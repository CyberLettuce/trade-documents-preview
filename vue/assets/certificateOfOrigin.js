// Box-by-box certificates ("Certificate details"): the UK Certificate of Origin, the Arab Certificate of Origin and
// the EUR1 movement certificate. One place for their sections, printed wording and requirements, shared by the
// editor, the preview and validation. The UK and Arab certificates cannot be chosen together
// (src/documentSelection.js). EUR1 can be chosen alongside either: the form then follows that certificate's boxes
// and adds the EUR1-only screens (EUR1_EXTRA_SECTIONS); exporter, consignee, goods, weights and place are shared.

export const isCertificateOfOrigin = form => (form?.docs || []).includes('coo');
export const isArabCertificate = form => !isCertificateOfOrigin(form) && (form?.docs || []).includes('arab');
export const hasEur1 = form => (form?.docs || []).includes('eur');
/** 'coo', 'arab', 'eur' (EUR1 on its own) or '' (no box layout). */
export const certificateKind = form => isCertificateOfOrigin(form) ? 'coo' : isArabCertificate(form) ? 'arab' : hasEur1(form) ? 'eur' : '';
/** EUR1 alongside the UK or Arab certificate. */
export const isCombinedEur1 = form => hasEur1(form) && ['coo', 'arab'].includes(certificateKind(form));
export const isBoxCertificate = form => !!certificateKind(form);

export const CERTIFICATE_SECTIONS = [
  ['parties', 'Box 1 – Exporter', 'building'],
  ['consignee', 'Box 2 – Consignee', 'person'],
  ['originCountry', 'Box 3 – Country of Origin', 'globe2'],
  ['transport', 'Box 4 – Transport Details', 'truck'],
  ['remarks', 'Box 5 – Remarks', 'pencil'],
  ['goods', 'Box 6 – General Description', 'box-seam'],
  ['quantities', 'Box 7 – Quantities', 'list'],
  ['place', 'Box 8 – Place', 'geo-alt'],
  ['origin', 'Reverse – Origin Declaration', 'file-earmark-check'],
  ['manufacturers', 'Reverse – Manufacturers', 'buildings'],
  ['evidence', 'Supporting Evidence', 'paperclip'],
];

/** Fields each section owns, so errors can open the right screen. */
export const CERTIFICATE_SECTION_FIELDS = {
  parties: ['exporter', 'exporterAddress'],
  consignee: ['consignee', 'consigneeAddress'],
  originCountry: ['originCountries', 'origin'],
  transport: [],
  remarks: ['replacementReference', 'replacementChamber', 'replacementIssueDate', 'remarks'],
  goods: ['goods', 'shippingMarks', 'packages', 'additionalGoods', 'goodsFit', 'invoices'],
  quantities: ['quantity', 'gross', 'net', 'cube', 'weightUnit', 'netUnit', 'cubeUnit'],
  place: ['place'],
  origin: ['originBasis', 'cumulationCountry'],
  manufacturers: ['manufacturers'],
  evidence: ['evidence', 'files', 'evidenceDetails', 'stamp', 'stampReference', 'stampSignatory'],
};

export const CERTIFICATE_SECTION_TITLES = {
  parties: 'Complete Box 1', consignee: 'Complete Box 2', originCountry: 'Choose the country of origin', transport: 'Check transport details',
  remarks: 'Complete the replacement details', goods: 'Complete the general description', quantities: 'Add a quantity',
  place: 'Add the place', origin: 'Choose an origin declaration', manufacturers: 'Add a manufacturer', evidence: 'Choose how evidence is provided',
};

