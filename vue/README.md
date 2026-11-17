# Trade Documents — Vue comparison

Published beside the original React prototype:
- Vue: https://cyberlettuce.github.io/trade-documents-preview/vue/
- React: https://cyberlettuce.github.io/trade-documents-preview/

This is a separate Vue 3.5.45 implementation of the Exporter and Chamber workspaces. The Account menu switches workspace and links to React. The exporter editor also retains its comparison controls. Settings offers a top header or sidebar dock, light/dark mode, and English, Dutch, Estonian, Arabic, Swedish and Portuguese. Arabic uses right-to-left layout and the Saudi flag. The typeface remains DM Sans.

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

    node --test tests/vue/model.test.mjs tests/vue/parity.test.mjs tests/vue/audit-regression.test.mjs tests/vue/interface.test.mjs

All runtime modules, libraries, fonts, flags and PDF assets are served locally. The JavaScript Vue components use Vue's template compiler and reactive state. HTML and CSS define the layout; there is no React runtime in the Vue bundle. The native paper adapter emits Vue VNodes from migrated presentation functions.

## Storage and prototype boundaries

Both sites are browser-based prototypes. Vue has separate storage keys beginning trade-documents-vue-comparison-v1, so it does not overwrite React records. Changes stay in the current browser; uploaded bytes use IndexedDB. There is no shared database, real authentication, server-enforced access control, payment collection, email delivery or official certification. Sample documents and stamps are labelled accordingly.

PDF support depends on PDF.js and PDF-lib. Encrypted, malformed or unusual PDFs can require a different reader or a rendered copy. A canvas preview is not a complete accessible PDF text layer. UI translations have been checked for layout and obvious omissions; professional linguistic review remains appropriate before operational use.

## Validation — 17 November 2026

48 automated checks pass, covering numbering, submission requirements, mixed document forms, CSV imports, roles, fees, print/reset eligibility, claims, queue filters and performance calculations. All 33 Vue component templates compile in the browser.

Functional browser checks covered a combined COO and invoice through submission and Chamber approval; multi-page PDF upload and preview; certification and QR placements; retained originals and stamped copies; rejected-application copying; a 51-record queue; table-options cancellation; linked claims; Agent client CSV flags; and Basic-user restrictions. The six languages were exercised on Dashboard, Applications and Reports in both workspaces at 360, 768 and 1366 CSS pixels: 108 checks without page-wide horizontal overflow. Arabic dark-theme layouts were visually inspected.

All 17 document pages rendered. Ten native fixed-layout certificate pages fit within the A4 print region in a print-stylesheet test; deliberately excessive content triggers a print warning. Physical printer output and OS print dialogs were not verified.

This is evidence for the tested workflows, not a guarantee that every possible data combination or PDF behaves identically. The checks are not a WCAG certification. Sample content is not sent for translation, and English document artwork is deliberately preserved.

See the included third-party licence files under assets/.

## Combined workspace update — 17 November 2026

Vue now combines React's compact navigation, dashboard hierarchy and Claims work queue with the Vue editor and its existing document workflows. The exporter editor retains its steps, central form and optional live preview. React remains independently available at the original URL, with separate saved data.

- Consistent borderless shortcuts, language flags, notification counts, Help, account chevron and Chamber Settings. Top header and sidebar dock can be switched in either direction; Account and Settings offer the same layout preference.
- Dashboard queue links clear stale search and advanced filters. User Performance carries the selected user and date period into its report.
- Claims has actionable summary filters, collapsible detailed filters, removable filter labels, processing bars, owner and action dates, saved column choices and pagination. Cancel does not apply column changes. Mobile retains claim, next action and actions, with processing information below the holder.
- Dates and currency formatting update immediately with the interface language. Company names remain user data. Contact details use the configured chamber.

The update passed all 48 automated checks and 33 template compilations. Browser verification covered layout switching in both workspaces, reload persistence, Claim filters and column preferences, stage updates, notification read counts, Help navigation, Chamber scoping, dashboard queue recovery, User Performance filters, and the retained exporter editor/guide/preview controls. Responsive checks covered six routes, six languages and widths of 360, 768 and 1366 pixels. A cramped Dutch metric was fixed and the affected Dashboard/Claims combinations rechecked without overflowing page widths or buttons. Arabic RTL/dark mode and matched-size React/Vue screenshots were inspected. These are prototype checks, not a claim of complete WCAG conformance or universal PDF compatibility.
