import {handlingTimeDefinition} from "../assets/review-site-layout.js?v=2026-11-23-site-review-r1";
import {useColumnSort} from './chamber-sort.js?v=2026-11-20-chamber-tables-r1';
import {sortableDate} from '../assets/chamber-column-sort.js?v=2026-11-20-chamber-tables-r1';
import {documentNames,decisionStatus,isDecision,decisionUser,decisionDate,handlingMinutes,duration,performanceSummary,performanceBy,reportMatches} from './parity-model.js?v=2026-11-20-certificate-review-r1';
import {quoteDocuments} from './form-model.js?v=2026-11-20-chamber-carnet-r1';
import {ref,reactive,computed,watch} from './assets/vue.esm-browser.prod.js?v=2026-11-20-acceptance-r1';
import {ws,useApp,download,formatDate,money} from './workspace.js?v=2026-11-24-dashboard-image-r1';
import {REPORTS,documentTypes,csvText,quoteApplication,uid,clone} from './workspace-model.js?v=2026-11-20-acceptance-r1';
export function reportRecords(records,filters={}){return records.filter(r=>reportMatches(r,filters));}
export function performanceRows(records,users=[]){return performanceBy(records).map(r=>{const times=r.records.map(handlingMinutes).filter(n=>n!==null);return {...r,total:r.documents,minutes:times.length?times.reduce((a,b)=>a+b,0)/times.length:null,documents:[...new Set(r.records.flatMap(documentNames))].join(', ')};});}
const colours=['#007f77','#ae4b00','#b8384f','#6a4fb2','#0a66a4','#637181','#967000','#167b8a'];
const signals={Approved:'#007f77','Auto Accepted':'#6a4fb2',Rejected:'#b8384f',Pending:'#ae4b00','In Progress':'#637181',Paid:'#007f77','Awaiting payment':'#ae4b00'};
const number=new Intl.NumberFormat('en-GB');
const fraction=new Intl.NumberFormat('en-GB',{style:'percent',maximumFractionDigits:1});
export const Donut={
 props:{title:String,description:String,items:Array,unit:String,interactive:Boolean,currency:Boolean},
 emits:['select'],
 setup(props){
  const total=computed(()=>props.items.reduce((sum,item)=>sum+Math.max(0,item.count),0));
  const segments=computed(()=>{
   let offset=0;
   return props.items.filter(item=>item.count>0).map((item,index)=>{
    const share=item.count/total.value,segment={...item,offset,share,colour:signals[item.label]||colours[index%colours.length]};
    offset+=share;return segment;
   });
  });
  function endpoint(offset,radius){const angle=(offset*360-90)*Math.PI/180;return [100+Math.cos(angle)*radius,100+Math.sin(angle)*radius];}
  return {total,segments,endpoint,amount:value=>props.currency?money(value):number.format(value),percent:value=>fraction.format(value)};
 },
 template:String.raw`<section class="card report-chart vue-report-donut">
  <h2>{{title}}</h2><p>{{description}}</p>
  <div class="vue-donut-body">
   <div class="vue-donut-ring" aria-hidden="true">
    <svg viewBox="0 0 200 200" focusable="false">
     <circle class="donut-track" cx="100" cy="100" r="81" fill="none" stroke-width="24"/>
     <circle v-for="segment in segments" :key="segment.label" cx="100" cy="100" r="81" fill="none" stroke-width="24" pathLength="100" :stroke="segment.colour" :stroke-dasharray="segment.share*100+' '+(100-segment.share*100)" :stroke-dashoffset="-segment.offset*100" transform="rotate(-90 100 100)"/>
     <line v-if="segments.length>1" v-for="segment in segments" :key="'divider-'+segment.label" class="donut-divider" :x1="endpoint(segment.offset,69)[0]" :y1="endpoint(segment.offset,69)[1]" :x2="endpoint(segment.offset,93)[0]" :y2="endpoint(segment.offset,93)[1]" stroke-width="2"/>
    </svg><div class="vue-donut-total"><strong>{{amount(total)}}</strong><small>{{unit}}</small></div>
   </div>
   <ul v-if="segments.length" class="vue-donut-legend"><li v-for="segment in segments" :key="segment.label">
    <component :is="interactive&&segment.filterable!==false?'button':'div'" :class="{'vue-donut-legend-row':!interactive||segment.filterable===false}" :type="interactive&&segment.filterable!==false?'button':undefined" @click="interactive&&segment.filterable!==false&&$emit('select',segment.label)">
     <span class="vue-donut-swatch" :style="{background:segment.colour}" aria-hidden="true"/><span>{{segment.label}}</span><strong>{{amount(segment.count)}}</strong><small>{{percent(segment.share)}}</small><Icon v-if="interactive&&segment.filterable!==false" name="next"/>
    </component></li></ul>
   <p v-else>No data in this range.</p>
  </div>
  <small v-if="segments.length" class="vue-donut-note">{{interactive?'Select a category to filter · Percentages rounded.':'Percentages rounded.'}}</small>
 </section>`,
};
const chamberReportIcons = {
 overview: 'report-grid',
 bcc: 'report-bar-chart',
 invoice: 'report-receipt',
 audit: 'report-clipboard-check',
 aviva: 'report-shield-check',
 single: 'report-person-check',
 users: 'report-person-check',
};
export const ReportsPage={components:{Donut},setup(){
 const app=useApp(),chamber=app.chamber,kind=ref('overview'),view=ref('user'),filters=reactive({from:'',to:'',status:'',document:'',user:'',exporter:'',service:'',payment:'',query:''}),drill=ref(null),viewName=ref(''),viewDialog=ref(false),page=ref(1),pageSize=ref(25);
 const resultSort=useColumnSort((row,column)=>{
   if(kind.value==='users')return decisionValue(row,column);
   if(kind.value==='invoice'&&[2,3,4].includes(column))return (row.fees||quoteDocuments(row,ws))[['net','tax','total'][column-2]];
   if(kind.value==='aviva'&&column===5)return row.items?.reduce((sum,item)=>sum+Number(item.value||0),0)||0;
   if((kind.value==='audit'&&column===4)||(!['invoice','aviva','audit'].includes(kind.value)&&column===5))return sortableDate(row.updatedAt);
   return values(row)[column];
 },()=>page.value=1);
 const performanceSort=useColumnSort((row,column)=>({approval:row.approval.minutes,rejection:row.rejection.minutes,timed:row.approval.timed+row.rejection.timed})[column]??row[column]);
 const volumeSort=useColumnSort((row,column)=>column==='total'?row.standard+row.express:row[column]);
 const drillSort=useColumnSort(decisionValue);
 function decisionValue(row,column){return ({reference:row.reference,document:documentNames(row).join(', '),status:decisionStatus(row),user:decisionUser(row),date:sortableDate(decisionDate(row)),time:handlingMinutes(row)})[column];}
 watch([kind,view],()=>{resultSort.reset();performanceSort.reset();volumeSort.reset();page.value=1;});
 watch(kind,current=>{if(current!=='invoice')filters.payment='';});
 watch(drill,()=>drillSort.reset());
 const names=computed(()=>chamber.value?REPORTS:{overview:'Overview',applications:'Applications report'});
 watch(app.route,()=>{const routeKind=app.route.value.split('/')[3]?.split('?')[0];kind.value=names.value[routeKind]?routeKind:'overview';if(kind.value==='users'&&app.ui.performanceReport){const context=app.ui.performanceReport;filters.user=context.user;filters.from=context.month?new Date().toISOString().slice(0,7)+'-01':'';filters.to=context.month?new Date().toISOString().slice(0,10):'';delete app.ui.performanceReport}},{immediate:true});
 const source=computed(()=>app.visibleRecords?.value||app.records.value),matching=computed(()=>reportRecords(source.value,{...filters,decisionsOnly:kind.value==='users'}).filter(row=>!filters.payment||(row.paid?'Paid':'Awaiting payment')===filters.payment)),done=computed(()=>matching.value.filter(r=>['Approved','Auto Accepted'].includes(decisionStatus(r)))),summary=computed(()=>performanceSummary(matching.value)),userNames=computed(()=>[...new Set([...ws.staff.map(s=>s.name),...source.value.filter(isDecision).map(decisionUser)])].sort()),exporters=computed(()=>[...new Set(source.value.map(r=>r.exporter))]);
 const groups=(rows,key)=>{const result=new Map;for(const r of rows){const label=key(r);result.set(label,(result.get(label)||0)+1)}return [...result].map(([label,count])=>({label,count}))};
 const byStatus=computed(()=>groups(matching.value,decisionStatus)),byDoc=computed(()=>groups(matching.value.flatMap(documentNames),d=>d)),byMonth=computed(()=>groups(matching.value,r=>(r.updatedAt||'').slice(0,7)||'Not recorded').sort((a,b)=>a.label.localeCompare(b.label))),byExporter=computed(()=>groups(matching.value,r=>r.exporter||'Not recorded'));
 const users=computed(()=>performanceBy(matching.value,view.value)),metrics=computed(()=>({total:matching.value.length,approved:done.value.length,rejected:matching.value.filter(r=>decisionStatus(r)==='Rejected').length,awaiting:matching.value.filter(r=>['Pending','In Progress'].includes(decisionStatus(r))).length}));
 const tableRows=computed(()=>{const rows=kind.value==='aviva'?done.value.filter(r=>documentNames(r).includes('ATA Carnet')):kind.value==='single'?done.value.filter(r=>!r.secondChecker):['bcc','invoice'].includes(kind.value)?done.value:matching.value;return [...rows].sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))});
 const pageCount=computed(()=>Math.max(1,Math.ceil(tableRows.value.length/pageSize.value))),paged=computed(()=>(chamber.value?resultSort.rows(tableRows.value):tableRows.value).slice((page.value-1)*pageSize.value,page.value*pageSize.value));watch([filters,kind,pageSize],()=>page.value=1,{deep:true});watch(pageCount,n=>page.value=Math.min(page.value,n));
 const columns=computed(()=>kind.value==='invoice'?['Reference','Exporter','Net','VAT','Total','Payment']:kind.value==='aviva'?['Reference','Holder','Carnet number','Destination country','Security','Value']:kind.value==='audit'?['Reference','Document','Status','Chamber User','Updated']:['Reference','Documents','Exporter','Destination country','Status','Updated']);
 function values(r){const fee=r.fees||quoteDocuments(r,ws);if(kind.value==='invoice')return[r.reference,r.exporter,money(fee.net),money(fee.tax),money(fee.total),r.paid?'Paid':'Awaiting'];if(kind.value==='aviva')return[r.reference,r.exporter,r.certificate,r.destination,r.security||'Not recorded',money(r.items?.reduce((s,v)=>s+Number(v.value||0),0)||0)];if(kind.value==='audit')return[r.reference,documentNames(r).join(', '),decisionStatus(r),decisionUser(r),formatDate(r.updatedAt)];return[r.reference,documentNames(r).join(', '),r.exporter,r.destination,decisionStatus(r),formatDate(r.updatedAt)];}
 const bcc=computed(()=>documentTypes.map(document=>({document,standard:done.value.filter(r=>documentNames(r).includes(document)&&r.service!=='eXpress').length,express:done.value.filter(r=>documentNames(r).includes(document)&&r.service==='eXpress').length})).filter(r=>r.standard+r.express));
 const charts=computed(()=>{
  const status={id:'status',title:'Applications by status',description:'Current statuses of the applications matching your filters.',items:byStatus.value,unit:'applications',filter:'status'};
  const docs={id:'documents',title:'Document mix',description:'Share of document selections, not printed copies.',items:byDoc.value,unit:'document selections',filter:'document'};
  const service={id:'service',title:'Certification services',description:'Share of applications by service.',items:groups(tableRows.value,row=>row.service||'Other / not recorded').map(item=>({...item,filterable:['Standard','eXpress'].includes(item.label)})),unit:'applications',filter:'service'};
  if(kind.value==='overview')return [status,docs,
   {id:'months',title:'Activity by month',description:'Share of matching applications by their last update month.',items:byMonth.value.map(item=>({...item,filterable:/^\d{4}-\d{2}$/.test(item.label)})),unit:'applications',filter:'month'},
   {id:'exporters',title:'Exporters in this report',description:'Share of matching applications for each exporter.',items:byExporter.value.map(item=>({...item,filterable:item.label!=='Not recorded'})),unit:'applications',filter:'exporter'}];
  if(kind.value==='audit')return [status,docs];
  if(kind.value==='bcc')return [{...docs,items:bcc.value.map(row=>({label:row.document,count:row.standard+row.express}))},{...service,description:'Share of approved document selections by service.',unit:'document selections',items:['standard','express'].map((key,index)=>({label:index?'eXpress':'Standard',count:bcc.value.reduce((sum,row)=>sum+row[key],0)}))}];
  if(kind.value==='invoice')return [{id:'payment',title:'Payment breakdown',description:'Share of gross fees by payment status.',unit:'gross fees',filter:'payment',currency:true,items:['Paid','Awaiting payment'].map((label,index)=>({label,count:done.value.filter(row=>Boolean(row.paid)===!index).reduce((sum,row)=>sum+(Number((row.fees||quoteDocuments(row,ws)).total)||0),0)}))}];
  if(['aviva','single'].includes(kind.value))return [service];
  return [];
 });
 function selectChart(filter,value){
  if(filter==='month'){
   const [year,month]=value.split('-').map(Number);
   filters.from=value+'-01';filters.to=new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
  }else filters[filter]=filters[filter]===value?'':value;
 }
 const reportViews=computed(()=>ws.savedViews.filter(v=>v.kind==='report'&&v.workspace===(chamber.value?'chamber':'exporter')));
 function exportCSV(){const rows=kind.value==='users'?users.value.map(r=>({[view.value==='user'?'Chamber User':'Document']:r.name,Applications:r.applications,'Approved documents':r.approved,'Rejected documents':r.rejected,'Total documents':r.documents,'Average approval minutes':r.approval.minutes??'','Average rejection minutes':r.rejection.minutes??'','Timed applications':r.approval.timed+r.rejection.timed})):kind.value==='bcc'?bcc.value.map(r=>({Document:r.document,Standard:r.standard,eXpress:r.express,Total:r.standard+r.express})):tableRows.value.map(r=>Object.fromEntries(columns.value.map((c,i)=>[c,values(r)[i]])));if(!rows.length){app.notify('No report records to export.');return}download('vue-'+kind.value+'-report.csv',csvText(rows));}
 function saveView(){if(!viewName.value.trim())return;ws.savedViews.push({id:uid(),name:viewName.value.trim(),kind:'report',workspace:chamber.value?'chamber':'exporter',report:kind.value,filters:clone(filters)});viewDialog.value=false;viewName.value='';app.notify('Report view saved.');}
 function reset(){Object.keys(filters).forEach(k=>filters[k]='')}
 function applyView(event){const v=ws.savedViews.find(v=>v.id===event.target.value);if(v){reset();Object.assign(filters,clone(v.filters));app.go('reports/'+v.report)}}
 function dateRange(days){if(!days){filters.from='';filters.to='';return}const end=new Date(),start=new Date(end);start.setDate(start.getDate()-days+1);filters.from=start.toISOString().slice(0,10);filters.to=end.toISOString().slice(0,10)}
 return{handlingTimeDefinition,chamberReportIcons,charts,selectChart,resultSort,performanceSort,volumeSort,drillSort,ws,chamber,kind,view,filters,drill,viewName,viewDialog,names,matching,byStatus,byDoc,byMonth,byExporter,users,userNames,exporters,metrics,summary,tableRows,paged,page,pageSize,pageCount,columns,values,bcc,reportViews,exportCSV,saveView,reset,applyView,dateRange,formatDate,documentTypes,documentNames,decisionUser,decisionStatus,decisionDate,handlingMinutes,duration,open:r=>app.go('applications/'+r.id),selectKind:k=>app.go('reports/'+k),print:()=>window.print(),money};
},template:String.raw`
<div class="section-tabs" :class="{'chamber-report-tabs':chamber}" :role="chamber?'navigation':undefined" :aria-label="chamber?'Report type':undefined">
 <button v-for="(name,key) in names" :key="key" type="button" :aria-pressed="kind===key" @click="selectKind(key)"><Icon v-if="chamber" :name="chamberReportIcons[key]"/><span>{{name}}</span></button>
</div>

<ListOptions :page="'reports-'+kind" :active="Object.entries(filters).some(([k,v])=>k!=='query'&&!!v)" :result="matching.length+' applications'"><template #search><label>Search records<input type="search" v-model="filters.query" placeholder="User, reference, exporter or document"></label></template><div class="record-toolbar"><label>Saved views<select @change="applyView"><option value="">Choose a saved view</option><option v-for="v in reportViews" :value="v.id">{{v.name}}</option></select></label><div class="button-row"><button @click="viewDialog=true">Save view</button><button @click="exportCSV"><Icon name="download"/>Export CSV</button><button @click="print"><Icon name="print"/>Print report</button></div></div><section class="card report-filters"><div class="fields-grid">
<label>{{kind==='users'?'Decision from':'From'}}<input type="date" v-model="filters.from"></label><label>{{kind==='users'?'Decision to':'To'}}<input type="date" v-model="filters.to" :min="filters.from"></label>
<label>Document<select v-model="filters.document"><option value="">All documents</option><option v-for="d in documentTypes">{{d}}</option></select></label>
<label>{{kind==='users'?'Decision':'Status'}}<select v-model="filters.status"><option value="">{{kind==='users'?'Approved and rejected':'All statuses'}}</option><option v-for="s in (kind==='users'?['Approved','Rejected','Auto Accepted']:['Pending','In Progress','Approved','Auto Accepted','Rejected'])">{{s}}</option></select></label>
<label v-if="chamber">Chamber User<select v-model="filters.user"><option value="">All users</option><option v-for="name in userNames">{{name}}</option></select></label><label>Service<select v-model="filters.service"><option value="">All</option><option>Standard</option><option>eXpress</option></select></label>
<label v-if="kind==='invoice'">Payment<select v-model="filters.payment"><option value="">All</option><option>Paid</option><option>Awaiting payment</option></select></label><label v-if="chamber">Exporter<select v-model="filters.exporter"><option value="">All exporters</option><option v-for="e in exporters">{{e}}</option></select></label></div>
<p>{{kind==='users'?'Date filters apply to the final decision, including both selected dates.':'Date filters apply to the latest update, including both selected dates.'}}</p><div class="button-row"><button @click="dateRange(0)">All dates</button><button @click="dateRange(30)">Last 30 days</button><button @click="dateRange(7)">Last 7 days</button><button class="text-button" @click="reset">Reset filters</button></div></section></ListOptions>
<div v-if="kind==='users'" class="report-metrics"><div class="card"><span class="report-metric-label">Applications processed<Icon name="report-files"/></span><strong>{{summary.applications}}</strong><small>{{summary.approval.applications}} approved · {{summary.rejection.applications}} rejected</small></div><div class="card"><span class="report-metric-label">Documents processed<Icon name="report-file"/></span><strong>{{summary.documents}}</strong><small>{{summary.approved}} approved · {{summary.rejected}} rejected</small></div><div v-for="[key,label] in [['approval','Average time to approval'],['rejection','Average time to rejection']]" class="card"><span class="report-metric-label">{{label}}<Icon name="report-clock"/></span><strong>{{duration(summary[key].minutes)}}</strong><small>{{summary[key].timed}} of {{summary[key].applications}} applications timed</small></div></div>
<div v-else class="report-metrics"><div v-for="[key,label,icon] in [['total','Applications','report-files'],['approved','Approved','report-approved'],['rejected','Rejected','report-rejected'],['awaiting','Awaiting decision','report-inbox']]" class="card"><span class="report-metric-label">{{label}}<Icon :name="icon"/></span><strong>{{metrics[key]}}</strong></div></div>
<p v-if="kind==='users'" class="performance-time-definition">{{handlingTimeDefinition}}</p>
<div v-if="charts.length" class="reports-grid vue-report-donuts"><Donut v-for="chart in charts" :key="chart.id" v-bind="chart" :interactive="!!chart.filter" @select="selectChart(chart.filter,$event)"/></div>
<section v-if="kind==='users'" class="card table-card"><h2>User Performance</h2><p>Archived decisions are included. Averages use applications with usable decision times.</p><p v-if="summary.applications>summary.approval.timed+summary.rejection.timed" role="status">{{summary.applications-summary.approval.timed-summary.rejection.timed}} applications have no usable handling time. Document counts are included.</p>
<div class="section-tabs"><button v-for="[key,label] in [['user','By Chamber User'],['document','By document'],['applications','Applications']]" :aria-pressed="view===key" @click="view=key">{{label}}</button></div>
<div class="table-scroll" tabindex="0" role="region" aria-label="Report results" v-if="view!=='applications'"><table class="performance-table"><thead><tr><SortHeading :sort="performanceSort" column="name">{{view==='user'?'Chamber User':'Document'}}</SortHeading><SortHeading :sort="performanceSort" column="applications">Applications</SortHeading><SortHeading :sort="performanceSort" column="approved">Approved documents</SortHeading><SortHeading :sort="performanceSort" column="rejected">Rejected documents</SortHeading><SortHeading :sort="performanceSort" column="documents">Total documents</SortHeading><SortHeading :sort="performanceSort" column="approval">Avg approval time</SortHeading><SortHeading :sort="performanceSort" column="rejection">Avg rejection time</SortHeading><SortHeading :sort="performanceSort" column="timed">Timed applications</SortHeading><th>Actions</th></tr></thead><tbody><tr v-for="row in performanceSort.rows(users)" :key="row.name" @click="drill=row"><td><button class="reference" translate="no" @click.stop="drill=row">{{row.name}}</button></td><td>{{row.applications}}</td><td>{{row.approved}}</td><td>{{row.rejected}}</td><td>{{row.documents}}</td><td>{{duration(row.approval.minutes)}}</td><td>{{duration(row.rejection.minutes)}}</td><td>{{row.approval.timed+row.rejection.timed}} / {{row.applications}}</td><td><button class="icon-button" :aria-label="'View records for '+row.name" data-tip="View records" @click.stop="drill=row"><Icon name="view"/></button></td></tr></tbody></table></div><EmptyState v-if="!matching.length"/>
<div v-if="view==='applications'" class="table-scroll" tabindex="0" role="region" aria-label="Report results"><table><thead><tr><SortHeading :sort="resultSort" column="reference">Reference</SortHeading><SortHeading :sort="resultSort" column="document">Documents</SortHeading><SortHeading :sort="resultSort" column="status">Decision</SortHeading><SortHeading :sort="resultSort" column="user">Chamber User</SortHeading><SortHeading :sort="resultSort" column="date">Decision date</SortHeading><SortHeading :sort="resultSort" column="time">Handling time</SortHeading></tr></thead><tbody><tr v-for="r in paged" :key="r.id" @click="open(r)"><td><button class="reference" translate="no" @click.stop="open(r)">{{r.reference}}</button></td><td>{{documentNames(r).join(', ')}}</td><td>{{decisionStatus(r)}}</td><td translate="no">{{decisionUser(r)}}</td><td>{{formatDate(decisionDate(r))}}</td><td>{{duration(handlingMinutes(r))}}</td></tr></tbody></table></div></section>
<section v-else-if="kind==='bcc'" class="card table-card"><h2>BCC report</h2><p>Approved document selections by service. Sample summary only.</p><table><thead><tr><SortHeading :sort="volumeSort" column="document">Document</SortHeading><SortHeading :sort="volumeSort" column="standard">Standard</SortHeading><SortHeading :sort="volumeSort" column="express">eXpress</SortHeading><SortHeading :sort="volumeSort" column="total">Total</SortHeading></tr></thead><tbody><tr v-for="r in volumeSort.rows(bcc)" :key="r.document"><td>{{r.document}}</td><td>{{r.standard}}</td><td>{{r.express}}</td><td>{{r.standard+r.express}}</td></tr></tbody></table></section>
<section v-else class="card table-card"><div class="card-heading"><h2>{{names[kind]}} · {{tableRows.length}} records</h2></div><p v-if="kind==='single'">Approved applications without a recorded second check. This does not itself establish a compliance failure.</p><p v-if="kind==='aviva'">Sample carnet security details. Insurer eligibility and submission are not verified.</p><p v-if="kind==='invoice'">Sample fees and payment status. This is not a tax invoice.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Report results"><table class="report-table"><thead><tr><SortHeading v-for="(c,index) in columns" :key="c" :sort="resultSort" :column="index" :enabled="chamber">{{c}}</SortHeading><th>Actions</th></tr></thead><tbody><tr v-for="record in paged" :key="record.id" @click="open(record)"><td v-for="(v,i) in values(record)">{{v}}</td><td @click.stop><button class="icon-button" :aria-label="'Open '+record.reference" data-tip="Open" @click="open(record)"><Icon name="view"/></button></td></tr></tbody></table></div><EmptyState v-if="!tableRows.length"/></section>
<div v-if="kind!=='bcc'&&(kind!=='users'||view==='applications')" class="pagination"><span>{{tableRows.length}} records</span><button aria-label="Previous page" :disabled="page<=1" @click="page--"><Icon name="back"/></button><span>Page {{page}} of {{pageCount}}</span><button aria-label="Next page" :disabled="page>=pageCount" @click="page++"><Icon name="next"/></button><label>Rows per page<select v-model.number="pageSize"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select></label></div>
<Modal v-if="viewDialog" title="Save report view" @close="viewDialog=false"><form @submit.prevent="saveView"><label>View name<input v-model="viewName" required></label><div class="dialog-actions"><button type="button" @click="viewDialog=false">Cancel</button><button class="primary">Save view</button></div></form></Modal>
<Modal v-if="drill" :title="drill.name+' · User Performance'" wide @close="drill=null"><div class="table-scroll" tabindex="0" role="region" aria-label="Report results"><table><thead><tr><SortHeading :sort="drillSort" column="reference">Reference</SortHeading><SortHeading :sort="drillSort" column="document">Documents</SortHeading><SortHeading :sort="drillSort" column="status">Decision</SortHeading><SortHeading :sort="drillSort" column="time">Handling time</SortHeading><th>Actions</th></tr></thead><tbody><tr v-for="r in drillSort.rows(drill.records)" :key="r.id"><td translate="no">{{r.reference}}</td><td>{{documentNames(r).join(', ')}}</td><td>{{decisionStatus(r)}}</td><td>{{duration(handlingMinutes(r))}}</td><td><button class="icon-button" :aria-label="'Open '+r.reference" data-tip="Open" @click="open(r);drill=null"><Icon name="view"/></button></td></tr></tbody></table></div><EmptyState v-if="!drill.records.length"/></Modal>`};
