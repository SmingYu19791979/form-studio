export const laneigeDossier={
 id:'laneige-perfect-renew-3x-cream-advanced-50ml-anti-wrinkle',
 product:'LANEIGE Perfect Renew 3X Cream Advanced',spec:'50 ml · Anti-wrinkle, Firm, Glow 正面版本',researchedAt:'2026-10-15',status:'研究完成，可做带缺失标注的外观模型',
 identity:'以用户正面图片和兰芝新加坡官方图为主。容量、Advanced 字样、盖身比例和正面文案对应；不混用旧版 3X Cream。',
 coverage:[{face:'正面 / 规格',status:'有同版参考',source:'用户正面图 + 兰芝新加坡官网'},{face:'侧壁 / 材质',status:'有斜视和特写',source:'兰芝新加坡官方视觉图'},{face:'顶盘',status:'有用户参考',source:'用户补充的顶部斜视图'},{face:'背面标签',status:'仍缺可靠同版图',source:'不编造背标文字'},{face:'底缘',status:'有局部斜视',source:'官方视觉图，仅确认外缘'},{face:'底贴 / 批号',status:'仍缺完整实拍',source:'不编造条码和批次'}],
 sources:[
 {id:'user-front',title:'用户提供的正面主图',kind:'用户原图',image:'assets/reference.png',use:'正面字样、罐体比例、盖身分界；建模主基准。',status:'采用'},
 {id:'sg-front',title:'兰芝新加坡 · 50ml 官方产品图',kind:'品牌官方',url:'https://sg.laneige.com/products/perfect-renew-3x-cream',image:'assets/research/sg-front.jpg',use:'核对 Advanced / 50ml / Anti-wrinkle 文案、整体轮廓与盖颈结构。',status:'采用'},
 {id:'sg-angle',title:'兰芝新加坡 · 官方斜视视觉图',kind:'品牌官方',url:'https://sg.laneige.com/products/perfect-renew-3x-cream',image:'assets/research/sg-detail.jpg',use:'观察金色细颗粒、弧面反射、缝隙与底部外缘。未展示完整背标或底贴。',status:'采用'},
 {id:'user-top',title:'用户补充 · 顶部与倾斜角度',kind:'用户原图',image:'assets/reference-angle.png',use:'确认浅色顶盘、居中 LANEIGE 标志、金属细包边。',status:'采用'},
 {id:'sg-macro',title:'兰芝新加坡 · 官方材质特写',kind:'品牌官方',url:'https://sg.laneige.com/products/perfect-renew-3x-cream',image:'assets/official.jpg',use:'细砂质感和印刷的明暗变化；照片不能证明真实基材或精确粗糙度数值。',status:'采用'},
 {id:'amore-other',title:'Global AMORE MALL · 50ml 产品图',kind:'品牌集团商城',url:'https://global.amoremall.com/products/laneige-perfect-renew-3x-cream-advanced',image:'assets/research/amore-front.png',use:'图中使用 Improve Wrinkles 文案，与用户图不同。仅作形体交叉参考，不用于正面印刷。',status:'版本差异'}],
 modeling:[{part:'盖体 / 罐身 / 瓶颈',basis:'用户正面图与官方同版图',action:'按可见分界建独立结构，保留盖下暗缝和圆角'}, {part:'缎面顶盘 / 字标 / 包边',basis:'用户补充斜视图',action:'单独建立顶盘与金属边圈'}, {part:'表面质感 / 印刷',basis:'官方材质与斜视图 + 用户主图',action:'颜色、细颗粒、印刷分开处理；物理材质数值为视觉拟合'}, {part:'背标 / 底贴',basis:'尚无可靠同版实拍',action:'保持缺失标注，暂不补写文字或批号'}],
 limitations:'当前仍是参考驱动的外观近似模型。背面标签、底贴、尺寸公差和真实材料参数未核实。'
};
export function researchBrief(source,name){return {format:'form-research-request',version:1,name:name.replace(/\.[^.]+$/,''),source,createdAt:new Date().toISOString(),status:'尚未联网检索',required:['识别品牌、系列、容量、地区和包装版本','寻找品牌官方 / 同版实拍的正、侧、背、顶、底面','记录来源 URL 与采集日期，剔除旧版和地区差异','整理几何结构、尺寸线索、材质与印刷依据','列出未知面，再制定该产品的专属建模方案'],sources:[],notes:'本文件是待研究资料包，不代表已搜索或已建模。由助手实际检索并整理资料后，再制作专属模型。'}}

