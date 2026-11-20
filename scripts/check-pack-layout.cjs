const {chromium,engineName}=require('./cloud-browser.cjs');
const {seedPdf,openPdf}=require('./pdf-check-helpers.cjs');
const fs=require('node:fs'), path=require('node:path'), http=require('node:http'), assert=require('node:assert/strict');
const out=path.resolve('qa-results');fs.mkdirSync(out,{recursive:true});
const roots={after:path.resolve('_site-check')};
const contentTypes={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.wasm':'application/wasm','.pdf':'application/pdf'};
const server=http.createServer((req,res)=>{
 const [revision,...segments]=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1).split('/');
 const root=roots[revision];let name=segments.join('/');if(!name||name.endsWith('/'))name+='index.html';
 if(!root)return res.writeHead(404).end();const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':contentTypes[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});

const cases = [
 {framework:'react', route:'/#chamber/applications/Pending/ch-app-0', preview:'.pack-main', paper:'.document-scaled-page'},
 {framework:'vue', route:'/vue/#/chamber/applications/sample-0', preview:'.document-pane', paper:'.native-paper'}
];
async function assertNoOverflow(page) {
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Page has horizontal overflow');
}
async function showMagnifier(page, surface) {
 const sheet=await surface.boundingBox();
 const point={x:Math.round(sheet.x+sheet.width*.28),y:Math.round(sheet.y+sheet.height*.3)};
 await page.mouse.move(point.x,point.y);
 const lens=page.locator('.review-magnifier');
 await page.waitForFunction(()=>!!document.querySelector('.review-magnifier')?.style.top);
 assert.equal(await lens.count(),1);
 assert.equal(await lens.getAttribute('aria-hidden'),'true');
 assert(await lens.evaluate(el=>el.inert&&getComputedStyle(el).pointerEvents==='none'));
 const rect=await lens.boundingBox();
 assert(Math.abs(rect.x+rect.width/2-point.x)<2);
 assert(Math.abs(rect.y+rect.height/2-point.y)<2);
 assert(await page.evaluate(({x,y})=>!document.elementFromPoint(x,y)?.closest('.review-magnifier'),point));
 return {lens,point};
}

async function checkCarnet(page, framework) {
 const react=framework==='react';
 const root='http://127.0.0.1:5204/after';
 const route=react?'/#chamber/applications/Pending/cloud-ata-pending':'/vue/#/chamber/applications/cloud-ata-pending';
 const seed=await page.evaluate(react=>{
  const key=react?'ecert-chamber-preview-v1':'trade-documents-vue-comparison-v1';
  const data=JSON.parse(localStorage.getItem(key));
  const records=react?data.apps:data.records;
  const sample=records.find(record=>record.id===(react?'ch-app-0':'sample-0'));
  const changes={id:'cloud-ata-pending',reference:'DEMO-CLOUD/123456789/N',status:'Pending',goodsType:'Machinery',
   items:[{id:'original-item',description:'Original instruments',pieces:1,unit:'Kilogram',weight:1,value:80,origin:'United Kingdom'}],
   use:react?['Professional equipment']:'Professional equipment',
   ...(react?{docs:['ata'],signatory:'Exporter sample signatory',lockedBy:'',assigned:''}
      :{document:'ATA Carnet',documents:['ATA Carnet'],applicantSignatory:'Alex Morgan',owner:''})};
  records.push({...sample,...changes},{...sample,...changes,id:'cloud-ata-approved',reference:'DEMO-CLOUD/987654321/N',status:'Approved'});
  return {key,data};
 },react);
 await page.addInitScript(({key,data})=>{
  if(sessionStorage.getItem('cloud-ata-seeded'))return;
  localStorage.setItem(key,JSON.stringify(data));
  sessionStorage.setItem('cloud-ata-seeded','1');
 },seed);
 await page.goto(root+route.replace('#','?cloud-carnet#'));
 const hideFiles=page.getByRole('button',{name:'Hide files',exact:true});
 if(await hideFiles.isVisible())await hideFiles.click();
 const details=page.getByRole('region',{name:'ATA Carnet application details'});
 await details.waitFor();
 const fact=name=>details.locator('dl').filter({has:page.getByText(name,{exact:true})}).locator('dd');
 assert.equal(await fact('Signatory (Applicant)').textContent(),react?'Exporter sample signatory':'Alex Morgan');
 assert.match(await fact('Formal Undertaking Expiry Date').textContent(),/2027/);
 assert.match(await fact('Box C – Intended Use of Goods').textContent(),/professional equipment/i);
 assert.match(await details.getByLabel('Goods Type',{exact:true}).inputValue(),/machinery/i);
 const id=details.getByLabel('Mercury Carnet ID',{exact:true}),pin=details.getByLabel('Mercury Carnet PIN',{exact:true});
 await id.fill('MERCURY-CHECK-041');
 await pin.fill('004219');
 const upload=details.getByLabel('Upload General List CSV',{exact:true});
 const download=details.getByRole('button',{name:'Download General List CSV',exact:true});
 const file=text=>({name:'general-list.csv',mimeType:'text/csv',buffer:Buffer.from(text)});
 const valid=file('Description,Number of pieces,Unit,Weight,Value,Origin\n"Portable instruments",2,KG,3,150,FR');
 page.once('dialog',dialog=>dialog.accept());
 await upload.setInputFiles(valid);
 await page.getByText('General List replaced.').first().waitFor();
 await upload.setInputFiles(file('Description,Number of pieces,Unit,Weight,Value,Origin\nInvalid item,0,KG,1,1,FR'));
 await details.getByRole('alert').filter({hasText:'positive whole number'}).waitFor();
 const pending=page.waitForEvent('download');
 await download.click();
 const csv=await pending;
 assert.equal(csv.suggestedFilename(),'general-list.csv');
 const content=fs.readFileSync(await csv.path(),'utf8');
 assert(content.includes('Portable instruments')&&content.includes('Kilogram')&&content.includes('France'));
 assert(!content.includes('Invalid item'));
 await page.waitForFunction(()=>Object.values(localStorage).some(value=>value.includes('MERCURY-CHECK-041')&&value.includes('004219')&&value.includes('Portable instruments')));
 await page.reload();
 await details.waitFor();
 assert.equal(await id.inputValue(),'MERCURY-CHECK-041');
 assert.equal(await pin.inputValue(),'004219');
 if(engineName==='chromium')await details.screenshot({path:path.join(out,framework+'-chamber-carnet-details.png')});
 await page.setViewportSize({width:390,height:844});
 await assertNoOverflow(page);
 await page.setViewportSize({width:1440,height:900});
 await page.goto(root+(react?'/#chamber/applications/Approved/cloud-ata-approved':'/vue/#/chamber/applications/cloud-ata-approved'));
 await details.waitFor();
 assert.equal(await id.getAttribute('readonly'), '');
 assert.equal(await upload.count(),0);
 assert(await download.isEnabled());
}

async function checkFit(page, preview, paper, details) {
 await paper.locator.waitFor({state:'visible'});
 await page.waitForFunction(({preview,paper})=>{
  const stage=document.querySelector(preview+' .compact-fit-page');
  const sheet=document.querySelector(preview+' '+paper)?.getBoundingClientRect();
  return stage&&sheet?.width>70&&sheet.height>70&&stage.getBoundingClientRect().width-sheet.width<=36;
 },{preview:preview.selector,paper:paper.selector});
 const previewBounds=await preview.locator.boundingBox();
 const detailsBounds=await details.boundingBox();
 const sheet=await paper.locator.boundingBox();
 assert(previewBounds.width-sheet.width<=38,JSON.stringify({previewBounds,sheet}));
 assert(detailsBounds.width>=previewBounds.width+90,JSON.stringify({previewBounds,detailsBounds}));
 assert(sheet.y+sheet.height<=page.viewportSize().height-48,JSON.stringify(sheet));
 return {previewWidth:Math.round(previewBounds.width),detailsWidth:Math.round(detailsBounds.width)};
}
(async()=>{
 await new Promise(resolve=>server.listen(5204,'127.0.0.1',resolve));
 const browser=await chromium.launch();
 const results=[];
 for(const {framework,route,preview:previewSelector,paper:paperSelector} of cases){
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  const errors=[];
  page.setDefaultTimeout(10000);
  page.on('pageerror',error=>errors.push(error.message));
  try {
   const url='http://127.0.0.1:5204/after'+route;
   await page.goto(url);
   const header=page.locator('.pack-summary-bar');
   await header.waitFor();
   await page.evaluate(()=>document.fonts.ready);
   const control=label=>header.getByRole('button',{name:label,exact:true});
   const zoom=page.locator(previewSelector+' select').filter({has:page.getByRole('option',{name:'Fit page',exact:true})});
   assert.equal(await zoom.inputValue(),'page');
   assert.equal(await page.locator('.preview-toggle,.pack-preview-toggle').count(),0);
   const preview={selector:previewSelector,locator:page.locator(previewSelector)};
   const paper={selector:paperSelector,locator:page.locator(previewSelector+' '+paperSelector).first()};
   const details=page.locator('#pack-details-panel');
   const metrics=await checkFit(page,preview,paper,details);
   const [actions,autosave]=await Promise.all([header.locator('.review-layout-actions').boundingBox(),header.locator('.pack-summary-save').boundingBox()]);
   const back=await control(framework==='react'?'Back to pending applications':'Back to Applications').boundingBox();
   assert(Math.abs(actions.y+actions.height/2-autosave.y-autosave.height/2)<4);
   assert(Math.abs(actions.y+actions.height/2-back.y-back.height/2)<4);
   assert(await header.evaluate(el=>el.scrollWidth<=el.clientWidth+2));
   await assertNoOverflow(page);
   const processing=details.locator('.review-processing-fields');
   assert((await processing.locator('select').count())>=1);
   const fields=processing.locator('select, input');
   const bounds=await fields.evaluateAll(controls=>controls.map(control=>{
    const r=control.getBoundingClientRect();
    return {top:r.top,width:r.width,height:r.height,bottom:r.bottom};
   }));
   assert(bounds.every(r=>r.height>=32&&r.height<=40&&r.width>=120),JSON.stringify(bounds));
   assert(Math.abs(bounds[0].top-bounds[1].top)<4,JSON.stringify(bounds));
   assert(bounds.every(r=>r.bottom<page.viewportSize().height-65),JSON.stringify(bounds));
   if(engineName==='chromium'){
    const rect=await header.boundingBox();
    const top=Math.max(0,Math.floor(rect.y)-8);
    await page.screenshot({path:path.join(out,framework+'-pending-layout.png'),clip:{x:0,y:top,width:1440,height:Math.min(550,900-top)}});
   }
   const {lens,point}=await showMagnifier(page,paper.locator);
   const scale=await lens.locator('.review-magnifier-sample').evaluate(sample=>new DOMMatrix(getComputedStyle(sample).transform).a);
   assert.equal(scale,2);
   await page.mouse.move(point.x+25,point.y+18);
   await page.waitForFunction(previous=>Math.abs(document.querySelector('.review-magnifier').getBoundingClientRect().x+84-previous.x-25)<2,point);
   if(engineName==='chromium'){
    const bounds=await preview.locator.boundingBox();
    const x=Math.max(0,Math.floor(bounds.x)-10),y=Math.max(0,Math.floor(bounds.y)-10);
    await page.screenshot({path:path.join(out,framework+'-hover-magnifier.png'),clip:{x,y,width:Math.ceil(bounds.width+20),height:560}});
   }
   await page.keyboard.press('Escape');
   assert.equal(await lens.count(),0);
   await page.mouse.move(point.x+30,point.y+20);
   assert.equal(await lens.count(),0);
   await zoom.hover();
   assert.equal(await lens.count(),0);
   await showMagnifier(page,paper.locator);
   await zoom.hover();
   assert.equal(await lens.count(),0);
   await paper.locator.dispatchEvent('pointermove',{pointerType:'touch',clientX:point.x,clientY:point.y});
   assert.equal(await lens.count(),0);

   const showFiles=control('Show files');
   await showFiles.focus();
   await page.keyboard.press('Enter');
   assert(await page.locator('#pack-page-list').isVisible());
   await control('Hide files').click();
   assert(!(await page.locator('#pack-page-list').isVisible()));
   await control('Hide application details').click();
   assert(!(await details.isVisible()));
   assert((await preview.locator.boundingBox()).width<=metrics.previewWidth+5);
   await control('Hide document preview').click();
   assert(!(await preview.locator.isVisible()));
   assert(await details.isVisible());
   await control('Show document preview').click();
   await control('Show application details').click();
   await zoom.selectOption({label:'Fit width'});
   assert((await preview.locator.boundingBox()).width>metrics.previewWidth+60);
   await page.reload();
   assert.equal(await zoom.inputValue(),'width');
   await zoom.selectOption({label:'Fit page'});
   await seedPdf(page,framework);
   const viewer=await openPdf(page,framework);
   const pdfZoom=viewer.getByRole('combobox',{name:/zoom/i});
   assert.equal(await pdfZoom.inputValue(),'page');
   const canvas=viewer.locator('canvas').first();
   await page.waitForFunction(()=>[...document.querySelectorAll('.compact-fit-page canvas')].some(el=>el.style.width&&el.getBoundingClientRect().height>60));
   assert((await canvas.boundingBox()).width>90);
   const pdfLens=(await showMagnifier(page,canvas)).lens;
   const sample=pdfLens.locator('canvas');
   assert(await sample.evaluate(canvas=>canvas.getContext('2d').getImageData(canvas.width/2,canvas.height/2,1,1).data[3]===255));
   await pdfZoom.hover();
   assert.equal(await pdfLens.count(),0);
   await viewer.getByRole('button',{name:'Text view',exact:true}).click();
   await viewer.locator('.pdf-readable-content').waitFor();
   await viewer.getByRole('button',{name:'Document view',exact:true}).click();
   await page.setViewportSize({width:390,height:844});
   await assertNoOverflow(page);
   assert(await header.evaluate(el=>el.scrollWidth<=el.clientWidth+2));
   await page.setViewportSize({width:320,height:768});
   await assertNoOverflow(page);
   assert(await header.evaluate(el=>el.scrollWidth<=el.clientWidth+2));
   await page.setViewportSize({width:1440,height:900});
   await checkCarnet(page,framework);
   assert.deepEqual(errors,[]);
   results.push({framework,...metrics,pass:true});
  } catch(error){
   results.push({framework,error:error.message,errors,pass:false});
   await page.screenshot({path:path.join(out,framework+'-failed.png')}).catch(()=>{});
  } finally {await context.close();}
 }
 console.log(JSON.stringify(results,null,2));
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 await browser.close();
 server.close();
 process.exitCode=results.some(result=>!result.pass)?1:0;
})().catch(error=>{console.error(error);process.exit(1)});
