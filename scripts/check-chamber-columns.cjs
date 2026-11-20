const {chromium}=require('./cloud-browser.cjs');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve('_site-check'),out=path.resolve('qa-results');fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf','.png':'image/png','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');if(!name||name.endsWith('/'))name+='index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res)});
const results=[];let browser;
async function screenshot(page,name){await page.screenshot({path:path.join(out,'screenshots',name+'.png'),fullPage:name.includes('dashboard-1366')});}
async function check(name,fn){const context=await browser.newContext({viewport:{width:1366,height:900},locale:'en-GB'}),page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));try{await fn(page);assert.deepEqual(errors,[],'Uncaught page errors');results.push({name,pass:true});console.log('PASS',name)}catch(error){await screenshot(page,name+'-failed').catch(()=>{});results.push({name,pass:false,error:error.message,stack:error.stack,errors,body:(await page.locator('body').innerText().catch(()=>'' )).slice(0,8000)});console.log('FAIL',name,error.message)}finally{await context.close()}}
async function loaded(page,url){await page.goto('http://127.0.0.1:5204'+url);await page.locator(url.startsWith('/vue/')?'#main':url.includes('#chamber/')?'#chamber-main':'#main-content').waitFor();await page.evaluate(()=>document.fonts.ready);}
async function withinPage(page){const size=await page.evaluate(()=>({width:innerWidth,content:document.documentElement.scrollWidth}));assert.ok(size.content<=size.width+2,`Page width ${size.content}px exceeds ${size.width}px`)}
async function bounds(page,locator,file){const box=await locator.boundingBox();await page.screenshot({path:path.join(out,'screenshots',file+'.png'),clip:{x:Math.max(box.x,0),y:Math.max(box.y,0),width:Math.min(box.width,page.viewportSize().width-Math.max(box.x,0)),height:Math.min(box.height,430)}});}
async function sortBoth(table,label){const head=table.getByRole('columnheader',{name:label,exact:true});const button=head.getByRole('button');await button.focus();await button.press('Enter');const first=await head.getAttribute('aria-sort');assert(['ascending','descending'].includes(first));await button.click();assert.notEqual(await head.getAttribute('aria-sort'),first);assert.equal(await table.locator('thead th[aria-sort]:not([aria-sort="none"])').count(),1);}
async function sortedValues(table,header,cellIndex,{numeric=false}={}){const head=table.getByRole('columnheader',{name:header,exact:true}),button=head.getByRole('button');await button.focus();await button.press('Space');let rows=await table.locator('tbody tr').evaluateAll((nodes,index)=>nodes.map(row=>row.cells[index].querySelector('button.reference,button.ch-reference,span')?.textContent.trim()||row.cells[index].innerText.trim().split('\n')[0]),cellIndex);const collator=new Intl.Collator('en-GB',{numeric:true,sensitivity:'base'}),dir=(await head.getAttribute('aria-sort'))==='ascending'?1:-1;const compare=numeric?(a,b)=>Number(a.replace(/[^\d.-]/g,''))-Number(b.replace(/[^\d.-]/g,'')):(a,b)=>collator.compare(a,b);assert.deepEqual(rows,[...rows].sort((a,b)=>compare(a,b)*dir));await button.click();const other=await head.getAttribute('aria-sort');assert.equal(other,dir===1?'descending':'ascending');}
(async()=>{
 await new Promise(resolve=>server.listen(5204,'127.0.0.1',resolve));browser=await chromium.launch();
 for(const framework of ['react','vue']){
  const react=framework==='react',base=react?'/#chamber/':'/vue/#/chamber/';
  await check(framework+'-queue-headers-and-pages',async page=>{
   await page.setViewportSize({width:1440,height:900});await loaded(page,base+(react?'applications/Approved':'applications'));
   if(!react)await page.getByRole('button',{name:/^Approved/}).first().click();
   const table=page.locator(react?'.ch-queue-panel table':'.application-table').first();await table.waitFor();
   if(!react)await page.getByLabel('Rows per page').selectOption('10');
   const sortable=table.locator('thead th').filter({has:page.locator('button.column-sort-button')});assert((await sortable.count())>=6);
   for(const th of await sortable.all()){const button=th.getByRole('button');if(!await button.isVisible())continue;await button.click();assert.equal(await th.getAttribute('aria-sort'),'ascending');}
   const name=react?'Application / exporter / holder':'Reference / exporter';await sortedValues(table,name,react?0:1);
   const paging=page.getByRole('button',{name:'Next page',exact:true}).first();if(await paging.isVisible()&&await paging.isEnabled()){
    const before=await table.locator('tbody tr').first().innerText();await paging.click();assert.notEqual(await table.locator('tbody tr').first().innerText(),before);
    await table.getByRole('columnheader',{name,exact:true}).getByRole('button').click();assert(await page.getByRole('button',{name:'Previous page',exact:true}).first().isDisabled());
   }
   await table.scrollIntoViewIfNeeded();await bounds(page,table.locator('thead'),framework+'-sort-headers');
   await page.setViewportSize({width:390,height:844});await page.screenshot();await withinPage(page);
   await table.getByRole('columnheader',{name,exact:true}).getByRole('button').click();
  });
  await check(framework+'-exporters-claims-and-setup',async page=>{
   await loaded(page,base+'exporters');const exporters=page.locator('main table').first();await sortedValues(exporters,'Company / account',0);
   await sortBoth(exporters,'Formal undertaking');
   await exporters.locator('tbody button').first().click();assert(await page.getByRole('button',{name:/^(All exporters|Back to Exporters)/i}).count());
   await loaded(page,base+'claims'+(react?'/Open':''));const claims=page.locator('main table').first();await sortBoth(claims,'Processing');await sortBoth(claims,'Next action');
   await loaded(page,base+'setup/signatures');const settings=page.locator('main table').first();await sortBoth(settings,'Name');
  });
  await check(framework+'-report-totals',async page=>{
   await loaded(page,base+'reports/users');const table=page.locator('main table').first();await sortBoth(table,'Chamber User');await sortBoth(table,'Approved documents');
   await loaded(page,base+'reports/bcc');const bcc=page.locator('main table').first();await sortBoth(bcc,'Standard');await sortBoth(bcc,'Total');
  });
 }
 await check('vue-chamber-donut-reports',async page=>{
  const url='/vue/#/chamber/reports/';await page.setViewportSize({width:1440,height:900});await loaded(page,url+'overview');
  const charts=page.locator('.vue-report-donut');assert.equal(await charts.count(),4);assert.equal(await page.locator('.report-metric-label svg').count(),4);
  const status=charts.first();await status.scrollIntoViewIfNeeded();await bounds(page,status,'vue-report-status-chart');
  const legend=status.getByRole('button',{name:/Approved/}).first();await legend.click();await page.locator('.list-options-toggle').click();assert.equal(await page.getByLabel('Status',{exact:true}).inputValue(),'Approved');
  await page.getByRole('button',{name:'Reset filters'}).click();
  for(const [kind,count] of [['audit',2],['bcc',2],['invoice',1],['aviva',1],['single',1]]){await loaded(page,url+kind);assert.equal(await charts.count(),count,kind);}
  await loaded(page,url+'overview');await page.setViewportSize({width:390,height:844});await page.screenshot();await withinPage(page);
 });
 fs.writeFileSync(path.join(out,'column-sort-results.json'),JSON.stringify(results,null,2));await browser.close();server.close();process.exitCode=results.some(result=>!result.pass)?1:0;
})().catch(error=>{console.error(error);process.exit(1)});
