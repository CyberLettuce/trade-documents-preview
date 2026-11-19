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
async function seedPdf(page,framework){
 const version=await page.locator('meta[name=application-version]').getAttribute('content');
 await page.evaluate(async({framework,bytes,version})=>{
  const data=new Uint8Array(bytes).buffer,name='accessible-test.pdf';localStorage.removeItem('trade-documents-pdf-reading-view-v1');
  if(framework==='react'){
   const {storePdf}=await import('/assets/application-attachment-store1-review1-5e01d232.js?v='+version);const saved=await storePdf(new File([data],name,{type:'application/pdf'}));const key='ecert-chamber-preview-v1',state=JSON.parse(localStorage.getItem(key)),record=state.apps.find(r=>r.id==='ch-app-0');record.files=[name];record.pdfFiles={files:{[name]:saved.id}};record.form={...record.form,files:[name],pdfFiles:record.pdfFiles};localStorage.setItem(key,JSON.stringify(state));
  }else{
   const {pdfStore}=await import('/vue/model.js?v='+version);await pdfStore('put','accessible-test',data);const key='trade-documents-vue-comparison-v1',state=JSON.parse(localStorage.getItem(key)),record=state.records.find(r=>r.id==='sample-0');record.files=[{id:'accessible-test',name,type:'application/pdf',size:data.byteLength,stamp:'none'}];localStorage.setItem(key,JSON.stringify(state));
  }
 },{framework,bytes:[...fixturePdf()],version});
 await page.reload();await page.waitForFunction(()=>document.querySelector('main')?.innerText.length>200);
}
async function openPdf(page,framework){
 const showFiles=page.getByRole('button',{name:/^Show files$/});if(await showFiles.count()&&await showFiles.isVisible())await showFiles.click();
 const file=page.getByRole('button',{name:/accessible-test\.pdf/}).first();await file.click();
 const viewer=page.locator(framework==='react'?'.application-pdf-viewer':'.pdf-viewer');await viewer.locator('.pdf-view-choice').waitFor();return viewer;
}
module.exports={fixturePdf,seedPdf,openPdf};
