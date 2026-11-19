import qrcodegen from './qrcodegen1.js?v=2026-11-19-editor-navigation-r1';
export function completedCarnet(record) {
  const carnet = record.docs?.includes('ata') || (record.documents || [record.document]).includes('ATA Carnet');
  return carnet && !record.archivedAt && ['Processed', 'Accepted', 'Approved', 'Completed', 'Auto Accepted'].includes(record.status);
}

export function carnetAccess(record) {
  const id = String(record.eCarnetId || record.ecarnetId || 'DEMO-' + (record.certificate || record.reference));
  const pin = String(record.eCarnetPin || record.ecarnetPin || '000000');
  return {id, pin, payload: JSON.stringify({type: 'sample-ecarnet-access', carnetId: id, pin})};
}

export const carnetActions = [
  {id: 'open', label: 'View', icon: 'eye'},
  {id: 'carnet', label: 'eCarnet ID and PIN', icon: 'qr-code'},
  {id: 'return', label: 'Return Carnet', icon: 'arrow-return-left'},
  {id: 'replacement', label: 'Replacement', icon: 'arrow-repeat'},
  {id: 'archive', label: 'Archive', icon: 'archive'}
];

export const carnetFields = ['eCarnetId', 'ecarnetId', 'eCarnetPin', 'ecarnetPin', 'eCarnetStatus', 'carnetReturned', 'carnetReturnedAt'];
export function clearCarnetAccess(record) {
  const result = {...record};
  for (const key of carnetFields) delete result[key];
  return result;
}

export function carnetQr(payload) {
  const qr=qrcodegen.QrCode.encodeText(payload,qrcodegen.QrCode.Ecc.MEDIUM), border=4, size=qr.size+border*2;
  let path=''; for(let y=0;y<qr.size;y++)for(let x=0;x<qr.size;x++)if(qr.getModule(x,y))path+=`M${x+border},${y+border}h1v1h-1z`;
  return {size,path};
}
