// PDF data remains in the browser. Never interpret document text as HTML.
const cache = new WeakMap();
const element = (tag, children = [], attrs = {}) => ({tag, children, attrs});
const text = value => ({text:String(value ?? '')});
const safeLanguage = value => /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(value || '') ? value : undefined;
const roleTags = {Document:'div',Part:'div',Art:'article',Sect:'section',Div:'div',P:'p',H:'h2',H1:'h1',H2:'h2',H3:'h3',H4:'h4',H5:'h5',H6:'h6',L:'ul',LI:'li',Lbl:'span',LBody:'div',Table:'table',THead:'thead',TBody:'tbody',TFoot:'tfoot',TR:'tr',TH:'th',TD:'td',Span:'span',Quote:'blockquote',BlockQuote:'blockquote',Note:'aside',Caption:'p'};

export function pdfTextModel(content, structure, annotations = []) {
 const runs=[],groups=new Map(),stack=[];
 for(const item of content.items || []) {
  if(item.type?.startsWith('beginMarkedContent')) { stack.push(item.id || null); continue; }
  if(item.type==='endMarkedContent') { stack.pop(); continue; }
  if(typeof item.str!=='string')continue;
  const run={text:item.str+(item.hasEOL?'\n':' '),dir:item.dir==='rtl'?'rtl':'ltr',index:runs.length};runs.push(run);
  for(const id of new Set(stack.filter(Boolean))) { if(!groups.has(id))groups.set(id,[]);groups.get(id).push(run); }
 }
 const used=new Set();
 function consume(items) { const available=items.filter(r=>!used.has(r.index));available.forEach(r=>used.add(r.index));return available.map(r=>text(r.text)); }
 function visit(node) {
  if(!node)return [];
  if(node.type==='content')return consume(groups.get(node.id)||[]);
  if(node.role==='Artifact') { for(const child of node.children||[])visit(child);return []; }
  const children=(node.children||[]).flatMap(visit),attrs={};
  if(safeLanguage(node.lang))attrs.lang=node.lang;
  if(node.role==='Figure')return node.alt?[element('figure',[element('figcaption',[text(node.alt)]),...children],attrs)]:children;
  if(!children.length)return [];
  if(node.role==='TH') { const scope=node.attributes?.scope;if(['row','col','rowgroup','colgroup'].includes(scope))attrs.scope=scope; }
  return [element(roleTags[node.role]||'div',children,attrs)];
 }
 const nodes=structure?visit(structure):[];
 const remaining=runs.filter(r=>!used.has(r.index));
 if(remaining.some(r=>r.text.trim()))nodes.push(element('div',[text(remaining.map(r=>r.text).join(''))],{class:'pdf-text-unstructured',dir:'auto'}));
 const fields=annotations.filter(a=>a.subtype==='Widget'&&a.fieldType!=='Sig'&&!a.password&&!(Number(a.fieldFlags)&8192)).map(a=>({name:a.alternativeText||a.fieldName||'',value:Array.isArray(a.fieldValue)?a.fieldValue.join(', '):String(a.fieldValue??'')})).filter(a=>a.name||a.value);
 if(fields.length)nodes.push(element('dl',fields.flatMap(f=>[element('dt',[text(f.name)]),element('dd',[text(f.value||'—')])]),{class:'pdf-text-fields'}));
 const hasText=runs.some(r=>r.text.trim())||fields.length>0||nodes.some(n=>JSON.stringify(n).includes('figcaption'));
 return {nodes,hasText:Boolean(hasText),tagged:Boolean(structure&&used.size),partial:Boolean(structure&&remaining.some(r=>r.text.trim())),lang:safeLanguage(content.lang),plain:runs.map(r=>r.text).join('').trim()};
}

async function textContent(page) {
 // Read PDF.js's public stream without requiring ReadableStream async iteration,
 // which is absent in some WebKit versions. Preserve the special XFA path.
 if(page.isPureXfa || typeof page.streamTextContent!=='function')return page.getTextContent({includeMarkedContent:true});
 const reader=page.streamTextContent({includeMarkedContent:true}).getReader();
 const content={items:[],styles:{},lang:null};
 try { while(true) { const {done,value}=await reader.read();if(done)break;content.items.push(...value.items);Object.assign(content.styles,value.styles);content.lang??=value.lang; } }
 finally { reader.releaseLock(); }
 return content;
}

export function readPdfText(page) {
 if(!cache.has(page))cache.set(page,(async()=>{
  const [content,structure,annotations]=await Promise.allSettled([textContent(page),page.getStructTree(),page.getAnnotations({intent:'display'})]);
  if(content.status==='rejected')throw content.reason;
  return pdfTextModel(content.value,structure.status==='fulfilled'?structure.value:null,annotations.status==='fulfilled'?annotations.value:[]);
 })());
 return cache.get(page);
}

export function renderPdfText(container,model) {
 const document=container.ownerDocument;
 function build(node) {
  if('text' in node)return document.createTextNode(node.text);
  const el=document.createElement(node.tag);for(const [key,value] of Object.entries(node.attrs||{}))el.setAttribute(key,value);
  el.append(...node.children.map(build));return el;
 }
 container.replaceChildren(...model.nodes.map(build));
 if(model.lang)container.lang=model.lang;else container.removeAttribute('lang');
}

export function savedPdfView() { try{return localStorage.getItem('trade-documents-pdf-reading-view-v1')==='text'?'text':'document'}catch{return 'document'} }
export function savePdfView(value) { try{localStorage.setItem('trade-documents-pdf-reading-view-v1',value)}catch{} }
