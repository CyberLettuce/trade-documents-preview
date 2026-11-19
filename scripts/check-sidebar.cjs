const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve('_site-check'),out=path.resolve('qa-results');fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf','.png':'image/png','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');if(!name||name.endsWith('/'))name+='index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res)});
const results=[];let browser;
async function screenshot(page,name){await page.screenshot({path:path.join(out,'screenshots',name+'.png'),fullPage:name.includes('dashboard-1366')});}
async function check(name,fn){const context=await browser.newContext({viewport:{width:1366,height:900},locale:'en-GB'}),page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));try{await fn(page);assert.deepEqual(errors,[],'Uncaught page errors');results.push({name,pass:true});console.log('PASS',name)}catch(error){await screenshot(page,name+'-failed').catch(()=>{});results.push({name,pass:false,error:error.message,errors,body:(await page.locator('body').innerText().catch(()=>'' )).slice(0,8000)});console.log('FAIL',name,error.message)}finally{await context.close()}}
async function loaded(page,url){await page.goto('http://127.0.0.1:5204'+url);await page.locator('main').waitFor();await page.evaluate(()=>document.fonts.ready);}
async function preferences(page,framework,{language='en',layout='sidebar',theme='light'}={}){await page.evaluate(({framework,language,layout,theme})=>{if(framework==='react'){localStorage.setItem('trade-documents-language-v1',language);localStorage.setItem('trade-documents-shell-layout-v1',layout);localStorage.setItem('ecert-appearance-v1',theme)}else{const key='trade-documents-vue-comparison-v1',state=JSON.parse(localStorage.getItem(key));if(!state)throw Error('Vue preferences were not saved');state.ui={...state.ui,language,layout,theme};localStorage.setItem(key,JSON.stringify(state))}},{framework,language,layout,theme});await page.reload();await page.locator('main').waitFor();await page.evaluate(()=>document.fonts.ready);}
async function withinPage(page){const size=await page.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth}));assert.ok(size.content<=size.width+2,`Page width ${size.content}px exceeds ${size.width}px`)}
(async()=>{await new Promise(resolve=>server.listen(5204,'127.0.0.1',resolve));browser=await chromium.launch();
for(const framework of ['react','vue'])for(const workspace of ['chamber','exporter'])for(const layout of ['sidebar','header'])await check(`${framework}-${workspace}-rail-${layout}`,async page=>{
 const url=framework==='react'?(workspace==='chamber'?'/#chamber/dashboard':'/#dashboard'):`/vue/#/${workspace}/dashboard`;
 const sidebar=page.locator(framework==='react'?(workspace==='chamber'?'#chamber-navigation':'#exporter-navigation'):'#workspace-sidebar'),toggle=page.locator('.sidebar-collapse-toggle'),main=page.locator('main').last();
 await loaded(page,url);await preferences(page,framework,{layout});await toggle.waitFor();
 assert.equal(await toggle.getAttribute('aria-expanded'),'true');const before=await main.boundingBox();await screenshot(page,`${framework}-${workspace}-${layout}-expanded`);
 await toggle.focus();await page.keyboard.press('Enter');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 await page.waitForFunction(()=>document.documentElement.dataset.sidebarCollapsed==='true');
 assert.equal(Math.round((await sidebar.boundingBox()).width),80);assert.ok((await main.boundingBox()).width>before.width+80,'Collapsed sidebar gives space back to page');await withinPage(page);
 assert.equal(await toggle.evaluate(el=>el===document.activeElement),true,'Toggle keeps keyboard focus');
 const nav=sidebar.locator('nav').first(),buttons=nav.locator(':scope > button');assert.ok(await buttons.count()>=6);for(const button of await buttons.all()){assert.ok(await button.getAttribute('aria-label'));const rect=await button.boundingBox();assert.ok(rect.width>=40&&rect.height>=40)}
 await screenshot(page,`${framework}-${workspace}-${layout}-collapsed`);
 await page.reload();await toggle.waitFor();assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(Math.round((await sidebar.boundingBox()).width),80);
 await buttons.nth(1).click();await page.locator('.list-options-toggle').waitFor();assert.equal(Math.round((await sidebar.boundingBox()).width),80,'Navigating keeps the rail collapsed');
 if(workspace==='chamber'&&framework==='react'){await buttons.nth(5).click();await buttons.nth(5).focus();await page.keyboard.press('Tab');assert.equal(await page.locator('.ch-subnav').evaluate(el=>el.contains(document.activeElement)),true,'Setup subpages are keyboard reachable');await page.keyboard.press('Enter')}
 if(layout==='sidebar'){
  const language=sidebar.locator(framework==='react'?'.language-flag-button':'.language-control button').first();
  if(await language.count()){await language.scrollIntoViewIfNeeded();await language.click();const menu=sidebar.locator('.language-menu');await menu.waitFor({state:'visible'});const box=await menu.boundingBox();assert.ok(box.width>=200&&box.x>=0&&box.x+box.width<=1366,'Language menu fits outside icon rail');await screenshot(page,`${framework}-${workspace}-rail-language`);await page.keyboard.press('Escape')}
 }
 await page.setViewportSize({width:1024,height:768});await withinPage(page);assert.equal(Math.round((await sidebar.boundingBox()).width),80);await screenshot(page,`${framework}-${workspace}-${layout}-rail-1024`);
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));assert.equal(await toggle.isVisible(),false);await withinPage(page);
 const open=page.getByRole('button',{name:'Open navigation',exact:true});await open.click();assert.ok((await sidebar.boundingBox()).width>=200,'Mobile navigation keeps full labels');await screenshot(page,`${framework}-${workspace}-${layout}-mobile-drawer`);await page.keyboard.press('Escape');
 await page.setViewportSize({width:1366,height:900});assert.equal(Math.round((await sidebar.boundingBox()).width),80,'Mobile use preserves desktop choice');await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');await page.reload();await toggle.waitFor();assert.equal(await toggle.getAttribute('aria-expanded'),'true');
});
for(const framework of ['react','vue'])for(const language of ['nl','et','ar','sv','pt'])await check(`${framework}-rail-${language}`,async page=>{
 await loaded(page,framework==='react'?'/#chamber/dashboard':'/vue/#/chamber/dashboard');await preferences(page,framework,{language,layout:'sidebar',theme:language==='ar'?'dark':'light'});
 const toggle=page.locator('.sidebar-collapse-toggle');await toggle.click();assert.ok(!(await toggle.getAttribute('aria-label')).includes('sidebar'),'Toggle label is translated');await withinPage(page);
 const side=page.locator(framework==='react'?'#chamber-navigation':'#workspace-sidebar'),rect=await side.boundingBox(),main=await page.locator('main').last().boundingBox();assert.equal(Math.round(rect.width),80);if(language==='ar'){assert.ok(rect.x>1200,'Arabic rail is on the right');assert.ok(main.x+main.width<=rect.x+1,'Arabic content clears rail')}
 await screenshot(page,`${framework}-rail-${language}`);
});
await browser.close();server.close();fs.writeFileSync(path.join(out,'sidebar-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).map(r=>r.name)},null,2));process.exitCode=results.some(r=>!r.pass)?1:0;
})().catch(error=>{console.error(error);process.exit(1)});
