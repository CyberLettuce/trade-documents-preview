import {computed,ref} from './assets/vue.esm-browser.prod.js?v=2026-11-19-audit-fixes-r1';
import {carnetAccess,carnetQr} from './assets/carnet-actions-model1.js?v=2026-11-19-audit-fixes-r1';
export const CarnetDialog={props:['record','mode'],emits:['close','return'],setup(props){const confirmed=ref(false),access=computed(()=>carnetAccess(props.record)),qr=computed(()=>carnetQr(access.value.payload));return{confirmed,access,qr}},template:String.raw`
<Modal :title="mode==='carnet'?'eCarnet ID and PIN':'Return Carnet'" @close="$emit('close')">
  <div v-if="mode==='carnet'" class="carnet-access">
    <p>Sample access details. This QR code cannot open a real carnet.</p>
    <dl><dt>Carnet ID</dt><dd translate="no">{{access.id}}</dd><dt>PIN</dt><dd class="demo-pin" translate="no">{{access.pin}}</dd></dl>
    <svg class="carnet-qr" :viewBox="'0 0 '+qr.size+' '+qr.size" role="img" aria-label="Sample eCarnet QR code"><rect :width="qr.size" :height="qr.size" fill="white"/><path :d="qr.path" fill="black" shape-rendering="crispEdges"/></svg>
  </div>
  <template v-else><p translate="no">{{record.reference}}</p><p v-if="record.carnetReturned" class="notice">Carnet return already recorded.</p><template v-else><p>Record the return of this carnet in the sample workspace.</p><label class="checkbox-row"><input type="checkbox" v-model="confirmed">The sample carnet is ready to return</label></template></template>
  <template #footer><button @click="$emit('close')">Close</button><button v-if="mode==='return'&&!record.carnetReturned" class="primary" :disabled="!confirmed" @click="$emit('return')">Record return</button></template>
</Modal>`};
