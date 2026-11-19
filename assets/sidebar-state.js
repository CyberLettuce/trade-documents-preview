// Independent preferences for the two comparison sites; shared across their workspaces.
export const sidebarKey = framework => `trade-documents-sidebar-collapsed-${framework}-v1`;
export function readSidebar(storage, framework) {
  try { return storage.getItem(sidebarKey(framework)) === 'true'; } catch { return false; }
}
export function saveSidebar(storage, framework, collapsed) {
  try { storage.setItem(sidebarKey(framework), String(!!collapsed)); return true; } catch { return false; }
}
// Preserve descriptive hover labels, including translated document-step labels.
export function bindSidebarLabels(sidebar, vue = false) {
  const update = () => {
    sidebar?.querySelectorAll('nav button, .outline-link, .outline-group, .sidebar-back, .navigation-shortcuts button, .ch-sidebar-bottom>a, .ch-sidebar-bottom>button, .sidebar-help button, .identity, .quick-access-edit').forEach(button => {
      const copy = button.cloneNode(true);
      copy.querySelectorAll('svg,em,.count,.ch-icon,.avatar').forEach(node => node.remove());
      const label = copy.textContent.trim() || button.getAttribute('aria-label');
      if (label && button.title !== label) button.title = label;
      if (vue && label && button.dataset.tip !== label) button.dataset.tip = label;
    });
  };
  update();
  const observer = new MutationObserver(update);
  if (sidebar) observer.observe(sidebar, {subtree:true, childList:true, characterData:true});
  return () => observer.disconnect();
}
