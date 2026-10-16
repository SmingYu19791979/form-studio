// Match identities, never infer an arbitrary new 3D model from a silhouette.
export function imageDifference(a,b){if(Math.abs(a.ratio-b.ratio)>.025)return Infinity;let sum=0,n=0;for(let y=0;y<24;y++)for(let x=0;x<24;x++){const ia=(Math.round(a.top+(a.bottom-a.top)*y/23)*a.w+Math.round(a.left+(a.right-a.left)*x/23))*4,ib=(Math.round(b.top+(b.bottom-b.top)*y/23)*b.w+Math.round(b.left+(b.right-b.left)*x/23))*4;for(let c=0;c<4;c++){sum+=Math.abs(a.data.data[ia+c]-b.data.data[ib+c]);n++}}return sum/n}
export function namedProductKey(name){const text=name.toLowerCase(),capacity=text.match(/(\d+(?:\.\d+)?)\s*(ml|毫升|g|克)(?![a-z])/),value=capacity?+capacity[1]:null,unit=capacity?(['g','克'].includes(capacity[2])?'g':'ml'):null;
 if(/(skin[\s_-]*veil[\s_-]*base|雪纱.*隔离|svb)/i.test(text)&&/(purple|violet|紫|40)/i.test(text)&&(!capacity||(value===30&&unit==='ml')))return 'skin-veil-40';
 if(/(致美.*面霜|perfect[\s_-]*renew.*3x[\s_-]*cream)/i.test(text)&&(!capacity||(value===50&&unit==='ml')))return 'laneige';
 if(/(小蓝盾.*洁颜膏|water[\s_-]*bank.*cleansing[\s_-]*foam)/i.test(text)&&value===30&&unit==='g')return 'water-bank-foam-30g';return null;
}

export function capacityCompatible(spec,name){const found=name.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(ml|毫升|g|克)(?![a-z])/);if(!found)return true;const unit=['g','克'].includes(found[2])?'g':'ml';return +found[1]===(spec.capacityValue??spec.capacityMl)&&unit===(spec.capacityUnit||'ml')}
