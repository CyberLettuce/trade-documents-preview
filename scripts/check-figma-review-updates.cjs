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

const alignmentRoutes = {
  react: {applications:'/#applications', claims:'/#chamber/claims/Open', accounts:'/#chamber/exporters', records:'/#stored'},
  vue: {applications:'/vue/#/exporter/applications', claims:'/vue/#/chamber/claims', accounts:'/vue/#/chamber/exporters', records:'/vue/#/exporter/stored/buyers'}
};

async function checkAlignment(table, rules) {
  await table.locator('th[data-table-align]').first().waitFor({state:'attached'});
  const columns = await table.evaluate(node => {
    const header = node.tHead.rows[node.tHead.rows.length - 1];
    const row = Array.from(node.tBodies[0].rows).find(row => row.cells.length === header.cells.length);
    return Array.from(header.cells, (cell, index) => {
      const value = row?.cells[index];
      const alignment = element => {
        if (!element) return;
        const {textAlign,direction} = getComputedStyle(element);
        return textAlign === (direction === 'rtl' ? 'right' : 'left') ? 'start' : textAlign === (direction === 'rtl' ? 'left' : 'right') ? 'end' : textAlign;
      };
      return {
        label:(cell.querySelector('.column-sort-label') || cell).textContent.trim(),
        source:cell.dataset.column,
        heading:alignment(cell),
        sortButton:alignment(cell.querySelector(':scope > button')),
        value:alignment(value),
        ref:alignment(value?.querySelector('.reference, .reference-button, .ch-reference, .report-reference, .claims-reference'))
      };
    });
  });
  for (const [label, expected] of rules) {
    const column = columns.find(col => label.test(col.label) || label.test(col.source || ''));
    assert(column, 'Missing ' + label + ' in ' + JSON.stringify(columns));
    assert.equal(column.heading, expected, JSON.stringify(column));
    if (column.sortButton) assert.equal(column.sortButton, expected, JSON.stringify(column));
    if (column.value) assert.equal(column.value, expected, JSON.stringify(column));
    if (column.ref) assert.equal(column.ref, expected, JSON.stringify(column));
  }
}

