export const MAX_UPLOAD = 12 * 1024 * 1024;
export function fileKind(file) {
  if (!file || !file.size) throw new Error('Choose a file that contains an image or PDF.');
  if (file.size > MAX_UPLOAD) throw new Error('Choose a file smaller than 12 MB.');
  if (file.type === 'application/pdf' || (!file.type && /\.pdf$/i.test(file.name))) return 'pdf';
  if (['image/png','image/jpeg','image/webp'].includes(file.type) || (!file.type && /\.(png|jpe?g|webp)$/i.test(file.name))) return 'image';
  throw new Error('Choose a PNG, JPG, WebP image or PDF.');
}
export function clampCrop(crop) {
  const x = Math.max(0, Math.min(.99, Number(crop.x) || 0));
  const y = Math.max(0, Math.min(.99, Number(crop.y) || 0));
  return {x,y,w:Math.max(.01,Math.min(1-x,Number(crop.w)||.01)),h:Math.max(.01,Math.min(1-y,Number(crop.h)||.01))};
}
export function dragCrop(a,b) { return clampCrop({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)}); }
export function inkBounds({data,width,height}) {
  let left=width,top=height,right=-1,bottom=-1,count=0;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const i=(y*width+x)*4;
    const lum=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722);
    if(data[i+3]>40 && lum<200){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
  }
  if(count<10) return null;
  const pad=Math.max(6,Math.round(Math.max(width,height)*.015));
  left=Math.max(0,left-pad);top=Math.max(0,top-pad);right=Math.min(width,right+pad+1);bottom=Math.min(height,bottom+pad+1);
  return {x:left/width,y:top/height,w:(right-left)/width,h:(bottom-top)/height};
}
export function cleanPixels(data) {
  for(let i=0;i<data.length;i+=4){
    const lum=data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722;
    data[i+3]=Math.round(data[i+3]*Math.max(0,Math.min(1,(220-lum)/65)));
  }
  return data;
}
// Conservative suggestions, not handwriting recognition. The user confirms the result.
// PDF text rectangles help exclude printed text; scanned pages use stroke geometry.
export function signatureCandidates({data,width,height}, textRects=[]) {
  const isolated=width/height>2;
  const mask=new Uint8Array(width*height),seen=new Uint8Array(mask.length),queue=new Int32Array(mask.length);
  for(let i=0;i<mask.length;i++) {const k=i*4;mask[i]=data[k+3]>40&&(data[k]*.2126+data[k+1]*.7152+data[k+2]*.0722)<185?1:0;}
  for(const r of textRects){
    const x0=Math.max(0,Math.floor(r.x*width)-1),x1=Math.min(width,Math.ceil((r.x+r.w)*width)+1);
    const y0=Math.max(0,Math.floor(r.y*height)-1),y1=Math.min(height,Math.ceil((r.y+r.h)*height)+1);
    for(let y=y0;y<y1;y++)mask.fill(0,y*width+x0,y*width+x1);
  }
  const parts=[];
  for(let i=0;i<mask.length;i++){
    if(!mask[i]||seen[i])continue;
    let head=0,tail=1,left=i%width,right=left,top=Math.floor(i/width),bottom=top;queue[0]=i;seen[i]=1;
    while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(x+dx<0||x+dx>=width||y+dy<0||y+dy>=height)continue;const n=p+dy*width+dx;if(mask[n]&&!seen[n]){seen[n]=1;queue[tail++]=n;}}
    }
    const w=right-left+1,h=bottom-top+1;
    if(tail<5||w/h>45||h/w>25||w>width*.98||h>height*(isolated?.95:.35))continue;
    parts.push({left,right,top,bottom,w,h,count:tail});
  }
  // Joined pen strokes tend to be wider and less regular than individual printed letters.
  const seeds=parts.filter(p=>p.w>=Math.max(20,width*.025)&&p.h>=Math.max(10,height*.012)&&p.w/p.h>1.15&&p.count/(p.w*p.h)<.55);
  const results=[];
  for(const seed of seeds){
    let group=[seed],left=seed.left,right=seed.right,top=seed.top,bottom=seed.bottom;
    for(let pass=0;pass<3;pass++)for(const p of parts){
      if(group.includes(p))continue;
      const gap=Math.max(0,p.left-right,left-p.right),middle=(p.top+p.bottom)/2;
      if(gap<Math.max(12,seed.h*.65)&&middle>top-seed.h*.2&&middle<bottom+seed.h*.2&&p.h<seed.h*1.8){group.push(p);left=Math.min(left,p.left);right=Math.max(right,p.right);top=Math.min(top,p.top);bottom=Math.max(bottom,p.bottom);}
    }
    const w=right-left+1,h=bottom-top+1,ratio=w/h,density=group.reduce((sum,p)=>sum+p.count,0)/(w*h);
    if(ratio<1.5||ratio>18||h>height*(isolated?.95:.3)||w<width*.045||density>.5)continue;
    const pad=Math.max(4,h*.1),x=Math.max(0,left-pad),y=Math.max(0,top-pad);
    const crop=clampCrop({x:x/width,y:y/height,w:(Math.min(width,right+pad+1)-x)/width,h:(Math.min(height,bottom+pad+1)-y)/height});
    // Ignore duplicate candidates belonging to the same handwritten line.
    if(results.some(r=>Math.abs(r.crop.y-crop.y)<crop.h*.6&&Math.abs(r.crop.x-crop.x)<crop.w*.6))continue;
    results.push({crop,score:Math.min(5,seed.w/seed.h)+Math.min(3,seed.w/width*10)+Math.min(2,h/height*15)-density});
  }
  return results.sort((a,b)=>b.score-a.score).slice(0,3);
}
export function findSignatures(source,textRects=[]){
  const scale=Math.min(1,1000/Math.max(source.width,source.height)),small=makeCanvas(source.width*scale,source.height*scale);
  small.getContext('2d').drawImage(source,0,0,small.width,small.height);
  return signatureCandidates(small.getContext('2d').getImageData(0,0,small.width,small.height),textRects);
}
export function makeCanvas(w,h){ const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w));canvas.height=Math.max(1,Math.round(h));return canvas; }
export function rotateCanvas(source,turn){
  const out=makeCanvas(source.height,source.width),ctx=out.getContext('2d');
  ctx.translate(out.width/2,out.height/2);ctx.rotate(turn*Math.PI/2);ctx.drawImage(source,-source.width/2,-source.height/2);return out;
}
export function cropVariants(source,crop){
  const c=clampCrop(crop),sw=source.width*c.w,sh=source.height*c.h;
  const scale=Math.min(1,1000/sw,440/sh),out=makeCanvas(sw*scale,sh*scale),ctx=out.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(source,source.width*c.x,source.height*c.y,sw,sh,0,0,out.width,out.height);
  const pixels=ctx.getImageData(0,0,out.width,out.height),ink=inkBounds(pixels);
  const original=smallPNG(out);cleanPixels(pixels.data);ctx.putImageData(pixels,0,0);
  return {original,clean:smallPNG(out),hasInk:!!ink,lowResolution:sw<180||sh<35,width:out.width,height:out.height};
}
function smallPNG(source){
  let out=source,url=out.toDataURL('image/png');
  while(url.length>450000&&out.width>150&&out.height>30){
    const smaller=makeCanvas(out.width*.8,out.height*.8);smaller.getContext('2d').drawImage(out,0,0,smaller.width,smaller.height);out=smaller;url=out.toDataURL('image/png');
  }
  if(url.length>450000) throw new Error('This crop is too detailed. Select a smaller area around the signature.');
  return url;
}
export async function readImage(file){
  const url=URL.createObjectURL(file),img=new Image();
  try {
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('The image could not be opened. Try another image or export it as PNG.'));img.src=url;});
    if(img.naturalWidth*img.naturalHeight>40000000) throw new Error('This image is too large to edit. Resize it to under 40 megapixels first.');
    const scale=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=makeCanvas(img.naturalWidth*scale,img.naturalHeight*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas;
  } finally {URL.revokeObjectURL(url);}
}