// Arab Certificate of Origin, agreed box by box with the user (20 October 2026). Box 4 (consignor's
// reference), 9 and 10 are not asked for: the reference comes from Setup, the rest are the chamber's.
export const ARAB_SECTIONS = [
  ['parties', 'Box 1 – Consignor', 'building'],
  ['consignee', 'Box 2 – Consignee', 'person'],
  ['transport', 'Box 3 – Method of Transport', 'truck'],
  ['originCountry', 'Box 5 – Originated In', 'globe2'],
  ['goods', 'Box 6 – General Description', 'box-seam'],
  ['manufacturers', 'Box 6 – Manufacturer(s)', 'buildings'],
  ['applicant', 'Box 7 – Applicant', 'people'],
  ['place', 'Box 8 – Place and Date', 'geo-alt'],
  ['remarks', 'Box 11 – Remarks', 'pencil'],
  ['evidence', 'Supporting Evidence', 'paperclip'],
  ['foreignEvidence', 'Foreign Origin Evidence', 'file-earmark-check'],
];
export const ARAB_SECTION_FIELDS = {
  parties: ['exporter', 'exporterAddress'],
  consignee: ['consignee', 'consigneeAddress'],
  transport: [],
  originCountry: ['originCountries', 'origin'],
  goods: [...CERTIFICATE_SECTION_FIELDS.goods, ...CERTIFICATE_SECTION_FIELDS.quantities],
  manufacturers: ['manufacturers'],
  applicant: ['applicant', 'applicantAddress'],
  place: ['place'],
  remarks: ['remarks'],
  evidence: CERTIFICATE_SECTION_FIELDS.evidence,
  foreignEvidence: ['foreignEvidence', 'foreignEvidenceFiles', 'foreignEvidenceDetails'],
};
export const ARAB_SECTION_TITLES = {
  ...CERTIFICATE_SECTION_TITLES, transport: 'Check the method of transport', originCountry: 'Choose where the goods originated',
  goods: 'Complete the general description and quantities', applicant: 'Check the applicant', remarks: 'Check the remarks',
  foreignEvidence: 'Choose how foreign origin evidence is provided',
};

// EUR1 movement certificate, agreed box by box with the user (20 October 2026). Box 2, 4, 5 and 11 are not asked
// for: Box 2 and 5 print the destination country chosen with the consignee, Box 4 always prints "UK" and
// Box 11 is for customs.
export const EUR1_SECTIONS = [
  ['parties', 'Box 1 – Exporter', 'building'],
  ['consignee', 'Box 3 – Consignee', 'person'],
  ['eurTransport', 'Box 6 – Transport Details', 'truck'],
  ['eurRemarks', 'Box 7 – Remarks', 'pencil'],
  ['goods', 'Box 8 – General Description', 'box-seam'],
  ['eurWeight', 'Box 9 – Gross Weight or Other Measure', 'list'],
  ['eurInvoices', 'Box 10 – Invoices', 'receipt'],
  ['place', 'Box 12 – Place', 'geo-alt'],
  ['evidence', 'Supporting Evidence', 'paperclip'],
];
/** Added before Supporting Evidence when EUR1 is chosen with the UK or Arab certificate. */
export const EUR1_EXTRA_SECTIONS = [
  ['eurTransport', 'EUR1 Box 6 – Transport Details', 'truck'],
  ['eurRemarks', 'EUR1 Box 7 – Remarks', 'pencil'],
  ['eurInvoices', 'EUR1 Box 10 – Invoices', 'receipt'],
];
const EUR1_ONLY_FIELDS = {
  eurTransport: [],
  eurRemarks: ['eurRemarksType', 'eurOriginalSerial', 'eurSubmissionDate', 'eurIssueDate', 'eurIssuingCountry', 'eurReplacementReason'],
  eurInvoices: [],
};
export const EUR1_SECTION_FIELDS = {
  parties: ['exporter', 'exporterAddress'],
  consignee: ['consignee', 'consigneeAddress'],
  ...EUR1_ONLY_FIELDS,
  goods: ['goods', 'shippingMarks', 'packages', 'additionalGoods', 'goodsFit'],
  eurWeight: ['eurWeight', 'gross', 'cube', 'weightUnit', 'cubeUnit'],
  place: ['place'],
  evidence: CERTIFICATE_SECTION_FIELDS.evidence,
};
const EUR1_TITLES = {
  eurTransport: 'Check the EUR1 transport details', eurRemarks: 'Complete the EUR1 remarks', eurInvoices: 'Check the EUR1 invoices',
  eurWeight: 'Add a gross weight or other measure',
};
export const EUR1_SECTION_TITLES = {...CERTIFICATE_SECTION_TITLES, ...EUR1_TITLES, consignee: 'Check Box 3', goods: 'Complete the general description', place: 'Add the place'};

