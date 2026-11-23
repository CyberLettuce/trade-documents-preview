import {r as React} from './index-Cj32ATD7-review1-d3188122-nochecklist1-options1-sidebar1-editorcol1.js?v=2026-11-23-site-review-r1';
import {languageCreateElement as h} from './language-runtime-review1-57775012.js?v=2026-11-20-acceptance-r1';
import {textSignature,signaturePad,SIGNATURE_STYLES} from './signature-create.js?v=2026-11-20-acceptance-r1';
const {useState,useEffect,useRef}=React;
export function SignatureCreate({mode,onChange,onPendingChange,onCancel}) {
  const [name,setName]=useState(''),[style,setStyle]=useState('Cursive'),[count,setCount]=useState(0),[preview,setPreview]=useState(''),[error,setError]=useState('');
  const canvas=useRef(null),pad=useRef(null);const pending=mode==='type'?!!name.trim():count>0;
  useEffect(()=>{onPendingChange?.(pending);return()=>onPendingChange?.(false)},[pending,onPendingChange]);
  useEffect(()=>{setError('');if(mode==='draw'){pad.current=signaturePad(canvas.current,n=>{setCount(n);setPreview(pad.current.image())});setCount(0);setPreview('');return()=>{pad.current?.destroy();pad.current=null}}},[mode]);
  useEffect(()=>{if(mode==='type')setPreview(textSignature(name,style))},[mode,name,style]);
  function useSignature(){const image=mode==='type'?textSignature(name,style):pad.current?.image();if(!image){setError(mode==='type'?'Enter your signature text.':'Draw your signature first.');return}onChange(image);onCancel()}
  return h('section',{className:'signature-create','aria-label':mode==='type'?'Type signature':'Draw signature'},
    mode==='type'?h(React.Fragment,null,
      h('label',null,'Signature text',h('input',{type:'text',value:name,maxLength:80,autoComplete:'off',onChange:e=>setName(e.target.value)})),
      h('label',null,'Signature style',h('select',{value:style,onChange:e=>setStyle(e.target.value)},Object.keys(SIGNATURE_STYLES).map(value=>h('option',{key:value,value},value))))):h(React.Fragment,null,
      h('p',{className:'signature-draw-help'},'Draw with your mouse, finger or pen. You can also use Type for a keyboard-only signature.'),
      h('canvas',{ref:canvas,className:'signature-draw-canvas',role:'img','aria-label':'Signature drawing area'}),
      h('div',{className:'button-row'},h('button',{type:'button',className:'button outline',disabled:!count,onClick:()=>pad.current.undo()},'Undo last stroke'),h('button',{type:'button',className:'button outline',disabled:!count,onClick:()=>pad.current.clear()},'Clear drawing'))),
    h('div',{className:'signature-created-preview'},h('h4',null,'Signature preview'),preview?h('img',{src:preview,alt:'Signature preview'}):h('p',null,'Your signature preview will appear here.')),
    error&&h('p',{role:'alert',className:'signature-error'},error),
    h('p',null,'Save the signatory to keep this signature.'),
    h('div',{className:'button-row'},h('button',{type:'button',className:'button outline',onClick:onCancel},'Cancel'),h('button',{type:'button',className:'button primary',disabled:!preview,onClick:useSignature},'Use this signature')));
}
