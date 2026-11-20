export function withCertificateDates(record, now = new Date()) {
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0')).join('-');
  return {
    ...record,
    issueDate: record.issueDate || today,
    stampDate: record.stampDate || today
  };
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

export function renderCertificateDetails(node, {record, applicant, expiry, formatDate}) {
  function fact(label, ...value) {
    return node('dl', {class: 'chamber-coo-fact'}, node('dt', {}, label), node('dd', {}, ...value));
  }
  const email = applicant.email ? node('a', {
    href: 'mailto:' + encodeURIComponent(applicant.email).replace('%40', '@'),
    translate: 'no',
    'aria-label': applicant.accountEmail ? 'Email exporter account at ' + applicant.email : undefined
  }, applicant.email) : null;
  return node('section', {class: 'chamber-coo-application', 'aria-label': 'UK Certificate of Origin application details'},
    node('h3', {}, 'Certificate details'),
    node('div', {class: 'chamber-coo-fields'},
      fact('Signatory (Applicant)', node('span', {translate: 'no'}, applicant.name || 'Not recorded'), email),
      fact('Formal Undertaking Expiry Date', expiry ? formatDate(expiry) : 'Not recorded'),
      fact('Certificate number', node('span', {id: 'review-certificate', tabIndex: -1, translate: 'no'}, record.certificate || 'Not assigned'))));
}
