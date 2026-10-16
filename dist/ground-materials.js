import * as T from './assets/three.js';

export const groundMaterials=[
 {id:'matte',name:'哑光',note:'柔和摄影纸 · 均匀漫反射',roughness:.95,clearcoat:0,tileMm:500,color:'#e8e2d7'},
 {id:'gloss',name:'亮面',note:'烤漆表面 · 柔亮高光与清漆层',roughness:.2,clearcoat:.8,tileMm:500,color:'#e8e2d7'},
 {id:'marble',name:'大理石',note:'白色大理石 · 连续石纹与抛光细节',roughness:.36,clearcoat:.3,tileMm:700,normal:.18,color:'#ffffff',maps:true},
 {id:'concrete',name:'混凝土',note:'细砂混凝土 · 颗粒与斑驳的漫反射',roughness:.92,clearcoat:0,tileMm:2000,normal:.45,color:'#ffffff',maps:true},
 {id:'wood',name:'木纹',note:'白橡木 · 自然木理与细微表面起伏',roughness:.65,clearcoat:.12,tileMm:500,normal:.3,color:'#ffffff',maps:true},
 {id:'linen',name:'亚麻',note:'蓝灰亚麻 · 真实交织纤维与柔和绒光',roughness:1,clearcoat:0,tileMm:270,normal:.55,color:'#ffffff',maps:true}
];
export const groundPreset=id=>groundMaterials.find(p=>p.id===id)||groundMaterials[0];
export const groundMapPaths=id=>({map:`assets/materials/${id}-color.jpg`,normalMap:`assets/materials/${id}-normal.${id==='marble'?'jpg':'png'}`,roughnessMap:`assets/materials/${id}-roughness.jpg`});
export function surfaceDefaults(id){const p=groundPreset(id);return {'floor-material':p.id,'floor-color':p.color,'floor-texture-scale':p.tileMm,'floor-texture-rotation':0,'floor-roughness':p.roughness,'floor-relief':1}}
// Upgrade the old decorative 100 mm pattern to the recommended PBR footprint once.
export function migrateSurfaceSettings(values={},version=0){
 const result={...values},p=groundPreset(values['floor-material']);
 if(version<2&&p.maps){result['floor-texture-scale']=p.tileMm;if(!values['floor-color']||values['floor-color']==='#e8e2d7')result['floor-color']='#ffffff'}
 return {...surfaceDefaults(p.id),...result};
}
export function configureGroundTexture(texture,channel,anisotropy=8){
 texture.colorSpace=channel==='map'?T.SRGBColorSpace:T.NoColorSpace;
 texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=anisotropy;texture.center.set(.5,.5);return texture;
}
export function createGroundController(floor,{loader=new T.TextureLoader(),anisotropy=8,onStatus=()=>{}}={}){
 const spanMm=(floor.geometry.parameters?.width||2000)*25;
 const cache=new Map();let current='',options={},ticket=0,pending=Promise.resolve(),disposed=false,failed=null;
 const material=new T.MeshPhysicalMaterial({color:'#e8e2d7',roughness:.95});floor.material.dispose();floor.material=material;
 function tune(){
  const p=groundPreset(current),size=T.MathUtils.clamp(+options.tileMm||p.tileMm,50,2500);
  material.color.set(options.color||p.color);material.roughness=T.MathUtils.clamp(Number(options.roughness??p.roughness),.08,1);
  material.normalScale.setScalar((p.normal||0)*T.MathUtils.clamp(Number(options.relief??1),0,2));
  material.clearcoat=p.clearcoat;material.clearcoatRoughness=.22;material.metalness=0;
  material.sheen=p.id==='linen'?.35:0;material.sheenColor.set('#c7d4de');material.sheenRoughness=.85;material.envMapIntensity=Number(options.environment??1);
  for(const channel of ['map','normalMap','roughnessMap'])if(material[channel]){
   material[channel].repeat.set(spanMm/size,spanMm/(size*(p.id==='linen'?271.3/270.708:1)));
   material[channel].rotation=T.MathUtils.degToRad(Number(options.rotation)||0);
   material[channel].offset.set(.17,.23);
  }
 }
 async function load(id){
  if(!cache.has(id)){
   const promise=Promise.allSettled(Object.entries(groundMapPaths(id)).map(async([channel,path])=>[channel,configureGroundTexture(await loader.loadAsync(path),channel,anisotropy)]))
    .then(results=>{const bad=results.find(r=>r.status==='rejected');if(bad||disposed){for(const r of results)if(r.status==='fulfilled')r.value[1].dispose();if(bad)throw bad.reason;throw new Error('材质控制器已释放')}return Object.fromEntries(results.map(r=>r.value))});
   cache.set(id,promise);promise.catch(()=>cache.delete(id));
  }
  return cache.get(id);
 }
 return {
  material,
  apply(kind='matte',color,tileMm,extra={}){
   const p=groundPreset(kind);options={color,tileMm,...extra};
   if(current!==p.id){
    current=p.id;failed=null;const request=++ticket;material.map=material.normalMap=material.roughnessMap=null;material.needsUpdate=true;
    if(p.maps){onStatus('loading');pending=load(p.id).then(maps=>{if(request!==ticket||disposed)return;Object.assign(material,maps);tune();material.needsUpdate=true;onStatus('ready')}).catch(()=>{if(request!==ticket||disposed)return;failed=new Error('地面纹理未载入，请刷新后重试');onStatus('error')})}
    else{pending=Promise.resolve();onStatus('ready')}
   }
   tune();return p;
  },
  async ready(){const active=pending;await active;if(active!==pending)return this.ready();if(failed)throw failed},
  dispose(){disposed=true;ticket++;for(const p of cache.values())p.then(maps=>Object.values(maps).forEach(t=>t.dispose())).catch(()=>{});cache.clear();material.dispose()}
 };
}
