import {createDocumentSampleDrafts} from './ChamberContent-PZCQTEV1-review1-b928b4e1-nochecklist1-options1.js?v=2026-11-20-vertical-review-r2';
export function addExporterDraftSamples(store) {
  const date=new Date().toISOString().slice(0,10), spaces={...store.spaces};
  for(const [accountId,space] of Object.entries(spaces)) {
    if(space.documentDraftSamplesVersion>=1)continue;
    const originals=createDocumentSampleDrafts().filter(r=>r.status==='Draft');
    const samples=originals.map(row=>({...row,id:'extra-draft-20261117-'+row.docs[0],reference:'SAMPLE-DRAFT-'+row.docs[0].toUpperCase(),customerReference:'',date,history:[{id:'extra-draft-'+row.docs[0],title:'Sample draft created',date,note:'Additional sample for exploring this document.'}]}));
    const ata=originals.find(r=>r.docs.includes('ata'));
    samples.push({...ata,id:'sample-completed-carnet-20261117',reference:'DEM0053204/917000001/N',customerReference:'SAMPLE-COMPLETED-ATA',status:'Processed',certificateNumber:'sampleata1',carnetNumber:'sampleata1',date,eCarnetId:'DEMO-ATA-2026-001',eCarnetPin:'482615',eCarnetStatus:'Issued',history:[{id:'sample-carnet-approved',title:'Sample carnet approved',date,note:'Demonstration only. Not a real carnet.'}]});
    const ids=new Set(space.apps.map(r=>r.id));
    spaces[accountId]={...space,apps:[...samples.filter(r=>!ids.has(r.id)),...space.apps],documentDraftSamplesVersion:1};
  }
  return {...store,spaces};
}
