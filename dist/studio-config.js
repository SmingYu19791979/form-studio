// Each packaged edition keeps its own browser scene and pending generation requests.
export const studioConfig=await fetch(new URL('./studio-config.json',import.meta.url)).then(r=>r.ok?r.json():{}).catch(()=>({}));
export const projectDatabase=studioConfig.storageNamespace||'form-product-studio';
export const taskDatabase=studioConfig.taskNamespace||'form-modeling-tasks';
