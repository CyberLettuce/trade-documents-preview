import {ref} from './assets/vue.esm-browser.prod.js?v=2026-11-20-acceptance-r1';
import {nextColumnSort, columnSortState, sortColumnRows} from '../assets/chamber-column-sort.js?v=2026-11-20-column-sort-r1';

export function useColumnSort(valueOf = (row, key) => row[key], onChange) {
  const order = ref(null);
  return {
    state: key => columnSortState(order.value, key),
    toggle(key) {order.value = nextColumnSort(order.value, key);onChange?.();},
    reset() {order.value = null;},
    rows(rows) {return sortColumnRows(rows, order.value, valueOf, document.documentElement.lang || 'en-GB');},
  };
}

export const SortHeading = {
  props: {sort: Object, column: [String, Number], enabled: {type: Boolean, default: true}},
  template: `<th scope="col" :aria-sort="enabled?sort.state(column):undefined"><button v-if="enabled" type="button" class="column-sort-button" @click="sort.toggle(column)"><span><slot/></span><Icon :name="sort.state(column)==='ascending'?'sortAscending':sort.state(column)==='descending'?'sortDescending':'sortColumn'"/></button><slot v-else/></th>`,
};
