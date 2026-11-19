import {r as React} from './index-Cj32ATD7-review1-d3188122-nochecklist1-options1-sidebar1-editorcol1.js?v=2026-11-19-wcag22-r1';
import {languageCreateElement as h} from './language-runtime-review1-57775012.js?v=2026-11-19-wcag22-r1';
import {readPdfText,renderPdfText} from './pdf-readable-text.js?v=2026-11-19-wcag22-r1';
export function PdfTextView({pdf,page}) {
 const [model,setModel]=React.useState(null),[error,setError]=React.useState(false),host=React.useRef(null);
 React.useEffect(()=>{let active=true;setModel(null);setError(false);(async()=>{try{const sheet=await pdf.getPage(page),value=await readPdfText(sheet);if(active)setModel(value)}catch{if(active)setError(true)}})();return()=>{active=false}},[pdf,page]);
 React.useEffect(()=>{if(host.current&&model)renderPdfText(host.current,model)},[model]);
 return h('section',{className:'pdf-text-view','aria-label':'PDF text view',tabIndex:0},
  h('h2',null,'PDF text view'),
  !model&&!error&&h('p',{role:'status'},'Reading PDF text…'),
  error&&h('p',{role:'alert'},'Text could not be read. Open the original PDF or request an accessible copy.'),
  model&&!model.hasText&&h('p',{role:'status'},'No readable text was found on this page. A scanned or image-only PDF needs a text-readable copy or a checked transcript.'),
  model?.hasText&&h('p',{className:'pdf-reading-note'},model.tagged&&!model.partial?'Reading order follows the PDF structure tags.':'This PDF has no complete reading-order tags. Some text follows the file’s stored order.'),
  model?.hasText&&h('p',{className:'pdf-reading-note'},'Text view does not reproduce every image, stamp or layout detail. Check the original document where needed.'),
  h('div',{className:'pdf-readable-content',ref:host,translate:'no',dir:'auto'}));
}