const baseSections = form => ({arab: ARAB_SECTIONS, eur: EUR1_SECTIONS}[certificateKind(form)] || CERTIFICATE_SECTIONS);
export function certificateSections(form) {
  const base = baseSections(form);
  if (!isCombinedEur1(form)) return base;
  const at = base.findIndex(([id]) => id === 'evidence');
  return [...base.slice(0, at), ...EUR1_EXTRA_SECTIONS, ...base.slice(at)];
}
export function certificateSectionFields(form) {
  const kind = certificateKind(form);
  const base = {arab: ARAB_SECTION_FIELDS, eur: EUR1_SECTION_FIELDS}[kind] || CERTIFICATE_SECTION_FIELDS;
  return isCombinedEur1(form) ? {...base, ...EUR1_ONLY_FIELDS} : base;
}
export function certificateSectionTitles(form) {
  const kind = certificateKind(form);
  const base = {arab: ARAB_SECTION_TITLES, eur: EUR1_SECTION_TITLES}[kind] || CERTIFICATE_SECTION_TITLES;
  return isCombinedEur1(form) ? {...base, ...EUR1_TITLES} : base;
}

// EUR1 Box 7 templates. Starred details are required and fill the printed wording.
export const EUR1_REMARK_TEMPLATES = ['None', 'Duplicate', 'Issued Retrospectively', 'Replacement', 'Replacement of Duplicate', 'Replacement of Retrospective', 'Duplicate of Retrospective'];
export const EUR1_REPLACEMENT_REASONS = ['Attachment', 'Post or Courier']; // two options (user, 20 October 2026)
const isDuplicate = type => type === 'Duplicate' || type === 'Duplicate of Retrospective';
const isReplacement = type => String(type || '').startsWith('Replacement');
/** Which details a template asks for. */
export function eur1RemarkFields(type) {
  if (isDuplicate(type)) return ['eurOriginalSerial', 'eurSubmissionDate', 'eurIssueDate'];
  if (isReplacement(type)) return ['eurOriginalSerial', 'eurIssueDate', 'eurIssuingCountry', 'eurReplacementReason'];
  return [];
}
/** What EUR1 Box 7 prints for the chosen template. */
export function eur1Remarks(f) {
  const type = f.eurRemarksType || 'None';
  const serial = String(f.eurOriginalSerial || '').trim() || BLANK;
  const issued = ukDate(f.eurIssueDate) || BLANK;
  if (isDuplicate(type)) {
    const lines = ['DUPLICATE', '', `Original Certificate Serial Number: ${serial}`, `Original Certificate Issue Date: ${issued}`];
    return (type === 'Duplicate of Retrospective' ? [...lines, 'ISSUED RETROSPECTIVELY'] : lines).join('\n');
  }
  if (type === 'Issued Retrospectively') return 'ISSUED RETROSPECTIVELY';
  if (isReplacement(type)) {
    const kind = {'Replacement of Duplicate': 'duplicate ', 'Replacement of Retrospective': 'retrospective '}[type] || '';
    return `Replacement of ${kind}EUR1 No ${serial} dated ${issued} issued in ${String(f.eurIssuingCountry || '').trim() || BLANK}`;
  }
  return '';
}
/** Box 12 shows the original submission date on a duplicate. */
export const eur1SubmissionDate = f => isDuplicate(f.eurRemarksType) ? ukDate(f.eurSubmissionDate) : '';
export const EUR1_MIXED_CONSIGNMENT = 'Goods marked with * on the invoice are non-originating and are not covered by this EUR1 certificate.';

