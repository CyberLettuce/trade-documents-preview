import './chamber-evidence-pdf-translations1.js?v=2026-11-20-acceptance-r1';
import {r as React,I as Icon} from './index-Cj32ATD7-review1-d3188122-nochecklist1-options1-sidebar1-editorcol1.js?v=2026-11-20-pending-review-r1';
import {languageCreateElement as h,preserveValue} from './language-runtime-review1-57775012.js?v=2026-11-20-acceptance-r1';
import {storePdf,readPdf} from './application-attachment-store1-review1-5e01d232.js?v=2026-11-20-acceptance-r1';

function download(bytes,name,type){
 const url=URL.createObjectURL(new Blob([bytes],{type})),link=document.createElement('a');
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function ChamberEvidenceFiles({application,onChange,readOnly=false,onBusy}){
 const files=application.files||[],form=application.form||application,pdfFiles=form.pdfFiles||application.pdfFiles||{};
 const [busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),listId=React.useId();
 async function attach(event){
  const selected=Array.from(event.target.files||[]);event.target.value='';if(!selected.length||readOnly||busy)return;
  setBusy(true);onBusy?.(true);setError('');
  const names=[...files],metadata={...pdfFiles,files:{...pdfFiles.files}},errors=[];
  try{
   for(const file of selected){try{const saved=await storePdf(file);if(!names.includes(saved.name))names.push(saved.name);metadata.files[saved.name]=saved.id;}catch(reason){errors.push(reason.message);}}
   if(selected.some(file=>metadata.files[file.name]))onChange({files:names,pdfFiles:metadata});
   if(errors.length)setError(errors.join(' '));
  }finally{setBusy(false);onBusy?.(false);}
 }
 async function original(name){
  setError('');try{const file=await readPdf(pdfFiles.files?.[name]);if(!file)throw Error('The saved PDF is unavailable. Add the original PDF again.');download(file.bytes,name,'application/pdf');}catch(reason){setError(reason.message);}
 }
 function remove(name,index){
  const metadata={...pdfFiles,files:{...pdfFiles.files}};delete metadata.files[name];
  onChange({files:files.filter((_,at)=>at!==index),pdfFiles:metadata});
 }
 return h('div',{className:'ch-files chamber-evidence-pdfs','aria-busy':busy},
  files.map((name,index)=>h('div',{className:'file-row',key:name+index},
   h(Icon,{name:'paperclip'}),h('span',{id:listId+'-'+index},preserveValue(name)),
   pdfFiles.files?.[name]?h('button',{type:'button',className:'text-button','aria-describedby':listId+'-'+index,onClick:()=>original(name)},'Download original PDF'):
    h('button',{type:'button',className:'text-button','aria-label':'Download file details for '+name,onClick:()=>download('File name: '+name+'\nOriginal file contents are not stored.\n',name.replace(/\.[^.]+$/,'')+'-file-details.txt','text/plain;charset=utf-8')},'Download file details'),
   !readOnly&&h('button',{type:'button',className:'icon-button',disabled:busy,'aria-label':'Remove '+name,onClick:()=>remove(name,index)},h(Icon,{name:'x-lg'}))
  )),
  !readOnly&&h(React.Fragment,null,
   h('label',{className:'button outline file-inline'},h(Icon,{name:'upload'}),'Attach documents',h('input',{'aria-label':'Attach documents',type:'file',accept:'.pdf,application/pdf',multiple:true,disabled:busy,onChange:attach})),
   h('p',{className:'ch-small muted'},'PDF only, up to 10 MB each. PDFs are saved in this browser for document preview.')
  ),
  busy&&h('p',{role:'status'},'Saving…'),error&&h('p',{role:'alert',className:'field-error'},error)
 );
}
