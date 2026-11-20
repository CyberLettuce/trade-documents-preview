import test from'node:test';import assert from'node:assert/strict';
import{makeSamples,number10,submitRecord,decisionErrors,OFFICERS,DOCS}from'../../vue/model.js';
import {certificateForPrint,certificateNumberError,certificateNumberErrors,ensureCertificateNumber} from '../../assets/certificate-numbering2.js';
import {certificateDateDefaults} from '../../assets/chamber-certificate-review.js';
test('sample queue covers multiple users, ownership and automatic acceptance',()=>{const rows=makeSamples();assert.equal(new Set(rows.map(r=>r.id)).size,24);for(const state of ['Pending','In Progress','Draft','Approved','Rejected','Auto Accepted'])assert(rows.some(r=>r.status===state));assert(rows.some(r=>r.status==='In Progress'&&r.owner==='Taylor Smith'));for(const user of OFFICERS)assert(rows.some(r=>r.owner===user&&r.status==='Approved'));});
test('certificate numbers contain both lowercase letters and digits, without punctuation',()=>{for(let i=0;i<1000;i++)assert.match(number10(),/^(?=[a-z0-9]{10}$)(?=.*[a-z])(?=.*[0-9])/);});
test('submission preserves the entered reference and assigns correct document identifiers',()=>{const existing=makeSamples();for(const[document,code]of Object.entries(DOCS)){const source={...existing.find(r=>r.status==='Draft'),yourReference:'CUSTOM-123',document,certificate:'',service:'eXpress'},submitted=submitRecord(source,existing);assert.match(submitted.reference,new RegExp('^DEM0053204/\\d{9}X/'+code+'$'));assert.equal(submitted.yourReference,'CUSTOM-123');assert.equal(submitted.status,'Pending');assert.match(submitted.certificate,document==='EUR1'?/^[a-z]\d{7,8}$/:document==='Arab Certificate of Origin'?/^[a-z]{1,2}\d{6,9}$/:/^(?=[a-z0-9]{10}$)(?=.*[a-z])(?=.*[0-9])/);assert.equal(source.status,'Draft');}});
test('approval requires a number, an active signatory without a review checklist',()=>{assert.deepEqual(Object.keys(decisionErrors({certificate:' ',signatory:'Former reviewer',checks:[true,false,true]})),['certificate','signatory']);assert.deepEqual(decisionErrors({certificate:'ab1234cd56',signatory:'Alex Morgan',checks:[false,false,false]}),{});});
test('EUR1 and Arab C of O enforce their own certificate number formats',()=>{
  for(const valid of ['A1234567','b00000000'])assert.equal(certificateNumberError('eur',valid),'');
  for(const invalid of ['A123456','AB12345678','A123456789','A1234-567',''])assert.match(certificateNumberError('eur',invalid),/1 letter followed by 7 to 8 digits/);
  for(const valid of ['A123456','ab000000000'])assert.equal(certificateNumberError('arab',valid),'');
  for(const invalid of ['A12345','ABC123456','A1234567890','12AB34567',''])assert.match(certificateNumberError('arab',invalid),/1 or 2 letters followed by 6 to 9 digits/);
});
test('combined certificate applications retain and print one number per document',()=>{
  const record={id:'pending',status:'Pending',documents:['Arab Certificate of Origin','EUR1'],certificate:'AB123456'};
  const numbered=ensureCertificateNumber(record,[],undefined,()=> 'e00000001');
  assert.equal(certificateForPrint(numbered,'arab'),'AB123456');
  assert.equal(certificateForPrint(numbered,'eur'),'e00000001');
  assert.deepEqual(certificateNumberErrors(numbered),[]);
  assert.deepEqual(certificateNumberErrors({...numbered,certificate:'bad'}).map(error=>error.key),['certificate-arab']);
});
test('certificate dates default in local time without replacing existing dates',()=>{
  const now=new Date(2026,10,20,23,45);
  const record={docs:['coo','eur'],issueDate:'2026-11-18',eurBox11Date:'2026-11-19'};
  assert.deepEqual(certificateDateDefaults(record,now),{stampDate:'2026-11-20',eurBox12Date:'2026-11-20'});
  assert.deepEqual(certificateDateDefaults({docs:['arab']},now),{});
});
