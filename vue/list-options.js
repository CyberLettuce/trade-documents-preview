import {ref,watch} from './assets/vue.esm-browser.prod.js?v=2026-11-19-audit-fixes-r1';
import {optionsStorage,optionsStorageKey,readOptionsOpen,writeOptionsOpen} from '../assets/list-options-model.js?v=2026-11-19-audit-fixes-r1';
let nextId=0;
export const ListOptions={
 props:{page:{type:String,default:'list'},active:{type:[Boolean,Number],default:false},result:{type:String,default:''}},
 setup(props){
  const key=()=>optionsStorageKey(location.hash.startsWith('#/chamber')?'vue-chamber':'vue-exporter',props.page);
  const open=ref(readOptionsOpen(optionsStorage(),key())),button=ref(null),id='list-options-'+(++nextId);
  watch(()=>props.page,()=>open.value=readOptionsOpen(optionsStorage(),key()));
  function toggle(value=!open.value){open.value=value;writeOptionsOpen(optionsStorage(),key(),value)}
  function escape(event){if(event.key==='Escape'&&open.value&&!event.target.closest('[role="dialog"],dialog,[role="menu"]')){event.stopPropagation();toggle(false);button.value?.focus()}}
  return{open,button,id,toggle,escape};
 },
 template:String.raw`<section class="list-options" @keydown="escape"><div class="list-options-bar"><div class="list-options-search"><slot name="search"/></div><button ref="button" type="button" class="list-options-toggle" :aria-expanded="open" :aria-controls="id" @click="toggle()"><Icon name="filter"/>Options<Icon name="chevron" :style="{transform:open?'rotate(180deg)':undefined}"/></button><span v-if="active" class="list-options-active">Filters active</span><span v-if="result" class="list-options-count" role="status">{{result}}</span><div v-if="$slots.actions" class="list-options-actions"><slot name="actions"/></div></div><div :id="id" :hidden="!open" class="list-options-panel"><div class="list-options-content"><slot/></div></div></section>`
};
