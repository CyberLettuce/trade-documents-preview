import test from 'node:test';
import assert from 'node:assert/strict';
import {nextDocumentSelection} from '../../vue/document-selection.js';
import {createDeferredSave} from '../../vue/persistence.js';

test('Carnet and uploaded document can be selected in either order',()=>{
 assert.deepEqual(nextDocumentSelection(['ATA Carnet'],'Uploaded document'),['ATA Carnet','Uploaded document']);
 assert.deepEqual(nextDocumentSelection(['Uploaded document'],'ATA Carnet'),['ATA Carnet','Uploaded document']);
 assert.deepEqual(nextDocumentSelection(['ATA Carnet','Uploaded document'],'Uploaded document'),['ATA Carnet']);
});
test('combining a Carnet does not weaken other document rules',()=>{
 assert.deepEqual(nextDocumentSelection(['ATA Carnet','Uploaded document'],'EUR1'),['EUR1']);
 assert.deepEqual(nextDocumentSelection(['UK Certificate of Origin','EUR1'],'Arab Certificate of Origin'),['EUR1','Arab Certificate of Origin']);
 assert.deepEqual(nextDocumentSelection(['ATA Carnet'],'ATA Carnet'),['ATA Carnet']);
});
test('batched saving keeps the latest value and flushes exactly once on exit',async()=>{
 let value=0;const saved=[];const queue=createDeferredSave(()=>saved.push(value),10);
 value=1;queue.schedule();value=2;queue.schedule();queue.flush();queue.flush();
 assert.deepEqual(saved,[2]);await new Promise(r=>setTimeout(r,25));assert.deepEqual(saved,[2]);
 value=3;queue.schedule();await new Promise(r=>setTimeout(r,25));assert.deepEqual(saved,[2,3]);
});
