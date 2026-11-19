# Vue Setup document selection — 19 November 2026

final result: passed

## Source and evidence

Source visual truth: C:/Users/Ben_lear/AppData/Local/Temp/codex-clipboard-18edd614-4f6a-4800-9907-c063f38d4b22.png, plus the active React Setup captured from the same release package as Vue. Implementation: /vue/#/exporter/applications/sample-draft-20261117-coo, browser-tested application commit b3d447ab7ee9e52ac178079c873cf316350261ac.

Evidence folder: ../vue-react-fidelity-20261117/chooser-verified/screenshots/. Source full view: react-setup.png. Implementation full view: vue-setup.png. Combined full-grid comparison: comparison.png. Combined focused selected-card comparison: comparison-detail.png. Additional states: vue-destination-required.png, vue-arabic-dark.png, vue-arabic-dark-cards.png, vue-setup-{768,390,320}.png and vue-cards-{768,390,320}.png.

Both full-screen captures are 1906 × 1000 CSS/image pixels, deviceScaleFactor 1, English/light, Germany selected, UK Certificate of Origin selected, live preview closed. Card grids are 1384 × 239 (React) and 1332 × 232 (Vue); first-card crops are 339 × 119 and 326 × 112. Combined comparisons preserve 1:1 density. Width differences reflect Vue's retained editor container. React's initial grid retains a focus ring; the detail comparison shows unfocused selected states. The user's screenshot has no destination selected, covered by the additional destination-required capture. Language/theme checks use 1366 × 900; responsive widths are 768, 390 and 320 at height 900. Long component captures include the existing fixed footer at its viewport position, a screenshot-composition limitation; focus scroll margins and footer behavior are retained.

## Findings and comparison history

1. Initial 26f099b comparison: P2 — Vue used a 22px control track versus React's 44px, altering line wrapping. Fixed to 44px with 10px gaps and 12px padding. P2 — inherited disabled-button opacity made availability explanations too faint. Removed inherited opacity, applied the existing sidebar surface, muted disabled content separately and preserved readable explanation text.
2. Revised 0875bbe: source and implementation grids and first cards inspected together. Both earlier findings resolved. Added mobile component captures for longer labels.
3. Final b3d447a: corrected two Dutch labels by composing existing translated strings. Repeated focused cloud checks with explicit translation assertions. Reopened comparison.png and comparison-detail.png with mobile and Arabic dark captures. No actionable P0/P1/P2 differences remain.

## Required fidelity surfaces

- Typography: existing DM Sans, 14px card titles/descriptions, 20px line-height, 600/400 weights. Matching hierarchy; natural wrapping in narrower Vue containers, no replacement font or clipping.
- Spacing: 47px artwork, flexible copy, 44px controls, 10px gaps, 12px padding, 6px outer radius. Grid adapts from four columns to one. No description/marker overlaps or page-width overflow in tested viewports.
- Colours/tokens: existing light/dark surface, text, muted, brand and tint tokens. Selected peach/orange follows the existing product design; dark selection uses its established lighter accent. Disabled cards retain readable reasons.
- Assets: exact React document-thumbnails.webp sprite and crop positions at 47 × 68. Upload uses the existing Fluent ArrowUpload20Regular path; preview/check use existing Vue icons. No substitute document drawings.
- Copy: same document order, labels and descriptions as React, preserving Vue record identifiers. Preview and availability labels translate in all six languages. The concise “Not available: Germany” formulation and existing translated “Selected” summary are intentional.

## Behavior and test evidence

Eight document choices; existing destination and selection rules retained, including ATA Carnet plus uploaded document and retaining the last required selection. Selected-card preview opens the correct document; Tab/Enter/Escape and focus return tested. Reload retains selections.

Focused cloud run https://github.com/CyberLettuce/trade-documents-preview/actions/runs/44579253368: 16/16 scenarios passed, six languages in both themes, three narrow widths, no uncaught page errors. Scoped axe WCAG 2.x A/AA checks passed for cards and the preview dialog.

Wider regression https://github.com/CyberLettuce/trade-documents-preview/actions/runs/44578458411: all steps passed, including 74 business-rule tests, navigation, interfaces, reviewed fixes, signatures, tables and accessibility follow-ups. The two final label changes were covered by the subsequent focused run. Release packaging passed. No browser or package installation was performed on the user's PC.

## Accepted differences and limits

Vue retains its form, steps, container widths and live preview. Existing Vue toggle-button semantics remain; React uses native checkboxes. Existing Vue tick artwork and accessible accent tokens produce minor expected differences. These are deliberate compatibility choices. This targeted review does not establish full-site WCAG conformance or native-speaker translation certification.

## Completion checklist

- [x] React document artwork, labels and compact cards reused.
- [x] Selected, unavailable and preview states implemented.
- [x] Keyboard, persistence, six languages, both themes and responsive checks passed.
- [x] Revised implementation compared with React at grid and detail levels.
