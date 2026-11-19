import {createDeferredSave} from './persistence.js?v=2026-11-19-audit-fixes-r1';
import {reactive,computed,watch,inject,ref} from './assets/vue.esm-browser.prod.js?v=2026-11-19-audit-fixes-r1';
import {STORAGE} from './model.js?v=2026-11-19-audit-fixes-r1';
import {freshWorkspace,clone,now,uid,canManageUsers} from './workspace-model.js?v=2026-11-19-audit-fixes-r1';
const key=STORAGE+'-workspace';let saved;try{saved=JSON.parse(localStorage.getItem(key))}catch{}
export const ws=reactive(saved?.version===2?saved:freshWorkspace());
if(!ws.content.publishedAt){ws.content.published=clone(ws.content.draft);ws.content.publishedAt=now();}
export const activeAccount=computed(()=>ws.accounts.find(a=>a.id===ws.activeAccount)||ws.accounts[0]);
export const activeUser=computed(()=>ws.users.find(u=>u.id===ws.activeUser)||ws.users[0]);
export const admin=computed(()=>canManageUsers(ws.users,ws.activeUser));
export function audit(title,detail=''){ws.audit.unshift({id:uid(),at:now(),user:ws.officer,title,detail});ws.audit.splice(1000);}
export function saveWorkspace(){try{localStorage.setItem(key,JSON.stringify(ws));return true}catch(e){window.dispatchEvent(new CustomEvent('vue-save-error',{detail:'This browser could not save changes. Export important records before closing.'}));return false;}}
const workspaceSaver=createDeferredSave(saveWorkspace);
watch(ws,workspaceSaver.schedule,{deep:true,flush:'sync'});
if(typeof window!=='undefined'){window.addEventListener('pagehide',workspaceSaver.flush);
window.addEventListener('beforeunload',workspaceSaver.flush);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')workspaceSaver.flush()});}
export const useApp=()=>inject('app');
export function download(name,content,type='text/csv;charset=utf-8'){const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);}
// Reactive locale avoids dates retaining the previous language after a switch.
export const interfaceLocale=ref('en');
const locale=()=>interfaceLocale.value==='en'?'en-GB':interfaceLocale.value;
export function money(n){return new Intl.NumberFormat(locale(),{style:'currency',currency:'GBP'}).format(Number(n)||0);}
export function formatDate(s){if(!s)return'—';const d=new Date(s);return Number.isNaN(+d)?s:new Intl.DateTimeFormat(locale(),{day:'2-digit',month:'short',year:'numeric'}).format(d);}
export function safeLink(value){try{const url=new URL(value);return ['https:','http:','mailto:','tel:'].includes(url.protocol)?url.href:''}catch{return''}}
