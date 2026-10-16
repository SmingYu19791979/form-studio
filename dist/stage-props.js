import * as T from './assets/three.js';
import {geometryFromRecipe} from './generated-model.js';

const MM_PER_UNIT=25;
export const propCatalog=[
 {id:'cube',name:'立方体',icon:'cube',detail:'60 × 60 × 60 mm'},
 {id:'rounded-cube',name:'圆角方块',icon:'rounded',detail:'柔和边角'},
 {id:'plinth',name:'长方形展台',icon:'plinth',detail:'120 × 25 × 80 mm'},
 {id:'cylinder',name:'圆柱展台',icon:'cylinder',detail:'直径 70 mm'},
 {id:'sphere',name:'球体',icon:'sphere',detail:'直径 50 mm'},
 {id:'arch',name:'拱形展台',icon:'arch',detail:'镂空拱门'},
 {id:'steps',name:'阶梯展台',icon:'steps',detail:'三层高低错落'},
 {id:'ribbon',name:'飘带',icon:'ribbon',detail:'弯曲缎带'},
 {id:'bow',name:'蝴蝶结',icon:'bow',detail:'双环与垂带'}
];

function mesh(root,geometry,material,name,position=[0,0,0]){
 const part=new T.Mesh(geometry,material);part.name=name;part.position.set(...position);part.castShadow=true;part.receiveShadow=true;root.add(part);return part;
}

// A closed rectangular strip follows the curve with a gentle fabric roll.
// All vertices are ordinary BufferGeometry, so saved scenes need no custom loader.
export function ribbonGeometry(points,width=10,thickness=.45,roll=.4){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments=128;
 const frames=curve.computeFrenetFrames(segments,false),positions=[],uvs=[],indices=[];
 const corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
 for(let i=0;i<=segments;i++){
  const t=i/segments,center=curve.getPointAt(t),angle=Math.sin(t*Math.PI*2)*roll;
  const normal=frames.normals[i].clone().applyAxisAngle(frames.tangents[i],angle);
  const binormal=frames.binormals[i].clone().applyAxisAngle(frames.tangents[i],angle);
  for(const [side,face]of corners){
   const vertex=center.clone().addScaledVector(normal,side*width/2).addScaledVector(binormal,face*thickness/2);
   positions.push(vertex.x,vertex.y,vertex.z);uvs.push(t,(side+1)/2);
  }
  if(i<segments)for(let j=0;j<4;j++){
   const a=i*4+j,b=i*4+(j+1)%4,c=(i+1)*4+(j+1)%4,d=(i+1)*4+j;
   indices.push(a,b,d,b,c,d);
  }
 }
 indices.push(0,2,1,0,3,2);
 const end=segments*4;indices.push(end,end+1,end+2,end,end+2,end+3);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function createStageProp(type){
 const info=propCatalog.find(p=>p.id===type);if(!info)throw new Error('未找到这个布景道具');
 const root=new T.Group(),fabric=['ribbon','bow'].includes(type),color=fabric?'#b96d77':'#d9cbb4';
 const material=new T.MeshPhysicalMaterial({color,roughness:fabric?.3:.65,metalness:fabric?.12:0,clearcoat:fabric?.2:0,sheen:fabric?.8:0,sheenColor:color,sheenRoughness:.35});material.name=fabric?'缎带材质':'布景道具材质';
 const box=(name,size,position,bevel=0)=>mesh(root,bevel?geometryFromRecipe({kind:'rounded_box',size,bevel}):new T.BoxGeometry(...size),material,name,position);
 if(type==='cube')box('立方体',[60,60,60],[0,30,0]);
 if(type==='rounded-cube')box('圆角立方体',[60,60,60],[0,30,0],5);
 if(type==='plinth')box('长方形展台',[120,25,80],[0,12.5,0],2);
 if(type==='cylinder')mesh(root,new T.CylinderGeometry(35,35,35,96),material,'圆柱展台',[0,17.5,0]);
 if(type==='sphere')mesh(root,new T.SphereGeometry(25,64,40),material,'球体',[0,25,0]);
 if(type==='steps')for(let i=0;i<3;i++)box('第 '+(i+1)+' 层台阶',[35,20*(i+1),75],[(i-1)*35,10*(i+1),0],1.5);
 if(type==='arch'){
  const shape=new T.Shape();shape.moveTo(-45,0);shape.lineTo(-45,55);shape.absarc(0,55,45,Math.PI,0,true);shape.lineTo(45,0);shape.lineTo(25,0);shape.lineTo(25,55);shape.absarc(0,55,25,0,Math.PI,false);shape.lineTo(-25,0);shape.closePath();
  const geometry=new T.ExtrudeGeometry(shape,{depth:25,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:1,bevelThickness:1,curveSegments:40});geometry.translate(0,1,-12.5);mesh(root,geometry,material,'实心镂空拱门');
 }
 if(type==='ribbon')mesh(root,ribbonGeometry([[-65,2,-15],[-40,5,18],[-10,9,9],[15,3,-15],[42,6,8],[65,2,22]],13,.5,.65),material,'连续弯曲缎带');
 if(type==='bow'){
  for(const direction of [-1,1]){
   mesh(root,ribbonGeometry([[0,18,0],[direction*19,28,-2],[direction*37,23,0],[direction*31,12,5],[0,18,2]],12,.5,.32),material,direction===-1?'左侧缎带环':'右侧缎带环');
   mesh(root,ribbonGeometry([[direction*2,17,0],[direction*12,5,14],[direction*22,3,32],[direction*35,4,44]],12,.5,.2),material,direction===-1?'左垂带':'右垂带');
  }
  box('中间束结',[14,12,15],[0,18,2],3);
 }
 // Geometry is authored in millimetres and baked to the studio's shared scale.
 root.traverse(part=>{if(part.isMesh){const source=part.geometry;source.scale(1/MM_PER_UNIT,1/MM_PER_UNIT,1/MM_PER_UNIT);part.geometry=new T.BufferGeometry().copy(source);source.dispose();part.position.multiplyScalar(1/MM_PER_UNIT)}});
 root.updateMatrixWorld(true);let bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3());
 root.children.forEach(part=>{part.position.x-=center.x;part.position.y-=bounds.min.y;part.position.z-=center.z});root.updateMatrixWorld(true);
 bounds=new T.Box3().setFromObject(root);const size=bounds.getSize(new T.Vector3());
 root.name=info.name;root.userData.stageProp={type,color,baseMm:Object.fromEntries(['x','y','z'].map(axis=>[axis,+(size[axis]*MM_PER_UNIT).toFixed(4)])),revision:1};root.userData.kind='布景道具 · '+info.name;return root;
}

export function setPropColor(root,color){
 if(!root?.userData.stageProp||!/^#[\da-f]{6}$/i.test(color))return;
 root.traverse(part=>{for(const material of Array.isArray(part.material)?part.material:part.material?[part.material]:[]){material.color?.set(color);if(material.sheenColor)material.sheenColor.set(color)}});root.userData.stageProp.color=color;
}

export function setPropDimension(root,axis,mm){
 const prop=root?.userData.stageProp;
 if(!prop||!['x','y','z'].includes(axis)||!Number.isFinite(mm)||mm<1||mm>2000)throw new Error('道具尺寸请输入 1–2000 mm');
 root.scale[axis]=mm/prop.baseMm[axis];root.updateMatrixWorld(true);
}
