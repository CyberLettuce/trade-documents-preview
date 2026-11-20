const empty = value => value == null || value === '' || value === '—' || value === '–';

export function nextColumnSort(current, key) {
  return {key, direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'};
}

export function columnSortState(current, key) {
  return current?.key !== key ? undefined : current.direction === 'asc' ? 'ascending' : 'descending';
}

export function sortColumnRows(rows, current, valueOf, locale = 'en-GB') {
  if (!current?.key && current?.key !== 0) return rows;
  const collator = new Intl.Collator(locale, {numeric: true, sensitivity: 'base'});
  const direction = current.direction === 'desc' ? -1 : 1;
  return rows.map(row => ({row, value: valueOf(row, current.key)})).sort((a, b) => {
    const aEmpty = empty(a.value), bEmpty = empty(b.value);
    if (aEmpty || bEmpty) return Number(aEmpty) - Number(bEmpty);
    if (typeof a.value === 'number' && typeof b.value === 'number') return (a.value - b.value) * direction;
    return collator.compare(String(a.value), String(b.value)) * direction;
  }).map(entry => entry.row);
}

export function sortableDate(value) {
  if (!value || value === '—') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sortableNumber(value) {
  if (empty(value)) return null;
  const parsed = Number(String(value).replace(/[£€$,%\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}
