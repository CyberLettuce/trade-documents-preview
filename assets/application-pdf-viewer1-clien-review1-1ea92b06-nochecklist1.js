import {reviewPageHeight} from './review-preferences.js?v=2026-11-20-pending-review-r1';
import {PdfTextView} from './pdf-readable-react.js?v=2026-11-23-site-review-r1';
import {savedPdfView,savePdfView} from './pdf-readable-text.js?v=2026-11-20-acceptance-r1';
import './application-pdf-translations1-review1-8a6839bf.js?v=2026-11-20-acceptance-r1';
import {r as React} from './index-Cj32ATD7-review1-d3188122-nochecklist1-options1-sidebar1-editorcol1.js?v=2026-11-23-site-review-r1';
import {languageCreateElement as h,preserveValue} from './language-runtime-review1-57775012.js?v=2026-11-20-acceptance-r1';
import {readPdf,attachmentEntries,findAttachment} from './application-attachment-store1-review1-5e01d232.js?v=2026-11-20-acceptance-r1';
import {loadPdfjs,pdfOptions} from './stamp-logic3.js?v=2026-11-20-acceptance-r1';
export function ApplicationPdfViewer({application,item,attachment,onFitPageWidth}){
 const entry=attachment||findAttachment(application,item||{}),id=entry?.id,name=entry?.name||item?.name||'PDF';
 const [view,setView]=React.useState(savedPdfView);
 const [pdf,setPdf]=React.useState(null),[page,setPage]=React.useState(1),[zoom,setZoom]=React.useState(onFitPageWidth?'page':'fit'),[error,setError]=React.useState(''),[busy,setBusy]=React.useState(false),[url,setUrl]=React.useState(''),[prompt,setPrompt]=React.useState(''),[password,setPassword]=React.useState(''),[native,setNative]=React.useState(false),renderRef=React.useRef(null),canvas=React.useRef(null),box=React.useRef(null),reply=React.useRef(null),[width,setWidth]=React.useState(500);
 React.useEffect(()=>{let active=true,task,opened,objectUrl;setPdf(null);setPage(1);setError('');setUrl('');setPrompt('');setPassword('');setNative(false);if(!id)return;setBusy(true);
  (async()=>{try{const record=await readPdf(id);if(!active)return;if(!record){setError('This PDF is no longer available in this browser. Add the original PDF again.');return;}objectUrl=URL.createObjectURL(new Blob([record.bytes],{type:'application/pdf'}));setUrl(objectUrl);const module=await loadPdfjs();if(!active)return;task=module.getDocument({...pdfOptions(record.bytes),enableXfa:true});task.onPassword=(callback,reason)=>{if(!active)return;reply.current=callback;setPrompt(reason===2?'Incorrect password. Try again.':'Enter the PDF password.');setBusy(false);};opened=await task.promise;if(!active){opened.destroy();return;}setPrompt('');setNative(Boolean(opened.isPureXfa));setPdf(opened);}catch(e){if(active)setError('This PDF could not be displayed. Open the original PDF to view it.');}finally{if(active)setBusy(false);}})();
  return()=>{active=false;reply.current=null;task?.destroy();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[id]);
 const compactFit=!!onFitPageWidth&&zoom==='page'&&view==='document'&&!native;
 const [pageHeight,setPageHeight]=React.useState(450);
 React.useEffect(()=>{
  if(!compactFit||!box.current)return;
  const stage=box.current;
  const toolbar=stage.parentElement.querySelector('.application-pdf-toolbar');
  const resize=()=>setPageHeight(toolbar?reviewPageHeight(toolbar,toolbar.offsetHeight+16):reviewPageHeight(stage));
  const observer=new ResizeObserver(resize);
  observer.observe(stage);
  if(toolbar)observer.observe(toolbar);
  window.addEventListener('resize',resize);
  resize();
  return()=>{observer.disconnect();window.removeEventListener('resize',resize);};
 },[compactFit,pdf]);
 React.useEffect(()=>{if(!box.current)return;const observer=new ResizeObserver(entries=>setWidth(Math.max(1,entries[0].contentRect.width-(compactFit?0:24))));observer.observe(box.current);return()=>observer.disconnect();},[id,compactFit]);
 React.useEffect(()=>{if(view==='text'){setBusy(false);return;}if(!pdf||native||!canvas.current)return;let cancelled=false,render;setBusy(true);(async()=>{try{const previous=renderRef.current;previous?.cancel();try{await previous?.promise}catch{}if(cancelled)return;const source=await pdf.getPage(page);if(cancelled)return;const base=source.getViewport({scale:1}),pageScale=Math.min(2,pageHeight/base.height),scale=compactFit?Math.min(pageScale,width/base.width):zoom==='fit'?Math.min(2,width/base.width):Number(zoom)/100,view=source.getViewport({scale}),density=onFitPageWidth?2:Math.min(window.devicePixelRatio||1,2),target=canvas.current;if(compactFit)onFitPageWidth(base.width*pageScale);target.width=Math.ceil(view.width*density);target.height=Math.ceil(view.height*density);target.style.width=view.width+'px';target.style.height=view.height+'px';render=source.render({canvasContext:target.getContext('2d'),viewport:view,transform:density===1?null:[density,0,0,density,0,0],annotationMode:1,background:'#fff'});renderRef.current=render;await render.promise;if(!cancelled)setError('');}catch(e){if(!cancelled&&e.name!=='RenderingCancelledException')setError('This page could not be displayed. Open the original PDF to view it.');}finally{if(!cancelled)setBusy(false);}})();return()=>{cancelled=true;render?.cancel();};},[pdf,page,width,zoom,native,view,compactFit,pageHeight,onFitPageWidth]);
 const button=(text,action,disabled)=>h('button',{type:'button',className:'button outline',onClick:action,disabled},text);
 return h('section',{className:'application-pdf-viewer'+(pdf&&compactFit?' compact-fit-page':''),'aria-label':'Uploaded PDF preview'},
  h('div',{className:'application-pdf-toolbar'},h('strong',null,preserveValue(name)),pdf&&h('div',{className:'pdf-view-choice',role:'group','aria-label':'PDF view'},...['document','text'].map(value=>h('button',{key:value,type:'button','aria-pressed':view===value,onClick:()=>{setView(value);savePdfView(value)}},value==='text'?'Text view':'Document view'))),pdf&&!native&&h('div',{className:'application-pdf-controls'},button('Previous page',()=>setPage(p=>p-1),page<=1),h('span',{'aria-live':'polite'},'Page '+page+' of '+pdf.numPages),button('Next page',()=>setPage(p=>p+1),page>=pdf.numPages),h('label',null,'Zoom',h('select',{'aria-label':'PDF zoom',value:zoom,onChange:e=>setZoom(e.target.value)},onFitPageWidth&&h('option',{value:'page'},'Fit page'),h('option',{value:'fit'},'Fit width'),...['75','100','125','150'].map(z=>h('option',{key:z,value:z},z+'%'))))),url&&h('a',{href:url,target:'_blank',rel:'noopener',className:'button outline'},'Open original PDF')),
  !id&&h('div',{className:'application-pdf-notice'},h('p',null,'Only the filename is available for this attachment. Add the original PDF to the application to preview it.')),
  prompt&&h('form',{className:'application-pdf-password',onSubmit:e=>{e.preventDefault();if(reply.current){setBusy(true);reply.current(password);setPassword('');}}},h('label',null,prompt,h('input',{type:'password',value:password,onChange:e=>setPassword(e.target.value),autoComplete:'off'})),button('Open PDF',()=>{if(reply.current){setBusy(true);reply.current(password);setPassword('');}},!password)),
  error&&h('p',{role:'alert',className:'field-error'},error),busy&&h('p',{role:'status'},'Loading PDF…'),
  pdf&&view==='text'&&h(PdfTextView,{key:id+':'+page,pdf,page}),
  h('div',{className:'application-pdf-pages',ref:box,'aria-busy':busy,hidden:view==='text'&&!!pdf,role:'region','aria-label':'PDF document view',tabIndex:0},native&&url?h('iframe',{title:name,src:url}):h('canvas',{ref:canvas,hidden:!pdf||!!prompt,role:'img','aria-label':name+', page '+page+(pdf?' of '+pdf.numPages:'')})),
  id&&h('small',{className:'application-pdf-note'},'PDF stored in this browser. The original file is unchanged.'));
}
export function ApplicationUploadsPreview({application,onFitPageWidth}){const entries=attachmentEntries(application),[selected,setSelected]=React.useState('');const entry=entries.find(e=>e.value===selected)||entries.find(e=>e.id)||entries[0];return h('div',{className:'application-uploads-preview'},entries.length>1&&h('label',null,'Uploaded PDF',h('select',{value:entry?.value||'',onChange:e=>setSelected(e.target.value)},...entries.map(e=>h('option',{key:e.value,value:e.value},preserveValue(e.name))))),entry?h(ApplicationPdfViewer,{key:entry.value,application,attachment:entry,onFitPageWidth}):h('p',null,'No files attached yet.'));}
