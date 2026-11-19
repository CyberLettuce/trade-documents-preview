export function readPreference(key, fallback) {
  try { const value = localStorage.getItem('trade-review-' + key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; }
}
export function savePreference(key, value) {
  try { localStorage.setItem('trade-review-' + key, JSON.stringify(value)); } catch { /* Display preferences are optional. */ }
}
export function rememberedZoom() {
  const value = readPreference('zoom', 'width');
  return ['width', 'page', '75', '100', '125'].includes(value) ? value : 'width';
}
