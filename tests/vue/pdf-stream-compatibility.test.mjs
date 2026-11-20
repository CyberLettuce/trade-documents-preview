import test from 'node:test';
import assert from 'node:assert/strict';
import {readPdfText} from '../../assets/pdf-readable-text.js';

test('PDF reading works with a reader-only stream and preserves chunk order',async()=>{
 let released=false,called=0;const chunks=[{items:[{str:'First',hasEOL:true}],styles:{},lang:'en-GB'},{items:[{str:'Second'}],styles:{},lang:null}];
 const page={streamTextContent(options){assert.equal(options.includeMarkedContent,true);return{getReader:()=>({read:async()=>chunks.length?{value:chunks.shift(),done:false}:{done:true},releaseLock(){released=true}})}},getTextContent(){throw Error('Requires unavailable async iterator')},getStructTree:async()=>null,getAnnotations:async()=>[]};
 const model=await readPdfText(page);assert.equal(model.plain,'First\nSecond');assert.equal(model.lang,'en-GB');assert.equal(released,true);assert.equal(await readPdfText(page),model);
});
test('PDF stream failures release the reader and remain distinguishable from empty text',async()=>{
 let released=false;const page={streamTextContent:()=>({getReader:()=>({read:async()=>{throw Error('Unreadable stream')},releaseLock(){released=true}})}),getStructTree:async()=>null,getAnnotations:async()=>[]};
 await assert.rejects(readPdfText(page),/Unreadable stream/);assert.equal(released,true);
});
