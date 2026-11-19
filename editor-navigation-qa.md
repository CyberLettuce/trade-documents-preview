# Editor navigation and review evidence — 19 November 2026

Release: `2026-11-19-editor-navigation-r1`.

React now retains the ordinary workspace sidebar when editing, including its remembered icons-only state. The application has a separate labelled step column with its return link, reference and status, following the Vue arrangement. The existing editor validation, autosave and document preview remain in place. At narrow widths the application sections use the existing disclosure.

Cloud Chrome validation at commit `e4eaa67b70b53e13115fce139d3fad1928f03d7c`:

- 65 business-rule tests passed.
- 12 editor checks passed, including all eight sample document drafts, collapsed navigation, 1024 px header layout, 390 px mobile layout, Dutch and Arabic dark theme.
- 46 general interface checks and 19 sidebar checks passed.
- 14 isolated row comparisons passed their alignment and page-width checks.
- 36 audit page/display combinations were captured and scanned after content loaded.
- The row gallery loaded and its comparison switch worked at desktop and mobile widths.

Run: https://github.com/CyberLettuce/trade-documents-preview/actions/runs/44540209496

The audit found pre-existing issues; a successful capture is not an accessibility pass. Twelve sampled page/display combinations had automated findings, primarily React row ARIA and generated focus sentinels. Visual review found the React mobile Claims table unreadable despite no whole-page overflow. A targeted Vue probe confirmed selecting Uploaded document replaces an ATA Carnet selection. The report separates these from unverified risks and optional design proposals.

`previews/slimmer-rows/` is a screenshot comparison gallery. Its CSS is not loaded by either live application. `previews/site-review/` is a report with sample-data screenshots. Neither applies the proposed table styles or audit fixes.

Earlier sidebar QA describing the React application outline inside the outer sidebar is superseded by this release. The main sidebar still collapses to icons; the editor steps remain labelled in their own column.
