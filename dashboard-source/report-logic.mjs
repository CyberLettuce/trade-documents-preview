// Counts document selections, not originals or printed copies. Timing is elapsed
// submission-to-decision time, attributed to the final decision-maker.
export const closedStatuses = ['Approved', 'Rejected'];
export const defaults = () => ({from:'',to:'',query:'',user:'All',status:'All',doc:'All',service:'All'});
const ukParts = value => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).map(p=>[p.type,p.value]));
export function ukDay(value) { const p=ukParts(value);return `${p.year}-${p.month}-${p.day}`; }
export function validDay(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value||'') && Number.isFinite(Date.parse(value+'T12:00:00Z')) && new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value; }
export function timestamp(value) {
 if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value) || !validDay(value.slice(0,10))) return null;
 if(Number(value.slice(11,13))>23 || Number(value.slice(14,16))>59 || Number(value.slice(17,19)||0)>59) return null;
 if(/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {const ms=Date.parse(value);return Number.isFinite(ms)?ms:null;}
 // Legacy UK wall times have no offset. Reject ambiguous/nonexistent DST times.
 const target=value.slice(0,16),base=Date.parse(value+'Z');
 const candidates=[base,base-3600000].filter(ms=>{const p=ukParts(ms);return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`===target;});
 return candidates.length===1?candidates[0]:null;
}
export function decisionEvent(app) {return (app.history||[]).find(h=>h.title===app.status+' by chamber')||null;}
export function decisionMaker(app) {return String(app.processedBy||decisionEvent(app)?.by||'').trim()||'Not recorded';}
export function timing(app) {
 const submissionEvent=[...(app.history||[])].reverse().find(h=>['Application received','Submitted to chamber','Application submitted'].includes(h.title));
 const submitted=app.submittedAt||app.submitted||submissionEvent?.at||submissionEvent?.date||'';
 const event=decisionEvent(app);
 const decided=app.processedAt||(app.status==='Approved'?app.approvedAt:app.rejectedAt)||event?.at||event?.date||'';
 const start=timestamp(submitted),end=timestamp(decided);
 const ms=start!==null&&end!==null&&end>=start?end-start:null;
 return {submitted,decided,ms,decisionDay:end!==null?ukDay(end):validDay(decided)?decided:'',reason:ms!==null?'Recorded':start!==null&&end!==null?'Decision precedes submission':'Missing complete timestamps'};
}
export function duration(ms) {
 if(ms===null || !Number.isFinite(ms))return 'Not recorded';
 if(ms<60000)return '<1 min';
 const minutes=Math.floor(ms/60000),days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60),mins=minutes%60;
 return [days?days+'d':'',hours?hours+'h':'',mins?mins+'m':''].filter(Boolean).join(' ');
}
export function dateTime(value) {
 const ms=timestamp(value);
 if(ms!==null)return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(ms));
 return validDay(value)?new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric'}).format(new Date(value+'T12:00:00Z'))+' (date only)':'Not recorded';
}
const all=v=>!v||v==='All';
const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
export function stats(records) {
 const approved=records.filter(r=>r.app.status==='Approved'),rejected=records.filter(r=>r.app.status==='Rejected');
 const times=items=>items.filter(r=>r.time.ms!==null).map(r=>r.time.ms);
 return {applications:records.length,approved:approved.length,rejected:rejected.length,approvedDocs:approved.reduce((sum,r)=>sum+r.docs.length,0),rejectedDocs:rejected.reduce((sum,r)=>sum+r.docs.length,0),timed:times(records).length,approvalTimed:times(approved).length,rejectionTimed:times(rejected).length,approvalMean:mean(times(approved)),rejectionMean:mean(times(rejected))};
}
export const summaryColumns=['Chamber User','Applications','Approved documents','Rejected documents','Total documents','Avg approval time','Avg rejection time','Timed applications'];
export const documentColumns=['Chamber User','Document','Approved','Rejected','Total'];
export const applicationColumns=['Reference','Chamber User','Documents','Status','Submitted','Final decision','Handling time','Timing data'];
export function buildReport(state, filters=defaults(), catalog=[]) {
 const scoped=(state.apps||[]).filter(a=>state.allChambers||!a.chamber||a.chamber===state.activeChamber);
 const name=id=>catalog.find(d=>d.id===id)?.name||id;
 const error=(filters.from&&!validDay(filters.from))||(filters.to&&!validDay(filters.to))?'Enter valid start and end dates.':filters.from&&filters.to&&filters.from>filters.to?'The end date must be on or after the start date.':'';
 const closed=scoped.filter(a=>closedStatuses.includes(a.status)).map(app=>({app,user:decisionMaker(app),time:timing(app),docs:[...new Set((app.docs||[]).filter(Boolean))]}));
 const users=[...new Set(closed.map(r=>r.user))].sort();
 const records=error?[]:closed.filter(r=>{
  if(!all(filters.user)&&filters.user!==r.user || !all(filters.status)&&filters.status!==r.app.status || !all(filters.service)&&filters.service!==r.app.service || !all(filters.doc)&&!r.docs.includes(filters.doc))return false;
  if((filters.from||filters.to)&&!r.time.decisionDay || filters.from&&r.time.decisionDay<filters.from || filters.to&&r.time.decisionDay>filters.to)return false;
  const haystack=[r.user,r.app.reference,r.app.customerReference,r.app.certificate,r.app.exporter,r.app.destination,...r.docs.map(name)].join(' ').toLowerCase();
  return String(filters.query||'').toLowerCase().trim().split(/\s+/).every(word=>haystack.includes(word));
 }).map(r=>({...r,docs:r.docs.filter(id=>all(filters.doc)||id===filters.doc)}));
 const summaries=[...new Set(records.map(r=>r.user))].map(user=>{
  const rows=records.filter(r=>r.user===user),s=stats(rows);
  return {key:user,user,apps:rows.map(r=>r.app),sortValues:{'Avg approval time':s.approvalMean,'Avg rejection time':s.rejectionMean,'Timed applications':s.timed},values:{'Chamber User':user,Applications:s.applications,'Approved documents':s.approvedDocs,'Rejected documents':s.rejectedDocs,'Total documents':s.approvedDocs+s.rejectedDocs,'Avg approval time':duration(s.approvalMean),'Avg rejection time':duration(s.rejectionMean),'Timed applications':`${s.timed} / ${s.applications}`}};
 });
 const documents=summaries.flatMap(summary=>[...new Set(records.filter(r=>r.user===summary.user).flatMap(r=>r.docs))].map(doc=>{
  const rows=records.filter(r=>r.user===summary.user&&r.docs.includes(doc)),s=stats(rows);
  return {key:JSON.stringify([summary.user,doc]),user:summary.user,doc,apps:rows.map(r=>r.app),values:{'Chamber User':summary.user,Document:name(doc),Approved:s.approved,Rejected:s.rejected,Total:s.applications}};
 }));
 const applications=records.map(r=>({key:r.app.id,app:r.app,sortValues:{Submitted:timestamp(r.time.submitted),'Final decision':timestamp(r.time.decided),'Handling time':r.time.ms},values:{Reference:r.app.reference,'Chamber User':r.user,Documents:r.docs.map(name).join(', ')||'Not recorded',Status:r.app.status,Submitted:dateTime(r.time.submitted),'Final decision':dateTime(r.time.decided),'Handling time':duration(r.time.ms),'Timing data':r.time.reason}}));
 return {error,users,records,summaries,documents,applications,totals:stats(records),undated:closed.filter(r=>!r.time.decisionDay).length};
}
export function exportRows(rows, columns, context={}) {return rows.map(row=>({...context,...Object.fromEntries(columns.map(c=>[c,row.values[c]??''])),...(Object.hasOwn(row.sortValues||{},'Handling time')?{'Handling time (minutes)':row.sortValues['Handling time']===null?'':+(row.sortValues['Handling time']/60000).toFixed(2)}:{}),...(Object.hasOwn(row.sortValues||{},'Avg approval time')?{'Avg approval time (minutes)':row.sortValues['Avg approval time']===null?'':+(row.sortValues['Avg approval time']/60000).toFixed(2),'Avg rejection time (minutes)':row.sortValues['Avg rejection time']===null?'':+(row.sortValues['Avg rejection time']/60000).toFixed(2)}:{})}));}
