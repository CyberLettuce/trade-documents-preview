const {chromium}=require('./cloud-browser.cjs');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve('_site-check'),out=path.resolve('qa-results');fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf','.png':'image/png','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');if(!name||name.endsWith('/'))name+='index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res)});
const results=[];let browser;
async function screenshot(page,name){await page.screenshot({path:path.join(out,'screenshots',name+'.png'),fullPage:name.includes('dashboard-1366')});}
async function check(name,fn){const context=await browser.newContext({viewport:{width:1366,height:900},locale:'en-GB'}),page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));try{await fn(page);assert.deepEqual(errors,[],'Uncaught page errors');results.push({name,pass:true});console.log('PASS',name)}catch(error){await screenshot(page,name+'-failed').catch(()=>{});results.push({name,pass:false,error:error.message,stack:error.stack,errors,body:(await page.locator('body').innerText().catch(()=>'' )).slice(0,8000)});console.log('FAIL',name,error.message)}finally{await context.close()}}
async function ready(page){await page.waitForFunction(()=>[...document.querySelectorAll('main')].some(m=>m.innerText.trim().length>140&&m.querySelector('button,input,a')));await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function loaded(page,url){await page.goto('http://127.0.0.1:5204'+url);await page.locator(url.startsWith('/vue/')?'#main':url.includes('#chamber/')?'#chamber-main':'#main-content').waitFor();await ready(page);}
async function preferences(page,framework,{language='en',layout='sidebar',theme='light'}={}){await page.evaluate(({framework,language,layout,theme})=>{if(framework==='react'){localStorage.setItem('trade-documents-language-v1',language);localStorage.setItem('trade-documents-shell-layout-v1',layout);localStorage.setItem('ecert-appearance-v1',theme)}else{const key='trade-documents-vue-comparison-v1',state=JSON.parse(localStorage.getItem(key));if(!state)throw Error('Vue preferences were not saved');state.ui={...state.ui,...JSON.parse(localStorage.getItem(key+'-ui')||'{}'),language,layout,theme};localStorage.setItem(key+'-ui',JSON.stringify(state.ui));localStorage.setItem(key,JSON.stringify(state))}},{framework,language,layout,theme});await page.reload();await page.locator('main').waitFor();await ready(page);}
async function withinPage(page){const size=await page.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth}));assert.ok(size.content<=size.width+2,`Page width ${size.content}px exceeds ${size.width}px`)}

