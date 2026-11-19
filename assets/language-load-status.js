export function languageLoadFailure(retry) {
  let alert = document.getElementById('language-load-error');
  if (alert) return;
  alert = document.createElement('div');
  alert.id = 'language-load-error'; alert.setAttribute('role', 'alert');
  alert.append('The language could not be loaded. Your entries are safe. ');
  const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Retry';
  button.addEventListener('click', () => { alert.remove(); retry(); });
  alert.append(button); document.body.append(alert);
}
export function languageLoadSuccess() { document.getElementById('language-load-error')?.remove(); }
