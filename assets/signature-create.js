// Shared by React and Vue. Signature pixels stay in the browser.
export const SIGNATURE_STYLES = {
  Cursive: 'italic 96px "Segoe Print", "Brush Script MT", cursive',
  Italic: 'italic 96px Georgia, serif',
  Plain: '96px Arial, sans-serif'
};
export function normaliseSignatureText(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80);
}
export function croppedSignature(canvas) {
  const ctx = canvas.getContext('2d', {willReadFrequently:true});
  const {data,width,height} = ctx.getImageData(0,0,canvas.width,canvas.height);
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
  if(right<left)return '';
  const padding=16, out=document.createElement('canvas');
  out.width=right-left+1+padding*2;out.height=bottom-top+1+padding*2;
  out.getContext('2d').drawImage(canvas,left,top,right-left+1,bottom-top+1,padding,padding,right-left+1,bottom-top+1);
  return out.toDataURL('image/png');
}
export function textSignature(value,style='Cursive') {
  const text=normaliseSignatureText(value);if(!text)return '';
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=240;
  const ctx=canvas.getContext('2d');ctx.font=SIGNATURE_STYLES[style]||SIGNATURE_STYLES.Cursive;
  const scale=Math.min(1,1100/Math.max(1,ctx.measureText(text).width));
  ctx.font=ctx.font.replace(/\d+(?:\.\d+)?px/,`${96*scale}px`);
  ctx.direction=/[\u0590-\u08ff]/.test(text)?'rtl':'ltr';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#111';
  ctx.fillText(text,600,120);return croppedSignature(canvas);
}
export function signaturePad(canvas,onChange=()=>{}) {
  canvas.width=1200;canvas.height=360;
  const ctx=canvas.getContext('2d');let strokes=[],active=null,pointer=null;
  const point=e=>{const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(1200,(e.clientX-r.left)*1200/r.width)),y:Math.max(0,Math.min(360,(e.clientY-r.top)*360/r.height))}};
  function paint(){ctx.clearRect(0,0,1200,360);ctx.strokeStyle=ctx.fillStyle='#111';ctx.lineWidth=4;ctx.lineCap=ctx.lineJoin='round';for(const stroke of [...strokes,...(active?[active]:[])]){ctx.beginPath();ctx.moveTo(stroke[0].x,stroke[0].y);if(stroke.length===1){ctx.arc(stroke[0].x,stroke[0].y,2,0,Math.PI*2);ctx.fill()}else{for(const p of stroke.slice(1))ctx.lineTo(p.x,p.y);ctx.stroke()}}}
  const changed=()=>onChange(strokes.length);
  function down(e){if(pointer!==null||!e.isPrimary||e.button!==0)return;e.preventDefault();pointer=e.pointerId;active=[point(e)];canvas.setPointerCapture(pointer);paint()}
  function move(e){if(e.pointerId!==pointer||!active)return;e.preventDefault();active.push(point(e));paint()}
  function end(e){if(e.pointerId!==pointer||!active)return;active.push(point(e));strokes.push(active);active=null;pointer=null;paint();changed()}
  function cancel(e){if(e.pointerId!==pointer)return;active=null;pointer=null;paint()}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);
  return {clear(){strokes=[];active=null;pointer=null;paint();changed()},undo(){strokes.pop();paint();changed()},image(){return croppedSignature(canvas)},destroy(){canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('lostpointercapture',cancel)}};
}
