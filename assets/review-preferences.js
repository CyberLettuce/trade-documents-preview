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

export function rememberedChamberZoom() {
  const value = readPreference('chamber-zoom', 'page');
  return ['width', 'page', '75', '100', '125'].includes(value) ? value : 'page';
}

export function reviewPageHeight(stage, offset = 0) {
  // Size against the review at its starting scroll position so scrolling never changes zoom.
  let top = stage.getBoundingClientRect().top + window.scrollY;
  for (let parent = stage.parentElement; parent && parent !== document.scrollingElement; parent = parent.parentElement) {
    top += parent.scrollTop;
  }
  return Math.max(160, Math.floor(window.innerHeight - top - offset - 80));
}
