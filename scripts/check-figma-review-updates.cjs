const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('./cloud-browser.cjs');

const output = path.resolve('qa-results');
const site = path.resolve('_site-check');
const source = 'https://cyberlettuce.github.io/trade-documents-preview';
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.pdf':'application/pdf','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.wasm':'application/wasm'};
fs.mkdirSync(output, {recursive:true});

const server = http.createServer((req, res) => {
  const requestPath = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(site, '.' + requestPath + (requestPath.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(site + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
  res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
});

const cases = {
  react: {queue:'/#chamber/applications/Pending', review:'/#chamber/applications/Pending/ch-app-0', exporter:'/#dashboard', performance:'/#chamber/reports/users', dashboard:'/#chamber/dashboard'},
  vue: {queue:'/vue/#/chamber/applications', review:'/vue/#/chamber/applications/sample-0', exporter:'/vue/#/exporter/dashboard', performance:'/vue/#/chamber/reports/users', dashboard:'/vue/#/chamber/dashboard'}
};
const local = 'http://127.0.0.1:5204';
const shots = [];
async function shot(page, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({path:path.join(output, name + '.png')});
  shots.push(name);
}
async function noOverflow(page) {
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 2);
}

async function compare(browser, framework, routes, revision) {
  const after = revision === 'after';
  const context = await browser.newContext({viewport:{width:390,height:844}, locale:'en-GB'});
  const page = await context.newPage();
  page.setDefaultTimeout(9000);
  const open = route => page.goto((after ? local : source) + route);
  try {
    await open(routes.queue);
    await page.locator('table tbody tr').first().waitFor();
    await noOverflow(page);
    if (after) {
      const tabs = page.locator('.application-queue-tabs > button');
      assert.equal(await tabs.count(), 6);
      assert(await tabs.evaluateAll(items => items.every(item => {
        const box = item.getBoundingClientRect();
        return box.width && box.left >= 0 && box.right <= innerWidth;
      })));
      const queueLinks = page.locator('.application-reference-link:visible');
      assert(await queueLinks.count() >= 3);
      const references = await queueLinks.evaluateAll(links => links.map(link => ({
        short:link.querySelector('.reference-short')?.textContent,
        width:link.clientWidth,
        content:link.scrollWidth,
        full:link.getAttribute('title')
      })));
      assert(references.every(ref => /^…\d{5}X?\/[A-Z]+$/.test(ref.short) && ref.full.endsWith(ref.short.slice(1)) && ref.content <= ref.width + 2), JSON.stringify(references));
      assert.equal(new Set(references.map(ref=>ref.short)).size, references.length);
      await page.setViewportSize({width:320,height:844});
      await noOverflow(page);
      await page.setViewportSize({width:390,height:844});
    }
    await shot(page,framework+'-queue-'+revision);
    await open(routes.review);
    const preview=page.locator('#pack-document-preview');
    await preview.getByRole('button',{name:'Read full size',exact:true}).waitFor();
    await shot(page,framework+'-review-'+revision);
    if (after) {
      const switcher=page.getByRole('group',{name:'Review view'});
      const details=page.locator('#pack-details-panel');
      const approve=page.getByRole('button',{name:'Approve',exact:true});
      assert.equal(await details.isVisible(),false);
      assert.equal(await approve.isVisible(),false);
      await switcher.getByRole('button',{name:'Application details',exact:true}).click();
      await details.getByRole('heading',{name:'Certificate details'}).waitFor();
      assert.equal(await preview.isVisible(),false);
      assert(await approve.isVisible());
      await page.evaluate(()=>window.scrollTo(0,0));
      await shot(page,framework+'-details-after');
      const processing=details.locator('.review-processing-fields :is(input,select)');
      const order=await processing.evaluateAll(fields=>fields.map(field=>field.getAttribute('aria-label')||field.closest('label')?.textContent?.trim()||field.id));
      const signatoryIndex=order.findIndex(label=>/signatory/i.test(label));
      assert(signatoryIndex>=3,JSON.stringify(order));
      const reference=details.getByRole('textbox',{name:/Chamber Reference/i});
      await reference.fill('CH-FIGMA-CHECK');
      await noOverflow(page);
      await switcher.getByRole('button',{name:'Document',exact:true}).click();
      await preview.waitFor();
      await switcher.getByRole('button',{name:'Application details',exact:true}).click();
      assert.equal(await reference.inputValue(),'CH-FIGMA-CHECK');
      await page.setViewportSize({width:1366,height:900});
      await preview.waitFor();
      await details.waitFor();
    }
    await page.setViewportSize({width:1366,height:900});
    await open(routes.exporter);
    await page.getByRole('heading',{name:'Your next steps',exact:true}).waitFor();
    if(after) await page.getByRole('button',{name:'Continue draft',exact:true}).first().waitFor();
    await noOverflow(page);
    await shot(page,framework+'-exporter-'+revision);
    await open(routes.performance);
    await page.getByText('Average time to approval',{exact:true}).first().waitFor();
    if(after)await page.getByText(/Handling time runs from submission to the final decision/).first().waitFor();
    await shot(page,framework+'-performance-'+revision);
    await open(routes.dashboard);
    await page.getByRole('heading',{name:'Applications to review',exact:true}).waitFor();
    await shot(page,framework+'-chamber-dashboard-'+revision);
    if(after){
      const period=page.getByRole('combobox',{name:'Performance period'});
      await period.selectOption({label:'All dates'});
      await page.getByRole('button',{name:'View User Performance report'}).click();
      await page.waitForURL(/reports\/users/);
      await noOverflow(page);
    }
  } catch(error) {
    await shot(page,framework+'-'+revision+'-failure').catch(()=>{});
    throw error;
  } finally { await context.close(); }
}

(async()=>{
  await new Promise(r=>server.listen(5204,'127.0.0.1',r));
  const browser=await chromium.launch();
  const results=[];
  try {
    for(const [framework,routes] of Object.entries(cases)) {
      for (const revision of ['before','after']) {
        try { await compare(browser,framework,routes,revision); results.push({framework,revision,pass:true}); }
        catch(error) { results.push({framework,revision,pass:false,error:error.stack}); }
      }
    }
  } finally {
    await browser.close();
    server.close();
    fs.writeFileSync(path.join(output,'figma-review-results.json'), JSON.stringify({results,shots},null,2));
  }
  console.log(JSON.stringify(results,null,2));
  if(results.some(r=>!r.pass))process.exitCode=1;
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
