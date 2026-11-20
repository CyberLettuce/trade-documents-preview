const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve('_site-check'),out=path.resolve('qa-results');fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf','.png':'image/png','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');if(!name||name.endsWith('/'))name+='index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res)});
const results=[];let browser;
async function screenshot(page,name){await page.screenshot({path:path.join(out,'screenshots',name+'.png'),fullPage:name.includes('dashboard-1366')});}
async function check(name,fn){const context=await browser.newContext({viewport:{width:1366,height:900},locale:'en-GB'}),page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));try{await fn(page);assert.deepEqual(errors,[],'Uncaught page errors');results.push({name,pass:true});console.log('PASS',name)}catch(error){await screenshot(page,name+'-failed').catch(()=>{});results.push({name,pass:false,error:error.message,stack:error.stack,errors,body:(await page.locator('body').innerText().catch(()=>'' )).slice(0,8000)});console.log('FAIL',name,error.message)}finally{await context.close()}}
async function loaded(page,url){await page.goto('http://127.0.0.1:5204'+url);await page.locator(url.startsWith('/vue/')?'#main':url.includes('#chamber/')?'#chamber-main':'#main-content').waitFor();await page.evaluate(()=>document.fonts.ready);}
async function withinPage(page){const size=await page.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth}));assert.ok(size.content<=size.width+2,`Page width ${size.content}px exceeds ${size.width}px`)}
async function openDraft(page,doc){
 await loaded(page,'/#applications');
 const draftTab=page.getByRole('tab',{name:/^Drafts/}).or(page.getByRole('button',{name:/^Drafts/}));await draftTab.first().click();
 await page.locator('.list-options-search input').fill('SAMPLE-DRAFT-'+doc.toUpperCase());
 const row=page.getByRole('row').filter({has:page.getByText('SAMPLE-DRAFT-'+doc.toUpperCase(),{exact:true})}).first();await row.click({button:'right'});await page.getByRole('menuitem',{name:'Continue',exact:true}).click();
 await page.locator('.editor-application-navigation').waitFor();
}

(async()=>{
 await new Promise(resolve=>server.listen(5204,'127.0.0.1',resolve));
 browser=await chromium.launch();
 for(const framework of ['react','vue'])await check(framework+'-carnet',async page=>{
  await page.setViewportSize({width:1920,height:1000});
  const react=framework==='react';
  if(react)await openDraft(page,'ata');
  else await loaded(page,'/vue/#/exporter/applications/sample-draft-20261117-ata');
  const outline=page.locator(react?'.editor-application-navigation':'.editor-outline');
  async function go(label){
   const link=outline.getByRole('button',{name:label}).or(outline.getByRole('link',{name:label})).first();
   if(!await link.isVisible())await outline.getByRole('button',{name:/Carnet details/}).first().click();
   await link.click();
  }
  await go(/Box B/);assert.equal(await page.getByLabel(/Passport number/).count(),0);
  await go(/Box C/);const alignment=await page.locator('.carnet-use-options').evaluate(group=>[...group.querySelectorAll('input')].map(input=>{
   const label=input.labels?.[0]||input.closest('label');const a=input.getBoundingClientRect(),b=label.getBoundingClientRect();return Math.abs(a.y+a.height/2-b.y-b.height/2);
  }));assert(alignment.length&&alignment.every(delta=>delta<=4),JSON.stringify(alignment));
  await go(/Box P/);assert.equal(await page.getByLabel('Use',{exact:true}).count(),0);
  const visits=page.getByRole('spinbutton',{name:/^Visits 1/}),transits=page.getByRole('spinbutton',{name:/^Transits 1/});
  await visits.fill('0');await transits.fill('2');await screenshot(page,framework+'-box-p');
  await go(/General List/);
  const template=page.getByRole('button',{name:'CSV template',exact:true}),downloadCsv=page.getByRole('button',{name:'Download CSV',exact:true});
  assert((await template.boundingBox()).x<(await downloadCsv.boundingBox()).x,'Template is directly before Download CSV');
  const downloadPromise=page.waitForEvent('download');await template.click();const file=await downloadPromise;assert(file.suggestedFilename().endsWith('template.csv'));
  const bulk=page.getByLabel('Unit for all items',{exact:true}),item=page.getByLabel('Item 1 unit',{exact:true});
  const picker=await bulk.boundingBox(),itemField=await item.boundingBox();assert(Math.abs(picker.x-itemField.x)<3,'Bulk picker follows the Unit column: '+JSON.stringify({picker,itemField}));
  await bulk.selectOption('Gram');await page.getByRole('button',{name:'Apply to all',exact:true}).click();assert.equal(await item.inputValue(),'Gram');
  await screenshot(page,framework+'-general-list');
  await go(/^Review/);
  const summary=page.locator('.carnet-review-summary');await summary.waitFor();
  assert((await summary.locator('.transits').locator('..').innerText()).includes('2'));
  assert.equal(await summary.getByRole('table',{name:'ATA Carnet General List'}).count(),1);
  assert((await page.locator(react?'.editor-preview-column':'.editor-preview').boundingBox()).x>(await summary.boundingBox()).x,'Live preview alongside Review');
  await page.evaluate(()=>scrollTo(0,0));await screenshot(page,framework+'-carnet-review');
  await summary.getByRole('button',{name:'Edit: Destination and transit countries'}).click();await transits.waitFor();assert.equal(await transits.inputValue(),'2');
  await go(/^Review/);await summary.waitFor();
  await page.setViewportSize({width:390,height:844});await page.screenshot();await withinPage(page);
  await summary.locator('.carnet-review-itinerary').scrollIntoViewIfNeeded();await screenshot(page,framework+'-carnet-review-mobile');
 });
 fs.writeFileSync(path.join(out,'carnet-results.json'),JSON.stringify(results,null,2));await browser.close();server.close();process.exitCode=results.some(r=>!r.pass)?1:0;
})().catch(error=>{console.error(error);process.exit(1)});
