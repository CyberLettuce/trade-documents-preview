const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {chromium} = require('playwright');

const live = 'https://cyberlettuce.github.io/trade-documents-preview/';
const release = process.env.AUDIT_VERSION;
const display = process.env.AUDIT_DISPLAY;
const [width, height] = display.split('x').map(Number);
const scale = Number(process.env.AUDIT_SCALE) / 100;
const zoomLevels = process.env.AUDIT_ZOOM_LEVELS.split(',').map(value => Number(value) / 100);
const dimensions = {width:Math.round(width / scale), height:Math.round(height / scale)};
const output = path.resolve('qa-results');
const results = [];
const screens = {
  'exporter-dashboard':['#dashboard','vue/#/exporter/dashboard'],
  'exporter-applications':['#applications','vue/#/exporter/applications'],
  'exporter-editor':['#new','vue/#/exporter/applications/sample-draft-20261117-ata'],
  'exporter-reports':['#reports','vue/#/exporter/reports'],
  'chamber-dashboard':['#chamber/dashboard','vue/#/chamber/dashboard'],
  'chamber-applications':['#chamber/applications/Pending','vue/#/chamber/applications'],
  'chamber-review':['#chamber/applications/Pending/ch-app-0','vue/#/chamber/applications/sample-0'],
  'chamber-reports':['#chamber/reports/users','vue/#/chamber/reports/users']
};

async function initialiseBrowser() {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(),'trade-scale-'));
  const extension = path.join(folder,'extension');
  await fs.mkdir(extension);
  await fs.writeFile(path.join(extension,'manifest.json'),JSON.stringify({
    manifest_version:3,name:'Browser zoom audit',version:'1.0',permissions:['tabs'],
    background:{service_worker:'zoom.js'}
  }));
  await fs.writeFile(path.join(extension,'zoom.js'),'chrome.runtime.onInstalled.addListener(()=>{});');
  return chromium.launchPersistentContext(path.join(folder,'profile'),{
    headless:true,channel:'chromium',viewport:null,
    args:[`--force-device-scale-factor=${scale}`,`--window-size=${dimensions.width},${dimensions.height}`,
      `--disable-extensions-except=${extension}`,`--load-extension=${extension}`]
  });
}

async function setZoom(worker, page, level) {
  const actual = await worker.evaluate(async ({url,level}) => {
    const tab = (await chrome.tabs.query({})).find(candidate=>candidate.url===url);
    if(!tab) throw Error('Browser tab URL was not found');
    await chrome.tabs.setZoomSettings(tab.id,{mode:'automatic',scope:'per-tab'});
    await chrome.tabs.setZoom(tab.id,level);
    return chrome.tabs.getZoom(tab.id);
  },{url:page.url(),level});
  assert(Math.abs(actual-level)<0.001, 'Chromium did not apply the requested page zoom');
  await page.waitForFunction(({scale,level})=>Math.abs(devicePixelRatio/(scale*level)-1)<0.03,{scale,level});
}

async function waitForLayout(page) {
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

async function fitTestWindow(context, page, worker) {
  const cdp = await context.newCDPSession(page);
  try {
    await setZoom(worker,page,1);
    for(let attempt=0;attempt<4;attempt++) {
      const bounds=await cdp.send('Browser.getWindowForTarget');
      const inner=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio}));
      if(Math.abs(inner.width-dimensions.width)<=12 && Math.abs(inner.height-dimensions.height)<=25) return inner;
      const next={width:Math.round(bounds.bounds.width*dimensions.width/inner.width),
        height:Math.round(bounds.bounds.height*dimensions.height/inner.height)};
      await cdp.send('Browser.setWindowBounds',{windowId:bounds.windowId,bounds:next});
      await waitForLayout(page);
    }
    throw Error('Could not match the requested Windows test window after display scaling');
  } finally {await cdp.detach();}
}

async function seedFeaturedImage(page) {
  const first = new URL(screens['exporter-dashboard'][0],live);
  await page.goto(first.href);
  await page.locator('main').first().waitFor();
  await page.evaluate(async () => {
    const canvas=document.createElement('canvas');
    canvas.width=1080;canvas.height=460;
    const paint=canvas.getContext('2d');
    paint.fillStyle='#263447';paint.fillRect(0,0,1080,460);
    paint.fillStyle='#ac4200';paint.fillRect(820,0,260,460);
    paint.fillStyle='white';paint.font='bold 62px sans-serif';paint.fillText('Export documentation',60,180);
    paint.fillText('workshop',60,260);
    const block={id:'test-scale-image',type:'image',featured:true,displaySize:'medium',visible:true,
      title:'Export documentation workshop',body:'',alt:'Example workshop banner',image:canvas.toDataURL('image/png')};
    localStorage.setItem('ecert-dashboard-content-v1:demo',JSON.stringify({chamberId:'demo',revision:1,
      published:{title:'From your chamber',blocks:[block]},publishedAt:'2026-11-24T00:00:00Z'}));
    const vueRoot=new URL('vue/workspace-model.js',location.href);
    const {freshWorkspace}=await import(vueRoot.href);
    const workspace=freshWorkspace();
    workspace.content.published.unshift(block);
    workspace.content.publishedAt='2026-11-24T00:00:00Z';
    localStorage.setItem('trade-documents-vue-comparison-v1-workspace',JSON.stringify(workspace));
    localStorage.setItem('trade-documents-shell-layout-v1','sidebar');
  });
}

