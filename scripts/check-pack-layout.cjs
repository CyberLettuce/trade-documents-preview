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
   if(engineName==='chromium'){
    const rect=await header.boundingBox();
    const top=Math.max(0,Math.floor(rect.y)-8);
    await page.screenshot({path:path.join(out,framework+'-pending-layout.png'),clip:{x:0,y:top,width:1440,height:Math.min(550,900-top)}});
   }
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
   const canvas=viewer.locator('canvas');
   await page.waitForFunction(()=>[...document.querySelectorAll('.compact-fit-page canvas')].some(el=>el.style.width&&el.getBoundingClientRect().height>60));
   assert((await canvas.boundingBox()).width>90);
   await viewer.getByRole('button',{name:'Text view',exact:true}).click();
   await viewer.locator('.pdf-readable-content').waitFor();
   await viewer.getByRole('button',{name:'Document view',exact:true}).click();
   await page.setViewportSize({width:390,height:844});
   await assertNoOverflow(page);
   assert(await header.evaluate(el=>el.scrollWidth<=el.clientWidth+2));
   await page.setViewportSize({width:320,height:768});
   await assertNoOverflow(page);
   assert(await header.evaluate(el=>el.scrollWidth<=el.clientWidth+2));
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
