// The selected engine runs only in the existing cloud validation workflow.
const engines=require('playwright');
const name=process.env.CHECK_BROWSER||'chromium';
if(!['chromium','firefox','webkit'].includes(name))throw Error('Unsupported check browser: '+name);
module.exports={chromium:engines[name],engineName:name};
