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

const scans=JSON.parse(fs.readFileSync(path.join(out,'audit-scans.json'),'utf8')),known=[],remaining=[],colours=[];
// Keep the unmodified axe report. Only classify the precise library sentinel,
// whose purpose is documented by its maintainer; never hide arbitrary failures.
for(const scan of scans){for(const issue of scan.violations)for(const node of issue.nodes){
 const sentinel=issue.id==='aria-hidden-focus'&&/^<i\s/.test(node.html)&&node.html.includes('data-tabster-dummy=')&&node.html.includes('role="none"')&&node.html.includes('aria-hidden="true"');
 (sentinel?known:remaining).push({page:scan.name,rule:issue.id,node});
}for(const issue of scan.incomplete)if(issue.id==='aria-prohibited-attr')remaining.push({page:scan.name,rule:issue.id,nodes:issue.nodes});}
(async()=>{
 await new Promise(resolve=>server.listen(5204,'127.0.0.1',resolve));browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
 await check('no-unresolved-accessibility-rule-failures',async()=>{assert.deepEqual(remaining,[]);assert.equal(known.length,0,'React focus-sentinel warnings must stay resolved')});
 for(const scan of scans.filter(s=>s.incomplete.some(i=>i.id==='color-contrast')))await check('contrast-followup-'+scan.name,async page=>{
  await loaded(page,scan.url);await preferences(page,scan.name.startsWith('react')?'react':'vue',{layout:'sidebar',language:scan.options.language||'en',theme:scan.options.theme||'light'});if(scan.options.width)await page.setViewportSize({width:scan.options.width,height:900});
  for(const issue of scan.incomplete.filter(i=>i.id==='color-contrast'))for(const node of issue.nodes){const target=page.locator(node.target[0]).first();if(!await target.count()||!await target.isVisible())continue;await target.scrollIntoViewIfNeeded();const result=await target.evaluate(el=>{
   const parse=value=>{const n=value.match(/[\d.]+/g)?.map(Number);return n&&n.length>=3?[...n.slice(0,3),n[3]??1]:[0,0,0,0]};
   const over=(top,bottom)=>[0,1,2].map(i=>top[i]*top[3]+bottom[i]*(1-top[3]));
   const layers=[];for(let n=el;n;n=n.parentElement){const c=getComputedStyle(n);layers.unshift(parse(c.backgroundColor));if(layers[0][3]===1)break}let bg=[255,255,255];for(const c of layers)bg=over(c,bg);
   const style=getComputedStyle(el),fg=over(parse(style.color),bg),lum=rgb=>rgb.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0),a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&Number(style.fontWeight)>=700);
   return {text:(el.innerText||el.value||'').slice(0,90),foreground:style.color,background:bg,ratio,required:large?3:4.5,disabled:el.disabled||el.closest('[aria-disabled=true]')!==null};
  });colours.push({page:scan.name,target:node.target,...result});if(!result.disabled)assert(result.ratio+.015>=result.required,JSON.stringify(result));}
 });
 for(const scan of scans.filter(s=>known.some(k=>k.page===s.name)))await check('focus-sentinels-'+scan.name,async page=>{
  await loaded(page,scan.url);await page.locator('main').click({position:{x:5,y:5}});const names=[];
  for(const key of [...Array(35).fill('Tab'),...Array(35).fill('Shift+Tab')]){await page.keyboard.press(key);await page.evaluate(()=>new Promise(requestAnimationFrame));const active=await page.evaluate(()=>({dummy:document.activeElement?.hasAttribute('data-tabster-dummy'),hidden:document.activeElement?.getAttribute('aria-hidden'),name:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent?.slice(0,70)}));assert(!active.dummy&&active.hidden!=='true','Focus must immediately reach a real accessible control');names.push(active.name)}assert(new Set(names).size>5);
 });
 await browser.close();server.close();fs.writeFileSync(path.join(out,'accessibility-followups.json'),JSON.stringify({results,remaining,knownLibrarySentinels:known,contrastChecks:colours,source:'https://github.com/microsoft/tabster/issues/288'},null,2));console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.pass).length,remaining:remaining.length,knownLibrarySentinels:known.length,contrastChecks:colours.length},null,2));process.exitCode=results.some(r=>!r.pass)?1:0;
})().catch(error=>{console.error(error);process.exit(1)});