async function checkWorkspaceTables(page, framework, routes) {
  const table = () => page.locator('main table:visible').first();
  const applicationRules = [[/^(Application \/ exporter \/ holder|Reference(?: \/ (?:exporter|your reference))?|Application)$/i, 'start'], [/^Documents?$/i, 'start'], [/^Status$/i, 'center'], [/^Actions?$/i, 'center']];
  const areas = alignmentRoutes[framework];
  const reports = routes.performance.replace(/users$/, '');
  for (const [name, route, rules] of [
    ['chamber-applications', routes.queue, applicationRules],
    ['exporter-applications', areas.applications, applicationRules],
    ['claims', areas.claims, [[/^Claim(?: \/ (?:carnet|holder))?$/i, 'start'], [/^Processing$/i, 'center'], [/^Next action$/i, 'start']]],
    ['exporters', areas.accounts, [[/^Company(?: \/ account)?$/i, 'start'], [/^(Account )?Status$/i, 'center']]],
    ['stored-data', areas.records, [[/^(Reference|Name|Company name)$/i, 'start'], [/^Actions?$/i, 'center']]],
    ['user-performance', routes.performance, [[/^Chamber User$/i, 'start'], [/^Applications$/i, 'end'], [/^(?:Avg|Average) approval time$/i, 'end'], [/^Actions?$/i, 'center']]],
    ['invoice-report', reports + 'invoice', [[/^Exporter$/i, 'start'], [/^Net(?: \(£\))?$/i, 'end'], [/^Total(?: \(£\))?$/i, 'end'], [/^Payment$/i, 'center']]],
    ['bcc-report', reports + 'bcc', [[/^Document$/i, 'start'], [/^Standard$/i, 'end'], [/^eXpress$/i, 'end'], [/^Total$/i, 'end']]]
  ]) {
    await page.goto(local + route);
    await checkAlignment(table(), rules);
    if (name === 'chamber-applications' || name === 'user-performance') await shot(page, framework+'-alignment-'+name);
  }

  await page.setViewportSize({width:390,height:844});
  await page.goto(local + routes.queue);
  await checkAlignment(table(), applicationRules);
  await noOverflow(page);

  await page.setViewportSize({width:1366,height:900});
  await page.goto(local + routes.performance);
  await table().locator('th[data-table-align]').first().waitFor({state:'attached'});
  await page.evaluate(framework => {
    if (framework === 'react') localStorage.setItem('trade-documents-language-v1','ar');
    else {
      const key = 'trade-documents-vue-comparison-v1-ui';
      localStorage.setItem(key,JSON.stringify({...JSON.parse(localStorage.getItem(key) || '{}'), language:'ar'}));
    }
  }, framework);
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dir === 'rtl');
  await page.waitForFunction(() => {
    const headers = Array.from(document.querySelector('main table')?.tHead?.rows[0]?.cells || []);
    return headers[1]?.dataset.tableAlign === 'end' && /[\u0600-\u06ff]/.test(headers[1].textContent);
  });
  const arabic = await table().evaluate(node => Array.from(node.tHead.rows[0].cells).slice(0,2).map(cell => ({alignment:getComputedStyle(cell).textAlign,direction:getComputedStyle(cell).direction})));
  assert.equal(arabic[0].direction,'rtl');
  assert(['start','right'].includes(arabic[0].alignment),JSON.stringify(arabic));
  assert(['end','left'].includes(arabic[1].alignment),JSON.stringify(arabic));
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
      await checkWorkspaceTables(page, framework, routes);
    }
  } catch(error) {
    await shot(page,framework+'-'+revision+'-failure').catch(()=>{});
    throw error;
  } finally { await context.close(); }
}

async function workspaceIcons(browser, framework, routes, theme) {
  const context=await browser.newContext({viewport:{width:1440,height:900},colorScheme:theme});
  await context.addInitScript(({framework,theme})=>{
    localStorage.setItem('trade-documents-sidebar-collapsed-'+framework+'-v1','true');
    if(framework==='react') {
      localStorage.setItem('trade-documents-shell-layout-v1','sidebar');
      localStorage.setItem('ecert-appearance-v1',theme);
    } else {
      const key='trade-documents-vue-comparison-v1-ui';
      const current=JSON.parse(localStorage.getItem(key)||'{}');
      localStorage.setItem(key,JSON.stringify({...current,layout:'sidebar',theme}));
    }
  },{framework,theme});
  const page=await context.newPage();
  page.setDefaultTimeout(9000);
  const svgShape=locator=>locator.locator('svg:visible').first().evaluate(svg=>{
    const bounds=svg.getBoundingClientRect();
    if(bounds.width<10||bounds.height<10) throw new Error('Icon is too small to see');
    const paths=Array.from(svg.querySelectorAll('path'),path=>path.getAttribute('d'));
    if(!paths.length) throw new Error('Icon is missing its vector path');
    return paths;
  });
  const snapshot={};
  try {
    for(const [workspace,route] of [['chamber',routes.dashboard],['exporter',routes.exporter]]) {
      await page.goto(local+route);
      await page.getByRole('button',{name:'Expand sidebar',exact:true}).waitFor();
      const metrics=page.locator(framework==='vue' ? '.metrics button' : '.status-strip .stat, .ch-status-strip .stat');
      await metrics.first().waitFor();
      assert.equal(await metrics.count(),4);
      const match={};
      for(const label of workspace==='chamber'?['Dashboard','Applications','Reports','Claims']:['Dashboard','Applications','Stored Data','Reports']) {
        match[label]=await svgShape(page.locator('nav').getByRole('button',{name:label,exact:true}).first());
      }
      match.notifications=await svgShape(page.getByRole('button',{name:/^Notifications(?:,|$)/}).first());
      if(workspace==='chamber')match.help=await svgShape(page.getByRole('button',{name:'Help & support',exact:true}).first());
      match.metrics=[];
      for(const tile of await metrics.all())match.metrics.push(await svgShape(tile));
      const filled=await page.locator('svg[fill="none"]:visible').evaluateAll(icons=>icons.filter(svg=>getComputedStyle(svg).fill!=='none').map(svg=>svg.outerHTML.slice(0,160)));
      assert.deepEqual(filled,[],framework+' '+workspace+' outline icons');
      await noOverflow(page);
      if(theme==='light')await shot(page,framework+'-'+workspace+'-icon-parity');
      snapshot[workspace]=match;
    }
  } finally { await context.close(); }
  return snapshot;
}

