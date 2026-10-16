"""Data-only procedural product recipe. Generated code is never executed."""
import json
from pathlib import Path

def obj(properties):
    return {'type':'object','properties':properties,'required':list(properties),'additionalProperties':False}
def arr(items,lo=0,hi=64): return {'type':'array','items':items,'minItems':lo,'maxItems':hi}
def num(lo=-2000,hi=2000): return {'type':'number','minimum':lo,'maximum':hi}
def string(limit=1500): return {'type':'string','maxLength':limit}
def enum(*values): return {'type':'string','enum':list(values)}
vec=arr(num(),3,3)
color={'type':'string','pattern':'^#[0-9a-fA-F]{6}$'}
geometry={'anyOf':[
 obj({'kind':enum('lathe'),'points':arr(obj({'y':num(),'radius':num(0,1000)}),3,64)}),
 obj({'kind':enum('loft'),'power':num(2,8),'rings':arr(obj({'y':num(),'radiusX':num(.01,1000),'radiusZ':num(.01,1000)}),2,48)}),
 obj({'kind':enum('rounded_box'),'size':vec,'bevel':num(0,500)}),
 obj({'kind':enum('cylinder'),'radiusTop':num(.01,1000),'radiusBottom':num(.01,1000),'height':num(.01,2000)}),
 obj({'kind':enum('sphere'),'radius':num(.01,1000),'scale':arr(num(.01,100),3,3)}),
 obj({'kind':enum('torus'),'radius':num(.01,1000),'tube':num(.001,100),'arc':num(.01,6.284)}),
]}
SCHEMA=obj({
 'version':{'type':'integer','enum':[1]},'status':enum('ready','insufficient_reference'),
 'identity':obj({'name':string(180),'brand':string(100),'variant':string(200),'capacityValue':{'type':['number','null']},'capacityUnit':{'type':['string','null'],'enum':['ml','g',None]},'confidence':enum('high','medium','low')}),
 'research':obj({'summary':string(2500),'sources':arr(obj({'url':string(1600),'title':string(240),'evidence':string(1200),'use':string(800)}),0,12),'unknowns':arr(string(500),0,20),'versionNotes':string(1500)}),
 'dimensions':obj({'width':num(1,2000),'height':num(1,2000),'depth':num(1,2000),'quality':enum('verified','retailer_reference','estimated'),'basis':string(1500),'sourceUrl':string(1600)}),
 'materials':arr(obj({'id':string(60),'name':string(120),'color':color,'roughness':num(0,1),'metalness':num(0,1),'clearcoat':num(0,1),'clearcoatRoughness':num(0,1),'transmission':num(0,1),'opacity':num(.01,1),'ior':num(1,2.5),'pattern':enum('solid','frosted','brushed','vertical_gradient'),'secondaryColor':color}),1,24),
 'parts':arr(obj({'name':string(160),'materialId':string(60),'position':vec,'rotation':vec,'geometry':geometry}),1,80),
 'labels':arr(obj({'name':string(160),'mode':enum('text','source_ink'),'surface':enum('plane','cylinder'),'width':num(.2,1000),'height':num(.2,1000),'radius':num(0,1000),'position':vec,'rotation':vec,'color':color,'lines':arr(obj({'text':string(160),'fontSize':num(.1,100),'weight':enum('normal','bold')}),0,10),'sourceRect':arr(num(0,1),4,4),'ink':enum('dark','light')}),0,30),
})
if __name__=='__main__':
    Path(__file__).with_name('recipe-schema.json').write_text(json.dumps(SCHEMA,ensure_ascii=False,indent=2),encoding='utf-8')
