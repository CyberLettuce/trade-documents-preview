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

const axe=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
async function openSignature(page,framework,workspace){
 const url=framework==='react'?(workspace==='chamber'?'/#chamber/setup/signatures':'/#settings'):`/vue/#/${workspace}/${workspace==='chamber'?'setup/signatures':'settings/signatories'}`;
 await loaded(page,url);
 if(framework==='react'&&workspace==='exporter')await page.getByRole('tab',{name:'Signatories',exact:true}).click();
 await page.getByRole('button',{name:framework==='react'?/New signatory/i:/^New$/}).click();
 await page.locator('.signature-methods').waitFor();return page.getByRole('dialog');
}
async function transparentPng(page,src){assert(src.startsWith('data:image/png;base64,'));return page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d');x.drawImage(image,0,0);const pixels=x.getImageData(0,0,c.width,c.height).data;let ink=0,clear=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]>20)ink++;if(!pixels[i])clear++}return{ink,clear,width:c.width,height:c.height}},src)}
(async()=>{
 await new Promise(resolve=>server.listen(5204,'127.0.0.1',resolve));browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
 for(const framework of ['react','vue'])for(const workspace of ['exporter','chamber'])await check(framework+'-'+workspace+'-type-draw-signature',async page=>{
  let modal=await openSignature(page,framework,workspace);
  const name=modal.getByLabel(/^(Signatory name|Name)\s*\*?$/i).first();await name.fill('Signature Test');
  const reference=modal.getByLabel(/^Reference\s*\*?$/i);if(await reference.count())await reference.first().fill('SIG-TEST');
  await modal.getByRole('button',{name:'Type signature',exact:true}).click();await modal.getByLabel('Signature text',{exact:true}).fill('Alex Morgan');
  await page.waitForFunction(()=>document.querySelector('.signature-created-preview img')?.naturalWidth>0);
  const typed=await modal.locator('.signature-created-preview img').getAttribute('src'),pixels=await transparentPng(page,typed);assert(pixels.ink>100&&pixels.clear>100);assert(pixels.width<=1232);
  await screenshot(page,framework+'-'+workspace+'-typed-signature');
  await modal.getByRole('button',{name:'Use this signature',exact:true}).click();assert.equal(await modal.locator('.signature-saved-image img,.signature-thumb').first().getAttribute('src'),typed);
  await modal.getByRole('button',{name:/^Save( signatory)?$/i}).click();await modal.waitFor({state:'hidden'});await page.reload();await ready(page);assert((await page.locator('main img').evaluateAll(images=>images.map(i=>i.getAttribute('src')))).includes(typed),'Saved typed signature must survive reload');await page.getByRole('row').filter({hasText:'Signature Test'}).getByRole('button',{name:/Edit/i}).first().click();modal=page.getByRole('dialog');
  await modal.getByRole('button',{name:'Draw signature',exact:true}).click();const canvas=modal.locator('.signature-draw-canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();
  async function stroke(offset){await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.15,box.y+box.height*(.3+offset));await page.mouse.down();await page.mouse.move(box.x+box.width*.4,box.y+box.height*(.7-offset),{steps:12});await page.mouse.move(box.x+box.width*.75,box.y+box.height*(.3+offset),{steps:12});await page.mouse.up()}
  await stroke(0);await stroke(.1);const draw1=await modal.locator('.signature-created-preview img').getAttribute('src');await modal.getByRole('button',{name:'Undo last stroke',exact:true}).click();assert.notEqual(await modal.locator('.signature-created-preview img').getAttribute('src'),draw1);
  await modal.getByRole('button',{name:'Clear drawing',exact:true}).click();assert.equal(await modal.locator('.signature-created-preview img').count(),0);assert(await modal.getByRole('button',{name:'Use this signature',exact:true}).isDisabled());
  await stroke(0);const drawn=await modal.locator('.signature-created-preview img').getAttribute('src');const drawing=await transparentPng(page,drawn);assert(drawing.ink>100&&drawing.clear>100);
  await page.addScriptTag({content:axe});const violations=await page.evaluate(async()=>{const r=await axe.run(document.querySelector('[role=dialog],dialog[open]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations});assert.deepEqual(violations.map(v=>v.id),[]);
  await screenshot(page,framework+'-'+workspace+'-drawn-signature');
  await modal.getByRole('button',{name:'Use this signature',exact:true}).click();await modal.getByRole('button',{name:/^Save( signatory)?$/i}).click();await modal.waitFor({state:'hidden'});await page.reload();await ready(page);
  const saved=await page.locator('main img').evaluateAll(images=>images.map(i=>i.getAttribute('src')));assert(saved.includes(drawn),'Saved drawn signature must survive reload');
 });
 for(const framework of ['react','vue'])for(const language of ['en','nl','et','ar','sv','pt'])await check(framework+'-signature-mobile-'+language,async page=>{
  const url=framework==='react'?'/#chamber/setup/signatures':'/vue/#/chamber/setup/signatures';await loaded(page,url);await preferences(page,framework,{language,theme:'dark'});await page.setViewportSize({width:390,height:844});
  await page.locator('main .button.primary,main button.primary').first().click();await page.locator('.signature-methods button').nth(1).click();await page.locator('.signature-create input').fill(language==='ar'?'أحمد محمد':'Alex Morgan');await page.waitForFunction(()=>document.querySelector('.signature-created-preview img')?.naturalWidth>0);await withinPage(page);
  const dialog=page.getByRole('dialog');assert(await dialog.isVisible());const clipping=await dialog.evaluate(el=>({scroll:el.scrollWidth,width:el.clientWidth}));assert(clipping.scroll<=clipping.width+2);await screenshot(page,framework+'-signature-mobile-'+language);
 });
 await browser.close();server.close();fs.writeFileSync(path.join(out,'signature-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).map(r=>r.name)},null,2));process.exitCode=results.some(r=>!r.pass)?1:0;
})().catch(error=>{console.error(error);process.exit(1)});

