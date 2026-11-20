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


const previewCss="\n#pack-details-panel .carnet-vertical-preview {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr);\n  gap: 14px;\n  align-items: stretch;\n  padding-block-end: 4px;\n}\n\n#pack-details-panel .carnet-vertical-preview > :is(.chamber-carnet-application, .vertical-preview-processing) {\n  min-width: 0;\n  margin: 0;\n  padding: 14px;\n  border: 1px solid var(--line, var(--colorNeutralStroke2, #dedede));\n  border-radius: 6px;\n  background: var(--surface, var(--colorNeutralBackground1, #fff));\n}\n\n#pack-details-panel .carnet-vertical-preview :is(.chamber-carnet-fields, .review-processing-fields) {\n  grid-template-columns: minmax(0, 1fr);\n  gap: 9px;\n}\n\n#pack-details-panel .carnet-vertical-preview :is(.chamber-carnet-application, .vertical-preview-processing) h3:first-child {\n  margin-top: 0;\n}\n\n#pack-details-panel .carnet-vertical-preview .vertical-preview-processing .ch-assignment {\n  margin-block-start: 0;\n}\n\n@container review-details (min-width: 540px) {\n  #pack-details-panel .carnet-vertical-preview { grid-template-columns: minmax(0, 1.06fr) minmax(0, 1fr); }\n}\n";

async function openSample(page, react) {
 const origin='http://127.0.0.1:5204/after';
 const base=react?'/?layout=original#chamber/applications/Pending/ch-app-0':'/vue/?layout=original#/chamber/applications/sample-0';
 await page.goto(origin+base);
 await page.locator('.pack-summary-bar').waitFor();
 const state=await page.evaluate(react=>{
  const key=react?'ecert-chamber-preview-v1':'trade-documents-vue-comparison-v1';
  const data=JSON.parse(localStorage.getItem(key));
  const records=react?data.apps:data.records;
  const seed=records.find(record=>record.id===(react?'ch-app-0':'sample-0'));
  records.push({...seed, id:'layout-preview-carnet',reference:'DEMO0053204/145016093X/N',status:'Pending',
   eCarnetId:'MERCURY-SAMPLE-041',eCarnetPin:'004219',goodsType:'Professional instruments',
   ...(react?{docs:['ata'],use:['Professional equipment'],signatory:'Exporter sample signatory',lockedBy:'',assigned:''}
      :{document:'ATA Carnet',documents:['ATA Carnet'],use:'Professional equipment',applicantSignatory:'Alex Morgan',owner:''})
  });
  return {key,data};
 },react);
 await page.addInitScript(({key,data})=>{
  if(sessionStorage.getItem('vertical-carnet-preview'))return;
  localStorage.setItem(key,JSON.stringify(data));
  sessionStorage.setItem('vertical-carnet-preview','1');
 },state);
 await page.goto(origin+(react?'/?layout=vertical#chamber/applications/Pending/layout-preview-carnet':'/vue/?layout=vertical#/chamber/applications/layout-preview-carnet'));
 await page.getByRole('region',{name:'ATA Carnet application details'}).waitFor();
 await page.evaluate(()=>document.fonts.ready);
}
async function arrangePreview(page, react) {
 await page.evaluate(react=>{
  const aside=document.getElementById('pack-details-panel');
  const carnet=aside.querySelector('.chamber-carnet-application');
  const grid=document.createElement('div');
  grid.className='carnet-vertical-preview';
  carnet.before(grid);
  grid.append(carnet);
  let processing;
  if(react){
   processing=aside.querySelector('.review-processing-fields').closest('.page-panel');
  }else{
   const heading=[...aside.querySelectorAll('h3')].find(node=>node.textContent.trim()==='Processing');
   processing=document.createElement('section');
   let field=heading;
   while(field&&(field===heading||field.matches('.assignment,.review-processing-fields,.checkbox-row'))){
    const next=field.nextElementSibling;
    processing.append(field);
    field=next;
   }
  }
  processing.classList.add('vertical-preview-processing');
  grid.append(processing);
 },react);
}
(async()=>{
 await new Promise(resolve=>server.listen(5204,'127.0.0.1',resolve));
 const browser=await chromium.launch();
 const outcomes=[];
 for(const framework of ['vue','react']){
  const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2,locale:'en-GB'});
  page.setDefaultTimeout(10000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   await openSample(page,framework==='react');
   const aside=page.locator('#pack-details-panel');
   await aside.screenshot({path:path.join(out,framework+'-current-application.png')});
   const main=page.locator('#pack-document-preview');
   const zoom=main.locator('select').filter({has:page.getByRole('option',{name:'Fit page',exact:true})});
   await zoom.selectOption({label:'100%'});
   const sheet=main.locator(framework==='vue'?'.paper-space .native-paper':'.document-scaled-page').first();
   await page.waitForFunction(selector=>document.querySelector(selector)?.getBoundingClientRect().width>=638,
    framework==='vue'?'#pack-document-preview .paper-space .native-paper':'#pack-document-preview .document-scaled-page');
   const pageBox=await sheet.boundingBox();
   assert(pageBox.x+pageBox.width<=1441,JSON.stringify(pageBox));
   await page.screenshot({path:path.join(out,framework+'-document-full-size.png'),clip:{
    x:Math.max(0,Math.floor(pageBox.x)),y:Math.max(0,Math.floor(pageBox.y)),
    width:Math.floor(pageBox.width),height:Math.floor(Math.min(390,950-pageBox.y))
   }});
   await zoom.selectOption({label:'Fit page'});
   await page.waitForFunction(()=>!!document.querySelector('#pack-document-preview .compact-fit-page'));
   await page.addStyleTag({content:previewCss});
   await arrangePreview(page,framework==='react');
   const carnet=aside.locator('.chamber-carnet-application'), processing=aside.locator('.vertical-preview-processing');
   const [a,b]=await Promise.all([carnet.boundingBox(),processing.boundingBox()]);
   assert(Math.abs(a.y-b.y)<2&&b.x>=a.x+a.width,JSON.stringify({a,b}));
   assert(await processing.getByText('Chamber signatory',{exact:framework==='vue'}).first().isVisible());
   assert(await carnet.getByRole('button',{name:'Copy Mercury Carnet PIN'}).isVisible());
   assert(await carnet.getByRole('textbox',{name:'Intended Use of Goods'}).isVisible());
   await aside.screenshot({path:path.join(out,framework+'-vertical-application.png')});
   await page.setViewportSize({width:390,height:844});
   const [narrowCarnet,narrowProcessing]=await Promise.all([carnet.boundingBox(),processing.boundingBox()]);
   assert(Math.abs(narrowCarnet.x-narrowProcessing.x)<2&&narrowProcessing.y>=narrowCarnet.y+narrowCarnet.height);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   assert.deepEqual(errors,[]);
   outcomes.push({framework,desktop:'side by side',mobile:'stacked',pass:true});
  }catch(error){
   outcomes.push({framework,error:error.message,errors,pass:false});
   await page.screenshot({path:path.join(out,framework+'-failed.png')}).catch(()=>{});
  }finally{await page.close();}
 }
 console.log(JSON.stringify(outcomes,null,2));
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(outcomes,null,2));
 await browser.close();server.close();
 process.exitCode=outcomes.some(result=>!result.pass)?1:0;
})().catch(error=>{console.error(error);process.exit(1)});
