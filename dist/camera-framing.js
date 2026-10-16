import * as T from './assets/three.js';
// Fit the actual projected box, including its depth, rather than an oversized sphere.
export function frameBounds(bounds,direction,verticalFov,aspect,padding=1.15){
 const center=bounds.getCenter(new T.Vector3()),back=direction.clone().normalize();
 if(!back.lengthSq())back.set(0,0,1);
 const right=new T.Vector3(0,1,0).cross(back);if(right.lengthSq()<1e-8)right.set(1,0,0);right.normalize();
 const up=back.clone().cross(right).normalize(),tanV=Math.tan(T.MathUtils.degToRad(verticalFov)/2),tanH=tanV*Math.max(.01,aspect);
 let distance=3,halfWidth=0,halfHeight=0;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const p=new T.Vector3(x,y,z).sub(center),h=Math.abs(p.dot(right)),v=Math.abs(p.dot(up)),depth=p.dot(back);
  distance=Math.max(distance,depth+Math.max(h/tanH,v/tanV)*padding);halfWidth=Math.max(halfWidth,h);halfHeight=Math.max(halfHeight,v);
 }
 return {center,distance,zoom:Math.min(4*Math.max(.01,aspect)/Math.max(.01,halfWidth),4/Math.max(.01,halfHeight))/padding};
}
