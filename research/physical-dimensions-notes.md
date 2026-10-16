# 两款产品的外形尺寸标定

日期：2026-10-15。不能把产品净含量（ml）当作外包装体积；它不包含盖体、泵头、双层外壁和空隙。每个容量版本应有独立的包装尺寸档案。

## 面霜 50ml

[兰芝新加坡官方](https://sg.laneige.com/products/perfect-renew-3x-cream)核对50ml同版。[The USA Beauty](https://www.theusabeauty.com/products/laneige-perfect-renew-3x-cream-anti-aging-moisturizer-with-peptides-encapsulated-retinol-to-visibly-firm-skin-smooth-texture)规格表列出63.1 ×63.1 ×54.0 mm；[Desertcart](https://www.desertcart.in/products/734368348-perfect-renew-3x-cream-anti-aging-moisturizer-with-peptides-encapsulated)列出2.48 ×2.48 ×2.13英寸，数量级相符。这些可能转录同一条上游规格，不当作独立实测。以宽63.1 mm为锚点，保持现有图像几何比例，模型高约54.5 mm。标签：零售商尺寸参考，非实测。其他地区容量版本不直接沿用。

## 隔离乳 No.40 30ml

[兰芝中国官方](https://www.laneige.com.cn/makeup/skin-veil-base.html)核对当前同版30ml。[Galaxus](https://www.galaxus.be/en/s6/product/laneige-skin-veil-base-ex-40-30ml-light-purple-light-violet-primer-base-66033631)列出11.7 ×4.4 ×3.9 cm，但标题为Package dimensions（包装尺寸），部分其他规格明显有误，可信度有限。[Joybuy](https://m.joybuy.de/dp/laneige-skin-veil-base-ex-no/10246061?requestIdentity=productDetailFrequentlyBought)仅提供11.2 ×4.1 ×4.1 cm包装信息。未找到可靠瓶体实测或工程图。

基于这两条外包装长边线索，暂取合盖瓶高110 mm；宽深按用户正面及官网斜视的现有模型比例得到约36.9 ×25.8 mm。110 mm为工作用估算，不是网页直接记载的瓶高，不能当作已验证实物数据。界面显示“瓶体尺寸估算 · 待实测”，可输入实测高度替换并等比更新其他轴。

## 平台规则

1. 统一25 mm / 场景单位。已有专属模型、快速添加、参考图导入、编辑重建、旧场景迁移共用产品尺寸档案。
2. 参考图进口不再调用通用模板。已研究同款匹配专属结构和材料；未知产品等待资料研究与模型建立。
3. 尺寸校正作用于包装标定层，位置与旋转在外层。布景缩放单独保留并显示有效毫米数；首次迁移旧比例时归100%。
4. 旧布景迁移版本标记避免重复缩放；手动标定和来源状态随JSON及IndexedDB存储。
5. 后续增加任意容量版本，需登记净含量、包装锚点尺寸、来源和可信状态，不能用现有50/30ml包装简单按容量做等比复用。
