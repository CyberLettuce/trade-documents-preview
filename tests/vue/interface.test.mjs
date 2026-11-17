import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationItems,dashboardQueue} from '../../vue/interface-model.js';
import {interfaceLocale,formatDate} from '../../vue/workspace.js';
test('date formatting changes immediately when the interface language changes',()=>{
  for(const language of ['pt','ar','nl','et','sv','en']){interfaceLocale.value=language;assert.equal(formatDate('2026-11-17'),new Intl.DateTimeFormat(language==='en'?'en-GB':language,{day:'2-digit',month:'short',year:'numeric'}).format(new Date('2026-11-17')))}
});
test('dashboard shortcuts clear stale conditions and preserve the requested queue',()=>{
  const ui={query:'no match',owner:'Taylor',document:'ATA Carnet',service:'Standard',conditions:[{field:'destination',value:'France'}],pageIndex:3,columns:{destination:false}};
  Object.assign(ui,dashboardQueue('Pending','unassigned'));
  assert.equal(ui.owner,'All');assert.equal(ui.query,'');assert.equal(ui.document,'All');assert.equal(ui.service,'All');assert.deepEqual(ui.conditions,[]);assert.equal(ui.pageIndex,1);assert.equal(ui.queueView,'unassigned');assert.deepEqual(ui.columns,{destination:false});
});
test('notification preferences, dismissal and thirty-day renewals share one source',()=>{
  const records=[{id:'pending',status:'Pending',reference:'p'},{id:'auto',status:'Auto Accepted',reference:'a'},{id:'draft',status:'Draft'}];
  const claims=[{id:'open',status:'Open'},{id:'closed',status:'Closed'}];
  const accounts=[{id:'due',status:'Active',renewal:'2026-12-17'},{id:'later',status:'Active',renewal:'2026-12-18'},{id:'gone',status:'Archived',renewal:'2026-11-01'}];
  const prefs={notifySubmitted:true,notifyDecisions:true,notifyClaims:true,notifyRenewals:true};
  assert.deepEqual(notificationItems(records,claims,accounts,prefs,[],'2026-11-17').map(i=>i.id),['pending-submitted','auto-Auto Accepted','open','due-renewal-2026-12-17']);
  assert.deepEqual(notificationItems(records,claims,accounts,{...prefs,notifySubmitted:false},['open'],'2026-11-17').map(i=>i.id),['auto-Auto Accepted','due-renewal-2026-12-17']);
});