async function checkDashboardImage(browser, framework, routes) {
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  try {
    const vue=framework==='vue';
    await page.goto(local+(vue?'/vue/#/chamber/setup/content':'/#chamber/setup/exporter-dashboard'));
    await page.getByRole('heading',{name:'Announcements & Chamber content',exact:true}).waitFor();
    const upload=await page.evaluate(()=>{
      const canvas=document.createElement('canvas');
      canvas.width=2160;
      canvas.height=920;
      const ctx=canvas.getContext('2d');
      const pixels=ctx.createImageData(canvas.width,canvas.height);
      let seed=31;
      for(let i=0;i<pixels.data.length;i+=4){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const shade=(seed>>>24)%17, accent=i/4%canvas.width>1440;
        pixels.data.set(accent?[179+shade,62+shade,16+shade,255]:[17+shade,29+shade,43+shade,255],i);
      }
      ctx.putImageData(pixels,0,0);
      ctx.strokeStyle='#ffd2b0';ctx.lineWidth=5;
      const container=(x,y,w,h)=>{
        ctx.strokeRect(x,y,w,h);
        for(let line=x+30;line<x+w;line+=30){ctx.beginPath();ctx.moveTo(line,y+12);ctx.lineTo(line,y+h-12);ctx.stroke();}
      };
      container(1550,560,470,180);container(1605,352,415,180);container(1730,144,290,180);
      ctx.fillStyle='#ffb98a';ctx.font='bold 32px sans-serif';ctx.fillText('CHAMBER WORKSHOP',126,188);
      ctx.fillStyle='#fff';ctx.font='bold 104px sans-serif';ctx.fillText('Export documentation',120,372);ctx.fillText('workshop',120,495);
      ctx.fillStyle='#ffdbc2';ctx.font='42px sans-serif';ctx.fillText('A practical session for exporters',126,633);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    const buffer=Buffer.from(upload,'base64');
    assert(buffer.length>600*1024, 'The sample must exceed the previous limit');
    await page.getByRole('button',{name:/^image$/i}).last().click();
    const block=page.locator(vue?'.content-editor':'.cd-block-fields').last();
    await block.getByRole('textbox',{name:vue?'Title':'Block title'}).fill('Export documentation workshop');
    await block.getByRole('textbox',{name:'Image description'}).fill('Export documentation workshop poster with an illustration of shipping containers');
    await block.getByRole('textbox',{name:'Caption (optional)'}).fill('A practical session from your chamber.');
    await block.locator('input[type="file"]').setInputFiles({name:'workshop.png',mimeType:'image/png',buffer});
    await block.locator('img').first().waitFor();
    await block.getByRole('checkbox',{name:'Feature on Exporter dashboard'}).check();
    const size=block.getByRole('combobox',{name:'Display size'});
    assert.equal(await size.inputValue(),'full');
    await size.selectOption('compact');
    if(vue)await page.getByRole('button',{name:'Preview',exact:true}).click();
    await page.locator('.exporter-dashboard-image[data-size="compact"] img').waitFor();
    if(vue)await page.getByRole('button',{name:'Edit content',exact:true}).click();
    await size.selectOption('medium');
    await size.scrollIntoViewIfNeeded();
    await shot(page,framework+'-featured-image-size-control');
    if(vue)await page.getByRole('button',{name:'Preview',exact:true}).click();
    await page.locator('.exporter-dashboard-image[data-size="medium"] img').waitFor();
    await page.getByRole('button',{name:vue?'Publish content':/^Publish(?: changes)?$/}).first().click();
    await page.waitForFunction(vue=>{
      const stored=vue?JSON.parse(localStorage.getItem('trade-documents-vue-comparison-v1-workspace'))?.content:
        JSON.parse(localStorage.getItem('ecert-dashboard-content-v1:demo'));
      const blocks=vue?stored?.published:stored?.published?.blocks;
      return blocks?.some(block=>block.type==='image'&&block.featured&&block.displaySize==='medium');
    },vue);
    await page.goto(local+routes.exporter);
    await page.reload();
    const image=page.locator('main .exporter-dashboard-image[data-size="medium"] img');
    await image.waitFor();
    await image.evaluate(element=>element.decode());
    assert.equal(await image.count(),1);
    const desktop=await image.boundingBox();
    assert(desktop.width>=800 && desktop.width<=840 && desktop.y<220,JSON.stringify(desktop));
    await shot(page,framework+'-featured-image-medium');
    await page.getByRole('button',{name:'Announcements',exact:true}).click();
    await image.waitFor();
    await page.setViewportSize({width:390,height:844});
    await noOverflow(page);
    assert((await image.boundingBox()).width>300);
  } finally {await context.close();}
}

async function checkCompactEditor(browser, framework) {
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  page.setDefaultTimeout(12000);
  const vue=framework==='vue';
  async function open(base){
    await page.goto(base+(vue?'/vue/#/exporter/applications/sample-draft-20261117-ata':'/#applications'));
    if(!vue){
      await page.getByRole('tab',{name:/^Drafts/}).or(page.getByRole('button',{name:/^Drafts/})).first().click();
      await page.locator('.list-options-search input').fill('SAMPLE-DRAFT-ATA');
      const draft=page.getByRole('row').filter({has:page.getByText('SAMPLE-DRAFT-ATA',{exact:true})}).first();
      await draft.click({button:'right'});
      await page.getByRole('menuitem',{name:'Continue',exact:true}).click();
      const steps=page.locator('.editor-application-navigation');
      const holder=steps.getByRole('button',{name:/Holder Details/i});
      if(!await holder.isVisible())await steps.getByRole('button',{name:/^Carnet details/i}).click();
      await holder.click();
      await page.locator('.editor-current-section strong').filter({hasText:/Holder Details/i}).waitFor();
    }
    const form=page.locator(vue?'.full-editor':'.editor-form-column');
    await form.waitFor();
    await page.evaluate(()=>{window.scrollTo(0,0);return document.fonts.ready;});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const y=await form.evaluate(node=>node.getBoundingClientRect().top+window.scrollY);
    return y;
  }
  try {
    const before=await open(source);
    await shot(page,framework+'-editor-header-before');
    const after=await open(local);
    assert(before-after>=(vue?12:26),JSON.stringify({framework,before,after}));
    const toolbar=page.locator(vue?'.editor-top':'.compact-editor-stage .button-group');
    const editorHeader=page.locator(vue?'.editor-top':'.compact-editor-stage');
    const desktopHeader=await editorHeader.boundingBox();
    assert(desktopHeader.height<=60,JSON.stringify({framework,desktopHeader}));
    await toolbar.getByRole(vue?'button':'switch',{name:/^Live preview$/i}).waitFor();
    if(!vue){
      await toolbar.getByRole('button',{name:'Preview documents',exact:true}).waitFor();
      await toolbar.getByRole('button',{name:'Save as template',exact:true}).waitFor();
    }
    await shot(page,framework+'-editor-header-after');
    await page.setViewportSize({width:390,height:844});
    await noOverflow(page);
    await toolbar.getByRole(vue?'button':'switch',{name:/^Live preview$/i}).waitFor();
    return {before,after};
  } finally {await context.close();}
}

async function checkShortViewport(browser, framework, routes) {
  const context=await browser.newContext({viewport:{width:729,height:398}});
  const page=await context.newPage();
  const vue=framework==='vue';
  try {
    await page.goto(local+routes.exporter);
    await page.getByRole('heading',{name:'Your next steps',exact:true}).waitFor();
    const firstPanel=page.locator(vue?'.work-column>.card':'.dashboard-section.attention-section').first();
    assert.equal(await firstPanel.evaluate(node=>getComputedStyle(node).paddingBlockStart),'16px');
    await noOverflow(page);
    await page.goto(local+alignmentRoutes[framework].applications);
    await page.locator('main table tbody tr').first().waitFor();
    await noOverflow(page);
    if(!vue){
      const references=page.locator('.application-reference-link:visible');
      assert(await references.count()>0);
      assert.equal(await references.evaluateAll(links=>links.filter(link=>link.scrollWidth>link.clientWidth+4).length),0);
      assert(await page.locator('.application-reference-summary .reference-short:visible').count()>0);
    }
    await shot(page,framework+'-short-viewport');
  } finally {await context.close();}
}

async function checkDanish(browser, framework, routes) {
  const context=await browser.newContext({viewport:{width:1366,height:768}});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    await page.goto(local+routes.exporter);
    await page.locator('.language-flag-button:visible, .language-control:visible').first().click();
    await page.getByRole('menuitemradio',{name:'Danish',exact:true}).click();
    await page.waitForFunction(()=>document.documentElement.lang==='da'&&document.documentElement.dir==='ltr');
    await page.getByRole('button',{name:'Oversigt',exact:true}).first().waitFor();
    const flag=page.locator('.language-flag-button img:visible, .language-control img:visible').first();
    await flag.evaluate(image=>image.decode());
    assert.match(await flag.getAttribute('src'),/flag-dk/);
    for(const route of [alignmentRoutes[framework].applications,routes.queue]){
      await page.goto(local+route);
      await page.getByLabel('Søg efter ansøgninger',{exact:true}).waitFor();
      await noOverflow(page);
    }
    await page.setViewportSize({width:390,height:844});
    await noOverflow(page);
    await page.reload();
    await page.waitForFunction(()=>document.documentElement.lang==='da');
    await page.getByLabel('Søg efter ansøgninger',{exact:true}).waitFor();
    await shot(page,framework+'-danish-chamber');
  } finally {await context.close();}
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
    for(const theme of ['light','dark']) {
      try {
        const react=await workspaceIcons(browser,'react',cases.react,theme);
        const vue=await workspaceIcons(browser,'vue',cases.vue,theme);
        for(const workspace of ['chamber','exporter']) {
          for(const name of Object.keys(react[workspace]))assert.deepEqual(vue[workspace][name],react[workspace][name],workspace+' '+name+' differs from React');
        }
        results.push({check:'workspace icon parity',theme,pass:true});
      } catch(error) { results.push({check:'workspace icon parity',theme,pass:false,error:error.stack}); }
    }
    for(const [framework,routes] of Object.entries(cases)) {
      try {await checkDashboardImage(browser,framework,routes);results.push({check:'featured Exporter image',framework,pass:true});}
      catch(error){results.push({check:'featured Exporter image',framework,pass:false,error:error.stack});}
    }
    for(const framework of Object.keys(cases)) {
      try {const heights=await checkCompactEditor(browser,framework);results.push({check:'compact editor header',framework,pass:true,...heights});}
      catch(error){results.push({check:'compact editor header',framework,pass:false,error:error.stack});}
    }
    for(const [framework,routes] of Object.entries(cases)) {
      for(const [check,run] of [['short viewport',checkShortViewport],['Danish workspace',checkDanish]]) {
        try{await run(browser,framework,routes);results.push({check,framework,pass:true});}
        catch(error){results.push({check,framework,pass:false,error:error.stack});}
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
