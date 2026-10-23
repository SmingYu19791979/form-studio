import base64,hashlib,io,json,queue,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'server'))
import studio_server as studio
from test_modeling_server import recipe

class ProductInput(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        for target,value in [('JOBS',Path(self.tmp.name)),('JOB_MAP',{}),('TASKS',queue.Queue())]:
            patcher=patch.object(studio,target,value);patcher.start();self.addCleanup(patcher.stop)
    def post(self,payload):
        raw=json.dumps(payload).encode();handler=object.__new__(studio.Handler);handler.path='/api/generate';handler.server=type('Server',(),{'server_port':8765})();handler.headers={'Host':'localhost:8765','Origin':'http://localhost:8765','Content-Type':'application/json','Content-Length':str(len(raw))};handler.rfile=io.BytesIO(raw);result=[];handler.send_json=lambda data,code=200:result.append((data,code));handler.do_POST();return result[0]
    def test_text_only_is_persisted_resumable_and_has_no_image_argument(self):
        notes='品牌：保拉纳，500ml，玻璃瓶；外尺寸待核实'
        job,code=self.post({'name':'啤酒','description':notes})
        self.assertEqual(code,202);self.assertFalse(job['hasImage'])
        path=studio.JOBS/job['id'];self.assertFalse((path/'input.png').exists())
        command=studio.modeling_command(job,path,{'noDaemon':True,'features':set()})
        self.assertNotIn('--image',command);self.assertIn('--search',command)
        evidence=json.loads(studio.modeling_input(job).splitlines()[-1])
        self.assertEqual(evidence,{'filename':'啤酒','description':notes,'hasImage':False})
        studio.JOB_MAP.clear();studio.load_jobs();loaded=studio.JOB_MAP[job['id']]
        self.assertEqual(loaded['description'],notes);self.assertFalse(loaded['hasImage'])
    def test_notes_change_cache_identity_and_identical_notes_reuse_job(self):
        payload={'name':'产品.jpg','source':'data:image/png;base64,'+base64.b64encode(bytes(range(30))).decode(),'description':'同款 20g'}
        first,code=self.post(payload);self.assertEqual(code,202)
        duplicate,_=self.post({**payload,'description':'  同款 20g  '});self.assertEqual(first['id'],duplicate['id'])
        second,_=self.post({**payload,'description':'同款 50g'});self.assertNotEqual(first['id'],second['id'])
        command=studio.modeling_command(first,studio.JOBS/first['id'],{'noDaemon':False,'features':set()})
        self.assertIn('--image',command);self.assertEqual((studio.JOBS/first['id']/'input.png').read_bytes(),bytes(range(30)))
    def test_legacy_image_fingerprint_and_prompt_are_compatible(self):
        payload={'name':'产品.jpg','source':'data:image/png;base64,'+base64.b64encode(bytes(range(30))).decode()}
        job,_=self.post(payload)
        self.assertEqual(job['fingerprint'],hashlib.sha256(bytes(range(30))+b'\0'+payload['name'].encode()).hexdigest())
        legacy={'id':job['id'],'name':job['name']}
        self.assertTrue(studio.job_has_image(legacy));self.assertEqual(json.loads(studio.modeling_input(legacy).splitlines()[-1])['description'],'')
    def test_reject_empty_invalid_or_oversized_input(self):
        for payload in [{},{'description':'   '},{'description':[]},{'description':'a'*4001},{'source':5,'description':'产品'},{'source':'not-an-image','description':'产品'}]:
            with self.subTest(payload=str(payload)[:50]):self.assertEqual(self.post(payload)[1],400)
    def test_text_only_recipe_cannot_extract_printing_from_missing_image(self):
        job,code=self.post({'name':'啤酒','description':'500ml 玻璃瓶'})
        model=recipe();model['labels']=[{'name':'标','mode':'source_ink','surface':'plane','width':10,'height':5,'radius':0,'position':[0,10,24.1],'rotation':[0,0,0],'color':'#000000','lines':[],'sourceRect':[0,0,.2,.2],'ink':'dark'}]
        with self.assertRaisesRegex(ValueError,'未上传图片'):studio.complete_recipe(job,model,True)
        model['labels']=[];studio.complete_recipe(job,model,True)
        self.assertEqual(job['status'],'complete')

if __name__=='__main__':unittest.main()
