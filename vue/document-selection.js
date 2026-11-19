// Uploaded certificates can accompany a Carnet without changing the Carnet workflow.
export function nextDocumentSelection(selected, document) {
  if (selected.includes(document)) return selected.length === 1 ? [...selected] : selected.filter(d => d !== document);
  if (document === 'ATA Carnet') return selected.includes('Uploaded document') ? [document, 'Uploaded document'] : [document];
  if (document === 'Uploaded document') return selected.includes('ATA Carnet') ? ['ATA Carnet', document] : [document];
  if (selected.some(d => ['ATA Carnet', 'Uploaded document'].includes(d))) return [document];
  const opposite = document === 'UK Certificate of Origin' ? 'Arab Certificate of Origin' : document === 'Arab Certificate of Origin' ? 'UK Certificate of Origin' : null;
  return [...selected.filter(d => d !== opposite), document];
}
