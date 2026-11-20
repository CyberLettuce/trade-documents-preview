const controls = 'button, a[href], [role="button"], [data-tip]';
const compactControls = '.icon-button, .row-action-icon, .notification-trigger, .suite-chat, .suite-account, .suite-chamber, .suite-navigation, .language-flag-button';
const hiddenText = 'svg, [hidden], [aria-hidden="true"], .visually-hidden, .outline-screen-reader, .sr-only';

function visibleText(control) {
  const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
  const parts = [];
  for (let item = walker.nextNode(); item; item = walker.nextNode()) {
    const value = item.textContent.trim();
    if (/\p{L}/u.test(value) && !item.parentElement.closest(hiddenText)) parts.push(value);
  }
  return parts.join(' ');
}

function labelledBy(control) {
  return (control.getAttribute('aria-labelledby') || '').trim().split(/\s+/)
    .map(id => document.getElementById(id)?.textContent.trim()).filter(Boolean).join(' ');
}

// Shared by both workspaces. Native dialogs put the tooltip in their own top layer.
export function installTooltips() {
  const tip = document.createElement('div');
  tip.id = 'workspace-tooltip';
  tip.className = 'workspace-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.append(tip);
  let active, clearTimer;

  const clearLeave = () => clearTimeout(clearTimer);
  function hide() {
    clearLeave();
    tip.hidden = true;
    if (!active) return;
    const {control, title, named, described} = active;
    active = null;
    if (title && !control.hasAttribute('title')) control.setAttribute('title', title);
    if (named && control.getAttribute('aria-label') === named) control.removeAttribute('aria-label');
    if (described) {
      const ids = (control.getAttribute('aria-describedby') || '').split(/\s+/)
        .filter(id => id && id !== tip.id);
      if (ids.length) control.setAttribute('aria-describedby', ids.join(' '));
      else control.removeAttribute('aria-describedby');
    }
  }

  function show(target) {
    const control = target instanceof Element && target.closest(controls);
    if (!control || control.disabled || control.getAttribute('aria-disabled') === 'true') return;
    clearLeave();
    if (active?.control === control) return;
    hide();
    if (control.getAttribute('aria-describedby')?.split(/\s+/).some(id =>
      id.startsWith('tooltip-') || document.getElementById(id)?.getAttribute('role') === 'tooltip')) return;
    const explicit = control.getAttribute('data-tip')?.trim();
    const title = control.getAttribute('title');
    const label = control.getAttribute('aria-label')?.trim() || labelledBy(control);
    const text = visibleText(control);
    const iconOnly = control.matches(compactControls) || !text;
    const value = explicit || (iconOnly ? title?.trim() || label : '');
    if (!value) return;
    const named = !label && !text && (title || explicit);
    if (named) control.setAttribute('aria-label', named);
    if (title) control.removeAttribute('title');
    const described = value !== (label || named || text);
    if (described) {
      const previous = control.getAttribute('aria-describedby');
      control.setAttribute('aria-describedby', [previous, tip.id].filter(Boolean).join(' '));
    }

    active = {control, title, named, described};
    const host = control.closest('dialog[open]') || document.body;
    if (tip.parentElement !== host) host.append(tip);
    tip.textContent = value;
    tip.hidden = false;
    const anchor = control.getBoundingClientRect();
    const box = tip.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(innerWidth - box.width - 8,
      anchor.left + (anchor.width - box.width) / 2)) + 'px';
    tip.style.top = Math.max(8, Math.min(innerHeight - box.height - 8,
      anchor.top > box.height + 12 ? anchor.top - box.height - 8 : anchor.bottom + 8)) + 'px';
  }

  function leave(event) {
    if (!active || active.control.contains(event.relatedTarget) || tip.contains(event.relatedTarget)) return;
    clearLeave();
    clearTimer = setTimeout(hide, 130);
  }

  const listeners = new AbortController();
  const options = {signal: listeners.signal};
  document.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    if (tip.contains(event.target)) clearLeave();
    else show(event.target);
  }, options);
  document.addEventListener('pointerout', leave, options);
  document.addEventListener('focusin', event => show(event.target), options);
  document.addEventListener('focusout', leave, options);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); }, options);
  document.addEventListener('click', hide, options);
  window.addEventListener('scroll', hide, {...options, capture: true});
  window.addEventListener('resize', hide, options);
  const changes = new MutationObserver(records => {
    if (!active) return;
    const {control} = active;
    if (!control.isConnected) hide();
    else if (records.some(change => change.target === control && change.type === 'attributes')) {
      hide();
      show(control);
    }
  });
  changes.observe(document.body, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ['data-tip','disabled','aria-disabled']
  });
  return () => { listeners.abort(); changes.disconnect(); hide(); tip.remove(); };
}
