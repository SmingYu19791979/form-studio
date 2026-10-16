import base64,io,json,queue,sys,tempfile,unittest
from unittest.mock import patch
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
from studio_server import validate_recipe,normalize_recipe,recover_researched_result,Handler,public
import studio_server as studio

def recipe():
    return {'version':1,'status':'ready','identity':{'name':'Test','brand':'Test','variant':'20g','capacityValue':20,'capacityUnit':'g','confidence':'high'},'research':{'summary':'Live reference','sources':[{'url':'https://example.com/product','title':'Reference','evidence':'Product','use':'Geometry'}],'unknowns':['Dimensions estimated'],'versionNotes':'Same version'},'dimensions':{'width':48,'height':32,'depth':48,'quality':'estimated','basis':'Image proportion','sourceUrl':'https://example.com/product'},'materials':[{'id':'body','name':'Body','color':'#FF99AA','roughness':.3,'metalness':0,'clearcoat':.2,'clearcoatRoughness':.3,'transmission':0,'opacity':1,'ior':1.5,'pattern':'solid','secondaryColor':'#FF99AA'}],'parts':[{'name':'Body','materialId':'body','position':[0,0,0],'rotation':[0,0,0],'geometry':{'kind':'cylinder','radiusTop':24,'radiusBottom':24,'height':32}}],'labels':[]}

class ModelingValidation(unittest.TestCase):
    def test_thin_rounded_insert_is_limited_like_threejs_not_rejected(self):
        for size,bevel in [([6.2,2.8,1.5],1.1),([7.2,3.1,1.4],1.2),([7.5,3.2,1.5],1.35)]:
            r=recipe();r['parts'][0]['geometry']={'kind':'rounded_box','size':size,'bevel':bevel}
            fixed,adjustments=normalize_recipe(r);validate_recipe(fixed)
            self.assertEqual(fixed['parts'][0]['geometry']['bevel'],min(size)*.49)
            self.assertEqual(r['parts'][0]['geometry']['bevel'],bevel)
            self.assertEqual(len(adjustments),1)
            self.assertEqual(normalize_recipe(fixed)[1],[])
        r['parts'][0]['geometry']['size'][2]=0
        with self.assertRaises(ValueError):normalize_recipe(r)
    def test_failed_researched_recipe_is_recovered_only_with_real_completed_search(self):
        with tempfile.TemporaryDirectory() as tmp,patch.object(studio,'JOBS',Path(tmp)):
            job={'id':'a'*32,'status':'failed'};p=Path(tmp)/job['id'];p.mkdir()
            r=recipe();r['parts'][0]['geometry']={'kind':'rounded_box','size':[7.2,3.1,1.4],'bevel':1.2}
            (p/'result.json').write_text(json.dumps(r));(p/'events.jsonl').write_text('')
            self.assertFalse(recover_researched_result(job));self.assertEqual(job['status'],'failed')
            (p/'events.jsonl').write_text(json.dumps({'type':'item.completed','item':{'type':'web_search'}})+'\n')
            self.assertTrue(recover_researched_result(job));self.assertEqual(job['status'],'complete');self.assertTrue(job['webVerified'])
            self.assertTrue((p/'agent-result.json').exists());self.assertEqual(len(job['geometryAdjustments']),1)
            validate_recipe(json.loads((p/'result.json').read_text()))
    def test_accepts_data_only_researched_recipe(self):validate_recipe(recipe(),True)
    def test_rejects_unresearched_or_invented_ready_result(self):
        with self.assertRaises(ValueError):validate_recipe(recipe(),False)
        r=recipe();r['research']['sources']=[]
        with self.assertRaises(ValueError):validate_recipe(r)
    def test_rejects_code_and_nonfinite_geometry(self):
        for change in [lambda r:r.update(script='alert(1)'),lambda r:r['parts'][0]['geometry'].update(height=float('nan')),lambda r:r['parts'][0].update(materialId='missing'),lambda r:r['dimensions'].update(sourceUrl='javascript:alert(1)')]:
            r=recipe();change(r)
            with self.assertRaises(ValueError):validate_recipe(r)
    def test_accepts_returning_lathe_profile_for_thick_hollow_shell(self):
        r=recipe();r['parts'][0]['geometry']={'kind':'lathe','points':[{'y':0,'radius':20},{'y':30,'radius':20},{'y':30,'radius':18},{'y':0,'radius':18},{'y':0,'radius':20}]}
        validate_recipe(r)
    def test_requires_real_same_origin_local_browser(self):
        handler=object.__new__(Handler);handler.server=type('Server',(),{'server_port':8765})();
        for host,origin,expected in [('localhost:8765','http://localhost:8765',True),('127.0.0.1:8765','http://127.0.0.1:8765',True),('localhost:8765','https://evil.example',False),('evil.example',None,False),('localhost:8765','http://localhost:8766',False)]:
            handler.headers={'Host':host};
            if origin:handler.headers['Origin']=origin
            self.assertEqual(handler.api_allowed(),expected)
    def test_private_source_and_diagnostics_are_never_sent_to_browser(self):
        self.assertEqual(public({'id':'1','source':'private','recipe':{},'raw_error':'secret'}),{'id':'1'})
    def test_job_submission_deduplication_force_retry_and_cancel(self):
        def post(path,payload,origin='http://localhost:8765'):
            raw=json.dumps(payload).encode();h=object.__new__(Handler);h.path=path;h.server=type('Server',(),{'server_port':8765})();h.headers={'Host':'localhost:8765','Origin':origin,'Content-Type':'application/json','Content-Length':str(len(raw))};h.rfile=io.BytesIO(raw);out=[];h.send_json=lambda data,code=200:out.append((data,code));h.do_POST();return out[0]
        with tempfile.TemporaryDirectory() as tmp,patch.object(studio,'JOBS',Path(tmp)),patch.object(studio,'JOB_MAP',{}),patch.object(studio,'TASKS',queue.Queue()):
            payload={'name':'Unregistered product.png','source':'data:image/png;base64,'+base64.b64encode(bytes(range(30))).decode()}
            first,code=post('/api/generate',payload);self.assertEqual(code,202)
            duplicate,code=post('/api/generate',payload);self.assertEqual(duplicate['id'],first['id']);self.assertEqual(code,200)
            cancelled,code=post('/api/jobs/'+first['id']+'/cancel',{});self.assertEqual(cancelled['status'],'cancelled')
            second,code=post('/api/generate',payload);self.assertNotEqual(second['id'],first['id'])
            studio.JOB_MAP[second['id']]['status']='complete'
            cached,_=post('/api/generate',payload);self.assertEqual(cached['id'],second['id'])
            regenerated,code=post('/api/generate',{**payload,'force':True});self.assertNotEqual(regenerated['id'],second['id'])
            _,code=post('/api/generate',payload,origin='https://other.example');self.assertEqual(code,403)

if __name__=='__main__':unittest.main()
