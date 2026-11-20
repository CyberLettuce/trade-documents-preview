import {fieldHelp} from './field-help.js?v=2026-11-20-vertical-review-r2';
import {prepareImport, csvColumns} from './general-list-logic-review1-2136caa2.js?v=2026-11-20-acceptance-r1';

export function carnetApplicant(record, signatories) {
  const key = record.exporterSignatory;
  return record.applicantSignatory || signatories.find(person => person.id === key || person.name === key)?.name || '';
}

export async function readCarnetGeneralList(file, parse, newId, origin) {
  if (!/\.csv$/i.test(file.name)) throw Error('Choose a CSV file.');
  if (file.size > 5 * 1024 * 1024) throw Error('Choose a CSV smaller than 5 MB.');
  const rows = parse(await file.text());
  if (rows.length > 1000) throw Error('Import up to 1,000 items at a time.');
  if (!rows.length) throw Error('The CSV has no items. Add at least one row below the headings.');
  const items = rows.map((row, index) => {
    const heading = Object.entries(row).some(([key, value]) =>
      key.trim().toLowerCase() === 'heading' && /^(yes|true|1)$/i.test(String(value).trim()));
    if (heading) {
      const description = Object.entries(row).find(([key]) => /^(description|descriptionofgoods|tradedescription)$/i.test(key.replace(/\W/g, '')))?.[1]?.trim();
      if (!description) throw Error('Row ' + (index + 2) + ': enter a description for the heading.');
      return {id: newId(), description, heading: true, pieces: 0, weight: 0, value: 0, origin: '', unit: '', price: 0, commodity: ''};
    }
    try {
      return prepareImport([row], newId, origin)[0];
    } catch (error) {
      throw Error(error.message.replace(/^Row 2:/, 'Row ' + (index + 2) + ':'));
    }
  });
  if (items.every(item => item.heading)) throw Error('Add at least one goods item to the General List.');
  return items;
}

export function carnetGeneralListCsv(items) {
  const columns = items.some(item => item.heading) ? [...csvColumns, 'heading'] : csvColumns;
  const cell = value => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
  return '\uFEFF' + [columns, ...items.map(item => columns.map(column => column === 'heading' ? (item.heading ? 'Yes' : '') : item[column]))]
    .map(row => row.map(cell).join(',')).join('\r\n');
}

export function renderChamberCarnet(node, {record, applicant, expiry, formatDate, writable, uploading, message, icon, update, upload, download, notify}) {
  const fact = (label, value, preserve = false, copyable = false) => {
    const hasValue = value !== '' && value != null;
    const canCopy = copyable && hasValue;
    const copyLabel = 'Copy ' + label;
    return node('dl', {class: 'chamber-carnet-fact'},
      node('dt', {}, label),
      node('dd', {class: canCopy ? 'chamber-carnet-copy-value' : undefined},
        node('span', {translate: preserve ? 'no' : undefined}, hasValue ? value : '—'),
        canCopy ? node('button', {type: 'button', class: 'icon-button chamber-carnet-copy',
          title: copyLabel, 'aria-label': copyLabel, onClick: async () => {
            try {
              await navigator.clipboard.writeText(String(value));
              notify(label + ' copied.');
            } catch {
              notify('Clipboard unavailable. Select and copy the value manually.');
            }
          }}, icon('copy')) : null));
  };
  const field = (label, value, onChange) => writable
    ? node('label', {class: 'chamber-carnet-input'},
      node('span', {}, label, node('span', {class: 'field-help-mark', 'aria-hidden': true, 'data-tip': fieldHelp(label)}, '?')),
      node('input', {type: 'text', value: value ?? '', placeholder: 'Not recorded', 'data-tip': fieldHelp(label),
        spellCheck: false, autoComplete: 'off', onInput: event => onChange(event.target.value)}))
    : fact(label, value, true);
  const multipleUses = Array.isArray(record.use);
  const use = multipleUses ? record.use.join(', ') : record.use;
  return node('section', {class: 'chamber-carnet-application', 'aria-label': 'ATA Carnet application details'},
    node('h3', {}, 'ATA Carnet details'),
    node('div', {class: 'chamber-carnet-fields'},
      fact('Signatory (Applicant)', applicant, true),
      fact('Formal Undertaking Expiry Date', expiry ? formatDate(expiry) : ''),
      fact('Mercury Carnet ID', record.eCarnetId ?? record.ecarnetId, true, true),
      fact('Mercury Carnet PIN', record.eCarnetPin ?? record.ecarnetPin, true, true),
      field('Goods Type', record.goodsType, value => update('goodsType', value)),
      field('Intended Use of Goods', use, value => update('use', multipleUses ? value.split(', ') : value))),
    node('div', {class: 'chamber-carnet-list-actions'},
      node('strong', {}, 'General List'),
      node('div', {class: 'button-row'},
        node('button', {type: 'button', class: 'button outline small', 'aria-label': 'Download General List CSV', onClick: download},
          icon('download'), 'Download CSV'),
        writable ? node('label', {class: 'button outline small file-inline chamber-list-upload'},
          icon('upload'), uploading ? 'Reading…' : 'Upload CSV',
          node('input', {type: 'file', accept: '.csv,text/csv', disabled: uploading, 'aria-label': 'Upload General List CSV', onChange: upload})) : null)),
    message ? node('p', {class: 'field-error', role: 'alert'}, message) : null);
}
