// Additive data model: the first description retains its original `goods` key.
// Old combined descriptions are never parsed or rewritten automatically.
export const goodsDocuments=['coo','arab','eur','eurmed'];
export const goodsDocumentNames={coo:'UK CoO · Box 6',arab:'Arab CoO · Box 6',eur:'EUR1 · Box 8',eurmed:'EUR-MED · Box 8'};
export const goodsBoxHeights={coo:252,arab:400,eur:272,eurmed:272};
export const hasStructuredGoods=f=>f.goodsLayout==='structured';
export const marksForDocument=(value,doc)=>/^(unmarked|no marks|no marks and numbers)$/i.test(String(value||'').trim())?(doc==='eur'||doc==='eurmed'?'No marks and numbers':'Unmarked'):value;
export function certificateInvoices(f){
 const rows=[...(f.invoices||[])];
 if(f.docs?.includes('invoice')&&(f.invoiceNumber||f.invoiceDate)&&!rows.some(row=>row.number===f.invoiceNumber&&row.date===f.invoiceDate))rows.push({id:'commercial-invoice',number:f.invoiceNumber,date:f.invoiceDate});
 return rows.filter(row=>row.number||row.date);
}
export function goodsRows(f){
 return [{id:'first',marks:f.shippingMarks||'',packages:f.packages||'',description:f.goods||''},...(Array.isArray(f.additionalGoods)?f.additionalGoods:[])];
}
export function goodsSummary(f){
 if(!hasStructuredGoods(f))return [f.shippingMarks,f.goods,f.continuation].filter(Boolean).join('\n');
 return [...goodsRows(f).map((row,n)=>[`${n+1}. ${row.description}`,row.marks,row.packages].filter(Boolean).join('\n')),f.continuation].filter(Boolean).join('\n\n');
}
export function goodsValidation(f){
 if(!hasStructuredGoods(f)||!f.docs?.some(doc=>goodsDocuments.includes(doc)))return {};
 const errors={};
 if(!f.shippingMarks?.trim())errors.shippingMarks='Enter marks and numbers, or state that the packages are unmarked.';
 if(!f.packages?.trim())errors.packages='Enter the number and type of packages, or “In bulk”.';
 if((f.additionalGoods||[]).some(row=>!row.description?.trim()||!row.marks?.trim()||!row.packages?.trim()))errors.additionalGoods='Complete the marks, packages and description for every additional item.';
 // The Arab certificate now follows the UK box rules (certificateErrors): at least one quantity and one
 // manufacturer, with units that can be changed. Its older KG / gross-and-net / manufacturer-text rules were retired
 // on 20 October 2026 when the user agreed its boxes.
 return errors;
}
// Only a rendered, non-zero measurement can report a fit. No character counts.
export function measuredGoodsFit({clientHeight,scrollHeight,clientWidth,scrollWidth}){
 if(!(clientHeight>0&&clientWidth>0))return 'checking';
 return scrollHeight>clientHeight||scrollWidth>clientWidth?'overflow':'fit';
}
export const goodsFitKey=f=>JSON.stringify([f.goodsLayout,f.goods,f.shippingMarks,f.packages,f.additionalGoods,f.continuation,f.smallFont,f.manufacturersText,f.printManufacturers,certificateInvoices(f),f.hideInvoices,f.invoiceUppercase,f.manufacturerIds,f.manufacturersAdded,f.manufacturersChosen,f.docs,f.quantity,f.gross,f.net,f.weightUnit,f.cube,f.cubeUnit,f.tariffHeading,f.destination,f.eurMixedConsignment]);
export function goodsFitError(checks,docs){
 const selected=docs.filter(doc=>goodsDocuments.includes(doc));
 const over=selected.filter(doc=>checks[doc]==='overflow');
 if(over.length)return `The goods content exceeds ${over.map(doc=>goodsDocumentNames[doc]).join(' and ')}. Shorten the text or use the document-specific invoice guidance before continuing.`;
 if(selected.some(doc=>checks[doc]!=='fit'))return 'Checking the goods layout. Open Goods & invoices if this message remains.';
 return '';
}
