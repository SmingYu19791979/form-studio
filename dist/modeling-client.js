import {createGeneratedProduct} from './generated-model.js';
import {capacityLabel} from './product-specs.js';
import {taskDatabase} from './studio-config.js';
const $=s=>document.querySelector(s),terminal=new Set(['complete','failed','cancelled']);
let active=null,retryAction=null;
function taskDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(taskDatabase,1);r.onupgradeneeded=()=>r.result.createObjectStore('requests');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function stored(value,write=false){const db=await taskDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('requests',write?'readwrite':'readonly'),s=tx.objectStore('requests');let r;if(write)r=value?s.put(value,'pending'):s.delete('pending');else r=s.get('pending');let result;r.onsuccess=()=>result=r.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
async function api(path,body){let r;try{r=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)})}catch{throw new Error('无法连接本机建模服务。请保持 studio_server.py 运行后重试；已提交的任务会继续保留。')}let data;try{data=await r.json()}catch{throw new Error('当前是静态预览服务。请用 python3 server/studio_server.py --port 8765 启动工作台。')}if(!r.ok)throw new Error(data.error||'建模请求失败');return data}
function show(job,name){const panel=$('#modeling-job');panel.hidden=false;panel.dataset.state=job.status;$('#modeling-title').textContent=({queued:'等待建模',running:'正在研究与建模',complete:'三维模型已生成',failed:'本次生成未完成',cancelled:'已取消建模'})[job.status]||'正在加入场景';$('#modeling-name').textContent=name;$('#modeling-message').textContent=job.message;$('#modeling-detail').textContent=(job.webSearches?'已检索 '+job.webSearches+' 次 · ':'')+'用时 '+Math.max(0,Math.floor((Date.now()/1000-job.createdAt)/60))+' 分 '+Math.max(0,Math.floor((Date.now()/1000-job.createdAt)%60))+' 秒';$('#modeling-cancel').hidden=terminal.has(job.status);$('#modeling-retry').hidden=!['failed','cancelled'].includes(job.status);$('#modeling-close').hidden=!terminal.has(job.status)}
function init(){if($('#modeling-job').dataset.bound)return;$('#modeling-job').dataset.bound='true';$('#modeling-cancel').onclick=async()=>{if(!active?.id)return;$('#modeling-cancel').disabled=true;try{await api('jobs/'+active.id+'/cancel',{})}catch(e){$('#modeling-message').textContent=e.message}finally{$('#modeling-cancel').disabled=false}};$('#modeling-retry').onclick=()=>retryAction?.();$('#modeling-close').onclick=()=>$('#modeling-job').hidden=true}
export function onGenerationRetry(fn){retryAction=fn;init()}
export async function acknowledgeGeneration(id){const p=await stored();if(p?.id===id)await stored(null,true);if(active?.id===id){active=null;setTimeout(()=>{if($('#modeling-job').dataset.state==='complete')$('#modeling-job').hidden=true},6000)}}
export async function pendingGeneration(){return stored()}
export async function generateProduct(source,name,onProgress=()=>{},resume=null,description=''){
 init();$('#loading').hidden=true;let request=resume||{source,name,description:description.trim(),id:null};let job={status:'queued',message:'正在连接本机 Codex；首次建模需检索同版资料，通常需要数分钟。',createdAt:Date.now()/1000};show(job,name);
 try{
  if(!request.id){await stored(request,true);const health=await api('health');if(!health.available)throw new Error('未找到本机 Codex。请安装并登录 Codex 后重试。');if((request.description||!request.source)&&!health.capabilities?.includes('product-text-input'))throw new Error('本地服务尚未载入新版文字输入功能。请在启动终端按 Ctrl+C 停止，再重新启动工作台并重试。');await stored(request,true);job=await api('generate',{source:request.source,name:request.name,description:request.description||'',force:!!request.regenerate});request.id=job.id;delete request.regenerate;await stored(request,true)}
  active=request;
  while(true){job=await api('jobs/'+request.id);show(job,name);onProgress(job.message);if(terminal.has(job.status))break;await new Promise(r=>setTimeout(r,1500))}
  if(job.status!=='complete')throw new Error(job.message);
  show({...job,status:'running',message:'正在创建独立几何、分区材质与毫米标定…'},name);
  const {recipe}=await api('jobs/'+request.id+'/result');let built;try{built=await createGeneratedProduct(recipe,request.source,request.id)}catch(e){request.regenerate=true;await stored(request,true);throw e}
  if(request.description)built.dossier.sources.unshift({id:'user-description',title:'用户补充的产品信息',kind:'用户说明 · 待核对',status:'参考',use:request.description});
  show({...job,message:'已生成专属三维模型，正在保存布景。'},name);
  return {model:built.model,name:recipe.identity.name+' · '+capacityLabel(built.profile),kind:'Codex 查资料后专属建模',metadata:{photoSource:request.source,sourceFileName:request.name,productDescription:request.description||'',photoConfig:{method:'generated',tolerance:35,physicalSize:structuredClone(built.model.userData.physicalSize)},photoResearch:built.dossier,generatedRecipe:recipe,generatedProfile:built.profile,generationId:request.id}};
 }catch(e){show({...job,status:job.status==='cancelled'?'cancelled':'failed',message:e.message},name);throw e}
}
export async function resumeGeneration(onProgress=()=>{},retry=false){const request=await stored();if(!request)return null;if(retry&&request.id){const job=await api('jobs/'+request.id);if(['failed','cancelled'].includes(job.status)||request.regenerate)request.id=null}return generateProduct(request.source,request.name,onProgress,request)}
