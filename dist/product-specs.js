// Packaging dimensions are distinct from the net contents. Scene units are shared by all products.
export const MM_PER_UNIT=25;
export const sizeProfiles={
 laneige:{id:'laneige',name:'致美面霜',capacityMl:50,axis:'x',mm:63.1,quality:'零售商尺寸参考 · 非实测',source:'The USA Beauty 标注 63.1 × 63.1 × 54.0 mm；保留用户主图长宽比，以宽 63.1 mm 标定。',url:'https://www.theusabeauty.com/products/laneige-perfect-renew-3x-cream-anti-aging-moisturizer-with-peptides-encapsulated-retinol-to-visibly-firm-skin-smooth-texture',revision:2},
 'skin-veil-40':{id:'skin-veil-40',name:'雪纱隔离乳 No.40',capacityMl:30,axis:'y',mm:110,quality:'瓶体尺寸估算 · 待实测',source:'零售商仅有约 112–117 mm 外包装长边；瓶高暂估 110 mm，宽深沿用用户图与官网斜视比例。外包装数据不能当作瓶体实测尺寸。',url:'https://www.galaxus.be/en/s6/product/laneige-skin-veil-base-ex-40-30ml-light-purple-light-violet-primer-base-66033631',revision:2}
 ,'water-bank-foam-30g':{id:'water-bank-foam-30g',name:'「小蓝盾」洁颜膏',capacityValue:30,capacityUnit:'g',capacityMl:null,axis:'y',mm:95,quality:'软管尺寸估算 · 待实测',source:'香港官网确认30g版本，但没有可信毫米尺寸；总高95mm为暂估，宽深按用户图和软管结构拟合。30g是净质量，不换算为30ml。',url:'https://hk.laneige.com/en_l/bundle-oct-ba-wb-cream.html',revision:1}
};
export function capacityLabel(spec){const value=spec.capacityValue??spec.capacityMl;return value==null?'净含量待核实':value+' '+(spec.capacityUnit||'ml')}
export function productProfile(root){
 if(root?.userData?.generatedProfile)return root.userData.generatedProfile;
 const existing=root?.userData?.physicalSize?.profileId||root?.userData?.photoConfig?.method;
 if(sizeProfiles[existing])return sizeProfiles[existing];let profile=null;
 root?.traverse(n=>{const method=n.userData?.buildMethod;if(method==='calibrated-laneige')profile=sizeProfiles.laneige;if(method==='researched-skin-veil-40')profile=sizeProfiles['skin-veil-40'];if(method==='researched-water-bank-foam-30g')profile=sizeProfiles['water-bank-foam-30g']});return profile;
}
