import {r as React, I as Icon} from './index-Cj32ATD7-review1-d3188122-nochecklist1-options1-sidebar1-editorcol1.js?v=2026-11-24-dashboard-image-size-r1';
import {languageCreateElement as h} from './language-runtime-review1-57775012.js?v=2026-11-20-acceptance-r1';
import {nextColumnSort, columnSortState, sortColumnRows, sortableDate, sortableNumber} from './chamber-column-sort.js?v=2026-11-20-chamber-tables-r1';

export function useChamberColumnSort(valueOf, onChange) {
  const [order, setOrder] = React.useState(null);
  return {
    order,
    reset: () => setOrder(null),
    toggle(key) {setOrder(current => nextColumnSort(current, key));onChange?.();},
    rows(rows) {return sortColumnRows(rows, order, valueOf, document.documentElement.lang || 'en-GB');},
  };
}

export function sortHeader(label, sort, key, attributes = {}, shortLabel) {
  if (!sort || /^(action|actions|select)$/i.test(label)) return h('th', {scope: 'col', ...attributes}, label);
  const direction = columnSortState(sort.order, key);
  return h('th', {scope: 'col', ...attributes, 'aria-sort': direction},
    h('button', {type: 'button', className: 'column-sort-button', onClick: () => sort.toggle(key)},
      h('span', {className: shortLabel ? 'column-sort-label' : undefined}, label),
      shortLabel && h('span', {className: 'column-sort-label-short', 'aria-hidden': true}, shortLabel),
      h(Icon, {name: direction === 'ascending' ? 'arrow-up' : direction === 'descending' ? 'arrow-down' : 'arrow-down-up', 'aria-hidden': true})));
}

function cellText(cell) {
  if (cell == null || typeof cell === 'boolean') return '';
  if (typeof cell === 'string' || typeof cell === 'number') return cell;
  if (Array.isArray(cell)) return cell.map(cellText).join(' ').trim();
  const props = cell.props;
  if (!props) return '';
  if (props.app?.status) return props.app.autoAccepted ? 'Auto Accepted' : props.app.status;
  if (props.status) return props.status;
  if (props.type === 'number') return props.value;
  if (props.src) return 'Available';
  if (props.value != null && typeof props.value !== 'object') return props.value;
  return cellText(props.children);
}

export function renderedRowValue(row, index, label) {
  const cell = React.Children.toArray(row.props.children)[index];
  const value = cellText(cell);
  if (/\b(date|updated|submitted|undertaking)\b/i.test(label)) return sortableDate(value);
  if (/\b(fee|tax|value|weight|pieces|originals|copies)\b/i.test(label)) {
    const amount = String(value).match(/[-£€$]?\s*\d[\d,.]*/)?.[0];
    return sortableNumber(amount);
  }
  return value;
}
