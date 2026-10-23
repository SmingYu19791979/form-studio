import {fileData} from './photo-flow.js';
const $=s=>document.querySelector(s);
export function initProductIntake(){
 const dialog=$('#product-intake'),form=$('#product-intake-form'),description=$('#product-description'),preview=$('#product-input-preview'),fileInput=$('#product-input-file');
 let resolveIntake=null,current={source:'',name:''},reading=false,version=0;
 function sync(){const hasImage=!!current.source;preview.hidden=!hasImage;if(hasImage)preview.src=current.source;else preview.removeAttribute('src');$('#product-input-name').textContent=hasImage?current.name:'未选择图片 · 可仅填写文字';$('#product-input-remove').hidden=!hasImage;$('#product-intake-submit').disabled=reading||(!hasImage&&!description.value.trim());description.required=!hasImage;}
 function finish(result){version++;dialog.close();const resolve=resolveIntake;resolveIntake=null;resolve?.(result);}
 description.oninput=sync;
 $('#product-input-choose').onclick=()=>fileInput.click();
 fileInput.onchange=async()=>{const file=fileInput.files[0];fileInput.value='';if(!file)return;const stamp=++version;reading=true;sync();try{if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('请选择 PNG、JPG 或 WEBP 图片');if(file.size>8*1024*1024)throw new Error('研究图片请控制在 8 MB 内');const source=await fileData(file);if(stamp!==version)return;current={source,name:file.name};$('#product-intake-error').textContent='';}catch(e){if(stamp===version)$('#product-intake-error').textContent=e.message;}finally{if(stamp===version){reading=false;sync();}}};
 $('#product-input-remove').onclick=()=>{version++;reading=false;current={source:'',name:''};sync();};
 $('#product-intake-cancel').onclick=()=>finish(null);
 dialog.oncancel=e=>{e.preventDefault();finish(null);};
 form.onsubmit=e=>{e.preventDefault();if(reading||!form.reportValidity())return;const text=description.value.trim();if(!current.source&&!text)return;finish({...current,name:current.name||text.split('\n')[0].slice(0,80),description:text});};
 return function show(input={}){if(resolveIntake)throw new Error('请先完成当前产品信息');version++;reading=false;current={source:input.source||'',name:input.name||''};description.value=input.description||'';$('#product-intake-error').textContent='';sync();const result=new Promise(resolve=>resolveIntake=resolve);dialog.showModal();description.focus();return result;};
}
