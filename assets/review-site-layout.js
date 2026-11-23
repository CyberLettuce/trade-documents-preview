export const reviewPhoneQuery = '(max-width: 600px)';

export function reviewViewportChanged(update) {
  const viewport = matchMedia(reviewPhoneQuery);
  const refresh = () => update(viewport.matches);
  viewport.addEventListener('change', refresh);
  refresh();
  return () => viewport.removeEventListener('change', refresh);
}

export function shortApplicationReference(reference) {
  const match = String(reference ?? '').match(/\/([0-9]+)(X?)\/([A-Z]+)$/i);
  if (!match || match[1].length <= 5) return '';
  return '…' + match[1].slice(-5) + match[2] + '/' + match[3];
}

export const handlingTimeDefinition = 'Handling time runs from submission to the final decision, including waiting time. It is attributed to the final decision-maker.';

export function daysWaiting(submitted, now = new Date()) {
  if (!submitted) return null;
  const days = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    - Date.parse(String(submitted).slice(0, 10))) / 86400000);
  return Number.isFinite(days) ? Math.max(0, days) : null;
}
