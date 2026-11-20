const letters = 'abcdefghijklmnopqrstuvwxyz';
const digits = '0123456789';
const formats = {
  eur: {pattern: /^[a-z]\d{7,8}$/i, hint: 'enter 1 letter followed by 7 to 8 digits', name: 'EUR1'},
  arab: {pattern: /^[a-z]{1,2}\d{6,9}$/i, hint: 'enter 1 or 2 letters followed by 6 to 9 digits', name: 'Arab C of O'}
};
const documentIds = {'UK Certificate of Origin': 'coo', 'Arab Certificate of Origin': 'arab', EUR1: 'eur'};

export function certificateTypes(record) {
  return [...new Set((record.docs || record.documents || [record.document])
    .map(doc => documentIds[doc] || doc).filter(doc => doc === 'coo' || Object.hasOwn(formats, doc)))];
}

export function certificateOnRecord(record, doc) {
  const value = certificateTypes(record)[0] === doc ? record.certificate : record.certificateNumbers?.[doc];
  return String(value ?? '');
}

export function certificateForPrint(record, doc) {
  const types = certificateTypes(record);
  if (!types.includes(doc)) return record.certificate;
  return certificateOnRecord(record, doc)
    || (!record.certificateNumbers && !['Pending','Submitted'].includes(record.status) ? record.certificate : '');
}

export function certificateEdit(record, doc, value) {
  return certificateTypes(record)[0] === doc
    ? {certificate: value}
    : {certificateNumbers: {...record.certificateNumbers, [doc]: value}};
}

export const certificateHint = doc => formats[doc]?.hint;
export function certificateNumberError(doc, value) {
  const format = formats[doc];
  return format && !format.pattern.test(String(value ?? '').trim())
    ? format.name + ' certificate number is invalid - ' + format.hint
    : '';
}

export function certificateNumberErrors(record) {
  return certificateTypes(record).flatMap(doc => {
    const message = certificateNumberError(doc, certificateOnRecord(record, doc));
    return message ? [{key: 'certificate-' + doc, message}] : [];
  });
}

function draw(count, alphabet) {
  let value = '';
  const limit = 256 - 256 % alphabet.length;
  while (value.length < count) {
    const bytes = crypto.getRandomValues(new Uint8Array(count));
    for (const byte of bytes) {
      if (byte < limit) value += alphabet[byte % alphabet.length];
      if (value.length === count) break;
    }
  }
  return value;
}

export function randomCertificateNumber(doc = 'coo') {
  if (doc === 'eur') return draw(1, letters) + draw(8, digits);
  if (doc === 'arab') return draw(2, letters) + draw(8, digits);
  for (;;) {
    const number = draw(10, letters + digits);
    if (/[a-z]/.test(number) && /[0-9]/.test(number)) return number;
  }
}

export const canAutoNumber = application => ['Pending','Submitted'].includes(application.status) && certificateTypes(application).length > 0;
export function ensureCertificateNumber(application,records=[],officer,random=randomCertificateNumber){
 if (!canAutoNumber(application) || application.lockedBy && application.lockedBy !== officer) return application;
 const used = new Set([...records, application]
   .flatMap(record => [record.certificate, ...Object.values(record.certificateNumbers || {})])
   .filter(Boolean).map(value => String(value).trim().toLowerCase()));
 let result = application;
 for (const doc of certificateTypes(application)) {
   if (certificateOnRecord(result, doc).trim()) continue;
   let assigned = false;
   for (let attempt = 0; attempt < 1000; attempt++) {
     const certificate = String(random(doc));
     if (doc === 'coo' ? !/^(?=.*[a-z])(?=.*\d)[a-z0-9]{10}$/.test(certificate) : certificateNumberError(doc, certificate)) {
       throw Error('The generated certificate number has an invalid format.');
     }
     if (used.has(certificate.toLowerCase())) continue;
     result = {...result, ...certificateEdit(result, doc, certificate)};
     used.add(certificate.toLowerCase());
     assigned = true;
     break;
   }
   if (!assigned) throw Error('A unique certificate number could not be assigned. Please try again.');
 }
 return result;
}

export function numberSubmittedApplications(state,records=[],random=randomCertificateNumber){
 const used=[...records,...Object.values(state.spaces||{}).flatMap(space=>space.apps||[])];let changed=false;
 const spaces=Object.fromEntries(Object.entries(state.spaces||{}).map(([id,space])=>[id,{...space,apps:(space.apps||[]).map(application=>{if(application.status!=='Submitted')return application;try{const numbered=ensureCertificateNumber(application,used,undefined,random);if(numbered!==application){changed=true;used.push(numbered);}return numbered;}catch{return application;}})}]));
 return changed?{...state,spaces}:state;
}
