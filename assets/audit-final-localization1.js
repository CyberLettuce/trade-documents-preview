import{registerPatterns}from"./language-runtime-review1-57775012.js?v=2026-11-17-personal-quick-access-r1";
const words={"Discard autosave {0}":["Automatisch opgeslagen werk {0} verwijderen","Loobu automaatselt salvestatud tööst {0}","تجاهل العمل المحفوظ تلقائياً {0}"],"{0} document":["{0} document","{0} dokument","{0} مستند"],"{0} documents":["{0} documenten","{0} dokumenti","{0} مستندات"]};
for(const[index,locale]of["nl","et","ar"].entries())registerPatterns(Object.entries(words).map(([en,values])=>[en,values[index]]),locale);
