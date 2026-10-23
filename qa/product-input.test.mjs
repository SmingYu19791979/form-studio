import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generatedDossier,createGeneratedProduct} from '../dist/generated-model.js';

const recipe={status:'ready',identity:{name:'文字产品',variant:'500ml',capacityValue:500,capacityUnit:'ml'},research:{summary:'测试资料',versionNotes:'无用户图片',sources:[{title:'参考',url:'https://example.com/product',evidence:'瓶身',use:'外形'}],unknowns:['外尺寸估算']},dimensions:{width:48,height:32,depth:48,quality:'estimated',basis:'参考比例估算',sourceUrl:''},materials:[{id:'body',name:'瓶身',color:'#FF99AA',roughness:.3,metalness:0,clearcoat:.2,clearcoatRoughness:.3,transmission:0,opacity:1,ior:1.5,pattern:'solid',secondaryColor:'#FF99AA'}],parts:[{name:'瓶身',materialId:'body',position:[0,16,0],rotation:[0,0,0],geometry:{kind:'cylinder',radiusTop:24,radiusBottom:24,height:32}}],labels:[]};

test('text-only recipe builds volume without Image or an invented original-photo source',async()=>{
 const result=await createGeneratedProduct(recipe,'','text-only-test');
 assert.equal(result.model.userData.generationId,'text-only-test');
 assert.equal(result.model.userData.physicalSize.baseMm.y,32);
 assert.ok(result.model.children.length>0);
 assert.equal(result.dossier.sources.length,1);
 assert.ok(!result.dossier.sources.some(source=>source.kind==='用户原图'));
 assert.ok(result.dossier.modeling.every(item=>item.basis.includes('文字信息')));
 const photoDossier=generatedDossier(recipe,'data:image/png;base64,abc','photo-test');
 assert.equal(photoDossier.sources[0].kind,'用户原图');
});
test('text-only recipe rejects image-derived labels before canvas processing',async()=>{
 const labeled=structuredClone(recipe);labeled.labels=[{name:'印刷',mode:'source_ink'}];
 await assert.rejects(createGeneratedProduct(labeled,'','no-source'),/未上传图片/);
});

test('text intake persists its notes through failure and retry into the saved object',async()=>{
 const originals=Object.fromEntries(['fetch','document','indexedDB'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const elements=new Map(),values=new Map(),submissions=[];let supportsText=true;
 globalThis.document={querySelector:selector=>{if(!elements.has(selector))elements.set(selector,{dataset:{},hidden:false,textContent:''});return elements.get(selector);}};
 const database={close(){},transaction(){const tx={objectStore(){const op=(kind,value,key)=>{const request={};queueMicrotask(()=>{if(kind==='put')values.set(key,structuredClone(value));if(kind==='delete')values.delete(key);request.result=kind==='get'?structuredClone(values.get(key)):undefined;request.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.());});return request;};return {put:(value,key)=>op('put',value,key),get:key=>op('get',null,key),delete:key=>op('delete',null,key)};}};return tx;}};
 globalThis.indexedDB={open(){const request={result:database};queueMicrotask(()=>request.onsuccess?.());return request;}};
 globalThis.fetch=async (url,options={})=>{
  const path=String(url);let data;
  if(path.endsWith('studio-config.json'))data={};
  else if(path==='/api/health')data={available:true,capabilities:supportsText?['product-text-input']:[]};
  else if(path==='/api/generate'){submissions.push(JSON.parse(options.body));data={id:'task-'+submissions.length};}
  else if(path.endsWith('/result'))data={recipe};
  else data={status:submissions.length===1?'failed':'complete',message:submissions.length===1?'模拟第一次失败':'模拟完成',createdAt:Date.now()/1000};
  return {ok:true,json:async()=>data};
 };
 try{
  const {createDirectProduct}=await import('../dist/product-import.js');
  const {pendingGeneration,resumeGeneration}=await import('../dist/modeling-client.js');
  const notes='同款 500ml 玻璃瓶，瓶高由参考资料核实';
  await assert.rejects(createDirectProduct('','没有图片的新品',null,()=>{},notes),/模拟第一次失败/);
  assert.equal((await pendingGeneration()).description,notes);
  const built=await resumeGeneration(()=>{},true);
  assert.equal(submissions.length,2);
  assert.ok(submissions.every(body=>body.description===notes&&body.source===''));
  assert.equal(built.metadata.productDescription,notes);
  assert.ok(built.metadata.photoResearch.sources.some(source=>source.kind==='用户说明 · 待核对'&&source.use===notes));
  const restored=JSON.parse(JSON.stringify(built.metadata));
  assert.equal(restored.productDescription,notes);
  supportsText=false;
  await assert.rejects(createDirectProduct('','旧服务',null,()=>{},notes),/重新启动/);
  assert.equal(submissions.length,2,'an old server must never silently discard user notes');
 }finally{for(const [key,descriptor] of Object.entries(originals)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
