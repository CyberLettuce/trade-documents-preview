export const performanceSampleVersion=2;
const examples=[['Alex Morgan',['coo','invoice'],'Approved',45],['Alex Morgan',['eur'],'Approved',95],['Alex Morgan',['ata'],'Approved',360],['Alex Morgan',['arab'],'Rejected',80],['Taylor Smith',['coo'],'Approved',30],['Taylor Smith',['eurmed','invoice'],'Approved',70],['Taylor Smith',['iic'],'Approved',130],['Taylor Smith',['ata'],'Rejected',150],['Casey Williams',['coo','original'],'Approved',120],['Casey Williams',['invoice'],'Approved',270],['Casey Williams',['ata'],'Approved',1620],['Casey Williams',['eur'],'Rejected',240]];
const day=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export function performanceSamples(seed,now=new Date()){
 if(!seed.apps?.length||!seed.exporters?.length)return {apps:[],exporters:[]};
 const exporter={...structuredClone(seed.exporters[0]),id:'sample-performance-exporter',reference:'SAMPLE-UP-EXPORTER',name:'Performance Examples Ltd (sample)',notes:'Fictional exporter used only to demonstrate User Performance.',sample:true};
 const apps=examples.map(([user,docs,status,minutes],index)=>{
  const source=seed.apps.find(app=>app.docs?.includes(docs[0]))||seed.apps[0],serial=String(index+1).padStart(3,'0'),id='sample-user-performance-'+serial,processedAt=new Date(new Date(now).getTime()-(index+1)*60000).toISOString(),submittedAt=new Date(Date.parse(processedAt)-minutes*60000).toISOString(),reason=status==='Rejected'?'Sample rejection: additional supporting evidence was required.':'';
  return {...structuredClone(source),id,reference:'SAMPLE-UP-'+serial,systemReference:undefined,applicationNumber:undefined,customerReference:'Performance example '+serial,exporterId:exporter.id,exporter:exporter.name,chamber:'demo',docs,status,sample:true,performanceSample:true,submitted:submittedAt,submittedAt,processedAt,date:day(processedAt),processedBy:user,assigned:'',lockedBy:'',workflow:'',priority:'Normal',certificate:status==='Approved'?'SAMPLE-UP-CERT-'+serial:'',issueDate:status==='Approved'?day(processedAt):'',chamberSignatory:status==='Approved'?(user==='Taylor Smith'?'ch-sig-2':user==='Alex Morgan'?'ch-sig-1':''):'',reason,paid:true,service:index%2===0?'Standard':'eXpress',fee:docs.includes('ata')?180:35,checks:{details:true,evidence:true,origin:true},comments:[],archived:false,history:[{id:id+'-decision',title:status+' by chamber',date:processedAt,by:user,note:'Illustrative sample handling time; not a real processing record.'+(reason?' '+reason:'')},{id:id+'-submitted',title:'Application received',date:submittedAt,by:'Sample exporter',note:'Fictional application created to demonstrate User Performance.'}]};
 });return {apps,exporters:[exporter]};
}
export function addPerformanceSamples(state,seed,now=new Date()){
 if(!state.apps?.length)return state;
 const currentDay=day(now),sample=performanceSamples(seed,now);
 if(!sample.apps.length)return state;
 if(state.performanceSampleVersion>=2&&state.performanceSampleDay===currentDay&&sample.apps.every(example=>state.apps.some(app=>app.id===example.id)))return state;
 const existing=new Map(state.apps.map(app=>[app.id,app])),updates=new Map(sample.apps.map(example=>[example.id,example]));
 const apps=state.apps.map(app=>{
  const example=updates.get(app.id);if(!example||!app.performanceSample)return app;
  const history=(app.history||[]).map(event=>event.id===app.id+'-decision'?{...event,date:example.processedAt}:event.id===app.id+'-submitted'?{...event,date:example.submittedAt}:event);
  return {...app,submitted:example.submitted,submittedAt:example.submittedAt,processedAt:example.processedAt,date:example.date,issueDate:app.status==='Approved'?example.issueDate:app.issueDate,history};
 });
 apps.push(...sample.apps.filter(example=>!existing.has(example.id)));
 const exporters=[...(state.exporters||[])];for(const exporter of sample.exporters)if(!exporters.some(existing=>existing.id===exporter.id))exporters.push(exporter);
 return {...state,performanceSampleVersion:2,performanceSampleDay:currentDay,apps,exporters};
}
