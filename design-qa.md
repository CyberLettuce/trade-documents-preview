# Vue application steps — 20 November 2026

final result: passed

Application implementation 22ffc32 passed cloud checks; 943dc31 only improves mobile screenshot framing. The final source/implementation comparisons and narrow-screen captures have been inspected.

## Scope and visual references

Match the remaining Vue exporter application steps to the existing React design while retaining Vue's simultaneous form and live document preview. The already published Setup document chooser is retained. The React application is reference material and is unchanged by this release.

Source: React served from the same packaged repository, baseline 5f70ee1. Implementation routes: /vue/#/exporter/applications/sample-draft-20261117-{coo,ata,eur,eurmed,arab,invoice,iic,upload}. The captured steps cover all eight document types, including parties, origin, transport, remarks, goods, declarations, evidence, review and checkout. React uses combined steps for some document types; Vue keeps its more granular navigation and all existing fields.

Evidence root: ../vue-react-fidelity-20261117/. Baseline: editor-steps-baseline/screenshots/. First implementation: editor-steps-r1/screenshots/. Revised comparison: editor-steps-r2/screenshots/. Final desktop evidence: editor-steps-verified/screenshots/. Final mobile framing: editor-steps-mobile/screenshots/.

Each source/implementation was captured at 1906 × 1000 CSS pixels, deviceScaleFactor 1, English, light theme, sample draft. Full views use matching viewport dimensions. Form crops retain their actual widths; the compare-*.png collages scale each crop to an equal-width column for inspection. They are visual comparisons, not pixel-difference scores. Carnet is an intentional layout adaptation: React gives the General List the full work area, while Vue retains the document pane alongside it. Detailed captures are not comparable by scale for that case.

Source/current pairs include react-coo-01 and vue-coo-01 (parties), react-coo-06 and vue-coo-06 (goods), react-coo-11 and vue-coo-12 (supporting evidence), react-coo-12 and vue-coo-13 (review), react-coo-13 and vue-coo-14 (delivery), react-coo-15 and vue-coo-16 (payment), and react-ata-05 and vue-ata-05 (General List). Each has a -form.png detail crop. Paired images are compare-{parties,goods,evidence,review,delivery,payment,carnet}.png. Additional document-specific crops cover invoice, import, Arab and EUR-MED sections.

## Comparison history

1. Baseline: Vue exposed all optional party fields, squeezed every goods type into a narrow table, used a minimal review summary and lacked the numbered checkout navigation. React's grouping, typography, disclosures and item panels became the implementation reference.
2. First implementation, 406db39: data edits, CSV imports, checkout and all-language layout checks passed. Visual comparison identified P2 issues not detected by those checks: invalid named-container query syntax prevented the narrow-field layout, and a radio choice inherited column direction. Corrected both, aligned goods textareas with subgrid, and extended the browser checks to verify these dimensions directly.
3. Revised 2bfee68: goods panels and choice labels aligned with React; Carnet fields became readable beside the preview. Review Edit links were filtered to actual document sections, Carnet totals preserved separate units, and existing translated wording replaced two untranslated labels. A test incorrectly required the sticky preview's top edge to equal the scrolled form's top edge. The failed screenshot showed the intended two-column layout; the test now verifies horizontal separation and vertical overlap, including after scrolling.
4. Final 22ffc32: removed a repeated invoice heading, used document-specific headings, balanced the four Carnet numeric/unit fields across a wide row or two narrower rows, and extended checks to 320px and 768px widths. Reopened the paired form comparisons, full Vue goods view, invoice details, Arabic dark evidence screen, and 320px Carnet and Dutch mobile goods/review/payment captures. No actionable P0/P1/P2 visual issues remain within this scope.

## Fidelity surfaces

- Typography: retained DM Sans and existing weights. Form headings 20px, field labels and inputs 14px, supporting copy 12–14px; optional sections and review groups use the same hierarchy as React. No font replacement or reduced-scale page zoom.
- Spacing and layout: 24px form panel padding, 44px input height, consistent field gaps, full-width names/addresses, expandable additional details, bordered goods panels and numbered checkout tabs. At 1366px and 1906px the preview remains beside the form; existing smaller-screen stacking remains available. Carnet switches to readable record fields when its pane cannot accommodate the table.
- Tokens: existing surface, text, muted, border, brand and selection colours. Both light and dark themes retained, including Arabic right-to-left layout. No new colour palette.
- Assets: retained the shared document renderer and current Vue icon library. No document art was approximated or replaced. The live preview's box navigation, zoom, print and download controls are retained.
- Copy and data: React-style headings and helper text reuse the current translation dictionaries. Vue-specific fields, CSV actions, evidence choices and validation rules remain. User-entered names, references, addresses and filenames are not translated. Review shows relevant setup, parties, goods and evidence, plus document-specific details and direct Edit links.

## Verification

Local business rules: 76/76 tests passed, including document-specific review destinations and mixed-unit Carnet totals. JavaScript syntax and diff checks passed. Cloud capture covers every Vue application step. Focused browser checks cover editing and reloading values, live preview updates, copying/deleting goods and countries, CSV import, review navigation, checkout progression and persisted messages. Scoped axe checks use WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags. Six languages are exercised in both themes at 1366px and 390px. Additional 320px/768px checks cover goods, evidence, review and payment for CoO, Carnet and uploaded documents.

Focused final run: https://github.com/CyberLettuce/trade-documents-preview/actions/runs/44716726835 — 21/21 scenarios passed and 191 source/implementation screens captured without page errors. The same application code passed run 44716156303 before the mobile screenshots were reframed.
Wider final regression: https://github.com/CyberLettuce/trade-documents-preview/actions/runs/44716156435 — passed all stages: 76 business-rule tests, application navigation, interfaces, reviewed fixes, signatures, row previews, design-audit checks and accessibility follow-ups.

No browser was installed or launched on the user's PC; browser tests and screenshots ran in GitHub Actions. Local tooling only edited, checked and packaged the existing files.

## Limits and intentional differences

This is visual consistency rather than identical step structure. Vue retains all of its existing fields, free-text goods mode, file retention, business rules and side-by-side preview. The narrower Carnet panel uses responsive record fields, while a sufficiently wide panel retains the table. React's policy validation prevented its incomplete Arab sample reaching checkout during capture; shared checkout references came from the other documents. Tall element screenshots can include the fixed footer at its viewport position; viewport captures and focus/scroll checks are used to distinguish this capture artefact from real clipping.

The automated and visual checks apply to these flows and do not establish full-site WCAG conformance or native-speaker certification of translations.
