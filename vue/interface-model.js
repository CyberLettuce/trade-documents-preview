// Shared by the notification drawer and its badge so read/dismiss preferences agree.
export function notificationItems(records, claims, accounts, preferences, dismissed = [], today = new Date().toISOString().slice(0, 10)) {
  const items = [];
  if (preferences.notifySubmitted) for (const r of records.filter(r => ['Pending', 'In Progress'].includes(r.status))) items.push({id:r.id+'-submitted',title:'Application submitted',detail:r.reference,target:'applications/'+r.id});
  if (preferences.notifyDecisions) for (const r of records.filter(r => ['Approved', 'Rejected', 'Auto Accepted'].includes(r.status))) items.push({id:r.id+'-'+r.status,title:r.status,detail:r.reference,target:'applications/'+r.id});
  if (preferences.notifyClaims) for (const c of claims.filter(c => c.status==='Open')) items.push({id:c.id,title:'Open claim',detail:c.reference,target:'claims/'+c.id});
  const cutoff = new Date(Date.parse(today)+30*86400000).toISOString().slice(0,10);
  if (preferences.notifyRenewals) for (const a of accounts.filter(a => a.renewal && a.renewal<=cutoff && a.status!=='Archived')) items.push({id:a.id+'-renewal-'+a.renewal,title:'Formal undertaking renewal due',detail:a.name,target:'exporters/'+a.id});
  return items.filter(i => !dismissed.includes(i.id));
}

// Dashboard totals describe the entire queue, independent of earlier list filters.
export function dashboardQueue(tab, queueView = 'all') {
  return {tab,queueView,query:'',document:'All',service:'All',owner:'All',conditions:[],pageIndex:1,queueScroll:0};
}
