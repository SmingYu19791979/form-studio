import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/assets/three.js';
import {propCatalog,createStageProp,setPropColor,setPropDimension,ribbonGeometry} from '../dist/stage-props.js';

test('all props have finite, grounded volume and load through the ordinary scene loader',async()=>{
 for(const item of propCatalog){
  const prop=createStageProp(item.id),bounds=new T.Box3().setFromObject(prop),size=bounds.getSize(new T.Vector3());
  assert.ok(Math.abs(bounds.min.y)<1e-5,item.id+' rests on ground');
  assert.ok(size.x>0&&size.y>0&&size.z>0,item.id+' has volume');
  prop.traverse(part=>{if(part.geometry){assert.ok([...part.geometry.attributes.position.array].every(Number.isFinite));assert.ok([...part.geometry.attributes.normal.array].every(Number.isFinite))}});
  const loaded=await new T.ObjectLoader().parseAsync(prop.toJSON());
  assert.equal(loaded.userData.stageProp.type,item.id);
  const restoredSize=new T.Box3().setFromObject(loaded).getSize(new T.Vector3());
  assert.ok(restoredSize.distanceTo(size)<1e-5,item.id+' reloads without custom geometry support');
 }
});

test('props retain physical scale relative to products, and independent sizes survive copying and saving',async()=>{
 const cube=createStageProp('cube'),plinth=createStageProp('plinth');
 assert.equal(cube.userData.stageProp.baseMm.x,60);
 assert.ok(Math.abs(new T.Box3().setFromObject(plinth).getSize(new T.Vector3()).x-120/25)<1e-5);
 setPropDimension(cube,'x',125);setPropDimension(cube,'y',35);setPropColor(cube,'#336699');cube.position.set(4,2,-3);cube.rotation.y=.8;cube.updateMatrixWorld(true);
 const loaded=await new T.ObjectLoader().parseAsync(cube.toJSON());
 assert.ok(Math.abs(loaded.userData.stageProp.baseMm.x*loaded.scale.x-125)<1e-8);
 assert.ok(Math.abs(loaded.userData.stageProp.baseMm.y*loaded.scale.y-35)<1e-8);
 assert.deepEqual(loaded.position.toArray(),[4,2,-3]);assert.equal(loaded.children[0].material.color.getHexString(),'336699');
 assert.equal(cube.clone().userData.stageProp.type,'cube');
 for(const value of [0,-1,Infinity,NaN,2001])assert.throws(()=>setPropDimension(cube,'x',value));
});

test('ribbons are closed solids rather than single image planes',()=>{
 const geometry=ribbonGeometry([[0,0,0],[10,0,0],[20,0,0]],8,.5,0),p=geometry.attributes.position,index=geometry.index;
 let volume=0;
 for(let i=0;i<index.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,index.getX(i)),b=new T.Vector3().fromBufferAttribute(p,index.getX(i+1)),c=new T.Vector3().fromBufferAttribute(p,index.getX(i+2));volume+=a.dot(b.cross(c))/6}
 assert.ok(Math.abs(volume-20*8*.5)<.01,'positive outward volume matches actual width and thickness');
 assert.ok(index.count>1000);assert.equal(createStageProp('bow').children.length,5);
});

