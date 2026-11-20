export const SAMPLE_DRAFTS_VERSION = 1;
const documents = [
  ['coo', 'UK Certificate of Origin', 'Germany'],
  ['arab', 'Arab Certificate of Origin', 'Saudi Arabia'],
  ['eur', 'EUR1', 'Switzerland'],
  ['eurmed', 'EUR-MED', 'Norway'],
  ['ata', 'ATA Carnet', 'Germany'],
  ['iic', 'Import certificate', 'United States of America'],
  ['invoice', 'Commercial invoice', 'France'],
  ['upload', 'Uploaded document', 'Germany']
];

export function sampleDocumentDrafts(account, at = new Date().toISOString()) {
  return documents.map(([code, document, destination]) => ({
    id: 'sample-draft-20261117-' + code, sample: true,
    reference: 'DRAFT-SAMPLE-' + code.toUpperCase(), yourReference: 'SAMPLE-' + code.toUpperCase() + '-2026',
    accountId: account.id, document, documents: [document], status: 'Draft',
    exporter: account.name, exporterAddress: account.address,
    consignee: 'Sample Exhibition & Trading Co.', consigneeAddress: '10 Exhibition Avenue\n' + destination,
    destination, service: 'Standard', certificate: '', owner: '', signatory: '',
    submittedAt: null, updatedAt: at, paid: false, priority: false, confirmed: false, ataConfirmed: false,
    files: document === 'Uploaded document' ? [{id: 'sample', name: 'stamp-sample.pdf', type: 'application/pdf', stamp: 'none'}] : [],
    origin: 'United Kingdom', originBasis: ['The goods were manufactured by us in the United Kingdom.'],
    manufacturersText: 'Sample Manufacturing Ltd\nBristol, United Kingdom', foreignEvidence: 'Manufacturer declaration',
    transport: 'Road', place: 'Bristol', gross: 12, net: 10, weightUnit: 'Kilogram', packages: '4 cartons',
    goods: 'Laptop computers and demonstration equipment (sample)',
    items: [{id: 'sample-item-' + code, description: 'Laptop computer for demonstration (SAMPLE)', pieces: 4, unit: 'Kilogram', weight: 12, value: 4000, origin: 'United Kingdom', packages: '4 cartons', marks: 'SAMPLE 1–4', commodity: '847130', price: 1000, heading: false}],
    invoices: [{id: 'sample-invoice-' + code, number: 'INV-SAMPLE-2026', date: at.slice(0, 10)}],
    invoiceNumber: 'INV-SAMPLE-2026', invoiceDate: at.slice(0, 10), currency: 'GBP', buyer: 'Sample Trading Co.', buyerAddress: '10 Exhibition Avenue\n' + destination,
    representative: 'Alex Morgan', representativeAddress: '18 Harbour Road, Bristol', use: 'Professional equipment',
    trips: [{id: 'sample-trip-' + code, country: 'European Union', visits: 1, transits: 0}],
    security: 'Aviva guarantee', securityAmount: 4000, cumulation: 'No cumulation applied',
    endUse: 'Demonstration equipment', importValue: 4000, sterling: 4000, supplier: 'Sample Equipment Ltd', supplierAddress: 'Bristol, United Kingdom', importStatuses: ['Authorised Signatory'],
    stamp: document === 'Arab Certificate of Origin' ? 'uploaded' : 'none', stampReference: document === 'Arab Certificate of Origin' ? 'SAMPLE-STAMP' : '',
    evidence: 'upload', evidenceDetails: 'Sample application for exploring the document flow.',
    visited: [], editorStep: 'setup', history: [{title: 'Sample draft created', at}]
  }));
}

// One-time additive migration: edits, deletions and submitted samples stay as the user left them.
export function addDocumentDrafts(saved, account) {
  if (saved.sampleDraftsVersion >= SAMPLE_DRAFTS_VERSION) return saved;
  const records = saved.records || [], ids = new Set(records.map(r => r.id));
  const samples = sampleDocumentDrafts(account), ata = samples.find(r => r.document === 'ATA Carnet');
  samples.push({...ata,id:'sample-completed-carnet-20261117',reference:'DEM0053204/917000001/N',yourReference:'SAMPLE-COMPLETED-ATA',status:'Approved',certificate:'sampleata1',paid:true,owner:'Alex Morgan',signatory:'Alex Morgan',submittedAt:new Date(Date.parse(ata.updatedAt)-75*60000).toISOString(),decidedAt:ata.updatedAt,decisionBy:'Alex Morgan',eCarnetId:'DEMO-ATA-2026-001',eCarnetPin:'482615',eCarnetStatus:'Issued',history:[{title:'Sample carnet approved',at:ata.updatedAt}]});
  const drafts = samples.filter(r => !ids.has(r.id));
  return {...saved, records: [...drafts, ...records], sampleDraftsVersion: SAMPLE_DRAFTS_VERSION};
}
