import * as T from './assets/three.js';
import {MM_PER_UNIT,productProfile} from './product-specs.js';
export {MM_PER_UNIT,productProfile};
const axes=['x','y','z'];
function bounds(root){root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root);if(box.isEmpty())throw new Error('产品没有可标定的几何体');return box}
export function createSizedModel(model,profile,calibration){
 const box=bounds(model),size=box.getSize(new T.Vector3());const custom=calibration?.profileId===profile?.id&&calibration.userCalibrated;
 const axis=custom?calibration.axis:profile?.axis,mm=custom?calibration.mm:profile?.mm;
 if(!axes.includes(axis)||!Number.isFinite(mm)||mm<=0||size[axis]<=0)throw new Error('缺少有效的产品尺寸依据');
 const factor=mm/(MM_PER_UNIT*size[axis]),inner=new T.Group();inner.name='包装尺寸标定';inner.userData.physicalFrame=true;inner.add(model);inner.scale.setScalar(factor);inner.updateMatrixWorld(true);const scaled=bounds(inner),center=scaled.getCenter(new T.Vector3());inner.position.set(-center.x,-scaled.min.y,-center.z);inner.updateMatrixWorld(true);
 const parent=new T.Group();parent.add(inner);const baseMm=Object.fromEntries(axes.map(a=>[a,+(size[a]*factor*MM_PER_UNIT).toFixed(2)]));
 parent.userData.physicalSize={profileId:profile.id,revision:profile.revision,capacityMl:profile.capacityMl,capacityValue:profile.capacityValue??profile.capacityMl,capacityUnit:profile.capacityUnit||'ml',axis,mm,userCalibrated:!!custom,quality:custom?'用户输入尺寸':profile.quality,source:custom?'用户输入一个外形尺寸，锁定产品比例等比标定。':profile.source,url:custom?'':profile.url,baseMm,mmPerUnit:MM_PER_UNIT};return parent;
}
export function migrateProductSize(root){
 const profile=productProfile(root);if(!profile||root.userData.physicalSize?.revision===profile.revision)return false;
 // Keep position, rotation, visibility and identity. The one-time migration resets legacy display scaling to the packaging baseline.
 root.scale.set(1,1,1);const content=new T.Group();while(root.children.length)content.add(root.children[0]);const sized=createSizedModel(content,profile,root.userData.physicalSize);root.add(...sized.children.slice());root.userData.physicalSize=sized.userData.physicalSize;root.updateMatrixWorld(true);return true;
}
export function setPhysicalDimension(root,axis,mm){
 const spec=root.userData.physicalSize;if(!spec||!axes.includes(axis)||!Number.isFinite(mm)||mm<1||mm>2000)throw new Error('尺寸请输入 1–2000 mm');
 const inner=root.children.find(c=>c.userData.physicalFrame);if(!inner)throw new Error('缺少产品尺寸标定层');const factor=mm/spec.baseMm[axis];inner.scale.multiplyScalar(factor);inner.position.multiplyScalar(factor);
 for(const a of axes)spec.baseMm[a]=+(spec.baseMm[a]*factor).toFixed(4);Object.assign(spec,{axis,mm,userCalibrated:true,quality:'用户输入尺寸',source:'用户输入一个外形尺寸，锁定产品比例等比标定。',url:''});root.updateMatrixWorld(true);
}
export function resetPhysicalDimension(root){const profile=productProfile(root);if(!profile)return;setPhysicalDimension(root,profile.axis,profile.mm);Object.assign(root.userData.physicalSize,{userCalibrated:false,quality:profile.quality,source:profile.source,url:profile.url})}
