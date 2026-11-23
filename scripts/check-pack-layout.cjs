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

const willReadPaper={react:".document-scaled-page",vue:".fit-100 .native-paper"};
const cases = [
 {framework:'react', route:'/#chamber/applications/Pending/ch-app-0', preview:'.pack-main', paper:'.document-scaled-page'},
 {framework:'vue', route:'/vue/#/chamber/applications/sample-0', preview:'.document-pane', paper:'.native-paper'}
];
async function assertNoOverflow(page) {
 try{
  await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth+2,undefined,{timeout:3500});
 }catch{
  const sizes=await page.evaluate(()=>({
   viewport:innerWidth,content:document.documentElement.scrollWidth,
   elements:[...document.querySelectorAll('body *')].flatMap(element=>{
    const rect=element.getBoundingClientRect();
    return rect.right>innerWidth+2&&rect.width>2?[{tag:element.tagName,id:element.id,className:element.getAttribute('class'),right:Math.round(rect.right)}]:[];
   }).slice(0,12)
  }));
  assert.fail('Page has horizontal overflow '+JSON.stringify(sizes));
 }
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
  const changes={id:'cloud-ata-pending',reference:'DEMO-CLOUD/123456789/N',status:'Pending',goodsType:'Machinery',eCarnetId:'MERCURY-CHECK-041',eCarnetPin:'004219',
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
 if(engineName==='chromium'){
  await page.context().grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(root).origin});
 }else{
  await page.addInitScript(()=>{
   // WebKit's automation permissions do not expose programmatic clipboard reads.
   let copied='';
   Object.defineProperty(navigator,'clipboard',{value:{
    writeText:async value=>{copied=value;},
    readText:async ()=>copied
   }});
  });
 }
 await page.goto(root+route.replace('#','?cloud-carnet#'));
 const hideFiles=page.getByRole('button',{name:'Hide files',exact:true});
 if(await hideFiles.isVisible())await hideFiles.click();
 const details=page.getByRole('region',{name:'ATA Carnet application details'});
 await details.waitFor();
 const sidebar=page.locator('#pack-details-panel');
 const detailTab=name=>sidebar.getByRole(react?'tab':'button',{name,exact:true});
 const summaryTitle=sidebar.getByRole('heading',{name:'Application summary',exact:true});
 const feesTitle=sidebar.getByRole('heading',{name:'Fees',exact:true});
 assert.equal(await summaryTitle.count(),0);
 assert.equal(await feesTitle.count(),0);
 await detailTab('Summary').click();
 await summaryTitle.waitFor();
 await feesTitle.waitFor();
 const [summaryPosition,feesPosition]=await Promise.all([summaryTitle.boundingBox(),feesTitle.boundingBox()]);
 assert(feesPosition.x>summaryPosition.x+100&&Math.abs(feesPosition.y-summaryPosition.y)<3,JSON.stringify({summaryPosition,feesPosition}));
 assert(await sidebar.getByText('Harbour Engineering Ltd',{exact:true}).isVisible());
 assert.equal(await details.count(),0);
 if(react)assert(await sidebar.getByLabel('Certification fee (£)',{exact:true}).isEditable());
 else {
  assert(await sidebar.getByText('Total',{exact:true}).isVisible());
  assert(await sidebar.getByRole('button',{name:'Recalculate fees',exact:true}).isEnabled());
 }
 if(engineName==='chromium')await sidebar.screenshot({path:path.join(out,framework+'-carnet-summary.png')});
 await detailTab('Application').click();
 await details.waitFor();
 const columns=sidebar.locator('.carnet-application-columns');
 const processing=columns.locator(':scope > :nth-child(2)');
 const [carnetPanel,processingPanel]=await Promise.all([details.boundingBox(),processing.boundingBox()]);
 assert(processingPanel.x>=carnetPanel.x+carnetPanel.width&&Math.abs(processingPanel.y-carnetPanel.y)<3,JSON.stringify({carnetPanel,processingPanel}));
 const fact=name=>details.locator('dl').filter({has:page.getByText(name,{exact:true})}).locator('dd');
 assert.equal(await fact('Signatory (Applicant)').textContent(),react?'Exporter sample signatory':'Alex Morgan');
 assert.match(await fact('Formal Undertaking Expiry Date').textContent(),/2027/);
 const useLabel='Intended Use of Goods';
 const use=details.getByRole('textbox',{name:useLabel,exact:true});
 const goods=details.getByRole('textbox',{name:'Goods Type',exact:true});
 const editedUse='Commercial samples, Exhibition and fairs';
 assert.match(await use.inputValue(),/professional equipment/i);
 assert.match(await goods.inputValue(),/machinery/i);
 assert.equal(await fact('Mercury Carnet ID').textContent(),'MERCURY-CHECK-041');
 assert.equal(await fact('Mercury Carnet PIN').textContent(),'004219');
 const [applicant,expiry,mercuryId,mercuryPin]=await Promise.all(
  ['Signatory (Applicant)','Formal Undertaking Expiry Date','Mercury Carnet ID','Mercury Carnet PIN'].map(name=>fact(name).boundingBox())
 );
 assert(Math.abs(mercuryId.x-applicant.x)<2&&Math.abs(mercuryPin.x-expiry.x)<2);
 const copyId=details.getByRole('button',{name:'Copy Mercury Carnet ID',exact:true});
 const copyPin=details.getByRole('button',{name:'Copy Mercury Carnet PIN',exact:true});
 const tooltip=page.locator('#workspace-tooltip');
 const workflowStep=processing.getByRole('combobox',{name:'Workflow step',exact:true});
 await workflowStep.focus();
 await tooltip.waitFor();
 assert.match(await tooltip.textContent(),/internal progress/i);
 await page.keyboard.press('Escape');
 await tooltip.waitFor({state:'hidden'});
 await processing.locator('.field-help-mark[data-tip*="internal progress"]').click();
 await tooltip.waitFor();
 assert.match(await tooltip.textContent(),/approve or reject/i);
 await page.keyboard.press('Escape');
 await copyId.hover();
 await tooltip.waitFor();
 assert.equal(await tooltip.textContent(),'Copy Mercury Carnet ID');
 await page.keyboard.press('Escape');
 await tooltip.waitFor({state:'hidden'});
 await copyId.click();
 await page.waitForFunction(async()=>await navigator.clipboard.readText()==='MERCURY-CHECK-041');
 await copyPin.focus();
 await tooltip.waitFor();
 assert.equal(await tooltip.textContent(),'Copy Mercury Carnet PIN');
 await page.keyboard.press('Enter');
 await page.waitForFunction(async()=>await navigator.clipboard.readText()==='004219');
 await page.getByText('Mercury Carnet PIN copied.').first().waitFor();
 assert.equal(await details.getByRole('textbox',{name:/Mercury Carnet|Formal Undertaking/}).count(),0);
 await goods.fill('Workshop instruments');
 await use.fill(editedUse);
 await page.waitForFunction(()=>/Commercial samples[,\s]+Exhibition and fairs/.test(document.querySelector('#pack-document-preview')?.textContent||''));
 const upload=details.getByLabel('Upload General List CSV',{exact:true});
 const download=details.getByRole('button',{name:'Download General List CSV',exact:true});
 assert((await download.boundingBox()).x<(await upload.boundingBox()).x);
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
 await page.waitForFunction(react=>Object.values(localStorage).some(value=>
  value.includes('Workshop instruments')&&value.includes('Portable instruments')&&value.includes(
    react?'"use":["Commercial samples","Exhibition and fairs"]':'"use":"Commercial samples, Exhibition and fairs"'
  )),react);
 await page.reload();
 await details.waitFor();
 assert.equal(await use.inputValue(),editedUse);
 assert.equal(await goods.inputValue(),'Workshop instruments');
 assert.equal(await fact('Mercury Carnet ID').textContent(),'MERCURY-CHECK-041');
 assert.equal(await fact('Mercury Carnet PIN').textContent(),'004219');
 if(engineName==='chromium')await columns.screenshot({path:path.join(out,framework+'-chamber-carnet-details.png')});
 await page.setViewportSize({width:390,height:844});
 await assertNoOverflow(page);
 await page.waitForFunction(()=>{
  const sheet=document.querySelector('#pack-document-preview .document-scaled-page, #pack-document-preview .paper-space .native-paper');
  return sheet?.getBoundingClientRect().width>=90;
 });
 await page.getByRole('group',{name:'Review view'}).getByRole('button',{name:'Application details',exact:true}).click();
 await page.waitForFunction(()=>{
  const [details,processing]=document.querySelector('.carnet-application-columns').children;
  const a=details.getBoundingClientRect(), b=processing.getBoundingClientRect();
  return a.width>0&&Math.abs(a.x-b.x)<3&&b.y>=a.bottom;
 });
 await page.setViewportSize({width:1440,height:900});
 await page.goto(root+(react?'/#chamber/applications/Approved/cloud-ata-approved':'/vue/#/chamber/applications/cloud-ata-approved'));
 await details.waitFor();
 assert.equal(await details.getByRole('textbox').count(),0);
 assert.match(await fact(useLabel).textContent(),/professional equipment/i);
 assert.equal(await fact('Goods Type').textContent(),'Machinery');
 assert(await copyId.isEnabled()&&await copyPin.isEnabled());
 assert.equal(await upload.count(),0);
 assert(await download.isEnabled());
 await detailTab('Summary').click();
 await summaryTitle.waitFor();
 await feesTitle.waitFor();
 if(react)assert(!(await sidebar.getByLabel('Certification fee (£)',{exact:true}).isEditable()));
 else assert.equal(await sidebar.getByRole('button',{name:'Recalculate fees',exact:true}).count(),0);
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('group',{name:'Review view'}).getByRole('button',{name:'Application details',exact:true}).click();
 await assertNoOverflow(page);
 const [mobileSummary,mobileFees]=await Promise.all([summaryTitle.boundingBox(),feesTitle.boundingBox()]);
 assert(Math.abs(mobileFees.x-mobileSummary.x)<3&&mobileFees.y>mobileSummary.y+20,JSON.stringify({mobileSummary,mobileFees}));
}

