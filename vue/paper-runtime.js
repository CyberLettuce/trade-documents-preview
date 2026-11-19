import {h,Fragment} from './assets/vue.esm-browser.prod.js?v=2026-11-19-wcag22-r1';
export {Fragment};
let activeEdit;
export function withPaperEdit(edit,render){const previous=activeEdit;activeEdit=edit;try{return render()}finally{activeEdit=previous}}
export const createContext=()=>({Provider:props=>props.children});
export const useContext=()=>activeEdit;
// These presentational functions produce Vue VNodes directly. All interaction state is owned by Vue.
export function jsx(type,props,...children){props={...props};delete props.key;const flat=(children.length?children:[props.children]).flat(Infinity).filter(c=>c!==undefined&&c!==null&&c!==false&&c!==true);if(typeof type==='function')return type({...props,children:flat.length===1?flat[0]:flat});delete props.children;if(props.className){props.class=props.className;delete props.className}if(props.htmlFor){props.for=props.htmlFor;delete props.htmlFor}if(props.style)props.style=Object.fromEntries(Object.entries(props.style).map(([k,v])=>[k,typeof v==='number'&&!['opacity','zIndex','fontWeight','lineHeight'].includes(k)?v+'px':v]));return h(type,props,flat)}
// Vue measures the rendered sheet in NativePaper; expanding content prevents silent clipping.
export const useGoodsBoxFit=()=>({status:'unmeasured',ref:undefined});
export const formatDate=value=>{if(!value)return'';const d=new Date(value);return Number.isNaN(+d)?value:d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})};
export const money=(value,currency='GBP')=>new Intl.NumberFormat('en-GB',{style:'currency',currency}).format(Number(value)||0);
