function fixturePdf(){
 const objects=[];const add=s=>(objects.push(s),objects.length);const reserve=()=>add('');const set=(id,s)=>objects[id-1]=s;
 const catalog=reserve(),pages=reserve(),page1=reserve(),page2=reserve(),page3=reserve(),font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 const stream=s=>add(`<< /Length ${Buffer.byteLength(s)} >>\nstream\n${s}\nendstream`);
 const one=stream('/P << /MCID 1 >> BDC BT /F1 12 Tf 40 700 Td (Paragraph stored first. <b>Document text</b>) Tj ET EMC\n/H1 << /MCID 0 >> BDC BT /F1 20 Tf 40 750 Td (Accessible invoice heading) Tj ET EMC');
 const two=stream('BT /F1 16 Tf 40 750 Td (Second page after rotation) Tj ET');
 const three=stream('0.9 0.9 0.9 rg 40 40 500 700 re f');
 const field=add('<< /Type /Annot /Subtype /Widget /FT /Tx /T (Invoice reference) /TU (Invoice reference) /V (INV-42) /Rect [40 650 300 680] /F 4 /DA (/F1 12 Tf 0 g) >>');
 const password=add('<< /Type /Annot /Subtype /Widget /FT /Tx /T (Private password) /V (NEVER-EXPOSE-THIS) /Ff 8192 /Rect [40 600 300 630] /F 4 /DA (/F1 12 Tf 0 g) >>');
 const tree=reserve(),heading=reserve(),paragraph=reserve(),parents=reserve();
 set(catalog,`<< /Type /Catalog /Pages ${pages} 0 R /Lang (en-GB) /MarkInfo << /Marked true >> /StructTreeRoot ${tree} 0 R /AcroForm << /Fields [${field} 0 R ${password} 0 R] /DR << /Font << /F1 ${font} 0 R >> >> /DA (/F1 12 Tf 0 g) >> >>`);
 set(pages,`<< /Type /Pages /Kids [${page1} 0 R ${page2} 0 R ${page3} 0 R] /Count 3 >>`);
 const page=(contents,extra='')=>`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${contents} 0 R ${extra} >>`;
 set(page1,page(one,'/StructParents 0'));set(page2,page(two,`/Rotate 90 /Annots [${field} 0 R ${password} 0 R]`));set(page3,page(three));
 set(tree,`<< /Type /StructTreeRoot /K [${heading} 0 R ${paragraph} 0 R] /ParentTree ${parents} 0 R /ParentTreeNextKey 1 >>`);
 set(heading,`<< /Type /StructElem /S /H1 /P ${tree} 0 R /Pg ${page1} 0 R /K 0 >>`);set(paragraph,`<< /Type /StructElem /S /P /P ${tree} 0 R /Pg ${page1} 0 R /K 1 >>`);set(parents,`<< /Nums [0 [${heading} 0 R ${paragraph} 0 R]] >>`);
 let data='%PDF-1.7\n',offsets=[0];objects.forEach((s,i)=>{offsets.push(Buffer.byteLength(data));data+=`${i+1} 0 obj\n${s}\nendobj\n`});const xref=Buffer.byteLength(data);data+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(data);
}
async function seedPdf(page,framework,buffer=fixturePdf()){
 await page.evaluate(()=>localStorage.removeItem('trade-documents-pdf-reading-view-v1'));
 if(framework==='react')await page.getByRole('tab',{name:'Documents & evidence',exact:true}).click();
 else await page.locator('.processing .detail-tabs').getByRole('button',{name:'Files',exact:true}).click();
 const input=framework==='react'?page.getByLabel('Attach documents',{exact:true}):page.locator('.processing input[type=file]');
 await input.setInputFiles({name:'accessible-test.pdf',mimeType:'application/pdf',buffer});
 await page.getByText('accessible-test.pdf',{exact:true}).first().waitFor({state:'attached'});
}
async function openPdf(page,framework){
 const showFiles=page.locator('button[aria-controls=pack-page-list][aria-expanded=false]:visible').first();if(await showFiles.count())await showFiles.click();
 const file=page.getByRole('button',{name:/accessible-test\.pdf/}).first();await file.click();
 const viewer=page.locator(framework==='react'?'.application-pdf-viewer':'.pdf-viewer');await viewer.locator('.pdf-view-choice').waitFor();return viewer;
}
module.exports={fixturePdf,seedPdf,openPdf};
