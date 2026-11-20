import {computed} from './assets/vue.esm-browser.prod.js?v=2026-11-20-acceptance-r1';
import {Icon} from './components.js?v=2026-11-20-certificate-review-r1';
import {documentAllowed} from './assets/destinations.js?v=2026-11-20-acceptance-r1';

// Reuse React's document artwork, labels and descriptions; keep Vue's record values.
const cards=[
 ['coo','UK Certificate of Origin','UK Certificate of Origin','Certify the origin of your goods',63],
 ['arab','Arab Certificate of Origin','Arab Certificate of Origin','For trade with Arab League countries',354],
 ['eur','EUR1','EUR1 movement certificate','For eligible preferential trade',645],
 ['eurmed','EUR-MED','EUR-MED movement certificate','With cumulation details',933],
 ['invoice','Commercial invoice','Commercial invoice','Request invoice certification',1222],
 ['ata','ATA Carnet','ATA Carnet','For temporary export of goods',1515],
 ['iic','Import certificate','International Import Certificate','Importer and intended-use details',1804],
 ['upload','Uploaded document','Upload a document','Add a document for certification',null]
].map(([id,value,label,description,x])=>({id,value,label,description,x}));
let sequence=0;
export const DocumentChooser={props:{record:Object},emits:['choose','preview'],components:{Icon},setup(props){const id='vue-document-chooser-'+(++sequence),selected=doc=>props.record.documents.includes(doc.value),unavailable=doc=>!props.record.destination||documentAllowed(props.record.destination,doc.id)===false,chosen=computed(()=>cards.filter(selected));return{id,cards,selected,unavailable,chosen}},template:String.raw`
<section class="vue-document-chooser" :aria-labelledby="id+'-title'">
 <h3 :id="id+'-title'">Choose your documents</h3>
 <p v-if="!record.destination" class="document-choice-locked">Choose a destination country above before selecting documents.</p>
 <div class="document-choices">
  <div v-for="doc in cards" :key="doc.id" class="vue-document-card" :class="{'is-selected':selected(doc),'is-unavailable':unavailable(doc)}">
   <button type="button" class="vue-document-select" :data-document="doc.value" :aria-pressed="selected(doc)" :aria-labelledby="id+'-'+doc.id+'-name'" :aria-describedby="id+'-'+doc.id+'-description'" :disabled="unavailable(doc)&&!selected(doc)" @click="$emit('choose',doc.value)">
    <span v-if="doc.x!==null" class="document-choice-thumbnail" aria-hidden="true" :style="{backgroundPosition:(-doc.x/5)+'px -39.6px'}"></span>
    <span v-else class="document-choice-upload" aria-hidden="true"></span>
    <span class="document-choice-copy"><strong :id="id+'-'+doc.id+'-name'">{{doc.label}}</strong><span :id="id+'-'+doc.id+'-description'">{{doc.description}}<span v-if="record.destination&&unavailable(doc)" class="document-choice-unavailable">{{'Not available: '+record.destination}}</span></span></span>
    <span class="document-choice-marker" aria-hidden="true"><Icon v-if="selected(doc)" name="check"/></span>
   </button>
   <button v-if="selected(doc)" class="icon-button document-choice-preview" type="button" :aria-label="'Preview: '+doc.label" :data-tip="'Preview: '+doc.label" @click="$emit('preview',doc.value)"><Icon name="eye"/></button>
  </div>
 </div>
 <div class="document-choice-summary" role="status" aria-atomic="true"><strong>{{chosen.length?'Selected':'No documents selected'}}</strong><p v-if="chosen.length"><span v-for="(doc,i) in chosen" :key="doc.id"><span v-if="i" aria-hidden="true"> · </span>{{doc.label}}</span></p><p v-else>Choose a destination country first to see which documents are available.</p></div>
</section>`};
