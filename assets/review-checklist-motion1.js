const modes = new Set(['off', 'optional', 'required']);

export function reviewChecklistPolicy(state, chamber) {
  const key = typeof chamber === 'string' ? chamber : chamber?.chamber || state.activeChamber;
  const saved = state.chamberReviewSettings?.[key]?.checklist;
  const mode = modes.has(saved) ? saved : state.settings?.requireChecks ? 'required' : 'optional';
  return {mode, enabled: mode !== 'off', requireChecks: mode === 'required'};
}

export function setReviewChecklistPolicy(state, chamber, mode) {
  if (!chamber || !modes.has(mode)) throw new Error('Choose a chamber and checklist option.');
  return {
    ...state,
    chamberReviewSettings: {
      ...state.chamberReviewSettings,
      [chamber]: {...state.chamberReviewSettings?.[chamber], checklist: mode}
    }
  };
}
