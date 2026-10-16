import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from '../dist/assets/three.js';
import {FontLoader} from '../dist/assets/addons/FontLoader.js';
import {groundMaterials,groundMapPaths,createGroundController,migrateSurfaceSettings,surfaceDefaults} from '../dist/ground-materials.js';
import {sceneThemes,createThemeDecorations,replaceThemeDecorations,themeSettings,scaleProportionally} from '../dist/scene-themes.js';
import {createStageProp,setPropDimension} from '../dist/stage-props.js';
const font=new FontLoader().parse(JSON.parse(fs.readFileSync(new URL('../dist/assets/fonts/helvetiker_regular.typeface.json',import.meta.url))));
const bounds=new T.Box3(new T.Vector3(-2,0,-2),new T.Vector3(2,4,2));
test('every PBR channel is bundled, distinct, and matches its source checksum',()=>{
 const sources=JSON.parse(fs.readFileSync(new URL('../dist/assets/materials/sources.json',import.meta.url)));
 for(const p of groundMaterials.filter(p=>p.maps)){
  assert.equal(new Set(Object.values(groundMapPaths(p.id))).size,3);
  const source=sources.find(s=>s.material===p.id);assert.equal(source.license,'CC0-1.0');
  for(const f of source.files){const bytes=fs.readFileSync(new URL('../dist/assets/materials/'+f.file,import.meta.url));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256)}
 }
});
test('PBR color spaces and transforms are correct, with no albedo bump map',async()=>{
 const floor=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.MeshStandardMaterial());const control=createGroundController(floor,{loader:{loadAsync:async()=>new T.Texture()}});
 control.apply('wood','#ffffff',500,{rotation:35,relief:.8,roughness:.6});await control.ready();const m=floor.material;
 assert.equal(m.map.colorSpace,T.SRGBColorSpace);assert.equal(m.normalMap.colorSpace,T.NoColorSpace);assert.equal(m.roughnessMap.colorSpace,T.NoColorSpace);assert.equal(m.bumpMap,null);
 for(const k of ['map','normalMap','roughnessMap']){assert.equal(m[k].repeat.x,100);assert.equal(m[k].rotation,35*Math.PI/180)}
 assert.equal(m.roughness,.6);assert.ok(Math.abs(m.normalScale.x-.24)<1e-10);control.dispose();
});
test('late loads cannot overwrite newer material selections; failed loads report errors',async()=>{
 const pending=[];const floor=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.MeshStandardMaterial());
 const control=createGroundController(floor,{loader:{loadAsync:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))}});
 control.apply('marble');control.apply('matte');pending.forEach(p=>p.resolve(new T.Texture()));await control.ready();await new Promise(r=>setTimeout(r,0));assert.equal(floor.material.map,null);
 control.apply('concrete');pending.slice(3).forEach(p=>p.reject(new Error('missing file')));await assert.rejects(control.ready(),/纹理未载入/);assert.equal(floor.material.map,null);
 control.apply('gloss');await control.ready();assert.equal(floor.material.clearcoat,.8);control.dispose();
});
test('legacy ground patterns migrate once; modern authored settings persist',()=>{
 const old={'floor-material':'marble','floor-texture-scale':100,'floor-color':'#e8e2d7'};const upgraded=migrateSurfaceSettings(old);assert.equal(upgraded['floor-texture-scale'],700);assert.equal(upgraded['floor-color'],'#ffffff');assert.equal(old['floor-texture-scale'],100);
 const modern={...surfaceDefaults('linen'),'floor-texture-scale':120,'floor-texture-rotation':80,'floor-color':'#aabbcc'};assert.deepEqual(migrateSurfaceSettings(modern,2),modern);assert.equal(migrateSurfaceSettings({'floor-color':'#abcdef'})['floor-color'],'#abcdef');
});
test('all four themes have grounded editable 3D decorations that survive JSON loading',async()=>{
 for(const theme of sceneThemes){const decorations=createThemeDecorations(theme.id,bounds,font);assert.equal(decorations.length,5);
  for(const o of decorations){const b=new T.Box3().setFromObject(o),size=b.getSize(new T.Vector3());assert.ok(Math.abs(b.min.y)<1e-5,theme.id+': '+o.name+' rests on floor');assert.ok(size.x>0&&size.y>0&&size.z>0);
   o.traverse(n=>{if(n.geometry){assert.ok([...n.geometry.attributes.position.array].every(Number.isFinite));assert.ok([...n.geometry.attributes.normal.array].every(Number.isFinite))}});
   const loaded=await new T.ObjectLoader().parseAsync(o.toJSON());assert.equal(loaded.userData.themeDecoration,theme.id);assert.ok(new T.Box3().setFromObject(loaded).getSize(new T.Vector3()).distanceTo(size)<1e-4);
  }assert.ok(themeSettings(theme.id)['floor-material']);
 }
});
test('theme replacement preserves user identities, transforms and copied decorations',()=>{
 const root=new T.Group(),product=createStageProp('cube');product.position.set(7,2,-4);product.rotation.set(.2,.3,.4);root.add(product);product.updateMatrixWorld(true);const pose=product.matrix.toArray();
 replaceThemeDecorations(root,createThemeDecorations('christmas',bounds,font));assert.equal(root.children.length,6);
 const personalCopy=root.children[1].clone();delete personalCopy.userData.themeDecoration;root.add(personalCopy);
 replaceThemeDecorations(root,createThemeDecorations('618',bounds,font));assert.equal(root.children.length,7);assert.ok(root.children.includes(product)&&root.children.includes(personalCopy));product.updateMatrixWorld(true);assert.deepEqual(product.matrix.toArray(),pose);
 replaceThemeDecorations(root,[]);assert.deepEqual(root.children,[product,personalCopy]);
});
test('capacity check is atomic and unknown themes leave existing work intact',()=>{
 const root=new T.Group();for(let i=0;i<26;i++)root.add(new T.Group());const before=[...root.children];assert.throws(()=>replaceThemeDecorations(root,createThemeDecorations('newyear',bounds,font)),/空位/);assert.deepEqual(root.children,before);assert.throws(()=>createThemeDecorations('unknown',bounds,font));
});
test('overall scale preserves independently authored dimensions',()=>{
 const object=createStageProp('cube');setPropDimension(object,'x',120);setPropDimension(object,'y',30);setPropDimension(object,'z',75);scaleProportionally(object,3);assert.deepEqual(object.scale.toArray(),[3,.75,1.875]);scaleProportionally(object,1);assert.deepEqual(object.scale.toArray(),[1,.25,.625]);
});

import {frameBounds} from '../dist/camera-framing.js';
test('long-lens portrait framing keeps every corner inside the image',()=>{
 const b=new T.Box3(new T.Vector3(-18,0,-8),new T.Vector3(12,13,7)),direction=new T.Vector3(-.4,.4,1).normalize();
 for(const aspect of [.5,1,2]){const camera=new T.PerspectiveCamera(16,aspect,.05,3000),f=frameBounds(b,direction,16,aspect);camera.position.copy(f.center).addScaledVector(direction,f.distance);camera.lookAt(f.center);camera.updateMatrixWorld(true);
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1)}
 }
});