async function inspect(page) {
  return page.evaluate(()=>{
    const main=document.querySelector('main');
    const feature=main.querySelector('.exporter-dashboard-image');
    const clipped=[...main.querySelectorAll('button, a, select')].filter(control=>{
      const area=control.getBoundingClientRect(),style=getComputedStyle(control);
      return area.width>0&&area.height>0&&style.visibility==='visible'&&
        ['hidden','clip'].includes(style.overflowX)&&control.scrollWidth>control.clientWidth+4;
    }).map(control=>control.getAttribute('aria-label')||control.textContent.trim().replace(/\s+/g,' ').slice(0,120));
    return {
      width:innerWidth,height:innerHeight,dpr:devicePixelRatio,
      scrollWidth:document.documentElement.scrollWidth,
      clipped:clipped.slice(0,12),
      image:feature?{width:feature.getBoundingClientRect().width,hasImage:feature.querySelector('img')?.naturalWidth>0}:null,
    };
  });
}

async function run(){
  await fs.mkdir(output,{recursive:true});
  const context=await initialiseBrowser();
  const page=context.pages()[0]||await context.newPage();
  page.setDefaultTimeout(12000);
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
  let baseline;
  try {
    await seedFeaturedImage(page);
    baseline=await fitTestWindow(context,page,worker);
    assert(Math.abs(baseline.dpr/scale-1)<0.03, 'Windows Chromium display scale did not take effect');
    for(const level of zoomLevels)for(const [name,routes] of Object.entries(screens))for(const [index,framework] of ['react','vue'].entries()){
      const target=new URL(routes[index],live);
      target.searchParams.set('scale-check',`${scale}-${level}-${framework}-${name}`);
      const key=`${framework}-${name}-${Math.round(level*100)}`;
      let state;
      try {
        await page.goto(target.href,{waitUntil:'domcontentloaded'});
        assert.equal(await page.locator('meta[name="application-version"]').getAttribute('content'),release);
        await page.waitForFunction(()=>document.querySelector('main')?.innerText.trim().length>100);
        await setZoom(worker,page,level);
        if(name==='exporter-dashboard')await page.locator('main .exporter-dashboard-image img').evaluate(image=>image.decode());
        await waitForLayout(page);
        state=await inspect(page);
        assert(Math.abs(state.width-baseline.width/level)<=3, 'Browser zoom did not reduce the effective width as expected');
        const issues=[];
        if(state.scrollWidth>state.width+2)issues.push('Page scrolls horizontally');
        if(state.clipped.length)issues.push('Control labels are clipped');
        if(name==='exporter-dashboard'&&(!state.image?.hasImage||state.image.width>state.width))issues.push('Featured image does not fit');
        const result={key,framework,screen:name,zoom:level,...state,issues};
        results.push(result);
        console.log(JSON.stringify(result));
        if(issues.length||(scale===1.5&&level===1.25&&['exporter-dashboard','chamber-applications'].includes(name))) {
          await page.screenshot({path:path.join(output,key+'.png'),timeout:5000}).catch(()=>{});
        }
      } catch(error){
        const result={key,framework,screen:name,zoom:level,...state,error:error.message};
        results.push(result);console.log(JSON.stringify(result));
        await page.screenshot({path:path.join(output,key+'-error.png'),timeout:5000}).catch(()=>{});
      }
    }
  } finally {
    await context.close();
    await fs.writeFile(path.join(output,'windows-scaling.json'),JSON.stringify({display,scale,baseline,release,platform:os.platform(),osVersion:os.release(),results},null,2));
  }
  const errors=results.filter(result=>result.error);
  const issues=results.filter(result=>result.issues?.length);
  console.log(JSON.stringify({checks:results.length,errors:errors.length,issues:issues.length}));
  if(errors.length)process.exitCode=1;
}
run().catch(error=>{console.error(error);process.exitCode=1;});
