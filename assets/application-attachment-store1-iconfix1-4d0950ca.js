const DB='trade-documents-application-pdfs-v1';
let opening;
function database(){return opening||=(new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore('pdfs',{keyPath:'id'});req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();opening=null;};resolve(req.result);};req.onerror=()=>{opening=null;reject(Error('The PDF could not be saved in this browser.'));};}));}
export async function storePdf(file){
 if(file.size>10*1024*1024)throw Error(file.name+' is larger than 10 MB.');
 if(!(file.type==='application/pdf'||/\.pdf$/i.test(file.name)))throw Error(file.name+' is not a PDF.');
 const bytes=await file.arrayBuffer();
 if(!new TextDecoder('latin1').decode(bytes.slice(0,1024)).includes('%PDF-'))throw Error(file.name+' could not be recognised as a PDF.');
 const record={id:crypto.randomUUID(),name:file.name,bytes,updatedAt:new Date().toISOString()},db=await database();
 await new Promise((resolve,reject)=>{const tx=db.transaction('pdfs','readwrite');tx.objectStore('pdfs').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(Error('The PDF could not be saved. Browser storage may be full.'));tx.onabort=tx.onerror;});return record;
}
export async function readPdf(id){if(!id)return null;const db=await database();return new Promise((resolve,reject)=>{const req=db.transaction('pdfs','readonly').objectStore('pdfs').get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(Error('The saved PDF could not be opened.'));});}
export function attachmentEntries(application){const form=application.form||application;return ['files','foreignEvidenceFiles','authorisationFile'].flatMap(group=>{const names=group==='authorisationFile'?[form[group]].filter(Boolean):form[group]||[];return names.map(name=>({name,group,id:form.pdfFiles?.[group]?.[name]||null,value:'attachment:'+group+':'+encodeURIComponent(name)}));});}
export function findAttachment(application,item){const entries=attachmentEntries(application);return entries.find(e=>e.value===item.value)||entries.find(e=>e.name===item.name&&(item.group?item.group===e.group:true))||null;}
