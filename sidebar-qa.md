# Collapsible sidebar verification — 19 November 2026

Release: `2026-11-19-sidebar-r1`.

Both React and Vue now provide a desktop sidebar toggle. The collapsed view keeps navigation icons, quick access and account access, with labels on hover/focus. Each version remembers the preference in browser storage across navigation, workspace switching and refresh. Mobile drawers retain their full labels without changing the saved desktop preference. Arabic mirrors the rail and toggle direction.

The application editor retains its existing layout; React's embedded section navigation becomes compact progress markers with descriptive labels when collapsed. Vue's application steps remain beside the form. Language menus remain readable outside the narrow rail. No application records or document data are migrated.

## Verification

- 65 Node tests passed, including persistence and unavailable-storage behavior.
- All 38 Vue component templates compiled successfully.
- All 65 cloud browser checks passed: 46 existing interface checks plus 19 sidebar checks.
- Sidebar checks cover both frameworks, both workspaces, both header layouts, 1366px and 1024px desktop widths, 390px mobile drawers, keyboard activation, icon visibility, page-space recovery, navigation, refresh, workspace switching, language menus and React's document editor.
- All six interface languages were covered, including Arabic in dark mode.
- Screenshots were reviewed for expanded/collapsed layouts, quick access, menus, the application editor, mobile drawers and right-to-left presentation.

Passing application commit: `6c44cf85c4c2c988ddb01f2d57df9e09db12e2e9`.

Cloud run: https://github.com/CyberLettuce/trade-documents-preview/actions/runs/44533612123

This is targeted browser and interaction verification, not a declaration of whole-site WCAG conformance.
