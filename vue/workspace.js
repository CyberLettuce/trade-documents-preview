import {reactive,computed,watch,inject} from './assets/vue.esm-browser.prod.js';
import {STORAGE} from './model.js?v=2026-11-17-vue-functional-parity-r2';
import {freshWorkspace,clone,now,uid,canManageUsers} from './workspace-model.js?v=2026-11-17-vue-functional-parity-r2';
const key=STORAGE+'-workspace';let saved;try{saved=JSON.parse(localStorage.getItem(key))}catch{}
export const ws=reactive(saved?.version===2?saved:freshWorkspace());
if(!ws.content.publishedAt){ws.content.published=clone(ws.content.draft);ws.content.publishedAt=now();}
export const activeAccount=computed(()=>ws.accounts.find(a=>a.id===ws.activeAccount)||ws.accounts[0]);
export const activeUser=computed(()=>ws.users.find(u=>u.id===ws.activeUser)||ws.users[0]);
export const admin=computed(()=>canManageUsers(ws.users,ws.activeUser));
export function audit(title,detail=''){ws.audit.unshift({id:uid(),at:now(),user:ws.officer,title,detail});ws.audit.splice(1000);}
export function saveWorkspace(){try{localStorage.setItem(key,JSON.stringify(ws));return true}catch(e){window.dispatchEvent(new CustomEvent('vue-save-error',{detail:'This browser could not save changes. Export important records before closing.'}));return false;}}
watch(ws,saveWorkspace,{deep:true});
export const useApp=()=>inject('app');
export function download(name,content,type='text/csv;charset=utf-8'){const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);}
export function money(n){return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);}
export function formatDate(s){if(!s)return'—';const d=new Date(s);return Number.isNaN(+d)?s:new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':document.documentElement.lang||'en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(d);}
export function safeLink(value){try{const url=new URL(value);return ['https:','http:','mailto:','tel:'].includes(url.protocol)?url.href:''}catch{return''}}
