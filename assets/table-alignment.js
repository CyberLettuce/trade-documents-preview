import {loadLocale} from './locale-loader.js?v=2026-11-24-danish-density-r1';

// Common column roles for the React and Vue workspaces. Match labels, never cell
// values, so dates and identifiers with digits still align with other text.
const centered = [
  'Select', 'Selection', 'Status', 'Account status', 'Application status',
  'Decision', 'Payment', 'Payment status', 'Processing', 'Claim status', 'Actions',
];
const numeric = [
  'Amount', 'Applications', 'Applications processed', 'Approved', 'Approved documents',
  'Average approval time', 'Average rejection time', 'Average time to approval',
  'Average time to rejection', 'Avg approval time', 'Avg rejection time',
  'Copies', 'Count', 'Documents processed', 'Fee', 'Fees', 'Goods value (£)', 'Gross', 'Gross total',
  'Gross weight', 'Handling time', 'Member / non-member fee', 'Net fees', 'Net weight',
  'Net', 'Net (£)', 'No. of pieces', 'Number of pieces', 'Originals', 'Pieces', 'Quantity',
  'Quantity / weight', 'Re-submission fee', 'Re-submission fee (£)', 'Rejected',
  'Rejected documents', 'Resubmission fee', 'Sample amount', 'Sample total',
  'Sample VAT', 'Sample VAT (£)', 'Submission fee', 'Submission fee (£)', 'Tax', 'Tax (%)', 'Tax rate (%)',
  'Timed applications', 'Total', 'Total (£)', 'Total documents', 'Unit price', 'Value', 'VAT',
  'VAT (20%)', 'Volume', 'Weight', 'Weight / volume',
];
const volumeLabels = ['Standard', 'eXpress', 'Other / not recorded'];
const headings = [...centered, ...numeric, ...volumeLabels, 'Action'];
const normalize = value => value?.trim().replace(/\s+/g, ' ').toLowerCase() || '';
const labels = new Map(headings.map(label => [normalize(label), label]));
const numericLabels = new Set(numeric);
const centeredLabels = new Set(centered);
const workspace = 'main, #main, #main-content, #chamber-main, [role="dialog"], dialog';
const artwork = '.paper-goods, .document-paper, .paper-document, .certificate-paper, .certificate-sheet, .document-artwork, .carnet-paper, .invoice-paper';

function labelOf(header) {
  const fullLabel = header.querySelector('.column-sort-label') || header;
  return labels.get(normalize(header.dataset.column)) || labels.get(normalize(fullLabel.textContent));
}

function roleOf(header, label, volumeTable, bodyCell) {
  if (header.dataset.columnAlign) return header.dataset.columnAlign;
  if (centeredLabels.has(label) || (!header.textContent.trim() && header.querySelector('input[type="checkbox"]'))) return 'center';
  // Audit log actions are written descriptions. Queue actions are controls.
  if (label === 'Action' && (!bodyCell || bodyCell.querySelector('button, a, [role="button"]'))) return 'center';
  if (numericLabels.has(label) || (volumeTable && volumeLabels.includes(label))) return 'end';
  return 'start';
}

function alignTable(table) {
  if (!table.isConnected || !table.closest(workspace) || table.closest(artwork)) return;
  const header = table.tHead?.rows[table.tHead.rows.length - 1];
  if (!header || Array.from(header.cells).some(cell => cell.colSpan > 1)) return;

  const columnLabels = Array.from(header.cells, labelOf);
  const volumeTable = ['Standard', 'eXpress', 'Total'].every(label => columnLabels.includes(label));
  const example = Array.from(table.tBodies).map(body => body.rows[0]).find(row => row?.cells.length === header.cells.length);
  const roles = Array.from(header.cells, (cell, index) => roleOf(cell, columnLabels[index], volumeTable, example?.cells[index]));
  for (const row of table.rows) {
    let column = 0;
    for (const cell of row.cells) {
      // Summary rows may use one label cell spanning several columns.
      const align = cell.colSpan === 1 ? roles[column] || 'start' : 'start';
      if (cell.dataset.tableAlign !== align) cell.dataset.tableAlign = align;
      column += cell.colSpan;
    }
  }
}

const pending = new Set();
let frame = 0;
function flush() {
  frame = 0;
  pending.forEach(alignTable);
  pending.clear();
}
function queue(table) {
  if (table) pending.add(table);
  if (pending.size && !frame) frame = requestAnimationFrame(flush);
}
function queueAll() {
  document.querySelectorAll('table').forEach(queue);
}

const loadedLanguages = new Set(['en']);
async function alignLanguage() {
  const language = document.documentElement.lang;
  if (!loadedLanguages.has(language)) {
    try {
      const dictionary = await loadLocale(language);
      for (const label of headings) {
        const entry = dictionary[label] || dictionary[label.toLowerCase()];
        if (entry && !labels.has(normalize(entry))) labels.set(normalize(entry), label);
      }
      loadedLanguages.add(language);
    } catch {
      // The application's language selector reports locale loading errors.
    }
  }
  queueAll();
}

const observer = new MutationObserver(mutations => {
  for (const {target, type, addedNodes} of mutations) {
    if (type === 'attributes') {
      void alignLanguage();
      continue;
    }
    const element = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
    if (type === 'childList' || element?.closest('thead')) queue(element?.closest('table'));
    for (const node of addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches('table')) queue(node);
      node.querySelectorAll('table').forEach(queue);
    }
  }
});
observer.observe(document.body, {subtree:true, childList:true, characterData:true});
observer.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
void alignLanguage();
