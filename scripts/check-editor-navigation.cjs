const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve('_site-check'),out=path.resolve('qa-results');fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf','.png':'image/png','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');if(!name||name.endsWith('/'))name+='index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res)});
const results=[];let browser;
async function screenshot(page,name){await page.screenshot({path:path.join(out,'screenshots',name+'.png'),fullPage:name.includes('dashboard-1366')});}
async function check(name,fn){const context=await browser.newContext({viewport:{width:1366,height:900},locale:'en-GB'}),page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));try{await fn(page);assert.deepEqual(errors,[],'Uncaught page errors');results.push({name,pass:true});console.log('PASS',name)}catch(error){await screenshot(page,name+'-failed').catch(()=>{});results.push({name,pass:false,error:error.message,stack:error.stack,errors,body:(await page.locator('body').innerText().catch(()=>'' )).slice(0,8000)});console.log('FAIL',name,error.message)}finally{await context.close()}}
async function loaded(page,url){await page.goto('http://127.0.0.1:5204'+url);await page.locator(url.startsWith('/vue/')?'#main':url.includes('#chamber/')?'#chamber-main':'#main-content').waitFor();await page.evaluate(()=>document.fonts.ready);}
async function preferences(page,framework,{language='en',layout='sidebar',theme='light'}={}){await page.evaluate(({framework,language,layout,theme})=>{if(framework==='react'){localStorage.setItem('trade-documents-language-v1',language);localStorage.setItem('trade-documents-shell-layout-v1',layout);localStorage.setItem('ecert-appearance-v1',theme)}else{const key='trade-documents-vue-comparison-v1',state=JSON.parse(localStorage.getItem(key));if(!state)throw Error('Vue preferences were not saved');state.ui={...state.ui,...JSON.parse(localStorage.getItem(key+'-ui')||'{}'),language,layout,theme};localStorage.setItem(key+'-ui',JSON.stringify(state.ui));localStorage.setItem(key,JSON.stringify(state))}},{framework,language,layout,theme});await page.reload();await page.locator('main').waitFor();await page.evaluate(()=>document.fonts.ready);}
async function withinPage(page){const size=await page.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth}));assert.ok(size.content<=size.width+2,`Page width ${size.content}px exceeds ${size.width}px`)}
async function openDraft(page,doc){
 await loaded(page,'/#applications');
 const draftTab=page.getByRole('tab',{name:/^Drafts/}).or(page.getByRole('button',{name:/^Drafts/}));await draftTab.first().click();
 await page.locator('.list-options-search input').fill('SAMPLE-DRAFT-'+doc.toUpperCase());
 const row=page.getByRole('row').filter({has:page.getByText('SAMPLE-DRAFT-'+doc.toUpperCase(),{exact:true})}).first();await row.click({button:'right'});await page.getByRole('menuitem',{name:'Continue',exact:true}).click();
 await page.locator('.editor-application-navigation').waitFor();
}
(async()=>{await new Promise(resolve=>server.listen(5204,'127.0.0.1',resolve));browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
for(const doc of ['ata','coo','arab','eur','eurmed','invoice','iic','upload'])await check('react-editor-navigation-'+doc,async page=>{
 await loaded(page,'/#applications');await preferences(page,'react',{layout:'sidebar'});await page.locator('.sidebar-collapse-toggle').click();await openDraft(page,doc);
 const rail=page.locator('#exporter-navigation'),outline=page.locator('.editor-application-navigation');assert.equal(Math.round((await rail.boundingBox()).width),80);assert.equal(await rail.locator('.workspace-navigation>button').count(),6);
 assert.equal(await rail.locator('.application-outline').count(),0);assert.ok((await outline.boundingBox()).width>=200);assert.ok((await outline.locator('.outline-label').first().boundingBox()).width>60,'Application labels remain readable');
 assert.equal((await outline.locator('.editor-application-reference').innerText()).trim(),'SAMPLE-DRAFT-'+doc.toUpperCase());
 await outline.getByRole('button',{name:/^Setup\./}).click();if(doc==='ata')assert.ok((await outline.innerText()).includes('Carnet details'));else assert.ok(/(?:Shipment|Certificate|Document|Invoice) details/.test(await outline.innerText()));
 await withinPage(page);await screenshot(page,'react-editor-'+doc+'-collapsed');
 await page.locator('.sidebar-collapse-toggle').click();assert.ok((await rail.boundingBox()).width>200);assert.ok((await outline.locator('.outline-label').first().boundingBox()).width>60);await screenshot(page,'react-editor-'+doc+'-expanded');
 await page.locator('.editor-back-applications').click();await page.locator('.list-options-toggle').waitFor();const selected=page.getByRole('tab',{name:/^Drafts/});if(await selected.count())assert.equal(await selected.getAttribute('aria-selected'),'true');
});
for(const [width,language,theme,layout]of [[1024,'en','light','header'],[390,'en','light','sidebar'],[1366,'ar','dark','sidebar'],[1366,'nl','light','header']])await check('react-editor-responsive-'+width+'-'+language,async page=>{
 await loaded(page,'/#applications');await preferences(page,'react',{layout,theme});await page.locator('.sidebar-collapse-toggle').click();await openDraft(page,'ata');
 if(language!=='en'){await page.locator('.language-flag-button:visible').first().click();await page.getByRole('menuitemradio',{name:new RegExp(language==='ar'?'العربية':'Dutch')}).click();await page.waitForFunction(language=>document.documentElement.lang===language,language)}
 await page.setViewportSize({width,height:width===390?844:900});await page.evaluate(()=>scrollTo(0,0));await withinPage(page);
 const outline=page.locator('.editor-application-navigation');if(width===390){const sections=outline.locator('.outline-mobile-toggle');await sections.click();assert.equal(await sections.getAttribute('aria-expanded'),'true');assert.ok(await outline.locator('.outline-link').first().isVisible());await screenshot(page,'react-editor-mobile-sections');await outline.locator('.outline-link').first().click();assert.equal(await sections.getAttribute('aria-expanded'),'false')}
 else {const nav=await outline.boundingBox(),form=await page.locator('.editor-work-area').boundingBox();assert.ok(language==='ar'?form.x+form.width<=nav.x:nav.x+nav.width<=form.x,'Steps and form do not overlap');assert.ok((await outline.locator('.outline-label').first().boundingBox()).width>60)}
 await screenshot(page,'react-editor-responsive-'+width+'-'+language);
});
await browser.close();server.close();fs.writeFileSync(path.join(out,'editor-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).map(r=>r.name)},null,2));process.exitCode=results.some(r=>!r.pass)?1:0;
})().catch(error=>{console.error(error);process.exit(1)});
