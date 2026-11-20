import test from 'node:test';
import assert from 'node:assert/strict';
import {freshWorkspace} from '../../vue/workspace-model.js';
import {normaliseApplication,sectionsFor,DOC_IDS} from '../../vue/form-model.js';
import {reviewGroups} from '../../vue/editor-presentation.js';

test('each document review links only to sections available in that application',()=>{
 const workspace=freshWorkspace();
 for(const document of Object.keys(DOC_IDS)){
  const record=normaliseApplication({document},workspace),available=new Set(sectionsFor(record).map(([id])=>id));
  const groups=reviewGroups(record,workspace);
  assert(groups.length>=3,document+' has a useful review summary');
  for(const group of groups){
   assert(available.has(group.step),document+': '+group.title);
   for(const action of group.actions||[])assert(available.has(action.step),document+': '+action.label);
  }
  if(document==='Uploaded document')assert(!groups.some(g=>g.step==='goods'));
 }
});

test('Carnet review totals preserve separate units and exclude heading rows',()=>{
 const workspace=freshWorkspace(),record=normaliseApplication({document:'ATA Carnet',items:[{description:'Camera',pieces:2,weight:4,unit:'Kilogram',value:500},{description:'Liquid',pieces:1,weight:3,unit:'Litre',value:20},{description:'Section heading',heading:true,pieces:99,weight:99,unit:'Kilogram',value:999}]},workspace);
 const rows=reviewGroups(record,workspace).find(g=>g.step==='goods').rows;
 assert.equal(rows.find(r=>r.label==='Number of pieces').value,'3');
 assert.equal(rows.find(r=>r.label==='Weight').value,'4 Kilogram, 3 Litre');
 assert.equal(rows.find(r=>r.label==='Value').value,'520');
 assert(!rows.some(r=>r.label==='Total gross'||r.label==='Total net'));
});