function eur1Errors(f) {
  const e = {}, type = f.eurRemarksType || 'None', need = eur1RemarkFields(type);
  if (!EUR1_REMARK_TEMPLATES.includes(type)) e.eurRemarksType = 'Choose a remarks template.';
  if (need.includes('eurOriginalSerial') && blank(f.eurOriginalSerial)) e.eurOriginalSerial = 'Original certificate serial number is required.';
  if (need.includes('eurIssueDate') && blank(f.eurIssueDate)) e.eurIssueDate = 'Certificate issue date is required.';
  if (need.includes('eurIssuingCountry') && blank(f.eurIssuingCountry)) e.eurIssuingCountry = 'Issuing country is required.';
  return e;
}

export const TRANSPORT_OPTIONS = ['By Road', 'By Air', 'By Sea', 'By Rail'];

/** Maps older free-text transport (e.g. "Road freight") onto the dropdown; unknown text gives ''. */
export function transportChoice(value) {
  const text = String(value || '').trim();
  if (TRANSPORT_OPTIONS.includes(text)) return text;
  if (/\b(road|lorry|truck|van)\b/i.test(text)) return 'By Road';
  if (/\b(air|flight|plane)\b/i.test(text)) return 'By Air';
  if (/\b(sea|vessel|ship|ocean|ferry)\b/i.test(text)) return 'By Sea';
  if (/\b(rail|train)\b/i.test(text)) return 'By Rail';
  return '';
}

export const REMARKS_TEMPLATES = ['None', 'Enter own text', 'Replacement'];

/** DD/MM/YYYY from an ISO date (or ''); the format printed on the certificate. */
export function ukDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

const BLANK = '____';
export function replacementRemark(f) {
  const serial = String(f.replacementReference || '').trim().toUpperCase() || BLANK;
  const chamber = String(f.replacementChamber || '').trim().toUpperCase() || BLANK;
  const date = ukDate(f.replacementIssueDate) || BLANK;
  return `THIS CERTIFICATE CANCELS AND REPLACES CERTIFICATE OF ORIGIN NO. ${serial} ISSUED BY ${chamber} ON ${date}`;
}

/** What the remarks box prints: UK Box 5 follows the chosen template; Arab Box 11 is free text. */
export function certificateRemarks(f) {
  if (certificateKind(f) === 'arab') return f.remarks || '';
  if (f.remarksType === 'Replacement') return replacementRemark(f);
  if (f.remarksType === 'None') return '';
  return f.remarks || '';
}

/** "AS PER INVOICE NUMBER 123 DATED 14/10/2026", one line per invoice, as printed in Box 6. */
export function invoiceLine(row, uppercase = false) {
  const number = String(row.number || '').trim();
  return `AS PER INVOICE NUMBER ${uppercase ? number.toUpperCase() : number} DATED ${ukDate(row.date) || BLANK}`;
}

export const ORIGIN_STATEMENTS = [
  {value: 'Wholly produced in the United Kingdom', text: 'The goods were manufactured/produced (delete as appropriate) in the United Kingdom wholly from United Kingdom materials or components by the company named below.'},
  {value: 'Substantially processed in the United Kingdom', text: 'The goods whilst not comprised wholly of United Kingdom components or materials, are entitled to be considered as of United Kingdom origin by virtue of the economically justified substantial process which has occurred in the United Kingdom, as indicated below.'},
  {value: 'Foreign origin supported by evidence', text: 'The goods are of foreign origin as proved by the documents attached to this application as per Standard Rules (e.g. foreign certificate of origin, certified invoice, customs declaration or other documents).'},
];
export const originStatementText = value => ORIGIN_STATEMENTS.find(item => item.value === value)?.text || value;

/** Country list for Box 3: the saved list, or the older origin + comma-separated extras. */
export function originCountries(f) {
  if (Array.isArray(f.originCountries)) return f.originCountries.filter(Boolean);
  const extra = String(f.additionalOrigins || '').split(',').map(item => item.trim()).filter(Boolean);
  return [...new Set([f.origin, ...extra].filter(Boolean))];
}

/** Box 5 of the Arab certificate, as on the user's example: "United Kingdom & Bangladesh, Panama." */
export function arabOriginText(f) {
  const [first, ...rest] = originCountries(f);
  if (!first) return '';
  return rest.length ? `${first} & ${rest.join(', ')}.` : first;
}

