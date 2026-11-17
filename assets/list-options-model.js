// Shared by both interfaces. View preferences do not change filters or records.
export function optionsStorageKey(workspace, page) {
  return `trade-documents:options:${workspace}:${page}`;
}
export function optionsStorage() {
  try { return window.localStorage; } catch { return null; }
}
export function readOptionsOpen(storage, key) {
  try { return storage.getItem(key) === 'open'; } catch { return false; }
}
export function writeOptionsOpen(storage, key, open) {
  try { storage.setItem(key, open ? 'open' : 'closed'); } catch { /* Storage may be unavailable. */ }
}
export function hasOptionFilters(filters) {
  return Object.entries(filters || {}).some(([key, value]) =>
    !['query', 'search', 'includeStatus', 'sort'].includes(key) &&
    (Array.isArray(value) ? value.length > 0 : value !== '' && value != null && value !== false && value !== 'All' && value !== 'all' && value !== 'any'));
}
