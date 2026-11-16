import {Flash16Filled} from "./auto-accepted-flash2.js";
import {languageCreateElement as h,registerPatterns} from './language-runtime-iconfix1-0b9efe5c.js';
import {isAutoAcceptedApplication} from './auto-accepted-model1-iconfix1-2c62017f.js';
registerPatterns([['Auto Accepted','Automatisch geaccepteerd'],['Automatic','Automatisch'],['Auto Accepted (sample)','Automatisch geaccepteerd (voorbeeld)']],'nl');
registerPatterns([['Auto Accepted','Automaatselt kinnitatud'],['Automatic','Automaatne'],['Auto Accepted (sample)','Automaatselt kinnitatud (näidis)']],'et');
registerPatterns([['Auto Accepted','مقبول تلقائيًا'],['Automatic','تلقائي'],['Auto Accepted (sample)','مقبول تلقائيًا (مثال)']],'ar');
export function AutoAcceptedStatus({app,fallback}){return isAutoAcceptedApplication(app)?h('span',{className:'ch-badge auto-accepted'},h(Flash16Filled,{className:"auto-accepted-icon","aria-hidden":true}),h('span',{className:'auto-accepted-label'},'Auto Accepted')):h(fallback,{status:app.status});}
