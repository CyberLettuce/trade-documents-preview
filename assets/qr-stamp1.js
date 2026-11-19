import qrcodegen from './qrcodegen1.js?v=2026-11-19-sidebar-r1';

export function createReferenceQr(application={}){
 const payload=String(application.reference||application.stampReference||'SAMPLE');
 const qr=qrcodegen.QrCode.encodeText(payload,qrcodegen.QrCode.Ecc.MEDIUM),border=4,side=qr.size+border*2;
 let path='';for(let y=0;y<qr.size;y++)for(let x=0;x<qr.size;x++)if(qr.getModule(x,y))path+=`M${x+border},${y+border}h1v1h-1z`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 654"><rect width="600" height="654" fill="white"/><svg x="0" y="0" width="600" height="600" viewBox="0 0 ${side} ${side}"><path fill="black" shape-rendering="crispEdges" d="${path}"/></svg><text x="300" y="630" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="black">SAMPLE · APPLICATION REFERENCE</text></svg>`;
 return {id:'qr',name:'QR code',width:600,height:654,defaultWidth:32,payload,svg};
}

export function placedStampForPage(marks,page,stampId){return marks.find(mark=>mark.page===page&&(mark.stamp==='qr')===(stampId==='qr'));}