export const skinVeilDossier={
 id:'laneige-skin-veil-base-ex-40-30ml-cn',product:'LANEIGE 雪纱丝柔修颜隔离乳',spec:'No.40 浅紫色 · 30ml · SKIN VEIL BASE_EX',researchedAt:'2026-10-15',status:'已核对官网同版参考，建立专属外观模型',
 identity:'官网当前页面明确列出 No.40 浅紫色、30ml 和 SKIN VEIL BASE_EX。官方正面图与用户图片的盖体竖向字标、瓶身两组字样、分界比例和透明底缘一致；旧版 skin-veil-base_old 页面不作为本款造型依据。',
 coverage:[{face:'正面 / 版本',status:'用户图与官网对应',source:'用户原图 + 中国官网 No.40 图库'},{face:'斜侧面 / 厚度',status:'有官网斜视图',source:'圆角扁瓶；厚度为视觉拟合'},{face:'盖顶 / 凸字',status:'有斜视与高清参考',source:'官网斜视 + 用户高清竖向字标'},{face:'内胆 / 透明底缘',status:'有高清视觉参考',source:'双层外观；非真实材料参数测定'},{face:'背标 / 完整底贴',status:'仍缺可靠实拍',source:'保持空白，不编造文字、条码'},{face:'开盖泵头',status:'未查证内部结构',source:'本次仅建合盖状态'}],
 sources:[
 {id:'user-skin-veil',title:'用户提供 · No.40 30ml 正面图',kind:'用户原图',image:'assets/skin-veil-reference.png',use:'主比例、紫色、透明底层、LANEIGE 凸字与正面印刷。',status:'采用'},
 {id:'cn-svb-front',title:'兰芝中国官网 · No.40 正面',kind:'品牌官方',url:'https://www.laneige.com.cn/makeup/skin-veil-base.html',image:'assets/research/skin-veil/official-front.jpg',use:'页面标注 No.40 浅紫色 / 30ml，正面包装与用户图对应。',status:'采用'},
 {id:'cn-svb-angle',title:'兰芝中国官网 · 斜侧面',kind:'品牌官方',url:'https://www.laneige.com.cn/makeup/skin-veil-base.html',image:'assets/research/skin-veil/official-angle.jpg',use:'核对扁圆角截面、圆盖顶肩、盖体闭合线和透明外壁。',status:'采用'},
 {id:'cn-svb-hero',title:'兰芝中国官网 · 高清包装视觉',kind:'品牌官方',url:'https://www.laneige.com.cn/makeup/skin-veil-base.html',image:'assets/research/skin-veil/official-hero.jpg',use:'珠光紫盖体、竖向凸字、紫色内胆和加厚透明底缘的光影。',status:'采用'},
 {id:'cn-svb-structure',title:'兰芝中国官网 · 整体结构',kind:'品牌官方',url:'https://www.laneige.com.cn/makeup/skin-veil-base.html',image:'assets/research/skin-veil/official-structure.jpg',use:'核对盖身高度关系、瓶底外形、闭合缝隙和左右圆角。',status:'采用'},
 {id:'cn-svb-colors',title:'兰芝中国官网 · 紫绿两色对照',kind:'品牌官方',url:'https://www.laneige.com.cn/makeup/skin-veil-base.html',image:'assets/research/skin-veil/official-colors.jpg',use:'只采用 No.40 紫色瓶；绿色为其他色号，不混用配色。',status:'采用'}],
 modeling:[{part:'扁圆角盖体 / 顶肩',basis:'用户主图 + 官网斜侧面',action:'单独建立圆角矩形截面和顶部圆润过渡，不套用圆柱'}, {part:'紫色内胆 / 透明外壁 / 厚底',basis:'官网高清包装图 + 用户底部',action:'分层建立不透明内胆与带折射外壁，参数为视觉拟合'}, {part:'盖面竖向 LANEIGE',basis:'用户高清原图和官方斜视',action:'使用带浅凸起的三维字形，方向由下向上'}, {part:'瓶身印刷',basis:'用户正面图',action:'LANEIGE 与 SKIN VEIL / BASE_EX 独立印刷层'}, {part:'背面 / 底贴 / 泵头',basis:'尚无可靠同版实拍',action:'不编造背标、批号、条码或内部泵结构'}],
 limitations:'合盖状态的外观近似模型。侧面厚度、折射率、涂层和毫米尺寸为视觉拟合；背标、完整底贴和泵头未查证。'
};

