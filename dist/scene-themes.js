import * as T from './assets/three.js';
import {FontLoader} from './assets/addons/FontLoader.js';
import {TextGeometry} from './assets/addons/TextGeometry.js';
import {createStageProp,setPropColor} from './stage-props.js';
import {surfaceDefaults} from './ground-materials.js';

export const sceneThemes=[
 {id:'618',name:'618 年中盛典',eyebrow:'SUMMER SALE',description:'珊瑚橙 · 奶油金 · 夏日礼盒',colors:['#dd7050','#f5d9b6','#c6a464'],surface:'marble',background:'#f0d8c5',key:'#fff4e8'},
 {id:'double11',name:'双十一购物季',eyebrow:'DOUBLE ELEVEN',description:'深紫 · 香槟金 · 立体数字',colors:['#553f77','#ba8cc7','#d8b875'],surface:'gloss',background:'#30243d',key:'#f6eaff'},
 {id:'christmas',name:'圣诞礼遇',eyebrow:'CHRISTMAS',description:'松绿 · 暖木 · 圣诞树与礼盒',colors:['#294d3e','#a7493e','#ceb47b'],surface:'wood',background:'#dce3da',key:'#fff0d8'},
 {id:'newyear',name:'新年纳福',eyebrow:'NEW YEAR',description:'朱红 · 流金 · 灯笼与折扇',colors:['#ad3930','#dc7050','#d4b371'],surface:'gloss',background:'#d5b8a1',key:'#fff1dd'}
];
export const getSceneTheme=id=>sceneThemes.find(p=>p.id===id);
let fontPromise;
export function loadThemeFont(){return fontPromise||=(new FontLoader()).loadAsync('assets/fonts/helvetiker_regular.typeface.json').catch(e=>{fontPromise=null;throw e})}
const physical=(color,metalness=0,roughness=.38)=>new T.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:metalness?.15:.25,clearcoatRoughness:.3});
function part(root,geometry,material,position=[0,0,0]){const m=new T.Mesh(geometry,material);m.position.set(...position);m.castShadow=m.receiveShadow=true;root.add(m);return m}
function finalize(root,name,color){
 root.traverse(n=>{if(n.isMesh){const old=n.geometry;n.geometry=new T.BufferGeometry().copy(old);old.dispose();n.castShadow=n.receiveShadow=true}});
 root.updateMatrixWorld(true);const b=new T.Box3().setFromObject(root),c=b.getCenter(new T.Vector3());
 root.children.forEach(n=>n.position.sub(new T.Vector3(c.x,b.min.y,c.z)));root.updateMatrixWorld(true);
 const size=new T.Box3().setFromObject(root).getSize(new T.Vector3());root.name=name;
 root.userData.stageProp={type:'theme-decoration',color,baseMm:Object.fromEntries(['x','y','z'].map(a=>[a,+(size[a]*25).toFixed(4)])),revision:1};
 root.userData.kind='节日装饰 · '+name;return root;
}
function gift(color,accent){
 const root=new T.Group(),paper=physical(color),ribbon=physical(accent,.55,.25);
 part(root,new T.BoxGeometry(1.9,1.6,1.9),paper,[0,.8,0]);part(root,new T.BoxGeometry(2, .16,2),paper,[0,1.68,0]);
 part(root,new T.BoxGeometry(.19,1.78,2.02),ribbon,[0,.89,0]);part(root,new T.BoxGeometry(2.02,1.78,.19),ribbon,[0,.89,0]);
 const bow=createStageProp('bow');setPropColor(bow,accent);bow.scale.setScalar(.46);bow.position.y=1.76;root.add(bow);
 return finalize(root,'缎带礼盒',color);
}
function bauble(color){const root=new T.Group();part(root,new T.SphereGeometry(.62,40,28),physical(color,.78,.21),[0,.62,0]);part(root,new T.CylinderGeometry(.13,.13,.15,20),physical('#c5a566',.85,.23),[0,1.27,0]);return finalize(root,'金属装饰球',color)}
function starGeometry(radius=.35){const s=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?radius*.44:radius;const p=[Math.cos(a)*r,Math.sin(a)*r];i?s.lineTo(...p):s.moveTo(...p)}s.closePath();return new T.ExtrudeGeometry(s,{depth:.08,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:2,steps:1})}
function tree(colors){
 const root=new T.Group(),pine=physical(colors[0],.1,.66),gold=physical(colors[2],.75,.27);
 part(root,new T.CylinderGeometry(.2,.24,.6,20),physical('#66513c'),[0,.3,0]);
 for(let i=0;i<4;i++)part(root,new T.ConeGeometry(1.15-i*.22,1.55,64),pine,[0,1.25+i*.72,0]);
 for(let i=0;i<15;i++){const h=.95+(i%5)*.53,r=(3.8-h)*.3,a=i*2.399;part(root,new T.SphereGeometry(.105,16,12),i%3===0?physical(colors[1],.2,.3):gold,[Math.cos(a)*r,h,Math.sin(a)*r])}
 part(root,starGeometry(.39),gold,[0,4.15,0]);return finalize(root,'星顶圣诞树',colors[0]);
}
function lantern(colors){
 const root=new T.Group(),red=physical(colors[0],.05,.45),gold=physical(colors[2],.65,.3);
 const body=part(root,new T.SphereGeometry(.9,64,40),red,[0,1.68,0]);body.scale.y=1.12;
 for(let i=0;i<12;i++){const a=i*Math.PI/6,pts=[];for(let j=0;j<=40;j++){const t=.18+(Math.PI-.36)*j/40;pts.push(new T.Vector3(Math.sin(t)*.905*Math.cos(a),1.68+Math.cos(t)*1.015,Math.sin(t)*.905*Math.sin(a)))}part(root,new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.012,5,false),gold)}
 for(const y of [.67,2.69])part(root,new T.CylinderGeometry(.27,.27,.16,32),gold,[0,y,0]);
 part(root,new T.CylinderGeometry(.045,.045,.4,12),gold,[0,.4,0]);
 for(let i=0;i<9;i++){const a=i*2.4;part(root,new T.CylinderGeometry(.018,.025,.35,8),red,[Math.cos(a)*.08,.175,Math.sin(a)*.08])}
 return finalize(root,'流苏灯笼',colors[0]);
}
function fan(colors){
 const root=new T.Group(),gold=physical(colors[2],.6,.38),red=physical(colors[0],.05,.55);
 for(let i=0;i<24;i++){const a=Math.PI*i/24,b=Math.PI*(i+1)/24,s=new T.Shape();s.moveTo(0,0);s.lineTo(Math.cos(a)*2.5,Math.sin(a)*2.5);s.lineTo(Math.cos(b)*2.5,Math.sin(b)*2.5);s.closePath();const m=part(root,new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:false}),i%2?red:gold);m.position.z=i%2?.08:0}
 part(root,new T.BoxGeometry(5.2,.17,.65),gold,[0,.08,0]);return finalize(root,'鎏金折扇',colors[0]);
}
function numeral(text,color,font){
 const root=new T.Group(),metal=physical(color,.65,.28),g=new TextGeometry(text,{font,size:1.55,height:.28,curveSegments:10,bevelEnabled:true,bevelSize:.035,bevelThickness:.03,bevelSegments:3});
 g.computeBoundingBox();const w=g.boundingBox.max.x-g.boundingBox.min.x;g.translate(-g.boundingBox.min.x-w/2,.45,0);part(root,g,metal);
 part(root,new T.BoxGeometry(w+.4,.45,.8),physical(color,.25,.45),[0,.225,.08]);return finalize(root,text+' 立体字',color);
}
function prop(id,color){const root=createStageProp(id);setPropColor(root,color);return root}
// Construct off-scene first. The commit below is all-or-nothing at the 30-object limit.
export function createThemeDecorations(id,bounds,font){
 const theme=getSceneTheme(id);if(!theme)throw new Error('未找到此节日场景');
 const [main,secondary,gold]=theme.colors;
 const b=bounds&&!bounds.isEmpty()?bounds:new T.Box3(new T.Vector3(-1,0,-1),new T.Vector3(1,3,1)),c=b.getCenter(new T.Vector3()),s=b.getSize(new T.Vector3());
 const unit=T.MathUtils.clamp(Math.max(s.y/4,s.x/10),.75,2.2),left=b.min.x-1.6*unit,right=b.max.x+1.6*unit,back=b.min.z-1.6*unit;
 const entries=[];const put=(root,x,z,scale=1,angle=0)=>{root.scale.multiplyScalar(unit*scale);root.position.set(x,0,z);root.rotation.y=angle;entries.push(root)};
 if(id==='618'||id==='double11'){
  if(!font)throw new Error('节日立体字字体尚未载入');
  const sign=numeral(id==='618'?'618':'11.11',gold,font);put(sign,left,c.z,.8);sign.updateMatrixWorld(true);sign.position.x-=new T.Box3().setFromObject(sign).max.x-b.min.x+.5*unit;
  put(prop('arch',main),c.x,back,1.2);put(gift(secondary,gold),right,c.z,.9,-.2);put(bauble(gold),left,c.z+.7*unit,.8);put(prop('ribbon',main),c.x,b.max.z+1.2*unit,.85);
 }else if(id==='christmas'){
  put(tree(theme.colors),left,back,1.1);put(gift(secondary,gold),right,c.z,.9,-.18);put(gift(main,gold),right+.4*unit,back,.7,.2);put(bauble(gold),left,c.z,.75);put(prop('bow',secondary),c.x,b.max.z+1.1*unit,.75);
 }else{
  put(fan(theme.colors),left,back,1.1);put(lantern(theme.colors),left,c.z,1.05);put(lantern([secondary,main,gold]),right,back,.8);put(gift(main,gold),right,c.z+.6*unit,.8,-.2);put(bauble(gold),left+.5*unit,b.max.z+1.1*unit,.75);
 }
 entries.forEach(root=>{root.userData.themeDecoration=id;root.userData.uid=T.MathUtils.generateUUID()});return entries;
}
export function replaceThemeDecorations(group,decorations,limit=30){
 const retained=group.children.filter(o=>!o.userData.themeDecoration);
 if(retained.length+decorations.length>limit)throw new Error(`此主题需要 ${decorations.length} 个空位，请先移除 ${retained.length+decorations.length-limit} 个对象（最多 ${limit} 个）`);
 for(const o of [...group.children])if(o.userData.themeDecoration)group.remove(o);
 if(decorations.length)group.add(...decorations);return retained;
}
export function themeSettings(id){
 const p=getSceneTheme(id);if(!p)throw new Error('未找到此节日场景');
 return {...surfaceDefaults(p.surface),'background':p.background,'floor-color':p.surface==='gloss'?(id==='newyear'?'#943c33':'#55405f'):'#ffffff','floor-visible':true,'grid-visible':false,'key-power':3.2,'key-angle':-38,'key-height':48,'key-color':p.key,'fill-power':1.1,'environment':.85,'exposure':1.05,'softness':2,'light-preset':'soft'};
}
export function scaleProportionally(object,nextX){if(!object||!Number.isFinite(nextX)||nextX<=0)return;const old=Math.abs(object.scale.x);if(old<1e-8)return;object.scale.multiplyScalar(nextX/old);object.updateMatrixWorld(true)}
