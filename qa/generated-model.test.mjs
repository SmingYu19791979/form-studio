import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../dist/assets/three.js';
import {geometryFromRecipe,generatedProfile,placeLabel,materialPatternPixels} from '../dist/generated-model.js';
import {createSizedModel,migrateProductSize,resetPhysicalDimension,setPhysicalDimension} from '../dist/product-scale.js';
import {capacityLabel,productProfile} from '../dist/product-specs.js';
test('generated geometry has volume, finite vertices and outward side normals',()=>{
 const shapes=[{kind:'loft',power:4,rings:[{y:0,radiusX:20,radiusZ:15},{y:80,radiusX:20,radiusZ:15}]},{kind:'rounded_box',size:[40,80,30],bevel:4},{kind:'lathe',points:[{y:0,radius:0},{y:0,radius:20},{y:80,radius:20},{y:80,radius:0}]},{kind:'cylinder',radiusTop:20,radiusBottom:18,height:80},{kind:'sphere',radius:20,scale:[1,2,.7]},{kind:'torus',radius:20,tube:2,arc:Math.PI*2}];
 for(const shape of shapes){const g=geometryFromRecipe(shape);g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3());assert.ok(size.x>0&&size.y>0&&size.z>0);assert.ok([...g.attributes.position.array].every(Number.isFinite));if(['loft','rounded_box'].includes(shape.kind)){const p=g.attributes.position,n=g.attributes.normal;let positive=0,negative=0;for(let i=0;i<p.count;i++){const dot=p.getX(i)*n.getX(i)+p.getZ(i)*n.getZ(i);if(dot>1)positive++;if(dot<-1)negative++}assert.ok(positive>negative*10,shape.kind+' outward normals')}g.dispose()}
});
test('generated profile survives serialization and retains shared millimetres and gram units',async()=>{
 const recipe={identity:{name:'新产品',capacityValue:20,capacityUnit:'g'},dimensions:{height:32,quality:'estimated',basis:'按参考比例估算',sourceUrl:'https://example.com/product'}};
 const profile=generatedProfile(recipe,'unregistered'),raw=new T.Mesh(geometryFromRecipe({kind:'cylinder',radiusTop:24,radiusBottom:24,height:32}),new T.MeshPhysicalMaterial());const model=createSizedModel(raw,profile);model.userData.generatedProfile=profile;model.userData.generationId='unregistered';model.position.set(4,2,-1);model.rotation.y=.8;model.scale.setScalar(1.4);model.updateMatrixWorld(true);
 const loaded=await new T.ObjectLoader().parseAsync(model.toJSON());assert.deepEqual(productProfile(loaded),profile);assert.equal(migrateProductSize(loaded),false);assert.deepEqual(loaded.userData.physicalSize.baseMm,{x:48,y:32,z:48});assert.equal(capacityLabel(loaded.userData.physicalSize),'20 g');assert.equal(loaded.scale.x,1.4);setPhysicalDimension(loaded,'y',40);assert.equal(loaded.userData.physicalSize.baseMm.x,60);resetPhysicalDimension(loaded);assert.equal(loaded.userData.physicalSize.baseMm.y,32);assert.equal(loaded.position.x,4);
 assert.equal(capacityLabel({capacityMl:null,capacityValue:null}),'净含量待核实');
});
test('unknown images use the asynchronous research service instead of another catalog entry',()=>{
 const importer=fs.readFileSync(new URL('../dist/product-import.js',import.meta.url),'utf8'),client=fs.readFileSync(new URL('../dist/modeling-client.js',import.meta.url),'utf8');assert.ok(importer.includes('if(!product)return generateProduct'));assert.ok(client.includes("api('generate'"));assert.ok(client.includes("api('jobs/'+request.id+'/result')"));assert.ok(!importer.includes('请把此图片发到当前对话'));
});

test('curved printing offsets follow the shell without sinking under it',()=>{const radius=24.08,mesh=new T.Mesh(new T.CylinderGeometry(radius,radius,5,32,1,true,-.6,1.2));placeLabel(mesh,{surface:'cylinder',position:[-2.3,15,0],rotation:[0,0,0],radius});mesh.updateMatrixWorld(true);const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);assert.ok(Math.hypot(v.x,v.z)>24.07)}assert.ok(mesh.rotation.y<0)});
test('thin rounded nozzle inserts retain finite geometry and requested external size',()=>{for(const [size,bevel]of [[[6.2,2.8,1.5],1.1],[[7.2,3.1,1.4],1.2]]){const g=geometryFromRecipe({kind:'rounded_box',size,bevel});assert.ok([...g.attributes.position.array].every(Number.isFinite));g.computeBoundingBox();const s=g.boundingBox.getSize(new T.Vector3());for(const [actual,wanted]of [[s.x,size[0]],[s.y,size[1]],[s.z,size[2]]])assert.ok(Math.abs(actual-wanted)<.001)}});

test('brushed microtexture preserves champagne-gold hue without repeated stripe overpainting',()=>{const m={id:'gold',color:'#B59A69',secondaryColor:'#B59A69',pattern:'brushed'},a=materialPatternPixels(m),b=materialPatternPixels(m);assert.deepEqual(a,b);const sums=[0,0,0];for(let i=0;i<a.length;i+=4){for(let c=0;c<3;c++)sums[c]+=a[i+c];assert.ok(a[i]>a[i+1]&&a[i+1]>a[i+2]);assert.equal(a[i+3],255)}for(const [i,target]of [181,154,105].entries())assert.ok(Math.abs(sums[i]/(a.length/4)-target)<1)});
