import {ref,onMounted,onUnmounted} from './assets/vue.esm-browser.prod.js?v=2026-11-20-acceptance-r1';
import {sidebarKey,readSidebar,saveSidebar,bindSidebarLabels} from '../assets/sidebar-state.js?v=2026-11-20-acceptance-r1';
export const SidebarCollapse={setup(){
  const collapsed=ref(readSidebar(localStorage,'vue')),button=ref(null);
  const apply=()=>document.documentElement.dataset.sidebarCollapsed=String(collapsed.value);
  function toggle(){collapsed.value=!collapsed.value;saveSidebar(localStorage,'vue',collapsed.value);apply()}
  function remote(event){if(event.key===sidebarKey('vue')||event.key===null){collapsed.value=readSidebar(localStorage,'vue');apply()}}
  let cleanup;apply();onMounted(()=>{cleanup=bindSidebarLabels(button.value.closest('aside'),true);window.addEventListener('storage',remote)});
  onUnmounted(()=>{cleanup?.();window.removeEventListener('storage',remote)});
  return{collapsed,button,toggle};
},template:String.raw`<button ref="button" type="button" class="sidebar-collapse-toggle icon-button" :aria-label="collapsed?'Expand sidebar':'Collapse sidebar'" :data-tip="collapsed?'Expand sidebar':'Collapse sidebar'" :aria-expanded="!collapsed" aria-controls="workspace-sidebar" @click="toggle"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path :d="collapsed?'m13 9 3 3-3 3':'m16 9-3 3 3 3'"/></svg></button>`};
