import test from 'node:test';
import assert from 'node:assert/strict';
import {pdfTextModel,readPdfText} from '../../assets/pdf-readable-text.js';
const begin=id=>({type:'beginMarkedContentProps',id}),end={type:'endMarkedContent'},run=(str,dir='ltr')=>({str,dir,hasEOL:true});
const words=node=>'text' in node?node.text:(node.children||[]).map(words).join('');
test('tagged reading order takes priority over drawing order without duplicating text',()=>{
 const content={items:[begin('body'),run('Paragraph'),end,begin('title'),run('Heading'),end]};
 const tree={role:'Document',children:[{role:'H1',children:[{type:'content',id:'title'}]},{role:'P',children:[{type:'content',id:'body'}]}]};
 const m=pdfTextModel(content,tree);assert.equal(words({children:m.nodes}),'Heading\nParagraph\n');assert.equal(m.nodes[0].children[0].tag,'h1');assert(m.tagged&&!m.partial);
});
test('unreferenced text in a partially tagged page remains available',()=>{
 const m=pdfTextModel({items:[begin('known'),run('Tagged text'),end,run('Additional text')]},{role:'P',children:[{type:'content',id:'known'}]});assert(m.partial);assert.equal(words({children:m.nodes}),'Tagged text\nAdditional text\n');
});
test('untagged and Arabic text remain text, including strings resembling HTML',()=>{
 const m=pdfTextModel({lang:'ar',items:[run('مرحبا','rtl'),run('<img src=x onerror=alert(1)>')]},null);assert.equal(m.lang,'ar');assert(!m.tagged);assert(m.nodes[0].children[0].text.includes('<img'));assert.equal(m.nodes[0].attrs.dir,'auto');
});
test('form labels and values are readable, but password and signature fields are excluded',()=>{
 const m=pdfTextModel({items:[]},null,[{subtype:'Widget',fieldType:'Tx',fieldName:'Invoice',fieldValue:'INV-42'},{subtype:'Widget',fieldType:'Tx',fieldName:'Password',fieldValue:'secret',fieldFlags:8192},{subtype:'Widget',fieldType:'Sig',fieldName:'Signature',fieldValue:'private'}]);assert(m.hasText);assert.equal(words({children:m.nodes}),'InvoiceINV-42');
});
test('empty pages are distinguished from extraction errors and figure alternatives are retained',async()=>{
 assert.equal(pdfTextModel({items:[]},null).hasText,false);const figure=pdfTextModel({items:[]},{role:'Figure',alt:'Chamber stamp'});assert(figure.hasText);assert.equal(words({children:figure.nodes}),'Chamber stamp');
 await assert.rejects(readPdfText({getTextContent:async()=>{throw Error('Unreadable font')},getStructTree:async()=>null,getAnnotations:async()=>[]}),/Unreadable font/);
});
test('missing optional structure and annotations do not discard readable text; repeat reads are cached',async()=>{
 let reads=0;const page={getTextContent:async()=>{reads++;return{items:[run('Readable page')]}},getStructTree:async()=>{throw Error('Bad tags')},getAnnotations:async()=>{throw Error('Bad form')}};const [a,b]=await Promise.all([readPdfText(page),readPdfText(page)]);assert.equal(reads,1);assert.equal(a,b);assert(a.hasText);assert.equal(a.plain,'Readable page');
});
