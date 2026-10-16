import * as T from './assets/three.js';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export async function readPhoto(source,tolerance=35){
 const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('无法读取这张图片'));i.src=source});
 const scale=Math.min(1,768/Math.max(img.width,img.height)),w=Math.max(2,Math.round(img.width*scale)),h=Math.max(2,Math.round(img.height*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0,w,h);const originalSource=canvas.toDataURL('image/png');const data=c.getImageData(0,0,w,h),px=data.data;
 let transparent=0;for(let i=3;i<px.length;i+=4)if(px[i]<20)transparent++;
 // Remove only a background region connected to the image border. Preserve interior white labels.
 if(transparent< w*h*.01&&tolerance>0){const corners=[[0,0],[w-1,0],[0,h-1],[w-1,h-1]],bg=[0,0,0];for(const [x,y]of corners){const k=(y*w+x)*4;for(let a=0;a<3;a++)bg[a]+=px[k+a]/4}
 const seen=new Uint8Array(w*h),q=new Int32Array(w*h);let head=0,tail=0;const offer=k=>{if(seen[k])return;seen[k]=1;const i=k*4;const d=Math.sqrt(((px[i]-bg[0])**2+(px[i+1]-bg[1])**2+(px[i+2]-bg[2])**2)/3);if(d<=tolerance){px[i+3]=0;q[tail++]=k}};for(let x=0;x<w;x++){offer(x);offer((h-1)*w+x)}for(let y=0;y<h;y++){offer(y*w);offer(y*w+w-1)}while(head<tail){const k=q[head++],x=k%w,y=Math.floor(k/w);if(x>0)offer(k-1);if(x<w-1)offer(k+1);if(y>0)offer(k-w);if(y<h-1)offer(k+w)}}
 const rows=[];let left=w,right=-1,top=h,bottom=-1;for(let y=0;y<h;y++){let l=w,r=-1;for(let x=0;x<w;x++)if(px[(y*w+x)*4+3]>90){l=Math.min(l,x);r=x}rows.push({l,r});if(r>=l){left=Math.min(left,l);right=Math.max(right,r);top=Math.min(top,y);bottom=y}}
 if(right<left||bottom-top<3)throw new Error('未找到产品轮廓，请降低背景剔除或换用透明 PNG');
 c.putImageData(data,0,0);const colors=[[],[],[]];for(let y=top;y<=bottom;y+=3){const row=rows[y];for(let x=row.l;x<=row.r;x+=4){const k=(y*w+x)*4;if(px[k+3]>200)for(let a=0;a<3;a++)colors[a].push(px[k+a])}}const rgb=colors.map(a=>{a.sort((x,y)=>x-y);return a[Math.floor(a.length*.55)]??180});
 const hex='#'+rgb.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');const ratio=(right-left+1)/(bottom-top+1);const shape=ratio>.78?'jar':'bottle';const metal=rgb[0]>rgb[2]*1.15&&rgb[0]-rgb[2]>25?.65:.08;
 return {canvas,data,rows,w,h,left,right,top,bottom,rgb,hex,shape,metal,source:canvas.toDataURL('image/png'),originalSource,ratio};
}
export function defaultConfig(photo){return {shape:'jar',width:100,depth:55,rounding:65,cropTop:0,cropBottom:0,retain:40,roughness:.45,metalness:photo.metal,color:photo.hex,tolerance:35}}
function texture(canvas){const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t}
function pixel(photo,x,y,fallback){x=clamp(Math.round(x),0,photo.w-1);y=clamp(Math.round(y),0,photo.h-1);const k=(y*photo.w+x)*4;if(photo.data.data[k+3]<80)return fallback;return [...photo.data.data.slice(k,k+3)]}
function hexRGB(hex){const n=parseInt(hex.replace('#',''),16);return [n>>16&255,n>>8&255,n&255]}
export function createPhotoModel(photo,config,extras={}){
 const group=new T.Group(),top=clamp(Math.round(photo.top+(photo.bottom-photo.top)*config.cropTop/100),photo.top,photo.bottom-3),bottom=clamp(Math.round(photo.bottom-(photo.bottom-photo.top)*config.cropBottom/100),top+3,photo.bottom),height=3,diameter=(photo.right-photo.left+1)/(bottom-top+1)*height*config.width/100,base=hexRGB(config.color),count=112;
 const contour=[];for(let j=0;j<=count;j++){const y=bottom-(bottom-top)*j/count;let width=0,samples=0;for(let yy=Math.max(top,Math.round(y)-2);yy<=Math.min(bottom,Math.round(y)+2);yy++){const row=photo.rows[yy];if(row.r>row.l){width+=row.r-row.l+1;samples++}}const rel=samples?width/samples/(photo.right-photo.left+1):1;contour.push({y:height*j/count,r:diameter/2*Math.max(.08,rel),sourceY:y})}
 // A smooth local contour prevents alpha edge noise from becoming ridges.
 const smooth=contour.map((p,i)=>({...p,r:contour.slice(Math.max(0,i-1),Math.min(contour.length,i+2)).reduce((a,b)=>a+b.r,0)/(Math.min(contour.length,i+2)-Math.max(0,i-1))}));
 const tw=1536,th=768,canvas=document.createElement('canvas');canvas.width=tw;canvas.height=th;const ctx=canvas.getContext('2d'),image=ctx.createImageData(tw,th);
 // Estimate broad baked illumination from a smoothed column profile; leave fine label detail intact.
 const means=new Float32Array(photo.w),weights=new Uint16Array(photo.w);for(let y=top;y<=bottom;y+=4)for(let x=photo.left;x<=photo.right;x++){const k=(y*photo.w+x)*4;if(photo.data.data[k+3]>200){means[x]+=(photo.data.data[k]+photo.data.data[k+1]+photo.data.data[k+2])/3;weights[x]++}}
 for(let x=0;x<photo.w;x++)means[x]=weights[x]?means[x]/weights[x]:(base[0]+base[1]+base[2])/3;
 const illum=new Float32Array(photo.w);for(let x=photo.left;x<=photo.right;x++){let n=0,s=0;for(let xx=Math.max(photo.left,x-22);xx<=Math.min(photo.right,x+22);xx++){s+=means[xx];n++}illum[x]=s/n}const target=(base[0]+base[1]+base[2])/3;
 for(let y=0;y<th;y++){const sy=top+(bottom-top)*y/(th-1),row=photo.rows[Math.round(sy)],center=(row.l+row.r)/2,r=Math.max(1,(row.r-row.l)/2);for(let x=0;x<tw;x++){const theta=-Math.PI+x/(tw-1)*Math.PI*2,sx=center+Math.sin(theta)*r;let rgb=base;if(Math.cos(theta)>.015){rgb=pixel(photo,sx,sy,base);const gain=Math.pow(clamp(target/Math.max(30,illum[clamp(Math.round(sx),photo.left,photo.right)]),.65,1.65),1-config.retain/100);rgb=rgb.map(v=>clamp(v*gain,0,255))}const k=(y*tw+x)*4;image.data.set([rgb[0],rgb[1],rgb[2],255],k)}}ctx.putImageData(image,0,0);
 if(extras.back){const back=extras.back;const half=document.createElement('canvas');half.width=tw;half.height=th;const bc=half.getContext('2d');bc.drawImage(back,0,0,tw/2,th);ctx.drawImage(half,tw/4,0,tw/4,th,0,0,tw/4,th);ctx.drawImage(half,0,0,tw/4,th,tw*3/4,0,tw/4,th)}
 const surface=new T.MeshPhysicalMaterial({map:texture(canvas),metalness:config.metalness,roughness:config.roughness,clearcoat:config.metalness>.3?.12:.05,clearcoatRoughness:.4});
 const capMat=new T.MeshPhysicalMaterial({color:config.color,metalness:config.metalness,roughness:config.roughness,clearcoat:.12});
 if(config.shape==='box'){
 const face=document.createElement('canvas');face.width=768;face.height=768;const fc=face.getContext('2d');fc.fillStyle=config.color;fc.fillRect(0,0,768,768);fc.drawImage(photo.canvas,photo.left,top,photo.right-photo.left+1,bottom-top,0,0,768,768);const front=surface.clone();front.map=texture(face);const back=capMat.clone();if(extras.back)back.map=texture(extras.back);
 const mats=[capMat,capMat,capMat,capMat,front,back];const mesh=new T.Mesh(new T.BoxGeometry(diameter,height,diameter*config.depth/100),mats);mesh.position.y=height/2;group.add(mesh);
 }else{
 const pts=smooth.map(p=>new T.Vector2(p.r,p.y));const geom=new T.LatheGeometry(pts,160,-Math.PI,Math.PI*2);const uv=geom.attributes.uv,pos=geom.attributes.position;for(let i=0;i<uv.count;i++)uv.setY(i,pos.getY(i)/height);uv.needsUpdate=true;group.add(new T.Mesh(geom,surface));
 const topMat=capMat.clone();if(extras.top)topMat.map=texture(extras.top);const topFace=new T.Mesh(new T.CircleGeometry(smooth[count].r,128),topMat);topFace.rotation.x=-Math.PI/2;topFace.position.y=height;group.add(topFace);const bottomFace=new T.Mesh(new T.CircleGeometry(smooth[0].r,128),capMat);bottomFace.rotation.x=Math.PI/2;group.add(bottomFace);
 // Fine rims catch reflections and give the inferred circular packaging a finished edge.
 const edge=capMat.clone();edge.roughness=Math.max(.15,config.roughness-.12);for(const p of [smooth[0],smooth[count]]){const ring=new T.Mesh(new T.TorusGeometry(Math.max(.01,p.r-.008),.009,8,128),edge);ring.rotation.x=Math.PI/2;ring.position.y=p.y;group.add(ring)}
 }
 group.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});return group;
}
