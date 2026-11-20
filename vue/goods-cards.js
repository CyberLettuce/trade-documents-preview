import {UNITS,unitCodes} from './form-model.js?v=2026-11-20-chamber-carnet-r1';
import {countries} from './workspace-model.js?v=2026-11-20-acceptance-r1';
export const GoodsCards={props:['record','readonly'],emits:['copy','remove'],setup(){return{UNITS,unitCodes,countries}},template:String.raw`
<div class="goods-entry-cards">
 <section v-for="(item,i) in record.items" :key="item.id" class="goods-entry-card" :aria-label="'Item '+(i+1)">
  <div class="editor-section-heading"><h3>Item {{i+1}}</h3><div class="row-actions" v-if="!readonly"><button type="button" class="icon-button" :aria-label="'Copy item '+(i+1)" data-tip="Copy" @click="$emit('copy',item)"><Icon name="copy"/></button><button type="button" class="icon-button" :aria-label="'Delete item '+(i+1)" data-tip="Delete" @click="$emit('remove',item)"><Icon name="delete"/></button></div></div>
  <div class="goods-description-fields">
   <label><span>Marks and numbers</span><textarea v-model="item.marks" :disabled="readonly" :aria-label="'Marks and numbers: '+(i+1)"></textarea></label>
   <label><span>Number and type of packages</span><textarea v-model="item.packages" :disabled="readonly" :aria-label="'Number and type of packages: '+(i+1)"></textarea></label>
   <label><span>Goods description</span><textarea v-model="item.description" :disabled="readonly" :aria-label="'Item '+(i+1)+' description'"></textarea></label>
  </div>
  <details class="editor-extra-details goods-extra-details" :open="(record.documents||[record.document]).includes('Commercial invoice')">
   <summary><strong>Package and invoice details</strong></summary>
   <div class="fields-grid">
    <label>No. of pieces<input type="number" min="1" step="1" v-model.number="item.pieces" :aria-label="'Item '+(i+1)+' pieces'" :disabled="readonly||item.heading"></label>
    <label>Unit<select v-model="item.unit" :aria-label="'Item '+(i+1)+' unit'" :disabled="readonly||item.heading"><option v-for="u in UNITS" :value="u">{{u}}</option></select></label>
    <label>Weight<input type="number" min="0" step="any" v-model.number="item.weight" :aria-label="'Item '+(i+1)+' weight'" :disabled="readonly||item.heading"></label>
    <label>Value<input type="number" min="0" step="0.01" v-model.number="item.value" :aria-label="'Item '+(i+1)+' value'" :disabled="readonly||item.heading"></label>
    <label class="field-wide">Origin<select v-model="item.origin" :aria-label="'Item '+(i+1)+' origin'" :disabled="readonly||item.heading"><option v-for="country in countries">{{country}}</option></select></label>
    <label>Commodity code<input v-model="item.commodity" :aria-label="'Commodity code: '+(i+1)" :disabled="readonly"></label>
    <label v-if="(record.documents||[record.document]).includes('Commercial invoice')">Unit price<input type="number" min="0" step="0.01" v-model.number="item.price" :aria-label="'Unit price: '+(i+1)" :disabled="readonly"></label>
   </div>
  </details>
 </section>
</div>`};

