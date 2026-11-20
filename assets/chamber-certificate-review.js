import {certificateHint, certificateNumberError, certificateForPrint, certificateOnRecord, certificateTypes, certificateEdit} from './certificate-numbering2.js?v=2026-11-20-acceptance-r1';
import {fieldHelp} from './field-help.js?v=2026-11-20-vertical-review-r2';

const documentNames = {coo: 'UK Certificate of Origin', eur: 'EUR1', arab: 'Arab C of O'};
const dates = {
  coo: [['issueDate', 'Issue Date'], ['stampDate', 'Stamp Date']],
  eur: [['eurBox12Date', 'Box 12 Date'], ['eurBox11Date', 'Box 11 Date']]
};

export function certificateDateDefaults(record, now = new Date()) {
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0')).join('-');
  return Object.fromEntries(certificateTypes(record).flatMap(doc => dates[doc] || [])
    .filter(([key]) => !record[key]).map(([key]) => [key, today]));
}

function emailAddress(value) {
  const address = typeof value === 'string' ? value.trim() : '';
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address) ? address : '';
}

export function certificateApplicant(record, signatories, account, legacyName = '') {
  const selected = signatories.find(person => person.id === record.exporterSignatory);
  const name = record.applicantSignatory || selected?.name || legacyName;
  const signatory = selected || signatories.find(person => person.name === name);
  const directEmail = emailAddress(record.applicantEmail) || emailAddress(signatory?.email);
  return {name, email: directEmail || emailAddress(account?.email), accountEmail: !directEmail};
}

export function renderCertificateDetails(node, {record, applicant, expiry, formatDate, writable, update, onNumberBlur, checkedNumber}) {
  function fact(label, ...value) {
    return node('dl', {class: 'chamber-certificate-fact'}, node('dt', {}, label), node('dd', {}, ...value));
  }
  const email = applicant.email ? node('a', {
    href: 'mailto:' + encodeURIComponent(applicant.email).replace('%40', '@'),
    translate: 'no',
    'aria-label': applicant.accountEmail ? 'Email exporter account at ' + applicant.email : undefined
  }, applicant.email) : null;
  function field(label, options, error = '') {
    return node('label', {class: 'certificate-review-input'},
      node('span', {}, label, options['data-tip']
        ? node('span', {class: 'field-help-mark', 'aria-hidden': true, 'data-tip': options['data-tip']}, '?') : null),
      node('input', {...options, 'aria-label': label, 'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? options.id + '-error' : undefined}),
      error ? node('small', {id: options.id + '-error', class: 'field-error', role: 'alert'}, error) : null);
  }
  const types = certificateTypes(record);
  const documentFields = types.map(doc => {
    const number = writable ? certificateOnRecord(record, doc) : certificateForPrint(record, doc);
    const label = types.length === 1 ? 'Certificate number' : documentNames[doc] + ' certificate number';
    const id = doc === 'coo' ? 'review-certificate' : 'review-certificate-' + doc;
    const controls = writable && doc !== 'coo'
      ? field(label, {id, type: 'text', value: number, 'data-tip': certificateHint(doc),
        autoComplete: 'off', spellCheck: false, onInput: event => update(certificateEdit(record, doc, event.target.value)),
        onBlur: event => {
          if (event.target.value !== event.target.value.trim()) update(certificateEdit(record, doc, event.target.value.trim()));
          onNumberBlur(doc);
        }},
        checkedNumber(doc) || number ? certificateNumberError(doc, number) : '')
      : fact(label, node('span', {id, tabIndex: -1, translate: 'no'}, number || 'Not assigned'));
    const dateFields = dates[doc]?.map(([key, dateLabel]) => field(dateLabel, {
      key, type: 'date', value: record[key] || '', disabled: !writable, 'data-tip': fieldHelp(dateLabel),
      onInput: event => update({[key]: event.target.value})
    }));
    return node('div', {key: doc, class: 'certificate-document-fields'}, controls,
      dateFields ? node('div', {class: 'certificate-date-fields'}, ...dateFields) : null);
  });
  const region = types.length === 1 ? documentNames[types[0]] + ' application details' : 'Certificate application details';
  return node('section', {class: 'chamber-certificate-application', 'aria-label': region},
    node('h3', {}, 'Certificate details'),
    node('div', {class: 'chamber-certificate-fields'},
      fact('Signatory (Applicant)', node('span', {translate: 'no'}, applicant.name || 'Not recorded'), email),
      fact('Formal Undertaking Expiry Date', expiry ? formatDate(expiry) : 'Not recorded'),
      ...documentFields));
}
