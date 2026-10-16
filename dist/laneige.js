import * as T from './assets/three.js';
export async function createLaneige(renderer){
const group=new T.Group();
// Sample the real micro-grain from the supplied lid, removing its broad baked lighting.
const sample=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='assets/reference.png'});
const grain=document.createElement('canvas');grain.width=grain.height=512;const gc=grain.getContext('2d');gc.drawImage(sample,440,100,200,200,0,0,512,512);
const pixels=gc.getImageData(0,0,512,512),rough=gc.createImageData(512,512),color=gc.createImageData(512,512);
for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4;const luminance=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;
let sum=0,count=0;for(let yy=Math.max(0,y-7);yy<Math.min(512,y+8);yy+=3)for(let xx=Math.max(0,x-7);xx<Math.min(512,x+8);xx+=3){const k=(yy*512+xx)*4;sum+=(pixels.data[k]+pixels.data[k+1]+pixels.data[k+2])/3;count++}
const detail=Math.max(-30,Math.min(30,luminance-sum/count));
color.data.set([Math.max(0,Math.min(255,224+detail*2.1)),Math.max(0,Math.min(255,224+detail*2.1)),Math.max(0,Math.min(255,224+detail*2.1)),255],i);
rough.data.set([185-detail*1.2,185-detail*1.2,185-detail*1.2,255],i);}
gc.putImageData(color,0,0);const rc=document.createElement('canvas');rc.width=rc.height=512;rc.getContext('2d').putImageData(rough,0,0);
function grainTexture(canvas){const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(6,1.3);t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
const nt=grainTexture(grain),rt=grainTexture(rc);
const gold=new T.MeshPhysicalMaterial({color:0xcbb397,map:nt,metalness:.65,roughness:.65,roughnessMap:rt,bumpMap:nt,bumpScale:.006,envMapIntensity:1.05,clearcoat:.12,clearcoatRoughness:.5});
// Rounded lips catch fine specular lines visible in the angled reference.
function roundedShell(radius,height,y,material,bevel=.018){
const pts=[new T.Vector2(0,-height/2),new T.Vector2(radius-bevel,-height/2)];
for(let i=0;i<=8;i++){const a=-Math.PI/2+i*Math.PI/16;pts.push(new T.Vector2(radius-bevel+bevel*Math.cos(a),-height/2+bevel+bevel*Math.sin(a)))}
pts.push(new T.Vector2(radius,height/2-bevel));for(let i=0;i<=8;i++){const a=i*Math.PI/16;pts.push(new T.Vector2(radius-bevel+bevel*Math.cos(a),height/2-bevel+bevel*Math.sin(a)))}pts.push(new T.Vector2(0,height/2));
const geometry=new T.LatheGeometry(pts,192);const uv=geometry.attributes.uv,pos=geometry.attributes.position;for(let i=0;i<uv.count;i++)uv.setY(i,(pos.getY(i)+height/2)/height);uv.needsUpdate=true;const mesh=new T.Mesh(geometry,material);mesh.position.y=y;group.add(mesh);return mesh}
const brightEdge=new T.MeshPhysicalMaterial({color:0xd2b58b,metalness:.95,roughness:.21,envMapIntensity:1.3});
roundedShell(1.45,1.17,-.68,gold,.035);
roundedShell(1.27,.20,-.015,new T.MeshPhysicalMaterial({color:0x99826b,metalness:.82,roughness:.26,envMapIntensity:1.1}),.014);
roundedShell(1.44,1.16,.65,gold,.022);
function ring(radius,tube,y,material=brightEdge){const m=new T.Mesh(new T.TorusGeometry(radius,tube,12,192),material);m.rotation.x=Math.PI/2;m.position.y=y;group.add(m);return m}
ring(1.419,.011,1.227);ring(1.432,.009,.081);ring(1.431,.009,-.098);
// Pale satin inset and centered LANEIGE mark are now verified by the user's second reference.
const cap=document.createElement('canvas');cap.width=cap.height=1024;const cc=cap.getContext('2d');
cc.fillStyle='#dcd8d1';cc.fillRect(0,0,1024,1024);
for(let i=-1024;i<2048;i+=2){cc.strokeStyle=i%6===0?'rgba(255,255,255,.028)':'rgba(100,90,75,.015)';cc.beginPath();cc.moveTo(i,0);cc.lineTo(i-1024,1024);cc.stroke()}
cc.fillStyle='#716044';cc.font='400 94px Arial';cc.textAlign='center';cc.textBaseline='middle';cc.fillText('LANEIGE',512,516);
const capTex=new T.CanvasTexture(cap);capTex.colorSpace=T.SRGBColorSpace;capTex.anisotropy=renderer.capabilities.getMaxAnisotropy();
const satin=new T.MeshPhysicalMaterial({map:capTex,metalness:.43,roughness:.47,envMapIntensity:1.0,clearcoat:.15,clearcoatRoughness:.5});
const capFace=new T.Mesh(new T.CircleGeometry(1.403,192),satin);capFace.rotation.x=-Math.PI/2;capFace.position.y=1.232;group.add(capFace);
ring(1.405,.007,1.234);
// The front lettering follows the supplied image; unknown faces remain unlabelled.
const label=document.createElement('canvas');label.width=1400;label.height=600;const c=label.getContext('2d');c.clearRect(0,0,1400,600);c.textAlign='center';let grad=c.createLinearGradient(220,0,1120,0);grad.addColorStop(0,'#fff9e2');grad.addColorStop(.45,'#c5ab6d');grad.addColorStop(1,'#4d4029');c.fillStyle=grad;c.font='600 84px Arial';c.fillText('PERFECT RENEW',700,155);c.font='76px Arial';c.fillText('3X CREAM',700,248);c.fillText('ADVANCED',700,340);c.font='60px Arial';c.fillText('Anti-wrinkle, Firm, Glow',700,505);let tex=new T.CanvasTexture(label);tex.colorSpace=T.SRGBColorSpace;const lm=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.FrontSide});const lettering=new T.Mesh(new T.CylinderGeometry(1.452,1.452,1.12,100,1,true,-.78,1.56),lm);lettering.position.y=-.68;group.add(lettering);

const names=['罐身','瓶颈','罐盖','顶缘包边','盖下缘','罐身上缘','缎面顶盘','顶盘金属细边','正面独立印刷'];group.children.forEach((o,i)=>o.name=names[i]||'包装部件');group.userData.buildMethod='calibrated-laneige';return group;
}
