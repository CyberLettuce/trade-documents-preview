const alphabet='abcdefghijklmnopqrstuvwxyz0123456789';
export function randomCertificateNumber(){
 for(;;){let number='';while(number.length<10){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);for(const byte of bytes){if(byte<252)number+=alphabet[byte%36];if(number.length===10)break;}}if(/[a-z]/.test(number)&&/[0-9]/.test(number))return number;}
}
export const canAutoNumber=application=>application.status==='Pending'&&application.docs?.some(doc=>['coo','arab','eur'].includes(doc));
export function ensureCertificateNumber(application,records=[],officer,random=randomCertificateNumber){
 if(!canAutoNumber(application)||String(application.certificate||'').trim()||application.lockedBy&&application.lockedBy!==officer)return application;
 const used=new Set(records.filter(record=>record.id!==application.id).map(record=>String(record.certificate||'').trim().toLowerCase()));
 for(let attempt=0;attempt<1000;attempt++){const certificate=String(random());if(!/^[a-z0-9]{10}$/.test(certificate)||!/[a-z]/.test(certificate)||!/[0-9]/.test(certificate))throw Error('The generated certificate number must contain ten lowercase letters and digits.');if(!used.has(certificate))return {...application,certificate};}
 throw Error('A unique certificate number could not be assigned. Please try again.');
}
