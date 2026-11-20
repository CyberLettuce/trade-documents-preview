import {carnetTripCounts,renderCarnetReview} from '../assets/carnet-review.js?v=2026-11-20-carnet-r1';
import {computed,h} from './assets/vue.esm-browser.prod.js?v=2026-11-20-acceptance-r1';
import {sectionsFor,itemTotals} from './form-model.js?v=2026-11-20-chamber-carnet-r1';
const money = new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP'}).format;

export function stepTitle(step,record,fallback){
 const d=record.document,movement=['EUR1','EUR-MED'].includes(d),uk=d==='UK Certificate of Origin',arab=d==='Arab Certificate of Origin';
 if(step==='review')return'Review your application';
 if(step==='delivery')return'How would you like your documents?';
 if(step==='payment')return'Payment & submission';
 if(step==='applicant'&&!arab)return'Applicant / agent details';
 if(step==='foreignEvidence')return'Foreign Origin Evidence';
 if(step==='goods'&&d==='Import certificate')return'Goods & invoices';
 if(step==='parties')return arab?'Box 1 – Consignor':uk||movement?'Box 1 – Exporter':'Exporter details';
 if(step==='originCountry')return uk?'Box 3 – Country of Origin':arab?'Box 5 – Originated In':fallback;
 if(step==='transport')return uk?'Box 4 – Transport Details':arab?'Box 3 – Method of Transport':movement?'Box 6 – Transport Details':fallback;
 if(step==='remarks')return uk?'Box 5 – Remarks':arab?'Box 11 – Remarks':movement?'Box 7 – Remarks':fallback;
 if(step==='goods'&&d!=='ATA Carnet'&&d!=='Commercial invoice')return movement?'Box 8 – General Description':'Box 6 – General Description';
 if(step==='quantities')return movement?'Box 9 – Gross Weight or Other Measure':uk?'Box 7 – Quantities':fallback;
 if(step==='place')return movement?'Box 12 – Place':uk?'Box 8 – Place':arab?'Box 8 – Place and Date':fallback;
 return fallback;
}
export function stepDescription(step,record){
 return {
  parties:'Use stored details or enter them below.',holder:'Use stored details or enter them below.',consignee:'Use stored details or enter them below.',
  transport:'How the goods will travel. This box is optional.',remarks:['EUR1','EUR-MED'].includes(record.document)?'Choose a template. The wording printed in EUR1 Box 7 updates from the details you enter.':'Choose a template. Replacement adds the standard wording for a replacement certificate.',
  goods:record.document==='ATA Carnet'?'Describe each item in the carnet general list and include quantities.':'Describe the goods and add the invoices they are listed on.',
  intendedUse:'Choose how the goods will be used during their temporary export.',
  countries:'Add each destination or transit country and the number of visits or transits.',
  security:'Provide the security arrangements for this carnet.',
  origin:'Tick each statement that applies to these goods. At least one is required.',
  evidence:'How your chamber will receive the commercial invoice and any other documents.',
  review:'Check each section, then continue to delivery and payment options.',
  delivery:'Select a service and delivery method for the sample order.',
  order:'Sample prices demonstrate how a clear order summary could work.',
  payment:'Complete the sample order. No payment is taken.'
 }[step]||'';
}
const group=(title,keys,optional=false)=>({title,keys,optional});
export function fieldGroups(step,fields,record){
 const configs={
  parties:[group('', ['exporter','exporterAddress']),group('Additional exporter details',['exporterVat','exporterPhone'],true),group('Applicant / agent details',['applicant','applicantAddress'],true)],
  holder:[group('',['exporter','exporterAddress']),group('Additional holder details',['holderEmail','holderPhone','holderRegistration'],true)],
  consignee:[group('',['consignee','consigneeAddress']),group('Additional consignee details',['consigneeVat','deliveryTerms'],true)],
  transport:[group('',['transport']),group('Additional details',['vessel','portLoading','portDischarge','placeDelivery'],true)],
  originCountry:[group('',['origin']),group('Additional origin countries',['otherOrigins'],true)],
  invoice:[group('',['invoiceNumber','invoiceDate','currency']),group('Buyer',['buyer','buyerAddress']),group('Additional details',['paymentTerms','invoiceDeclaration'],true)],
  security:[group('',['security','securityReference','securityAmount','securityDetails']),group('Additional details',['departure','returnDate'])],
  quantities:[group('',['gross','net','weightUnit']),group('',['cube','cubeUnit','quantity'])],
  iic:[group('',['endUse','importValue','currency','sterling']),group('',['supplier','supplierAddress']),group('Additional details',['purchaseOrder','importLicence','endUser'])],
  payment:[group('',['payment','purchaseOrder','message']),group('Declaration',['emailNotifications','confirmed'])]
 };
 const source=configs[step]||[group('',fields.map(f=>f.key))];
 const used=new Set(source.flatMap(g=>g.keys));
 const groups=source.map(g=>({...g,fields:g.keys.map(k=>fields.find(f=>f.key===k)).filter(Boolean)}));
 if(fields.some(f=>!used.has(f.key)))groups.push({title:'Additional details',fields:fields.filter(f=>!used.has(f.key))});
 return groups.filter(g=>g.fields.length).map(g=>({...g,fields:g.fields.map(f=>({...f,label:step==='parties'&&record.document==='Arab Certificate of Origin'?f.label.replace('Exporter','Consignor'):f.label}))}));
}
export const StepFields={props:['fields','record','step','errors'],setup(props){return{groups:computed(()=>fieldGroups(props.step,props.fields,props.record)),wide:field=>field.type==='textarea'||field.type==='checkbox'||['exporter','consignee','buyer','supplier','applicant','representative','manufacturersText','quantity'].includes(field.key)}},template:String.raw`
<div class="editor-field-sections">
 <template v-for="(group,i) in groups" :key="step+'-'+i">
  <details v-if="group.optional" class="editor-extra-details" :open="group.fields.some(field=>errors[field.key])">
   <summary><strong>{{group.title}}</strong><small>Optional</small></summary>
   <div class="fields-grid"><Field v-for="field in group.fields" :key="field.key" :field="field" :class="{'field-wide':wide(field)}" v-model="record[field.key]" :error="errors[field.key]"/></div>
  </details>
  <section v-else class="editor-field-section">
   <h3 v-if="group.title">{{group.title}}</h3>
   <div class="fields-grid"><Field v-for="field in group.fields" :key="field.key" :field="field" :class="{'field-wide':wide(field)}" v-model="record[field.key]" :error="errors[field.key]"/></div>
  </section>
 </template>
</div>`};
const row=(label,value,user=false)=>({label,value:value===undefined||value===null||value===''?'—':String(value),user});
export function reviewGroups(f,ws){
 const ata=f.document==='ATA Carnet',signatory=ws.saved.signatories.find(s=>s.id===f.exporterSignatory)?.name||'—';
 const groups=[{title:'Documents & setup',step:'setup',rows:[row('Your reference',f.yourReference,true),row('Documents',f.documents.join(', ')),row('Destination country',f.destination),row('Originals / copies',f.originals+' / '+f.copies),row('Signatory',signatory,true)]},
 {title:ata?'Holder & representative':'Exporter & consignee',step:ata?'holder':'parties',actions:ata?[{label:'Holder',step:'holder'},{label:'Representative',step:'representative'}]:[{label:'Exporter',step:'parties'},{label:'Consignee',step:'consignee'}],rows:[row(ata?'Holder':'Exporter',[f.exporter,f.exporterAddress].filter(Boolean).join('\n'),true),row(ata?'Representative':'Consignee',ata?[f.representative,f.representativeAddress].filter(Boolean).join('\n'):[f.consignee,f.consigneeAddress].filter(Boolean).join('\n'),true)]}];
 if(ata)groups.push({title:'Intended use of goods',step:'intendedUse',rows:[row('Intended use of goods',f.use)]},{title:'Destination and transit countries',step:'countries',rows:f.trips.map(trip=>{const {visits,transits}=carnetTripCounts(trip);return row(trip.country,visits+' / '+transits);})},{title:'Security',step:'security',rows:[row('Security arrangement',f.security),row('Security reference',f.securityReference,true),row('Security details',f.securityDetails,true)]});
 const totals=itemTotals(f.items||[]);
 groups.push({title:ata?'General list':'Goods & origin',step:'goods',rows:[row('Goods',(f.items?.length?f.items.map((item,i)=>(i+1)+'. '+item.description).join('\n'):f.goods),true),...(ata?[row('Number of pieces',totals.pieces),row('Weight',Object.entries(totals.weights).map(([unit,weight])=>weight+' '+unit).join(', ')),row('Value',totals.value)]:[row('Country of origin',f.origin),row('Total gross',f.gross),row('Total net',f.net)])]});
 if(f.document==='Import certificate')groups.push({title:'Import details',step:'iic',rows:[row('End use of goods',f.endUse,true),row('Import value',f.importValue),row('Currency',f.currency),row('Supplier name',f.supplier,true),row('Purchase order number',f.purchaseOrder,true)]});
 if(f.documents.includes('Commercial invoice'))groups.push({title:'Invoice details',step:'invoice',rows:[row('Invoice number',f.invoiceNumber,true),row('Invoice date',f.invoiceDate),row('Buyer',f.buyer,true),row('Currency',f.currency)]});
 groups.push({title:'Evidence & declarations',step:'evidence',rows:[row('Files',f.files?.map(file=>file.name).join('\n')||'—',true),row('Evidence method',({upload:'Uploaded documents',post:'Documents sent separately',held:'Evidence held on file'})[f.evidence]||f.evidence),...(f.originBasis?.length?[row('Origin declaration',f.originBasis.join('\n'))]:[]),...(f.place?[row('Place of issue',f.place,true)]:[]),row('Stamp reference',f.stampReference,true),row('Evidence details',f.evidenceDetails,true)]});
 const available=new Set(sectionsFor(f).map(([id])=>id));
 return groups.filter(g=>available.has(g.step)).map(g=>({...g,...(g.actions?{actions:g.actions.filter(a=>available.has(a.step))}:{})}));
}
const CarnetReview={props:['record','workspace'],emits:['edit'],setup(props,{emit}){return()=>renderCarnetReview((tag,attrs,...children)=>h(tag,attrs,children),{
 record:props.record,documents:props.record.documents.join(', '),totals:itemTotals(props.record.items||[]),
 signatory:props.workspace.saved.signatories.find(entry=>entry.id===props.record.exporterSignatory)?.name,
 edit:step=>emit('edit',step),formatMoney:money
});}};
export const ApplicationReview={components:{CarnetReview},props:['record','workspace','problems'],emits:['edit','issues'],setup(props){return{groups:computed(()=>{
 const groups=reviewGroups(props.record,props.workspace);
 return props.record.document==='ATA Carnet'?groups.filter(group=>group.step==='evidence'):groups;
 })}},template:String.raw`
<div class="application-review-summary">
 <div class="editor-information" :class="{'needs-attention':problems.length}"><Icon v-if="!problems.length" name="check"/><span>{{problems.length?'Check the following details':'Required application details are complete.'}}</span><button v-if="problems.length" class="text-button" @click="$emit('issues')">What’s missing? <span class="count">{{problems.length}}</span></button></div>
 <CarnetReview v-if="record.document==='ATA Carnet'" :record="record" :workspace="workspace" @edit="$emit('edit',$event)"/>
 <section v-for="group in groups" :key="group.title" class="editor-review-section">
  <div class="editor-section-heading"><h3>{{group.title}}</h3><div class="button-row"><button v-for="action in group.actions||[{step:group.step}]" :key="action.step" type="button" class="text-button" :aria-label="'Edit: '+(action.label||group.title)" @click="$emit('edit',action.step)">{{action.label?'Edit: '+action.label:'Edit'}}</button></div></div>
  <dl class="editor-review-values"><div v-for="(row,i) in group.rows" :key="i"><dt>{{row.label}}</dt><dd :translate="row.user?'no':undefined">{{row.value}}</dd></div></dl>
 </section>
</div>`};