export const waterBankFoamDossier={
 id:'laneige-water-bank-cleansing-foam-30g',product:'LANEIGE「小蓝盾」洁颜膏',spec:'30g · WATER BANK BLUE HYALURONIC CLEANSING FOAM · 用户竖排印刷版本',researchedAt:'2026-10-15',status:'已查品牌30g资料并建立软管专属模型',
 identity:'用户原图为浅蓝色倒置软管、底部圆盖、顶部热封压纹，前面是竖排英文。香港官网套装明确列有30g，图中压纹与整体比例对应，但印刷排版不同；保留用户竖排版本。美国官网150g仅交叉参考材质和管身到封口的过渡，不套用其容量、尺寸或文字。',
 coverage:[{face:'规格 / 正面',status:'官网确认30g存在',source:'用户竖排图 + 香港官网30g套装'},{face:'管身 / 封口',status:'有官方结构参考',source:'30g软管圆肩向扁平热封过渡'},{face:'盖体 / 材质',status:'有合盖外形参考',source:'独立圆盖与浅蓝色塑料反射'},{face:'前标排版',status:'版本差异，采用用户图',source:'官方横排图不替换用户竖排字样'},{face:'背面 / 开盖',status:'仍缺可靠30g资料',source:'不补写背标、条码或开盖铰链'},{face:'毫米尺寸',status:'仍缺实测',source:'总高95mm仅作标注的外观估算'}],
 sources:[{id:'user-foam-30g',title:'用户载入的30g竖排产品图',kind:'用户原图',image:'assets/water-bank-foam-30g-reference.png',status:'采用',use:'保留竖排英文、盖身比例、封口压纹与浅蓝色外观。'},
 {id:'hk-mini-30g',title:'兰芝香港官网 · 30g套装图',kind:'品牌官方',url:'https://hk.laneige.com/en_l/bundle-oct-ba-wb-cream.html',image:'assets/research/water-bank-foam/official-30g.jpg',status:'版本差异',use:'页面明确30g；核对几何比例及压纹。其横排印刷与用户图不同，不替换正面字样。'},
 {id:'us-family',title:'兰芝美国官网 · 150g材质参考',kind:'品牌官方',url:'https://us.laneige.com/products/water-bank-blue-hyaluronic-cleansing-foam',image:'assets/research/water-bank-foam/official-family.jpg',status:'版本差异',use:'仅参考管材光泽、圆肩过渡与热封结构，不使用150g尺寸、文案或容量。'},
 {id:'us-detail',title:'兰芝美国官网 · 软管结构细节',kind:'品牌官方',url:'https://us.laneige.com/products/water-bank-blue-hyaluronic-cleansing-foam',image:'assets/research/water-bank-foam/official-angle.jpg',status:'版本差异',use:'辅助核对盖缝与压边，未知背标仍留空。'}],
 modeling:[{part:'软管',basis:'用户正面与官方30g轮廓',action:'按截面放样，由下部近圆形渐变为上部扁平封口'}, {part:'封口压纹',basis:'用户图与香港官网细节',action:'独立建立横向压边和正背面细纹；不固化可能随批次改变的模压编码'}, {part:'圆盖 / 分界线',basis:'合盖参考',action:'独立建立圆角锥形盖和窄闭合线'}, {part:'正面印刷 / 塑料表面',basis:'用户竖排主图',action:'文字贴附曲面，与光照和塑料材质分离'}, {part:'背标 / 喷嘴',basis:'无可靠30g实拍',action:'不编造不可见结构与文字'}],
 limitations:'30g合盖外观模型；未查得瓶体实测尺寸，总高95mm为估算。背标、开盖喷嘴与铰链未核实；容量单位为g，不换算成ml。'
};