/** Keeps the older single-value fields in step for screens and documents that still read them. */
export const originPatch = countries => ({originCountries: countries, origin: countries[0] || '', additionalOrigins: countries.slice(1).join(', ')});

const singleLine = text => String(text || '').split(/\n+/).map(part => part.trim().replace(/,$/, '')).filter(Boolean).join(', ');

/** Selected saved manufacturers, then ones added only to this application. */
export function manufacturerEntries(f, saved = []) {
  const snapshot = f.manufacturersChosen || [];
  const chosen = (f.manufacturerIds || []).map(id => saved.find(item => item.id === id) || snapshot.find(item => item.id === id)).filter(Boolean).map(item => ({id: item.id, name: item.name, address: item.address || '', source: 'saved'}));
  return [...chosen, ...(f.manufacturersAdded || []).map(item => ({...item, source: 'added'}))];
}

/** Text printed for the manufacturers: "Name, address, lines." per manufacturer, then any free text. */
export function manufacturerPrintText(f, saved = []) {
  const lines = manufacturerEntries(f, saved).map(item => singleLine([item.name, item.address].filter(Boolean).join('\n')) + '.');
  const extra = String(f.manufacturersText || '').trim();
  return [...lines, ...(extra ? [extra] : [])].join('\n');
}

export const EVIDENCE_OPTIONS = [
  {value: 'upload', label: 'Uploaded with this application', description: 'Attach PDFs now. You can ask for a document to be stamped.'},
  {value: 'post', label: 'Sent by post/courier or delivered by hand', description: 'Send the documents to your chamber with your reference.'},
  {value: 'other', label: 'Other arrangement', description: 'Tell your chamber how the documents will reach them.'},
];
export const STAMP_OPTIONS = [
  {value: 'none', label: 'No stamp required'},
  {value: 'uploaded', label: 'Uploaded document requires stamp'},
  {value: 'original', label: 'Original document requires stamp'},
];
// Arab certificate only: how evidence of origin is provided for goods the consignor did not make (user, 20 October 2026).
export const FOREIGN_EVIDENCE_OPTIONS = [
  {value: 'not-required', label: 'Not required – Same exporter and manufacturer'},
  {value: 'upload', label: 'Uploaded as part of application', description: 'Attach PDFs now.'},
  {value: 'on-file', label: 'Evidence held on file at Chamber of Commerce'},
  {value: 'other', label: 'Other arrangement, please specify'},
];
export const foreignEvidenceLabel = value => FOREIGN_EVIDENCE_OPTIONS.find(option => option.value === value)?.label || '';
export const stampNeeded = f => f.evidence === 'upload' && ['uploaded', 'original'].includes(f.stamp);

export const PDF_LIMIT_BYTES = 10 * 1024 * 1024;
/** Accepts PDFs of 10 MB or less; returns the accepted names and a message for each refused file. */
export function checkEvidenceFiles(files) {
  const accepted = [], refused = [];
  for (const file of files) {
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf) refused.push(`${file.name} is not a PDF. Save it as a PDF and add it again.`);
    else if (file.size > PDF_LIMIT_BYTES) refused.push(`${file.name} is larger than 10 MB. Reduce its size and add it again.`);
    else accepted.push(file.name);
  }
  return {accepted, refused};
}

const blank = value => !String(value ?? '').trim();

