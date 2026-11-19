import {assignSubmissionReference,clearSubmissionReference} from './application-references-review1-efab1313.js?v=2026-11-19-audit-fixes-r1';
import {ensureCertificateNumber} from './certificate-numbering2.js?v=2026-11-19-audit-fixes-r1';
export const isAutoAcceptedApplication=app=>app?.status==='Approved'&&app.autoAccepted===true;
export function addAutoAcceptedSamples(state,sampleFactory,now=new Date()){
 if(state.autoAcceptedSampleVersion===1)return state;
 const apps=state.apps||[],exporter=state.exporters?.find(e=>e.id==='exporter-0'&&e.chamber==='demo'&&e.status==='Active'),next={...state,autoAcceptedSampleVersion:1};
 if(!exporter||!String(exporter.reference||'').trim()||String(exporter.reference).includes('/')||!apps.some(a=>a.sample===true))return next;
 const templates=sampleFactory().apps||[],added=[],day=now.toISOString().slice(0,10),approved=now.toISOString();
 for(const [doc,destination,client,index]of [['coo','Germany','Northbridge Manufacturing Ltd',1],['eur','Switzerland','Westhaven Trading Ltd',2]]){
  const id='sample-auto-accepted-'+doc;if(apps.some(a=>a.id===id))continue;
  const template=templates.find(a=>a.docs?.includes(doc));if(!template)continue;
  const submitted=new Date(now.getTime()-index*60000).toISOString();
  let record={...clearSubmissionReference(template),id,reference:'SAMPLE-AUTO-'+doc.toUpperCase(),customerReference:'SAMPLE-AUTO-'+doc.toUpperCase(),sample:true,sampleKind:'auto-acceptance',autoAcceptanceDemo:true,exporterId:exporter.id,exporter:exporter.name,exporterAddress:[exporter.address,exporter.city,exporter.postcode,exporter.country].filter(Boolean).join(', '),chamber:'demo',docs:[doc],destination,status:'Pending',certificate:'',service:'eXpress',priority:'Normal',workflow:'',lockedBy:'',assigned:'',processedBy:'Automatic',submitted,submittedAt:submitted,date:day,updatedAt:approved,approvedAt:approved,processedAt:approved,decisionAt:approved,issueDate:day,autoAccepted:true,autoAcceptedAt:approved,autoAcceptedClient:client,history:[{id:id+'-accepted',title:'Auto Accepted (sample)',date:approved,by:'Automatic',note:'Demonstration of automatic acceptance using client settings. No automatic approval rules were executed.'},{id:id+'-submitted',title:'Application received',date:submitted,by:'Exporter',note:'Sample application for the Auto Accepted indicator.'}]};
  record=assignSubmissionReference(record,exporter.reference,[...apps,...added]);record=ensureCertificateNumber(record,[...apps,...added]);added.push({...record,status:'Approved'});
 }
 return {...next,apps:[...added,...apps]};
}
