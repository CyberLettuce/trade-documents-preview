// Shared, independently testable rules for queues and performance reports.
export const documentNames = r => [...new Set(r.documents?.length ? r.documents : [r.document])].filter(Boolean);
export const decisionStatus = r => r.status === 'Archive' ? r.previousStatus : r.status;
export const isDecision = r => ['Approved', 'Auto Accepted', 'Rejected'].includes(decisionStatus(r));
export const decisionUser = r => r.decisionBy || (decisionStatus(r) === 'Auto Accepted' ? 'Automatic' : r.owner) || 'Unassigned';
export function decisionDate(r) {
  const explicit = r.decidedAt || r.approvedAt || r.rejectedAt;
  if (explicit) return explicit;
  const historical = [...(r.history || [])].reverse().find(h => /^(Approved|Rejected|Auto Accepted)/i.test(h.title || ''))?.at;
  if (historical) return historical;
  // Older preview records stored an elapsed interval rather than a decision date.
  const submitted = Date.parse(r.submittedAt);
  if (isDecision(r) && Number.isFinite(submitted) && Number.isFinite(r.handledMinutes) && r.handledMinutes >= 0) return new Date(submitted + r.handledMinutes * 60000).toISOString();
  return null;
}
export function handlingMinutes(r) {
  if (!isDecision(r)) return null;
  const submitted = Date.parse(r.submittedAt), decided = Date.parse(decisionDate(r));
  if (Number.isFinite(submitted) && Number.isFinite(decided)) return decided >= submitted ? (decided - submitted) / 60000 : null;
  return Number.isFinite(r.handledMinutes) && r.handledMinutes >= 0 ? r.handledMinutes : null;
}
export function duration(minutes) {
  if (minutes === null || !Number.isFinite(minutes)) return 'Not recorded';
  if (minutes > 0 && minutes < 1) return '<1m';
  const total = Math.round(minutes), hours = Math.floor(total / 60), rest = total % 60;
  return hours ? `${hours}h${rest ? ' ' + rest + 'm' : ''}` : `${total}m`;
}
export function performanceSummary(records) {
  const done = records.filter(isDecision), approved = done.filter(r => decisionStatus(r) !== 'Rejected'), rejected = done.filter(r => decisionStatus(r) === 'Rejected');
  const average = rows => { const times = rows.map(handlingMinutes).filter(v => v !== null); return {minutes: times.length ? times.reduce((a,b) => a+b,0) / times.length : null, timed: times.length, applications: rows.length}; };
  const count = rows => rows.reduce((n,r) => n + documentNames(r).length, 0);
  return {applications:done.length, documents:count(done), approved:count(approved), rejected:count(rejected), approval:average(approved), rejection:average(rejected), records:done};
}
export function performanceBy(records, mode = 'user') {
  const done = records.filter(isDecision), keys = [...new Set(done.flatMap(r => mode === 'document' ? documentNames(r) : [decisionUser(r)]))].sort();
  return keys.map(name => { const rows = done.filter(r => mode === 'document' ? documentNames(r).includes(name) : decisionUser(r) === name), summary = performanceSummary(rows); return {...summary, name, ...(mode === 'document' ? {documents:rows.length, approved:rows.filter(r=>decisionStatus(r)!=='Rejected').length, rejected:rows.filter(r=>decisionStatus(r)==='Rejected').length} : {})}; });
}
export function reportMatches(r, filters = {}) {
  if (decisionStatus(r) === 'Draft' || (filters.decisionsOnly && !isDecision(r))) return false;
  const date = String(filters.decisionsOnly ? decisionDate(r) || '' : r.updatedAt || '').slice(0,10), status = decisionStatus(r);
  return (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to && !!date) && (!filters.status || (filters.status === 'Approved' ? ['Approved','Auto Accepted'].includes(status) : status === filters.status)) && (!filters.document || documentNames(r).includes(filters.document)) && (!filters.user || decisionUser(r) === filters.user) && (!filters.exporter || r.exporter === filters.exporter) && (!filters.service || r.service === filters.service) && (!filters.query || JSON.stringify(r).toLowerCase().includes(filters.query.toLowerCase().trim()));
}
export function queueMatches(r, view, officer) {
  return !view || view === 'all' || (view === 'mine' && r.owner === officer) || (view === 'unassigned' && !r.owner) || (view === 'priority' && r.priority) || (view === 'unpaid' && !r.paid);
}
export const CLAIM_LETTERS = ['A','C','I','G','G2','H1','H2','F'];
export function claimProgress(c) { const count = CLAIM_LETTERS.filter(k => c.letters?.[k]?.done).length; return {count, label:count === 0 ? 'Not started' : count === CLAIM_LETTERS.length ? 'All letters recorded' : 'In progress'}; }
export function claimDue(c, today = new Date().toISOString().slice(0,10)) { if (!c.nextDue) return 'none'; const days = Math.round((Date.parse(c.nextDue)-Date.parse(today))/86400000); return days < 0 ? 'overdue' : days <= 7 ? 'soon' : 'later'; }
export function cleanDraftData(record) {
  const data = JSON.parse(JSON.stringify(record));
  for (const key of ['certificate','owner','signatory','secondChecker','secondCheckedAt','secondCheckedBy','workflow','decidedAt','decisionBy','approvedAt','rejectedAt','handledMinutes','previousStatus','fees','rejectionReason','submittedAt','paid','editorStep','invoiceDate']) delete data[key];
  data.files=(data.files||[]).map(({stampedId,stamps,...file})=>file); data.pdf=null;
  return data;
}
