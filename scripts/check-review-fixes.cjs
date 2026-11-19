const {chromium}=require('playwright');
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

async function language(page,framework,name,code){
 await page.locator(framework==='react'?'.language-flag-button':'.language-control').first().click();
 await page.getByRole('menuitemradio',{name,exact:true}).click();
 await page.waitForFunction(code=>document.documentElement.lang===code,code);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}
(async()=>{
 await new Promise(resolve=>server.listen(5204,'127.0.0.1',resolve));
 browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
 for(const framework of ['react','vue'])for(const workspace of ['chamber','exporter'])await check(framework+'-'+workspace+'-reviewed-rows-languages',async page=>{
  const url=framework==='react'?(workspace==='chamber'?'/#chamber/applications/Pending':'/#applications'):'/vue/#/'+workspace+'/applications';
  await loaded(page,url);
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name));
  assert.equal(resources.filter(n=>/\/locales\/|language-(nl|sv|pt|other)/.test(n)).length,0,'English should not download other-language dictionaries');
  const cells=await page.locator('main tbody tr:first-child td').evaluateAll(cells=>cells.filter(c=>c.getBoundingClientRect().width>0).map(c=>({align:getComputedStyle(c).textAlign,vertical:getComputedStyle(c).verticalAlign,padding:parseFloat(getComputedStyle(c).paddingTop)})));
  assert(cells.length>2);assert(cells.every(c=>c.align==='center'&&c.vertical==='middle'&&c.padding<=7),JSON.stringify(cells));
  await screenshot(page,'fixed-'+framework+'-'+workspace+'-rows');
  for(const[name,code]of [['Dutch','nl'],['Estonian','et'],['العربية','ar'],['Swedish','sv'],['Portuguese','pt'],['English','en']]){
   await language(page,framework,name,code);await withinPage(page);
   if(code==='ar'&&framework==='vue'&&workspace==='chamber'){assert(!(await page.locator('thead').innerText()).includes('Reference / exporter'));assert(!(await page.locator('tbody').innerText()).includes('Unassigned'));}
   await screenshot(page,'fixed-'+framework+'-'+workspace+'-'+code);
  }
 });
 for(const framework of ['react','vue'])await check(framework+'-mobile-claims-readable',async page=>{
  await loaded(page,framework==='react'?'/#chamber/claims/Open':'/vue/#/chamber/claims');await page.setViewportSize({width:390,height:844});
  const heads=await page.locator('main thead th').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().width>0).map(n=>({text:n.textContent,width:n.getBoundingClientRect().width})));
  assert(heads.length<=3,'Only the useful summary columns should remain visible');assert(heads[0].width>95);await withinPage(page);await screenshot(page,'fixed-'+framework+'-claims-mobile');
 });
 for(const framework of ['react','vue'])await check(framework+'-review-panels-and-zoom',async page=>{
  await loaded(page,framework==='react'?'/#chamber/applications/Pending/ch-app-0':'/vue/#/chamber/applications/sample-0');
  const main=page.locator(framework==='react'?'.pack-main':'.document-pane');const before=await main.boundingBox();
  await page.getByRole('button',{name:'Hide application details',exact:true}).click();assert(!(await page.locator('#pack-details-panel').isVisible()));
  assert((await main.boundingBox()).width>before.width+100);
  await page.getByRole('button',{name:'Show files',exact:true}).click();assert(await page.locator('#pack-page-list').isVisible());
  await page.getByRole('button',{name:'Hide files',exact:true}).click();
  await page.getByRole('button',{name:'Show application details',exact:true}).click();
  const input=page.locator(framework==='react'?'#review-certificate':'#pack-details-panel input').first();await input.fill('test123abc');
  await page.getByRole('button',{name:'Hide application details',exact:true}).click();await page.getByRole('button',{name:'Show application details',exact:true}).click();assert.equal(await input.inputValue(),'test123abc');
  const zoom=page.locator('select').filter({has:page.locator('option[value="page"]')}).first();await zoom.selectOption('page');
  await page.reload();await ready(page);assert.equal(await page.locator('select').filter({has:page.locator('option[value="page"]')}).first().inputValue(),'page');
  await screenshot(page,'fixed-'+framework+'-review');
 });
 await check('vue-carnet-upload-and-save',async page=>{
  const url='/vue/#/exporter/applications/sample-draft-20261117-ata';await loaded(page,url);
  await page.locator('.document-choices button').filter({hasText:'Uploaded document'}).click();
  assert.deepEqual((await page.locator('.document-choices button[aria-pressed=true]').allTextContents()).map(s=>s.trim()),['ATA Carnet','Uploaded document']);
  assert((await page.locator('.application-outline,.editor-outline,.workflow-outline').allTextContents()).join('').includes('Carnet details'));
  const reference=page.getByLabel('Your reference',{exact:false}).first();await reference.fill('SAVE-FLUSH-CHECK');
  await page.getByRole('button',{name:'Back to Applications',exact:true}).click();await page.waitForURL('**/#/exporter/applications');await loaded(page,url);assert.equal(await page.getByLabel('Your reference',{exact:false}).first().inputValue(),'SAVE-FLUSH-CHECK');
  await screenshot(page,'fixed-vue-combined-carnet');
 });
 for(const framework of ['react','vue'])await check(framework+'-dashboard-order',async page=>{
  await loaded(page,framework==='react'?'/#chamber/dashboard':'/vue/#/chamber/dashboard');
  await page.getByLabel('Dashboard order',{exact:true}).selectOption('tasks');
  const performance=page.getByRole('heading',{name:'User Performance',exact:true}),queue=page.getByRole('heading',{name:'Applications to review',exact:true});
  assert((await performance.boundingBox()).y>(await queue.boundingBox()).y);await page.reload();await ready(page);assert.equal(await page.getByLabel('Dashboard order',{exact:true}).inputValue(),'tasks');
  await screenshot(page,'fixed-'+framework+'-tasks-first');
 });
 await check('vue-preferences-do-not-reserialize-applications',async page=>{
  await loaded(page,'/vue/#/exporter/applications');
  await page.evaluate(()=>{window.storageWrites=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){window.storageWrites.push(key);return original.call(this,key,value)}});
  await language(page,'vue','Dutch','nl');const keys=await page.evaluate(()=>window.storageWrites);assert(!keys.includes('trade-documents-vue-comparison-v1'));assert(keys.includes('trade-documents-vue-comparison-v1-ui'));
 });
 await check('react-row-context-menu-keeps-keyboard-access',async page=>{
  await loaded(page,'/#chamber/applications/Pending');const row=page.locator('tbody tr').first();await row.focus();await page.keyboard.press('Shift+F10');assert(await page.getByRole('menu').isVisible());await page.keyboard.press('Escape');assert.equal(await row.getAttribute('aria-expanded'),null);
 });

 for(const [name,url] of [['records','/#stored'],['chamber-settings','/#chamber/settings'],['exporter-settings','/#settings'],['document-pack','/#chamber/applications/Pending/ch-app-0']])await check('react-keyboard-'+name,async page=>{
  await loaded(page,url);const focused=[];await page.locator('main').click({position:{x:5,y:5}});
  for(let i=0;i<45;i++){await page.keyboard.press('Tab');await page.evaluate(()=>new Promise(requestAnimationFrame));const state=await page.evaluate(()=>({hidden:document.activeElement?.getAttribute('aria-hidden'),dummy:document.activeElement?.hasAttribute('data-tabster-dummy'),name:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent?.slice(0,60),tag:document.activeElement?.tagName}));assert(!state.dummy&&state.hidden!=='true','Keyboard focus must not land on a hidden focus sentinel');focused.push(state.name||state.tag)}
  assert(new Set(focused).size>4,'Keyboard should move through usable controls');
 });

 for(const framework of ['react','vue'])await check(framework+'-language-network-retry',async page=>{
  await loaded(page,framework==='react'?'/#applications':'/vue/#/exporter/applications');let requests=0;
  await page.route('**/assets/locales/nl.js*',route=>++requests===1?route.abort():route.continue());
  await page.locator(framework==='react'?'.language-flag-button':'.language-control').first().click();await page.getByRole('menuitemradio',{name:'Dutch',exact:true}).click();
  await page.locator('#language-load-error').waitFor();await page.waitForTimeout(250);assert.equal(requests,1,'Failed language loading should wait for Retry, not repeatedly retry on DOM changes');assert.equal(await page.locator('html').getAttribute('lang'),'en');
  await page.locator('#language-load-error button').click();await page.waitForFunction(()=>document.documentElement.lang==='nl');assert.equal(await page.locator('#language-load-error').count(),0);assert(requests>=2);
 });
 await browser.close();server.close();fs.writeFileSync(path.join(out,'review-fixes-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).map(r=>r.name)},null,2));process.exitCode=results.some(r=>!r.pass)?1:0;
})().catch(error=>{console.error(error);process.exit(1)});