const {PDFDocument,StandardFonts,degrees,rgb}=require('pdf-lib');
const {seedPdf,openPdf}=require('./pdf-check-helpers.cjs');
const engine=process.env.CHECK_BROWSER||'chromium';
const reviewURL=f=>f==='react'?'/#chamber/applications/Pending/ch-app-0':'/vue/#/chamber/applications/sample-0';
async function mixedPdf(){
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);
 for(let i=0;i<7;i++){
  const p=pdf.addPage(i===4?[842,1191]:i===5?[792,612]:[595,842]);
  if(i<4)p.setRotation(degrees(i*90));if(i===6)p.setCropBox(25,25,545,792);
  p.drawText('Compatibility page '+(i+1),{x:45,y:p.getHeight()-60,size:18,font});
  p.drawText('End of page '+(i+1),{x:45,y:45,size:12,font});
  p.drawRectangle({x:35,y:35,width:p.getWidth()-70,height:p.getHeight()-70,borderWidth:1,borderColor:rgb(.3,.3,.3)});
 }
 const field=pdf.getForm().createTextField('Customer reference');field.setText('PDF-ROUNDTRIP-20261120');field.addToPage(pdf.getPage(4),{x:50,y:700,width:250,height:30});
 pdf.setTitle('Synthetic PDF compatibility pack');pdf.setLanguage('en-GB');return Buffer.from(await pdf.save());
}
async function stampDownload(page,framework){
 await page.getByRole('button',{name:'Stamp document',exact:true}).first().click();const modal=page.getByRole('dialog');
 await modal.locator('canvas').waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('[role=dialog] canvas,dialog[open] canvas')].some(c=>c.width>100));
 const place=modal.getByRole('button',{name:'Place selected stamp',exact:true});
 if(await place.count())await place.click();else await modal.locator('.stamp-page').click({position:{x:160,y:150}});
 await modal.locator('.placed-stamp,.stamp-placement').first().waitFor();
 await screenshot(page,framework+'-stamping-desktop');await page.setViewportSize({width:390,height:844});await withinPage(page);await screenshot(page,framework+'-stamping-mobile');await page.setViewportSize({width:1366,height:900});
 if(framework==='vue'){await modal.locator('summary').filter({hasText:'More options'}).click();}
 const download=page.waitForEvent('download');await modal.getByRole('button',{name:framework==='vue'?'Download stamped PDF':'Save stamped document',exact:true}).click();
 const file=await download,dest=path.join(out,framework+'-stamped.pdf');await file.saveAs(dest);
 return fs.readFileSync(dest);
}
(async()=>{
 await new Promise(r=>server.listen(5204,'127.0.0.1',r));browser=await chromium.launch({});
 const fixture=await mixedPdf();fs.writeFileSync(path.join(out,'mixed-pages-original.pdf'),fixture);
 for(const framework of ['react','vue']){
  await check(framework+'-mixed-pdf-and-stamp',async page=>{
   await loaded(page,reviewURL(framework));await seedPdf(page,framework,fixture);const viewer=await openPdf(page,framework);
   await viewer.locator('canvas:visible').waitFor();
   for(let i=1;i<=7;i++){
    await viewer.getByRole('button',{name:'Text view',exact:true}).click();await viewer.getByText('Compatibility page '+i,{exact:false}).waitFor();
    await viewer.getByRole('button',{name:'Document view',exact:true}).click();await viewer.locator('canvas:visible').waitFor();
    assert.equal(await viewer.getByRole('alert').count(),0);await screenshot(page,framework+'-mixed-pdf-'+i);
    if(i<7)await viewer.getByRole('button',{name:/^Next( PDF)? page$/}).click();
   }
   await page.reload();await ready(page);await openPdf(page,framework);
   const stamped=await stampDownload(page,framework),output=await PDFDocument.load(stamped),original=await PDFDocument.load(fixture);
   assert.equal(output.getPageCount(),7);assert.deepEqual(output.getPages().map(p=>[p.getWidth(),p.getHeight(),p.getRotation().angle,p.getCropBox()]),original.getPages().map(p=>[p.getWidth(),p.getHeight(),p.getRotation().angle,p.getCropBox()]));
   assert.equal(output.getForm().getTextField('Customer reference').getText(),'PDF-ROUNDTRIP-20261120');assert(!stamped.equals(fixture));
  });
  await check(framework+'-malformed-pdf-recovery',async page=>{
   await loaded(page,reviewURL(framework));await seedPdf(page,framework,Buffer.from('%PDF-1.7\nNot a valid PDF file'));const show=page.locator('button[aria-controls=pack-page-list][aria-expanded=false]:visible').first();if(await show.count())await show.click();await page.getByRole('button',{name:/accessible-test\.pdf/}).first().click();const viewer=page.locator(framework==='react'?'.application-pdf-viewer':'.pdf-viewer');
   await viewer.getByText(framework==='react'?/This PDF could not be displayed/:/Invalid PDF structure/).waitFor();assert((await viewer.innerText()).match(/unavailable|could not|cannot|failed|Invalid|unable/i));await screenshot(page,framework+'-malformed-pdf');
   await page.getByRole('button',{name:/Back to.*applications/i}).first().click();await page.locator('.list-options-toggle').waitFor();
  });
  for(const workspace of ['exporter','chamber'])await check(framework+'-'+workspace+'-text-spacing-keyboard',async page=>{
   const url=framework==='react'?(workspace==='chamber'?'/#chamber/applications/Pending':'/#applications'):`/vue/#/${workspace}/applications`;
   await loaded(page,url);await screenshot(page,framework+'-'+workspace+'-baseline');
   await page.addStyleTag({content:'*:not(svg):not(svg *){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}'});
   await withinPage(page);const toggle=page.locator('.list-options-toggle');await toggle.focus();await page.keyboard.press('Enter');assert.equal(await toggle.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert(await toggle.evaluate(e=>e===document.activeElement));
   await page.setViewportSize({width:390,height:844});await withinPage(page);if(framework==='react'&&workspace==='chamber'){const header=page.locator('th[data-column="Application / exporter / holder"]');assert.equal(await header.evaluate(e=>getComputedStyle(e).fontSize),'0px','Compact heading must not overlap the full heading');}await screenshot(page,framework+'-'+workspace+'-text-spacing-mobile');
   if(engine!=='webkit'){await page.emulateMedia({forcedColors:'active'});assert(await page.evaluate(()=>matchMedia('(forced-colors:active)').matches));await toggle.focus();const style=await toggle.evaluate(e=>({outline:getComputedStyle(e).outlineStyle,width:parseFloat(getComputedStyle(e).outlineWidth)}));assert(style.outline!=='none'&&style.width>0,'Forced-colours keyboard focus needs an outline');await screenshot(page,framework+'-'+workspace+'-forced-colours');}
  });
  if(engine==='chromium')await check(framework+'-generated-document-print',async page=>{
   await loaded(page,framework==='react'?'/#chamber/applications/Pending':reviewURL(framework));await page.evaluate(()=>{window.print=()=>{window.printRequested=true}});if(framework==='react'){await page.locator('tbody tr').first().getByRole('button',{name:/^Print /}).click();await page.getByRole('dialog').waitFor();}
   const button=page.getByRole('button',{name:/^Print this (page|document) \/ PDF$/});await button.first().click();await page.waitForFunction(()=>window.printRequested===true);
   await page.emulateMedia({media:'print'});await page.pdf({path:path.join(out,framework+'-generated-print.pdf'),preferCSSPageSize:true,printBackground:true,tagged:true});
   await screenshot(page,framework+'-print-layout');assert.equal(await page.locator('a.skip:visible').count(),0,'Screen-only skip link must not print');const pdf=await PDFDocument.load(fs.readFileSync(path.join(out,framework+'-generated-print.pdf')));assert(pdf.getPageCount()>=1&&pdf.getPageCount()<=5,'Sample certificate should print a sensible number of pages');
  });
 }
 await browser.close();server.close();fs.writeFileSync(path.join(out,'acceptance-extras.json'),JSON.stringify({engine,version:require('playwright/package.json').version,results},null,2));console.log(JSON.stringify({checks:results.length,failed:results.filter(r=>!r.pass)},null,2));process.exitCode=results.some(r=>!r.pass)?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
