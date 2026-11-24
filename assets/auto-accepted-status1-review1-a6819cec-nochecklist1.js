import {Flash16Filled} from "./auto-accepted-flash2-review1-a216b1b7-nochecklist1.js?v=2026-11-24-dashboard-image-size-r1";
import {languageCreateElement as h,registerPatterns} from './language-runtime-review1-57775012.js?v=2026-11-20-acceptance-r1';
import {isAutoAcceptedApplication} from './auto-accepted-model1-review1-65eab4c9.js?v=2026-11-20-certificate-review-r1';
registerPatterns([['Auto Accepted','Automatisch geaccepteerd'],['Automatic','Automatisch'],['Auto Accepted (sample)','Automatisch geaccepteerd (voorbeeld)']],'nl');
registerPatterns([['Auto Accepted','Automaatselt kinnitatud'],['Automatic','Automaatne'],['Auto Accepted (sample)','Automaatselt kinnitatud (näidis)']],'et');
registerPatterns([['Auto Accepted','مقبول تلقائيًا'],['Automatic','تلقائي'],['Auto Accepted (sample)','مقبول تلقائيًا (مثال)']],'ar');
export function AutoAcceptedStatus({app,fallback}){return isAutoAcceptedApplication(app)?h('span',{className:'ch-badge auto-accepted'},h(Flash16Filled,{className:"auto-accepted-icon","aria-hidden":true}),h('span',{className:'auto-accepted-label'},'Auto Accepted')):h(fallback,{status:app.status});}
