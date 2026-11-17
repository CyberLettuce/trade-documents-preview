import auditLanguage from './assets/audit-language.js?v=2026-11-17-vue-combined-workspaces-r3';
import nl from './assets/language-nl.js';
import other from './assets/language-other.js';
import sv from './assets/language-sv.js';
import pt from './assets/language-pt.js';
import supplement from './assets/language-supplement.js';
export const LANGUAGES=[{code:'en',name:'English',flag:'gb'},{code:'nl',name:'Dutch',flag:'nl'},{code:'et',name:'Estonian',flag:'ee'},{code:'ar',name:'العربية',flag:'sa'},{code:'sv',name:'Swedish',flag:'se'},{code:'pt',name:'Portuguese',flag:'pt'}];
const dictionaries={nl,...other.dictionaries,sv,pt};
for(const lang of Object.keys(dictionaries))Object.assign(dictionaries[lang],supplement[lang],other.patterns[lang],auditLanguage[lang]);
for(const [lang,words] of Object.entries({nl:['Donkere modus','Lichte modus'],et:['Tume režiim','Hele režiim'],ar:['الوضع الداكن','الوضع الفاتح'],sv:['Mörkt läge','Ljust läge'],pt:['Modo escuro','Modo claro']})){dictionaries[lang]['Dark mode']=words[0];dictionaries[lang]['Light mode']=words[1];}
const interfaceWords={nl:{'Workspace':'Werkruimte','Next action overdue':'Volgende actie te laat','Next action due soon':'Volgende actie binnenkort','Customise claims':'Claims aanpassen','Claim / holder (always shown)':'Claim / houder (altijd zichtbaar)','Actions (always shown)':'Acties (altijd zichtbaar)'},et:{'Next action overdue':'Järgmise toimingu tähtaeg on möödas','Next action due soon':'Järgmise toimingu tähtaeg läheneb'},ar:{'Next action overdue':'الإجراء التالي متأخر','Next action due soon':'موعد الإجراء التالي قريب'},sv:{'Next action overdue':'Nästa åtgärd är försenad','Next action due soon':'Nästa åtgärd förfaller snart'},pt:{'Next action overdue':'Próxima ação em atraso','Next action due soon':'Próxima ação a vencer'}};
for(const [language,words] of Object.entries(interfaceWords))Object.assign(dictionaries[language],words);
const queueCopy={nl:'Prioriteit eerst, daarna langst wachtend',et:'Esmalt prioriteetsed, seejärel kõige kauem oodanud',ar:'الأولوية أولاً، ثم الأطول انتظاراً',sv:'Prioriterade först, sedan längst väntetid',pt:'Prioridade primeiro, depois os que esperam há mais tempo'};
for(const [language,text] of Object.entries(queueCopy))dictionaries[language]['Priority first, then waiting longest']=text;
const folded=Object.fromEntries(Object.entries(dictionaries).map(([lang,entries])=>[lang,Object.fromEntries(Object.entries(entries).map(([k,v])=>[k.toLowerCase(),v]))]));
const patterns={},escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function translate(text,language,depth=0){
 if(language==='en'||!text||depth>3)return text;const dictionary=dictionaries[language]||{},trim=text.trim();
 if(dictionary[trim])return text.replace(trim,dictionary[trim]);if(folded[language]?.[trim.toLowerCase()])return text.replace(trim,folded[language][trim.toLowerCase()]);
 if(!patterns[language])patterns[language]=Object.entries(dictionary).filter(([key])=>/\{\d+\}/.test(key)).sort((a,b)=>b[0].length-a[0].length).map(([key,value])=>{const indices=[];const expression=key.split(/(\{\d+\})/).map(part=>/^\{\d+\}$/.test(part)?(indices.push(part.slice(1,-1)),'(.+?)'):escape(part)).join('');return{re:new RegExp('^'+expression+'$'),value,indices}});
 for(const p of patterns[language]){const match=trim.match(p.re);if(match){const output=p.value.replace(/\{(\d+)\}/g,(_,i)=>translate(match[p.indices.indexOf(i)+1]||'',language,depth+1));return text.replace(trim,output)}}
 const parts=trim.split(/( · | — |, |: |\s*\*\s*$)/);if(parts.length>1)return text.replace(trim,parts.map(p=>translate(p,language,depth+1)).join(''));
 const number=trim.match(/^(\d+) (applications|records|documents|files|pages|stamps placed)$/);if(number&&dictionary[number[2]])return number[1]+' '+dictionary[number[2]];
 const countLabel=trim.match(/^(\d+) (approved|rejected|unread)$/i);if(countLabel)return countLabel[1]+' '+translate(countLabel[2].charAt(0).toUpperCase()+countLabel[2].slice(1),language,depth+1);
 const action=trim.match(/^(Open|View|Review|Copy|Delete|Archive|Remove|Download|Search|Updated|Submitted) (.+)$/);if(action&&dictionary[action[1]])return dictionary[action[1]]+' '+translate(action[2],language,depth+1);
 return text;
}
// Translate rendered interface text while preserving original values and user data.
// Vue continues to own the DOM and the data values; the observer never changes a form value.
export function installLanguage(getLanguage,root=document.body){let observer,scheduled=false;const source=new WeakMap(),attributes=new WeakMap();const excluded=node=>node.closest?.('[translate="no"],script,style,svg,canvas,.certificate-sheet,.signature-thumb');
 function run(){scheduled=false;observer?.disconnect();const language=getLanguage()||'en';document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(excluded(node.parentElement)||!node.nodeValue.trim())continue;const old=source.get(node),original=old&&node.nodeValue===old.output?old.input:node.nodeValue;if(node.parentElement?.tagName==='OPTION'&&!node.parentElement.hasAttribute('value'))node.parentElement.value=original;const output=translate(original,language);source.set(node,{input:original,output});if(node.nodeValue!==output)node.nodeValue=output;}
 for(const el of root.querySelectorAll('[aria-label],[placeholder],[title],[data-tip]')){if(excluded(el))continue;const values=attributes.get(el)||{};for(const attr of ['aria-label','placeholder','title','data-tip'])if(el.hasAttribute(attr)){const current=el.getAttribute(attr),old=values[attr],input=old&&old.output===current?old.input:current,output=translate(input,language);values[attr]={input,output};if(current!==output)el.setAttribute(attr,output);}attributes.set(el,values);}observer?.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title','data-tip']});}
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(run)}}observer=new MutationObserver(schedule);run();return{update:run,destroy:()=>observer.disconnect()};}
export const LanguageControl={props:['modelValue'],emits:['update:modelValue'],setup(){return{LANGUAGES}},template:String.raw`<label class="language-control icon-button" data-tip="Language"><img :src="'./assets/flag-'+(LANGUAGES.find(l=>l.code===modelValue)?.flag||'gb')+'.svg'" alt=""><select aria-label="Language" :value="modelValue||'en'" @change="$emit('update:modelValue',$event.target.value)" ><option translate="no" v-for="language in LANGUAGES" :value="language.code">{{language.name}}</option></select></label>`};
