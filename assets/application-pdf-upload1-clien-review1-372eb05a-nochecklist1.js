import './application-pdf-translations1-review1-8a6839bf.js?v=2026-11-20-acceptance-r1';
import {r as React} from './index-Cj32ATD7-review1-d3188122-nochecklist1-options1-sidebar1-editorcol1.js?v=2026-11-23-site-review-r1';
import {languageCreateElement as h} from './language-runtime-review1-57775012.js?v=2026-11-20-acceptance-r1';
import {storePdf} from './application-attachment-store1-review1-5e01d232.js?v=2026-11-20-acceptance-r1';
export const PdfUploadContext=React.createContext(null);
export function PdfUploadProvider({form,onPatch,children}){
 const latest=React.useRef({form,onPatch});latest.current={form,onPatch};
 const [states,setStates]=React.useState({}),queue=React.useRef(Promise.resolve()),mounted=React.useRef(true);
 React.useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 function handle(event,field){const files=Array.from(event.target.files||[]);event.target.value='';if(!files.length)return;
  setStates(s=>({...s,[field]:{busy:true,error:''}}));
  queue.current=queue.current.then(async()=>{
   const accepted=[],errors=[];
   for(const file of files)try{accepted.push(await storePdf(file));}catch(e){errors.push(e.message);}
   if(!mounted.current)return;
   if(accepted.length){const current=latest.current,form=current.form,pdfFiles={...form.pdfFiles,[field]:{...form.pdfFiles?.[field]}};for(const record of accepted)pdfFiles[field][record.name]=record.id;
    const names=field==='authorisationFile'?accepted[0].name:[...new Set([...(form[field]||[]),...accepted.map(r=>r.name)])];current.onPatch({[field]:names,pdfFiles});
   }
   setStates(s=>({...s,[field]:{busy:false,error:errors.join(' ')}}));
  }).catch(()=>{if(mounted.current)setStates(s=>({...s,[field]:{busy:false,error:'The PDF could not be saved. Please add it again.'}}));});
 }
 return h(PdfUploadContext.Provider,{value:{states,handle}},children);
}
export function PdfUploadInput({field,...props}){const upload=React.useContext(PdfUploadContext),state=upload?.states[field];return h(React.Fragment,null,h('input',{...props,type:'file',accept:'.pdf,application/pdf',disabled:state?.busy,onChange:e=>upload.handle(e,field)}),state?.busy&&h('small',{role:'status'},'Saving PDF…'),state?.error&&h('p',{role:'alert',className:'field-error'},state.error));}
