import {languageCreateElement as h,registerPatterns} from './language-runtime-auto1-657965c2.js';
import {isAutoAcceptedApplication} from './auto-accepted-model1.js';
registerPatterns([['Auto Accepted','Automatisch geaccepteerd'],['Automatic','Automatisch'],['Auto Accepted (sample)','Automatisch geaccepteerd (voorbeeld)']],'nl');
registerPatterns([['Auto Accepted','Automaatselt kinnitatud'],['Automatic','Automaatne'],['Auto Accepted (sample)','Automaatselt kinnitatud (näidis)']],'et');
registerPatterns([['Auto Accepted','مقبول تلقائيًا'],['Automatic','تلقائي'],['Auto Accepted (sample)','مقبول تلقائيًا (مثال)']],'ar');
export function AutoAcceptedStatus({app,fallback}){return isAutoAcceptedApplication(app)?h('span',{className:'ch-badge auto-accepted'},h('img',{className:'auto-accepted-icon',src:'./assets/auto-accepted-flash1.svg',alt:'','aria-hidden':true}),h('span',{className:'auto-accepted-label'},'Auto Accepted')):h(fallback,{status:app.status});}
