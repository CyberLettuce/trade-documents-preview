import {buildReport, defaults, ukDay, validDay} from './report-logic.mjs';

export function shiftDay(day, offset) {
 const date = new Date(day+'T12:00:00Z');
 date.setUTCDate(date.getUTCDate()+offset);
 return date.toISOString().slice(0,10);
}
export function shortDate(day) {
 return validDay(day) ? new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'numeric',month:'short'}).format(new Date(day+'T12:00:00Z')) : 'Not recorded';
}
export function overviewPerformance(state, {period='This month',scope='all',today=ukDay(new Date().toISOString())}={}) {
 const all = buildReport(state, defaults());
 const users=[...new Set([state.officer,...all.users].filter(Boolean))].sort();
 const selectedScope=scope==='all'||scope==='mine'||users.some(user=>scope==='user:'+encodeURIComponent(user))?scope:'all';
 const user=selectedScope==='mine'?state.officer:selectedScope.startsWith('user:')?decodeURIComponent(selectedScope.slice(5)):'All';
 const dates=all.records.map(r=>r.time.decisionDay).filter(day=>validDay(day)&&day<=today).sort();
 const from=period==='Today'?today:period==='Last 7 days'?shiftDay(today,-6):period==='All time'?(dates[0]||today):today.slice(0,7)+'-01';
 const report=buildReport(state,{...defaults(),from,to:today,user});
 const lastActivity=report.records.map(r=>r.time.decisionDay).filter(validDay).sort().at(-1);
 const chartEnd=period==='All time'&&lastActivity?lastActivity:today;
 const days=Array.from({length:7},(_,i)=>shiftDay(chartEnd,i-6));
 const bars=days.map(day=>({day,label:shortDate(day),count:report.records.filter(r=>r.time.decisionDay===day).length}));
 return {...report,users,selectedScope,user,from,to:today,bars,chartEnd,
  chartLabel:chartEnd===today?'Applications processed · Last 7 days':'Applications processed · 7 days to '+shortDate(chartEnd),
  chartTotal:bars.reduce((sum,bar)=>sum+bar.count,0)};
}
export function defaultPeriod(state,today=ukDay(new Date().toISOString())) {
 return overviewPerformance(state,{today,period:'This month'}).records.length?'This month':'All time';
}
export function waitingLabel(app,today=ukDay(new Date().toISOString())) {
 const day=String(app.submittedAt||app.submitted||app.date||'').slice(0,10);
 if(!validDay(day))return 'Not recorded';
 const age=Math.max(0,Math.floor((Date.parse(today+'T12:00:00Z')-Date.parse(day+'T12:00:00Z'))/86400000));
 return age===0?'Today':age+' '+(age===1?'day':'days');
}
export function applicationStage(status) {
 return status==='Draft'?0:status==='Submitted'||status==='Pending'||status==='In Progress'?1:status==='Rejected'?2:3;
}
