import { r as React, I as Icon, M as Modal } from './index-Cj32ATD7-dashboardviews1.js';
import { languageCreateElement as localiseElement, preserveValue } from './language-runtime-dashboardviews1.js';
import { readProfile, chamberId, readUpdates, CONTENT_EVENT, CHAMBER_KEY } from './chamber-profile-dashboardviews1.js';
import { ChamberUpdateBlock } from './ChamberContent-PZCQTEV1-dashboardviews1.js';
import { DEFAULT_SETTINGS, SETTINGS_PREFIX, PREFERENCE_PREFIX, SETTINGS_EVENT, readSettings, saveSettings, readPreference, savePreference, resolveView } from './dashboard-view-logic1.js';
function h(type, props, ...children) {
  return localiseElement(type, props, ...children.map((child, index) => React.isValidElement?.(child) && child.key == null ? React.cloneElement(child, {
    key: 'part-' + index
  }) : child));
}
const icon = name => h(Icon, {
  name
});
const SETTINGS_TAB = 'trade-documents-dashboard-settings-tab';
function announce() {
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}
function useChanges() {
  const [, set] = React.useState(0);
  React.useEffect(() => {
    const update = event => {
      if (event?.type === 'storage' && event.key && !event.key.startsWith(SETTINGS_PREFIX) && !event.key.startsWith(PREFERENCE_PREFIX) && !event.key.startsWith('ecert-dashboard-content-v1:') && event.key !== CHAMBER_KEY) return;
      set(n => n + 1);
    };
    for (const type of [SETTINGS_EVENT, CONTENT_EVENT, 'storage', 'focus']) window.addEventListener(type, update);
    const timer = setInterval(update, 60000);
    return () => {
      for (const type of [SETTINGS_EVENT, CONTENT_EVENT, 'storage', 'focus']) window.removeEventListener(type, update);
      clearInterval(timer);
    };
  }, []);
}
function useExporter(account) {
  useChanges();
  const profile = readProfile(localStorage, account),
    scope = chamberId(account, profile),
    settings = readSettings(localStorage, scope).settings,
    preference = readPreference(localStorage, scope, account?.id),
    updates = readUpdates(localStorage, scope);
  return {
    profile,
    scope,
    settings,
    preference,
    updates,
    ...resolveView(settings, preference)
  };
}
export function dashboardSettingsInitialTab() {
  try {
    if (sessionStorage.getItem(SETTINGS_TAB) === 'dashboard') {
      sessionStorage.removeItem(SETTINGS_TAB);
      return 'dashboard';
    }
  } catch {}
  return 'defaults';
}
const errorText = 'Changes could not be saved. Browser storage is unavailable or full.';
function Failure({
  message
}) {
  return message && h('p', {
    className: 'dv-error',
    role: 'alert'
  }, icon('exclamation-circle'), message);
}
function ViewControls({
  data,
  account
}) {
  const [error, setError] = React.useState('');
  function choose(value) {
    try {
      savePreference(localStorage, data.scope, account.id, {
        enabled: true,
        view: value
      });
      setError('');
      announce();
    } catch {
      setError(errorText);
    }
  }
  return h('div', {
    className: 'dv-view-row'
  }, h('div', null, h('span', {
    className: 'dv-view-label'
  }, 'Dashboard view'), h('p', null, 'Your choice is remembered for this exporter account.')), h('div', {
    className: 'dv-view-actions'
  }, h('div', {
    className: 'dv-segmented',
    role: 'group',
    'aria-label': 'Dashboard view'
  }, [['stats', 'bar-chart', 'Stats'], ['announcements', 'bell', 'Announcements']].map(([value, ico, label]) => h('button', {
    key: value,
    type: 'button',
    'aria-pressed': data.view === value,
    onClick: () => choose(value)
  }, icon(ico), label)))), h(Failure, {
    message: error
  }));
}
function Updates({
  data,
  compact,
  onOpen
}) {
  const {
      settings,
      updates
    } = data,
    blocks = updates.blocks,
    lead = blocks.find(b => ['announcement', 'notice'].includes(b.type)) || blocks[0],
    rest = blocks.filter(b => b !== lead);
  const heading = settings.heading === DEFAULT_SETTINGS.heading ? 'From your chamber' : preserveValue(settings.heading);
  return h('section', {
    className: 'dv-updates' + (compact ? ' is-compact' : ''),
    'aria-label': 'Chamber announcements'
  }, h('div', {
    className: 'section-heading'
  }, h('h2', null, heading), h('span', {
    className: 'dv-chamber-source'
  }, icon('globe2'), 'Your chamber')), !lead ? h('p', {
    className: 'dv-empty'
  }, 'Your chamber has no current announcements.') : h(React.Fragment, null, h('article', {
    className: (compact ? 'dv-compact-notice' : settings.style === 'featured' ? 'dv-featured' : 'dv-simple-notice') + ' dv-accent-' + settings.accent
  }, h('div', {
    className: 'dv-update-meta'
  }, icon('bell'), updates.sample ? 'Sample update' : 'Chamber announcement'), compact ? h('h3', null, preserveValue(lead.title || '')) : h(ChamberUpdateBlock, {
    block: lead,
    onRead: onOpen
  }), h('button', {
    type: 'button',
    className: compact ? 'text-button' : settings.style === 'featured' ? 'button primary' : 'text-button',
    onClick: () => onOpen(lead)
  }, 'Read announcement', icon('arrow-right'))), rest.length > 0 && h('div', {
    className: compact ? 'dv-update-list' : 'dv-update-grid'
  }, rest.map(block => h('article', {
    key: block.id,
    className: 'dv-update-card'
  }, h('div', {
    className: 'dv-update-meta'
  }, icon(block.type === 'notice' ? 'info-circle' : 'file-earmark'), 'Chamber update'), h('h3', null, preserveValue(block.title || '')), !compact && block.body && h('p', null, preserveValue(block.body.length > 150 ? block.body.slice(0, 147) + '…' : block.body)), h('button', {
    type: 'button',
    className: 'text-button',
    onClick: () => onOpen(block)
  }, 'Read update', icon('arrow-right')))))));
}
function Totals({
  counts,
  onApplications
}) {
  return h('section', {
    className: 'dv-small-totals',
    'aria-label': 'Application totals'
  }, h('h2', null, 'Your applications'), h('div', null, ['Drafts', 'Submitted', 'Rejected', 'Completed'].map(label => h('button', {
    key: label,
    type: 'button',
    onClick: () => onApplications(label)
  }, h('span', null, label), h('strong', null, counts[label] || 0)))));
}
export function DashboardViews({
  children,
  account,
  counts,
  onApplications
}) {
  const data = useExporter(account),
    [open, setOpen] = React.useState(null);
  const [heading, layout] = children.props.children,
    [primary, rail] = layout.props.children,
    parts = primary.props.children,
    railParts = Array.isArray(rail.props.children) ? rail.props.children : [rail.props.children],
    attention = parts.find(p => p?.props?.className?.includes('attention-section')),
    recent = parts.find(p => p?.props?.className?.includes('recent-section')),
    stats = parts[0],
    contact = railParts[0],
    rejections = railParts.slice(1);
  const updates = compact => h(Updates, {
    data,
    compact,
    onOpen: setOpen
  });
  return h(React.Fragment, null, heading, data.controlsVisible ? h(ViewControls, {
    data,
    account
  }) : null, h('div', {
    className: 'dv-dashboard dv-mode-' + data.view
  }, h('div', {
    className: 'dv-main'
  }, data.view === 'stats' ? h(React.Fragment, null, stats, attention, recent) : h(React.Fragment, null, updates(false), h('details', {
    className: 'dv-recent-disclosure'
  }, h('summary', null, icon('clock'), 'Recent applications', h('span', null, 'Show activity')), recent))), h('aside', {
    className: 'dv-rail'
  }, data.view === 'stats' ? h(React.Fragment, null, data.updates.blocks.length > 0 && updates(true), contact, ...rejections) : h(React.Fragment, null, attention, data.settings.showTotals && h(Totals, {
    counts,
    onApplications
  }), contact, ...rejections))), open && h(Modal, {
    title: preserveValue(open.title || ''),
    onClose: () => setOpen(null),
    wide: true
  }, h(ChamberUpdateBlock, {
    block: open,
    full: true,
    onRead: setOpen
  }), h('div', {
    className: 'modal-actions'
  }, h('button', {
    type: 'button',
    className: 'button outline',
    onClick: () => setOpen(null)
  }, 'Close'))));
}
export function ExporterDashboardPreferences({
  account,
  notify
}) {
  const data = useExporter(account),
    [message, setMessage] = React.useState(''),
    [error, setError] = React.useState('');
  const available = !!data.scope && data.settings.allowChoice;
  function change(update) {
    if (!available) return;
    try {
      savePreference(localStorage, data.scope, account.id, {
        ...data.preference,
        ...update
      });
      setError('');
      setMessage('Dashboard preferences saved.');
      announce();
      notify?.('Dashboard preferences saved.');
    } catch {
      setMessage('');
      setError(errorText);
    }
  }
  return h('section', {
    className: 'dv-settings-card',
    'aria-labelledby': 'dv-exporter-settings-title'
  }, h('h2', {
    id: 'dv-exporter-settings-title'
  }, 'Your dashboard'), h('p', null, 'Choose whether to use the Chamber default or your own dashboard view.'), !available && h('p', {
    className: 'dv-note'
  }, icon('info-circle'), 'Your chamber manages the dashboard view. Personal view selection is currently unavailable.'), h('label', {
    className: 'dv-setting-toggle'
  }, h('span', null, h('strong', null, 'Choose dashboard view'), h('small', null, 'Turn this on to show the dashboard toggle and remember your preferred view.')), h('input', {
    type: 'checkbox',
    role: 'switch',
    checked: available && data.preference.enabled,
    disabled: !available,
    onChange: e => change({
      enabled: e.target.checked
    })
  })), h('fieldset', {
    className: 'dv-mode-options',
    disabled: !available || !data.preference.enabled
  }, h('legend', null, 'Preferred dashboard view'), [['stats', 'bar-chart', 'Stats-focused', 'Applications, progress and next steps come first.'], ['announcements', 'bell', 'Announcements-focused', 'Chamber news and guidance take the lead.']].map(([value, ico, title, body]) => h('label', {
    key: value,
    className: 'dv-mode-option' + (data.preference.view === value ? ' is-selected' : '')
  }, h('input', {
    type: 'radio',
    name: 'exporter-dashboard-view',
    value,
    checked: data.preference.view === value,
    onChange: () => change({
      view: value
    })
  }), icon(ico), h('span', null, h('strong', null, title), h('small', null, body))))), h('p', {
    className: 'dv-settings-note'
  }, !data.preference.enabled || !available ? 'The dashboard uses your Chamber’s default view.' : 'Your choice applies to this exporter account in this browser.'), h('p', {
    className: 'dv-settings-note'
  }, data.settings.defaultView === 'announcements' ? 'Chamber default: Announcements-focused' : 'Chamber default: Stats-focused'), h(Failure, {
    message: error
  }), message && h('p', {
    className: 'dv-inline-success',
    role: 'status'
  }, icon('check-circle'), message), h('button', {
    type: 'button',
    className: 'button outline',
    onClick: () => {
      location.hash = 'dashboard';
    }
  }, 'View dashboard', icon('arrow-right')));
}
function MiniPreview({
  settings,
  block
}) {
  return h('section', {
    className: 'dv-mini-preview',
    'aria-label': 'Exporter dashboard layout preview'
  }, h('div', {
    className: 'dv-mini-top'
  }, icon('file-earmark'), h('strong', null, 'Trade Documents')), h('div', {
    className: 'dv-mini-body'
  }, h('h3', null, 'Your export documents'), h('div', {
    className: 'dv-mini-mode'
  }, settings.defaultView === 'stats' ? 'Stats-focused' : 'Announcements-focused'), settings.defaultView === 'stats' ? h(React.Fragment, null, h('div', {
    className: 'dv-mini-stats'
  }, ['Drafts', 'Submitted', 'Rejected', 'Completed'].map(label => h('div', {
    key: label
  }, h('span', null, label)))), h('div', {
    className: 'dv-mini-task'
  }, h('strong', null, 'Your next steps'), h('p', null, 'Recent applications')), h('div', {
    className: 'dv-mini-update'
  }, icon('bell'), block ? preserveValue(block.title) : 'Chamber announcements')) : h(React.Fragment, null, h('div', {
    className: 'dv-mini-feature dv-accent-' + settings.accent + (settings.style === 'list' ? ' is-plain' : '')
  }, h('small', null, settings.heading === DEFAULT_SETTINGS.heading ? 'From your chamber' : preserveValue(settings.heading)), h('h4', null, block ? preserveValue(block.title) : 'Chamber announcements'), h('p', null, 'Published announcements appear here.')), h('div', {
    className: 'dv-mini-task'
  }, h('strong', null, 'Your next steps')), settings.showTotals && h('div', {
    className: 'dv-mini-footer'
  }, 'Application totals'))));
}
export function ChamberDashboardAppearance({
  chamberId: scope,
  canEdit,
  notify
}) {
  useChanges();
  const [saved, setSaved] = React.useState(() => readSettings(localStorage, scope)),
    [draft, setDraft] = React.useState(saved.settings),
    [message, setMessage] = React.useState(''),
    [error, setError] = React.useState(''),
    updates = readUpdates(localStorage, scope);
  function change(key, value) {
    setDraft(old => ({
      ...old,
      [key]: value
    }));
    setMessage('');
    setError('');
  }
  function reload() {
    const record = readSettings(localStorage, scope);
    setSaved(record);
    setDraft(record.settings);
    setMessage('');
    setError('');
  }
  function submit(e) {
    e.preventDefault();
    if (!canEdit) return;
    if (!draft.heading.trim()) {
      setError('Enter a section heading.');
      return;
    }
    try {
      const record = saveSettings(localStorage, scope, draft, saved.revision);
      setSaved(record);
      setDraft(record.settings);
      setMessage('Dashboard settings saved.');
      setError('');
      announce();
      notify?.('Dashboard settings saved.');
    } catch (err) {
      setMessage('');
      setError(err.message.startsWith('Dashboard settings changed') ? err.message : errorText);
    }
  }
  return h('section', {
    className: 'dv-appearance'
  }, h('div', {
    className: 'section-heading'
  }, h('div', null, h('h2', null, 'Dashboard views & appearance'), h('p', {
    className: 'dv-settings-note'
  }, 'Choose the default layout and whether exporters can use a personal view.'))), h('div', {
    className: 'dv-settings-layout'
  }, h('form', {
    className: 'dv-settings-card',
    onSubmit: submit
  }, h('fieldset', {
    className: 'dv-config-fields',
    disabled: !canEdit
  }, h('fieldset', {
    className: 'dv-mode-options'
  }, h('legend', null, 'Default dashboard view'), [['stats', 'bar-chart', 'Stats-focused', 'Applications, progress and next steps come first.'], ['announcements', 'bell', 'Announcements-focused', 'Chamber news and guidance take the lead.']].map(([value, ico, title, body]) => h('label', {
    key: value,
    className: 'dv-mode-option' + (draft.defaultView === value ? ' is-selected' : '')
  }, h('input', {
    type: 'radio',
    name: 'chamber-dashboard-view',
    checked: draft.defaultView === value,
    onChange: () => change('defaultView', value)
  }), icon(ico), h('span', null, h('strong', null, title), h('small', null, body))))), h('label', {
    className: 'dv-setting-toggle'
  }, h('span', null, h('strong', null, 'Let exporters choose their view'), h('small', null, 'Exporters must also enable “Choose dashboard view” in their own Settings.')), h('input', {
    type: 'checkbox',
    role: 'switch',
    checked: draft.allowChoice,
    onChange: e => change('allowChoice', e.target.checked)
  })), h('label', {
    className: 'dv-setting-toggle'
  }, h('span', null, h('strong', null, 'Keep application totals visible'), h('small', null, 'Show a compact summary in the announcements view.')), h('input', {
    type: 'checkbox',
    role: 'switch',
    checked: draft.showTotals,
    onChange: e => change('showTotals', e.target.checked)
  })), h('div', {
    className: 'dv-setting-grid'
  }, h('label', {
    className: 'dv-setting-field'
  }, h('span', null, 'Announcement layout'), h('select', {
    value: draft.style,
    onChange: e => change('style', e.target.value)
  }, h('option', {
    value: 'featured'
  }, 'Featured announcement'), h('option', {
    value: 'list'
  }, 'Simple news list'))), h('div', {
    className: 'dv-setting-field'
  }, h('span', null, 'Accent colour'), h('div', {
    className: 'dv-swatches',
    role: 'group',
    'aria-label': 'Accent colour'
  }, [['orange', 'Orange'], ['teal', 'Teal'], ['navy', 'Navy']].map(([value, label]) => h('button', {
    key: value,
    type: 'button',
    className: 'dv-swatch dv-swatch-' + value,
    'aria-label': label,
    'aria-pressed': draft.accent === value,
    onClick: () => change('accent', value)
  }, draft.accent === value && icon('check-lg')))))), h('label', {
    className: 'dv-setting-field'
  }, h('span', null, 'Section heading'), h('input', {
    value: draft.heading,
    maxLength: 100,
    onChange: e => change('heading', e.target.value)
  })), h('button', {
    type: 'submit',
    className: 'button primary'
  }, 'Save dashboard settings')), !canEdit && h('p', {
    className: 'dv-note'
  }, icon('lock'), 'A Chamber administrator can change dashboard settings.'), h(Failure, {
    message: error
  }), error?.startsWith('Dashboard settings changed') && h('button', {
    type: 'button',
    className: 'button outline',
    onClick: reload
  }, 'Reload saved settings'), message && h('p', {
    className: 'dv-inline-success',
    role: 'status'
  }, icon('check-circle'), message)), h('aside', {
    className: 'dv-settings-preview'
  }, h('h3', null, 'Layout preview'), h(MiniPreview, {
    settings: draft,
    block: updates.blocks[0]
  }), h('p', {
    className: 'dv-settings-note'
  }, 'Only published, current Chamber updates appear to exporters. Manage those updates below.'), h('p', {
    className: 'dv-settings-note'
  }, 'When personal selection is off, the Chamber default is used. Saved personal choices are retained.'))));
}
