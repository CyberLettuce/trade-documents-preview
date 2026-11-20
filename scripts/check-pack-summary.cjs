const {chromium}=require('playwright');
const fs=require('node:fs'), path=require('node:path'), http=require('node:http'), assert=require('node:assert/strict');
const out=path.resolve('qa-results');fs.mkdirSync(out,{recursive:true});
const roots={before:path.resolve('before/_site-before'),after:path.resolve('_site-check')};
const contentTypes={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
 const [revision,...segments]=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1).split('/');
 const root=roots[revision];let name=segments.join('/');if(!name||name.endsWith('/'))name+='index.html';
 if(!root)return res.writeHead(404).end();const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();
 res.writeHead(200,{'Content-Type':contentTypes[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
async function crop(page,selectors,file){
 const bounds=[];for(const selector of selectors)bounds.push(await page.locator(selector).boundingBox());
 assert(bounds.every(Boolean));const y=Math.max(0,Math.min(...bounds.map(b=>b.y))-8),bottom=Math.max(...bounds.map(b=>b.y+b.height))+8;
 const x=Math.max(0,Math.min(...bounds.map(b=>b.x))-8),right=Math.min(page.viewportSize().width,Math.max(...bounds.map(b=>b.x+b.width))+8);
 await page.screenshot({path:path.join(out,file+'.png'),clip:{x,y,width:right-x,height:bottom-y}});
 return bottom-y;
}
(async()=>{
 await new Promise(resolve=>server.listen(5204,'127.0.0.1',resolve));const browser=await chromium.launch();
 const outcomes=[];let failed=false;
 for(const [framework,route] of [['react','/#chamber/applications/Pending/ch-app-0'],['vue','/vue/#/chamber/applications/sample-0']]){
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{
   const url='http://127.0.0.1:5204/';await page.goto(url+'before'+route);
   await page.getByRole('heading',{name:'Application document pack',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
   const before=await crop(page,framework==='react'?['.pack-review-heading']:['.review-back','.review-title'],framework+'-before');
   await page.goto(url+'after'+route);const header=page.locator('.pack-summary-bar');await header.waitFor();await page.evaluate(()=>document.fonts.ready);
   const headline=await header.getByRole('heading',{name:'Application document pack',level:1}).boundingBox();assert(headline.width<=1&&headline.height<=1);
   const row=await header.locator('.pack-summary-back,.pack-summary-identity,.pack-summary-status,.pack-summary-meta,.pack-summary-save').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {text:el.innerText,mid:r.y+r.height/2};}));
   assert(row.length>=4&&Math.max(...row.map(v=>v.mid))-Math.min(...row.map(v=>v.mid))<3,JSON.stringify(row));
   const after=await crop(page,['.pack-summary-bar'],framework+'-after');assert(before-after>=28,JSON.stringify({before,after}));
   await page.setViewportSize({width:390,height:844});await page.screenshot();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   assert(await header.evaluate(el=>el.scrollWidth<=el.clientWidth+2));
   await crop(page,['.pack-summary-bar'],framework+'-mobile');
   const back=header.getByRole('button',{name:/back to/i});await back.focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:/Options/}).first().waitFor();
   assert.deepEqual(errors,[]);outcomes.push({framework,before,after,pass:true});
  }catch(error){failed=true;outcomes.push({framework,error:error.message,errors,pass:false});await page.screenshot({path:path.join(out,framework+'-failed.png')}).catch(()=>{});}
  await page.close();
 }
 console.log(JSON.stringify(outcomes,null,2));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(outcomes,null,2));await browser.close();server.close();process.exitCode=failed?1:0;
})().catch(error=>{console.error(error);process.exit(1)});