/** Requirements for the box-by-box certificates (UK and Arab). */
export function certificateErrors(f, {signatories} = {}) {
  const e = {}, arab = certificateKind(f) === 'arab', eurOnly = certificateKind(f) === 'eur';
  if (hasEur1(f)) Object.assign(e, eur1Errors(f));
  if (eurOnly) {
    // EUR1 on its own: optional consignee, transport and invoices; Box 9 needs a gross weight or a cube.
    if (blank(f.gross) && blank(f.cube)) e.eurWeight = 'Enter a total gross weight or a total cube.';
  } else {
  if (!originCountries(f).length) e.originCountries = arab ? 'Choose at least one country the goods originated in.' : 'Choose at least one country of origin.';
  if (!arab && f.remarksType === 'Replacement') {
    if (blank(f.replacementReference)) e.replacementReference = 'Original certificate serial number is required.';
    if (blank(f.replacementChamber)) e.replacementChamber = 'Original issuing chamber name is required.';
    if (blank(f.replacementIssueDate)) e.replacementIssueDate = 'Original certificate issue date is required.';
  }
  if (!(f.invoices || []).some(row => !blank(row.number))) e.invoices = 'Add at least one invoice number and date.';
  if (blank(f.gross) && blank(f.net) && blank(f.cube) && blank(f.quantity)) e.quantity = 'Enter at least one: total gross, total net, total cube or quantity.';
  if (!(f.manufacturerIds || []).length && !(f.manufacturersAdded || []).length && blank(f.manufacturersText)) e.manufacturers = 'Add at least one manufacturer.';
  }
  if (blank(f.place)) e.place = 'Place is required.';
  if (!EVIDENCE_OPTIONS.some(option => option.value === f.evidence)) e.evidence = 'Choose how the documents will be provided.';
  if (f.evidence === 'upload') {
    if (!(f.files || []).length) e.files = 'Add at least one PDF, or choose another way to provide the documents.';
    if (!STAMP_OPTIONS.some(option => option.value === f.stamp)) e.stamp = 'Choose whether a document needs a stamp.';
  }
  if (stampNeeded(f)) {
    if (blank(f.stampReference)) e.stampReference = 'Reference is required for a stamped document.';
    if (blank(f.stampSignatory)) e.stampSignatory = 'Choose a signature for the stamp.';
    else if (signatories && !signatories.some(item => item.id === f.stampSignatory)) e.stampSignatory = 'Choose an available signature.';
  }
  if (f.evidence === 'other' && blank(f.evidenceDetails)) e.evidenceDetails = 'Tell us how the documents will be provided.';
  if (arab) {
    if (!FOREIGN_EVIDENCE_OPTIONS.some(option => option.value === f.foreignEvidence)) e.foreignEvidence = 'Choose how foreign origin evidence will be provided.';
    if (f.foreignEvidence === 'upload' && !(f.foreignEvidenceFiles || []).length) e.foreignEvidenceFiles = 'Add at least one PDF, or choose another option.';
    if (f.foreignEvidence === 'other' && blank(f.foreignEvidenceDetails)) e.foreignEvidenceDetails = 'Tell us how the foreign origin evidence will be provided.';
  }
  return e;
}

/** Defaults for fields added with the box layout; never overwrites what an exporter entered. */
export function certificateDefaults(f) {
  return {
    originCountries: originCountries({...f, origin: f.origin || 'United Kingdom'}),
    netUnit: f.netUnit || f.weightUnit || 'KG',
    cubeUnit: !f.cubeUnit || f.cubeUnit === 'M3' ? 'M³' : f.cubeUnit,
    manufacturersAdded: Array.isArray(f.manufacturersAdded) ? f.manufacturersAdded : [],
    invoiceUppercase: Boolean(f.invoiceUppercase),
    replacementChamber: f.replacementChamber || '', replacementIssueDate: f.replacementIssueDate || '',
    stamp: f.stamp || '', stampReference: f.stampReference || '', stampSignatory: f.stampSignatory || '',
    remarksType: REMARKS_TEMPLATES.includes(f.remarksType) ? f.remarksType : 'None',
    eurRemarksType: EUR1_REMARK_TEMPLATES.includes(f.eurRemarksType) ? f.eurRemarksType : 'None',
    eurTransport: f.eurTransport ?? (certificateKind(f) === 'eur' ? f.transport || '' : ''), eurInvoices: f.eurInvoices || '',
    eurMixedConsignment: Boolean(f.eurMixedConsignment), weightUnit: f.weightUnit || 'KG',
    foreignEvidence: f.foreignEvidence || '', foreignEvidenceFiles: Array.isArray(f.foreignEvidenceFiles) ? f.foreignEvidenceFiles : [], foreignEvidenceDetails: f.foreignEvidenceDetails || '',
  };
}
