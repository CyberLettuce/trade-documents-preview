# Trade Documents — Vue comparison

Published beside the original React prototype:
- Vue: https://cyberlettuce.github.io/trade-documents-preview/vue/
- React: https://cyberlettuce.github.io/trade-documents-preview/

This is a separate Vue 3.5.45 implementation of the Exporter and Chamber workspaces. The comparison control switches workspace. Settings offers a top header or sidebar dock, light/dark mode, and English, Dutch, Estonian, Arabic, Swedish and Portuguese. Arabic uses right-to-left layout and the Saudi flag. The typeface remains DM Sans.

## Included workflows

- Exporter Stats and Announcements dashboards; Chamber dashboard and per-user performance, including approval, rejection, document types and submission-to-decision handling time.
- Application queues, complete-record search, advanced filters, Auto Accepted, saved views, column preferences, right-click actions, copying, printing, draft deletion, archiving and queue return state.
- Eight document types: UK and Arab Certificates of Origin, EUR1, EUR-MED, ATA Carnet, Import Certificate, Commercial Invoice and uploaded documents. Document-specific steps, optional-section completion, live preview, guides, missing-field navigation, item-row copying, CSV import/export, checkout and numbering.
- UK/Arab CoO, EUR1/EUR-MED, IIC and primary carnet paper layouts migrated to native Vue rendering. Supplementary carnet pages are comparison layouts. English document wording is retained independently of the interface language.
- Original supporting PDF and image uploads, multiple PDF pages, optional/enlarged previews, original-file download and document printing.
- Chamber document processing through the Application tab with direct Approve and Reject actions, comments, history, fees and ownership. Review checklists and checklist settings are removed.
- PDF stamping with vertical stamp choices, QR code, drag/drop or click placement, keyboard adjustment, size controls, multiple pages, saved stamped copies and original preservation. PDF-lib preserves source PDF content where supported; an explicitly selected rendered-copy fallback is available.
- Signature uploads from images or PDFs, page selection, suggested signature regions, cropping, background removal and saved signatures.
- Stored Data, client CSV imports, Agent Accounts, per-client Auto Accept settings, Chamber exporter management, claims, reports, CSV exports, printable records, tariffs, payment/delivery options, workflow steps, content editing and browser preferences.
- Exporter Basic/Administrator access previews. Basic users cannot manage users, company details or signatories. Client Auto Accept checkboxes are settings demonstrations; they do not automate approvals.

## Running the source

No package installation or build step is needed. Serve the repository root with a static HTTP server and open /vue/. Do not open index.html directly as a file. From the repository root, run the regression checks with:

    node --test tests/vue/model.test.mjs tests/vue/parity.test.mjs tests/vue/audit-regression.test.mjs

All runtime modules, libraries, fonts, flags and PDF assets are served locally. The JavaScript Vue components use Vue's template compiler and reactive state. HTML and CSS define the layout; there is no React runtime in the Vue bundle. The native paper adapter emits Vue VNodes from migrated presentation functions.

## Storage and prototype boundaries

Both sites are browser-based prototypes. Vue has separate storage keys beginning trade-documents-vue-comparison-v1, so it does not overwrite React records. Changes stay in the current browser; uploaded bytes use IndexedDB. There is no shared database, real authentication, server-enforced access control, payment collection, email delivery or official certification. Sample documents and stamps are labelled accordingly.

PDF support depends on PDF.js and PDF-lib. Encrypted, malformed or unusual PDFs can require a different reader or a rendered copy. A canvas preview is not a complete accessible PDF text layer. UI translations have been checked for layout and obvious omissions; professional linguistic review remains appropriate before operational use.

## Validation — 17 November 2026

45 automated checks pass, covering numbering, submission requirements, mixed document forms, CSV imports, roles, fees, print/reset eligibility, claims, queue filters and performance calculations. All 33 Vue component templates compile in the browser.

Functional browser checks covered a combined COO and invoice through submission and Chamber approval; multi-page PDF upload and preview; certification and QR placements; retained originals and stamped copies; rejected-application copying; a 51-record queue; table-options cancellation; linked claims; Agent client CSV flags; and Basic-user restrictions. The six languages were exercised on Dashboard, Applications and Reports in both workspaces at 360, 768 and 1366 CSS pixels: 108 checks without page-wide horizontal overflow. Arabic dark-theme layouts were visually inspected.

All 17 document pages rendered. Ten native fixed-layout certificate pages fit within the A4 print region in a print-stylesheet test; deliberately excessive content triggers a print warning. Physical printer output and OS print dialogs were not verified.

This is evidence for the tested workflows, not a guarantee that every possible data combination or PDF behaves identically. The checks are not a WCAG certification. Sample content is not sent for translation, and English document artwork is deliberately preserved.

See the included third-party licence files under assets/.
