import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {addDocumentDrafts,sampleDocumentDrafts} from '../../vue/sample-drafts.js';
import {completedCarnet,carnetActions,carnetAccess,carnetQr,clearCarnetAccess} from '../../vue/assets/carnet-actions-model1.js';
import {documentTypes} from '../../vue/workspace-model.js';
const account={id:'account-test',name:'Sample company',address:'Sample address'};
test('additional drafts cover every document without approvals or certificate numbers',()=>{
 const drafts=sampleDocumentDrafts(account);
 assert.deepEqual(new Set(drafts.map(r=>r.document)),new Set(documentTypes));
 assert.equal(new Set(drafts.map(r=>r.id)).size,documentTypes.length);
 for(const r of drafts){assert.equal(r.status,'Draft');assert.equal(r.accountId,account.id);assert.equal(r.certificate,'');assert.equal(r.submittedAt,null);assert.equal(r.confirmed,false);assert.equal(r.ataConfirmed,false);}
});
test('migration retains edited work and does not resurrect deleted or submitted samples',()=>{
 const existing={id:'existing',status:'Draft',notes:'Do not replace me'},saved={records:[existing],ui:{tab:'Drafts'}};
 const first=addDocumentDrafts(saved,account);
 assert.equal(first.records.find(r=>r.id===existing.id),existing);assert.equal(saved.records.length,1);assert.equal(first.ui,saved.ui);
 first.records=first.records.filter(r=>r.id!=='sample-draft-20261117-ata');first.records[0].status='Pending';
 assert.equal(addDocumentDrafts(first,account),first);assert.ok(!first.records.some(r=>r.id==='sample-draft-20261117-ata'));
});
test('completed Carnet actions are identical in React and Vue and excluded from drafts or archive',()=>{
 assert.deepEqual(carnetActions.map(a=>a.id),['open','carnet','return','replacement','archive']);
 for(const status of ['Processed','Accepted','Approved','Auto Accepted','Completed'])assert.ok(completedCarnet({docs:['ata'],status}));
 for(const status of ['Draft','Submitted','Pending','Rejected','Archive'])assert.ok(!completedCarnet({document:'ATA Carnet',status}));
 assert.ok(!completedCarnet({docs:['coo'],status:'Processed'}));assert.ok(!completedCarnet({docs:['ata'],status:'Processed',archivedAt:'today'}));
 assert.equal(readFileSync(new URL('../../assets/carnet-actions-model1.js',import.meta.url),'utf8'),readFileSync(new URL('../../vue/assets/carnet-actions-model1.js',import.meta.url),'utf8'));
});
test('QR contains the displayed ID and PIN and produces a scannable square with a quiet zone',()=>{
 const access=carnetAccess({eCarnetId:'DEMO-ATA-001',eCarnetPin:'004812'}),payload=JSON.parse(access.payload),qr=carnetQr(access.payload);
 assert.equal(payload.carnetId,access.id);assert.equal(payload.pin,'004812');assert.equal(payload.type,'sample-ecarnet-access');assert.ok(qr.size>29);assert.match(qr.path,/^M4,4h1v1h-1z/);
});
test('replacement cannot inherit issued eCarnet access or returned state',()=>{
 const original={id:'old',eCarnetId:'OLD',eCarnetPin:'012345',eCarnetStatus:'Returned',carnetReturned:true,carnetReturnedAt:'today'};
 const replacement=clearCarnetAccess(original);assert.equal(original.eCarnetPin,'012345');assert.ok(!('eCarnetPin'in replacement));assert.ok(!('carnetReturned'in replacement));
});
