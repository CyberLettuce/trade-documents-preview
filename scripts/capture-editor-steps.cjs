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

async function captureSteps(framework){
 const context=await browser.newContext({viewport:{width:1906,height:1000},locale:'en-GB'}),page=await context.newPage();page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const doc of ['coo','ata','eur','eurmed','arab','invoice','iic','upload']){
  try{
   if(framework==='react'){await loaded(page,'/#applications');await preferences(page,'react');await openDraft(page,doc)}
   else{await loaded(page,'/vue/#/exporter/applications/sample-draft-20261117-'+doc);await preferences(page,'vue')}
   const outline=page.locator(framework==='react'?'.editor-application-navigation':'.editor-outline');
   const links=outline.locator(framework==='react'?'.outline-link':'.outline-child,.outline-parent:not([aria-expanded])');
   const labels=await links.evaluateAll(es=>es.map(e=>e.querySelector('.outline-label')?.textContent?.replace(/ · Complete/g,'').trim()||e.textContent.trim()));
   for(let i=0;i<labels.length;i++){
    const label=labels[i];if(label==='Setup')continue;
    const link=links.nth(i);if(!await link.isVisible()){const group=framework==='react'?link.locator('xpath=ancestor::li[contains(@class,"outline-branch")][1]').locator('.outline-group'):link.locator('xpath=ancestor::li[contains(@class,"outline-group")][1]').locator('.outline-parent');if(await group.count())await group.click()}
    await link.click();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.evaluate(()=>scrollTo(0,0));
    const name=framework+'-'+doc+'-'+String(i).padStart(2,'0'),form=page.locator(framework==='react'?'.editor-work-area':'.editor-fields');
    await page.screenshot({path:path.join(out,'screenshots',name+'.png')});
    await form.screenshot({path:path.join(out,'screenshots',name+'-form.png')});
    const data=await form.evaluate(el=>({headings:[...el.querySelectorAll('h1,h2,h3,legend')].map(e=>e.textContent),text:el.innerText.slice(0,10000),inputs:[...el.querySelectorAll('input,select,textarea')].map(e=>({label:e.getAttribute('aria-label')||e.closest('label')?.innerText,type:e.type,width:e.getBoundingClientRect().width})),width:el.getBoundingClientRect().width}));
    results.push({framework,doc,label,name,...data});
    const dialog=page.getByRole('dialog');if(await dialog.isVisible())await page.keyboard.press('Escape');
   }
  }catch(e){results.push({framework,doc,error:e.stack,body:(await page.locator('body').innerText()).slice(0,5000)});await page.screenshot({path:path.join(out,'screenshots',framework+'-'+doc+'-failed.png')});}
 }
 results.push({framework,errors});await context.close();
}
(async()=>{await new Promise(r=>server.listen(5204,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});await Promise.all([captureSteps('react'),captureSteps('vue')]);await browser.close();server.close();fs.writeFileSync(path.join(out,'editor-steps-baseline.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({framework,doc,label,name,error,errors,headings})=>({framework,doc,label,name,error,errors,headings})),null,2));})().catch(e=>{console.error(e);process.exit(1)});
