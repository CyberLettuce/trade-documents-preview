import test from 'node:test';
import assert from 'node:assert/strict';
import {nextColumnSort, sortColumnRows, sortableDate, sortableNumber} from '../../assets/chamber-column-sort.js';

test('column sorting keeps the source order intact and puts missing values last in either direction', () => {
  const rows = [{id: 'missing', date: ''}, {id: 'newer', date: '2026-12-04'}, {id: 'older', date: '2026-02-21'}];
  const ascending = nextColumnSort(null, 'date');
  const descending = nextColumnSort(ascending, 'date');
  const sorted = order => sortColumnRows(rows, order, row => sortableDate(row.date)).map(row => row.id);
  assert.deepEqual(sorted(ascending), ['older', 'newer', 'missing']);
  assert.deepEqual(sorted(descending), ['newer', 'older', 'missing']);
  assert.deepEqual(rows.map(row => row.id), ['missing', 'newer', 'older']);
});

test('numeric totals and references sort naturally with stable ties', () => {
  const rows = [{id: 'REF-11', value: '£2.50'}, {id: 'REF-9', value: '£2.50'}, {id: 'REF-3', value: '£1,000.00'}];
  const order = nextColumnSort(null, 'value');
  assert.deepEqual(sortColumnRows(rows, order, row => sortableNumber(row.value)), rows);
  assert.deepEqual(sortColumnRows(rows, nextColumnSort(order, 'id'), row => row.id).map(row => row.id), ['REF-3', 'REF-9', 'REF-11']);
});
