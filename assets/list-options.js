import {r as React, Q as ReactDOM, I as Icon} from './index-Cj32ATD7-review1-d3188122-nochecklist1-options1-sidebar1-editorcol1.js?v=2026-11-24-inline-editor-r1';
import {languageCreateElement as h, registerPatterns} from './language-runtime-review1-57775012.js?v=2026-11-24-danish-density-r1';
import words from './list-options-language.js?v=2026-11-20-acceptance-r1';
import {optionsStorage,optionsStorageKey, readOptionsOpen, writeOptionsOpen} from './list-options-model.js?v=2026-11-20-acceptance-r1';
export {hasOptionFilters} from './list-options-model.js?v=2026-11-20-acceptance-r1';
export {h as listElement};
for (const [locale, entries] of Object.entries(words)) registerPatterns(Object.entries(entries), locale);

// A page's existing controls keep their own React state and event handlers.
// Portals collect controls from the list, saved views and table into one panel.
const hosts = new Map(), listeners = new Set();
const notify = () => listeners.forEach(listener => listener());
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
const route = () => location.hash.split('?')[0];
export function ListOptionsSlot({children, order = 30}) {
  const page = route();
  const host = React.useSyncExternalStore(subscribe, () => hosts.get(page) || null);
  return host ? ReactDOM.createPortal(h('div', {className:'list-options-slot', style:{order}}, children), host) : children;
}
export function ListOptions({search, children, actions, result, active = false, page = 'list'}) {
  const workspace = location.hash.startsWith('#chamber') ? 'react-chamber' : 'react-exporter';
  const key = optionsStorageKey(workspace, page), currentRoute = route();
  const [open, setOpen] = React.useState(() => readOptionsOpen(optionsStorage(), key));
  React.useEffect(() => setOpen(readOptionsOpen(optionsStorage(), key)), [key]);
  const id = React.useId(), button = React.useRef(null);
  const hostRef = React.useCallback(node => {
    if (node) hosts.set(currentRoute, node); else hosts.delete(currentRoute);
    notify();
  }, [currentRoute]);
  function toggle(value) { setOpen(value); writeOptionsOpen(optionsStorage(), key, value); }
  return h('section', {className:'list-options', onKeyDown:event => {
    if (event.key === 'Escape' && open && !event.target.closest('[role="dialog"],dialog,[role="menu"]')) { event.stopPropagation(); toggle(false); button.current?.focus(); }
  }}, h('div', {className:'list-options-bar'},
    h('div', {className:'list-options-search'}, search),
    h('button', {type:'button', className:'button outline list-options-toggle', ref:button, 'aria-expanded':open, 'aria-controls':id, onClick:() => toggle(!open)},
      h(Icon, {name:'sliders'}), 'Options', h(Icon, {name:open?'chevron-up':'chevron-down'})),
    active && h('span', {className:'list-options-active'}, 'Filters active'),
    result != null && h('span', {className:'list-options-count', role:'status'}, result),
    actions && h('div', {className:'list-options-actions'}, actions)),
    h('div', {id, hidden:!open, className:'list-options-panel'},
      children && h('div', {className:'list-options-content'}, children),
      h('div', {className:'list-options-slots', ref:hostRef})));
}