async function checkCertificateReview(page, framework) {
 const react=framework==='react';
 const data=await page.evaluate(react=>{
  const key=react?'ecert-chamber-preview-v1':'trade-documents-vue-comparison-v1';
  const workspace=JSON.parse(localStorage.getItem(key));
  const records=react?workspace.apps:workspace.records;
  const sample=records.find(record=>record.id===(react?'ch-app-0':'sample-0'));
  const pending={...sample,id:'cloud-uk-certificate',status:'Pending',certificate:'',issueDate:'',stampDate:'',
   purchaseOrder:'PO-2026-123',applicantSignatory:'Jamie Taylor',applicantEmail:'jamie+exports@example.com',
   ...(react?{docs:['coo'],lockedBy:'',assigned:''}:{document:'UK Certificate of Origin',documents:['UK Certificate of Origin'],owner:''})};
  records.push(pending);
  records.push({...pending,id:'cloud-combined-certificates',reference:'DEM0053204/123456789/U',
   ...(react?{docs:['eur','arab']}:{document:'EUR1',documents:['EUR1','Arab Certificate of Origin']})});
  return {key,workspace};
 },react);
 await page.addInitScript(({key,workspace})=>{
  if(sessionStorage.getItem('cloud-coo-seeded'))return;
  localStorage.setItem(key,JSON.stringify(workspace));
  sessionStorage.setItem('cloud-coo-seeded','1');
 },data);
 const root='http://127.0.0.1:5204/after';
 await page.goto(root+(react?'/?cloud-coo#chamber/applications/Pending/cloud-uk-certificate':'/vue/?cloud-coo#/chamber/applications/cloud-uk-certificate'));
 const sidebar=page.locator('#pack-details-panel');
 const tab=name=>sidebar.getByRole(react?'tab':'button',{name,exact:true});
 const layout=sidebar.locator('.certificate-application-columns');
 const applicant=layout.getByRole('region',{name:'UK Certificate of Origin application details'});
 await applicant.waitFor();
 assert(await applicant.getByText('Jamie Taylor',{exact:true}).isVisible());
 assert.equal(await applicant.getByRole('link',{name:'jamie+exports@example.com'}).getAttribute('href'),'mailto:jamie%2Bexports@example.com');
 assert.match(await applicant.locator('dl').filter({hasText:'Formal Undertaking Expiry Date'}).locator('dd').textContent(),/2027/);
 const number=await applicant.locator('#review-certificate').textContent();
 assert.match(number,/^[a-z\d]{10}$/);
 assert.match(number,/[a-z]/);
 assert.match(number,/\d/);
 const paper=page.locator('#pack-document-preview .certificate-coo').first();
 assert((await paper.textContent()).includes(number));
 await page.locator('#pack-document-preview').getByRole('button',{name:'Read full size',exact:true}).click();
 const reader=page.getByRole('dialog',{name:'Read document',exact:true});
 await reader.waitFor();
 assert((await reader.locator('.certificate-coo').first().textContent()).includes(number));
 await page.keyboard.press('Escape');
 await reader.waitFor({state:'hidden'});
 const issue=layout.getByLabel(/Issue Date/i),stamp=layout.getByLabel(/Stamp Date/i);
 const today=await page.evaluate(()=>{
  const now=new Date();
  return [now.getFullYear(),now.getMonth()+1,now.getDate()].map(n=>String(n).padStart(2,'0')).join('-');
 });
 assert.equal(await issue.getAttribute('type'),'date');
 assert.equal(await stamp.getAttribute('type'),'date');
 assert.equal(await issue.inputValue(),today);
 assert.equal(await stamp.inputValue(),today);
 const po=layout.getByRole('textbox',{name:/P\.O\. Number/});
 const reference=layout.getByRole('textbox',{name:/Chamber Reference/});
 assert.equal(await po.inputValue(),'PO-2026-123');
 await po.fill('PO-CHECK-2');
 await reference.fill('CH-COO-42');
 await issue.fill('2026-11-18');
 await stamp.fill('2026-11-19');
 await layout.getByRole('combobox',{name:'Workflow step',exact:true}).selectOption({index:1});
 await page.waitForFunction(()=>Object.values(localStorage).some(value=>value.includes('CH-COO-42')&&value.includes('2026-11-19')));
 await page.reload();
 await applicant.waitFor();
 assert.equal(await applicant.locator('#review-certificate').textContent(),number);
 assert.equal(await po.inputValue(),'PO-CHECK-2');
 assert.equal(await reference.inputValue(),'CH-COO-42');
 assert.equal(await issue.inputValue(),'2026-11-18');
 assert.equal(await stamp.inputValue(),'2026-11-19');
 await tab('Summary').click();
 await sidebar.getByRole('heading',{name:'Application summary',exact:true}).waitFor();
 await sidebar.getByRole('heading',{name:'Fees',exact:true}).waitFor();
 await tab('Application').click();
 const panels=layout.locator(':scope > *');
 const [left,right]=await Promise.all([panels.nth(0).boundingBox(),panels.nth(1).boundingBox()]);
 assert(right.x>=left.x+left.width&&Math.abs(right.y-left.y)<3);
 if(engineName==='chromium')await sidebar.screenshot({path:path.join(out,framework+'-pending-uk-certificate.png')});
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('group',{name:'Review view'}).getByRole('button',{name:'Application details',exact:true}).click();
 await assertNoOverflow(page);
 const [first,second]=await Promise.all([panels.nth(0).boundingBox(),panels.nth(1).boundingBox()]);
 assert(Math.abs(first.x-second.x)<3&&second.y>=first.y+first.height);

 await page.setViewportSize({width:1440,height:900});
 await page.goto(root+(react?'/#chamber/applications/Pending/cloud-combined-certificates':'/vue/#/chamber/applications/cloud-combined-certificates'));
 const eur=layout.getByRole('textbox',{name:'EUR1 certificate number',exact:true});
 const arab=layout.getByRole('textbox',{name:'Arab C of O certificate number',exact:true});
 assert.match(await eur.inputValue(),/^[a-z]\d{7,8}$/);
 assert.match(await arab.inputValue(),/^[a-z]{1,2}\d{6,9}$/);
 const declaration=layout.getByLabel('Box 12 Date',{exact:true});
 const endorsement=layout.getByLabel('Box 11 Date',{exact:true});
 assert.equal(await declaration.inputValue(),today);
 assert.equal(await endorsement.inputValue(),today);
 await eur.fill('WRONG');
 await arab.fill('A12345');
 await layout.getByRole('alert').filter({hasText:'EUR1 certificate number is invalid - enter 1 letter followed by 7 to 8 digits'}).waitFor();
 await layout.getByRole('alert').filter({hasText:'Arab C of O certificate number is invalid - enter 1 or 2 letters followed by 6 to 9 digits'}).waitFor();
 await page.getByRole('button',{name:'Approve',exact:true}).click();
 await page.waitForFunction(()=>document.activeElement?.id==='review-certificate-eur');
 assert.equal(await eur.getAttribute('aria-invalid'),'true');
 assert.equal(await arab.getAttribute('aria-invalid'),'true');
 assert(await page.locator('.pack-summary-status').getByText('Pending',{exact:true}).isVisible());
 await eur.fill('a1234567');
 await arab.fill('AB123456789');
 await page.waitForFunction(()=>!document.querySelector('.certificate-application-columns [id^="review-certificate-"][role="alert"]'));
 await declaration.fill('2026-11-18');
 await endorsement.fill('2026-11-19');
 const eurPaper=page.locator('#pack-document-preview .certificate-eur').first();
 assert((await eurPaper.textContent()).includes('a1234567'));
 assert.match(await eurPaper.locator('.movement-declaration').textContent(),/18\s+Nov|18\/11/);
 assert.match(await eurPaper.locator('.movement-customs').textContent(),/19\s+Nov|19\/11/);
 const preview=page.locator('#pack-document-preview');
 if(react){
  await preview.getByRole('button',{name:'Next',exact:true}).click();
 }else{
  await preview.getByRole('combobox',{name:'Document',exact:true}).selectOption({label:'Arab Certificate of Origin'});
 }
 const arabPaper=preview.locator('.certificate-arab').first();
 assert((await arabPaper.textContent()).includes('AB123456789'));
 assert(!(await arabPaper.textContent()).includes('a1234567'));
 await page.waitForFunction(()=>Object.values(localStorage).some(value=>value.includes('AB123456789')&&value.includes('a1234567')));
 await page.reload();
 assert.equal(await eur.inputValue(),'a1234567');
 assert.equal(await arab.inputValue(),'AB123456789');
 assert.equal(await declaration.inputValue(),'2026-11-18');
 assert.equal(await endorsement.inputValue(),'2026-11-19');
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
   const readFullSize=preview.locator.getByRole('button',{name:'Read full size',exact:true});
   await readFullSize.click();
   const reader=page.getByRole('dialog',{name:'Read document',exact:true});
   await reader.waitFor();
   if(framework==='react')assert.equal(await reader.getByRole('combobox',{name:'Zoom',exact:true}).inputValue(),'100');
   else assert(await reader.locator('.fit-100').isVisible());
   const readerPaper=reader.locator(willReadPaper[framework]).first();
   await readerPaper.waitFor({state:'visible'});
   await page.waitForFunction(selector=>document.querySelector(selector)?.getBoundingClientRect().width>=638,
    (framework==='vue'?'dialog[open] ':'.chamber-document-dialog ')+willReadPaper[framework]);
   await page.keyboard.press('Escape');
   await reader.waitFor({state:'hidden'});
   assert.equal(await zoom.inputValue(),'page');
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
   if(!(await details.locator('.certificate-application-columns').count())){
    assert(Math.abs(bounds[0].top-bounds[1].top)<4,JSON.stringify(bounds));
   }
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
   assert(await canvas.evaluate(element=>element.width/parseFloat(element.style.width)>=1.99));
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
   await page.setViewportSize({width:1440,height:900});
   await checkCertificateReview(page,framework);
   await page.setViewportSize({width:1440,height:900});
   await page.goto('http://127.0.0.1:5204/after'+(framework==='react'?'/#dashboard':'/vue/#/exporter/dashboard'));
   const rail=page.locator('.sidebar-collapse-toggle:visible').first();
   await rail.waitFor();
   const label=await rail.getAttribute('aria-label');
   assert(label);
   await rail.hover();
   const tip=page.locator('#workspace-tooltip');
   await tip.waitFor();
   assert.equal(await tip.textContent(),label);
   const tooltipBounds=await tip.boundingBox();
   assert(tooltipBounds.x>=0&&tooltipBounds.y>=0&&tooltipBounds.x+tooltipBounds.width<=1440);
   await page.keyboard.press('Escape');
   await tip.waitFor({state:'hidden'});
   await rail.focus();
   await tip.waitFor();
   await page.evaluate(()=>{document.documentElement.dataset.theme='dark'});
   assert.equal(await tip.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(41, 43, 47)');
   await page.goto('http://127.0.0.1:5204/after'+(framework==='react'?'/#new':'/vue/#/exporter/applications/sample-draft-20261117-ata'));
   const reference=page.getByRole('textbox',{name:/Your reference/i}).first();
   await reference.focus();
   await tip.waitFor();
   assert.match(await tip.textContent(),/service assigns the application reference/i);
   await page.keyboard.press('Escape');
   await tip.waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);
   results.push({framework,...metrics,pass:true});
  } catch(error){
   results.push({framework,error:error.message,stack:error.stack,errors,pass:false});
   await page.screenshot({path:path.join(out,framework+'-failed.png')}).catch(()=>{});
  } finally {await context.close();}
 }
 console.log(JSON.stringify(results,null,2));
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 await browser.close();
 server.close();
 process.exitCode=results.some(result=>!result.pass)?1:0;
})().catch(error=>{console.error(error);process.exit(1)});
