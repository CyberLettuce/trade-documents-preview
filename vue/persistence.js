// Keep display preferences separate so a menu or theme change does not rewrite records.
export function createDeferredSave(write, delay = 200) {
  let timer;
  const flush = () => { if (timer !== undefined) { clearTimeout(timer); timer = undefined; write(); } };
  return { schedule() { clearTimeout(timer); timer = setTimeout(() => { timer = undefined; write(); }, delay); }, flush };
}
