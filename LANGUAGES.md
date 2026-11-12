# Interface languages

The Exporter and Chamber workspaces support English, Dutch, Estonian and Arabic. Use the header language menu or the language control in Settings. The browser remembers the choice using only the trade-documents-language-v1 preference.

Arabic uses a right-to-left document and Fluent provider, mirrored navigation and directional controls. Telephone numbers, email addresses, application references and original document pages retain their appropriate direction. Arabic uses a neutral Arabic-letter icon rather than a country flag.

The language catalogues and runtime are readable source in assets/language-nl-chambercontent1.js, assets/language-other-chambercontent1.js and assets/language-runtime-chambercontent1.js. Layout adjustments are in assets/language-chambercontent1.css. English remains the business-data language: do not translate stored status values, option values, routes, IDs, CSV keys or submitted data. User-entered names, references, addresses, descriptions and notes retain their original wording. The interface choice does not translate issued forms or document previews.

Translations run locally in the browser, without a translation service or uploading application data. The existing browser-only application storage is retained. New catalogue or runtime releases should use new asset names and update the active module graph to avoid stale browser caches.

Checks for this release: module parsing; English/Dutch/Estonian/Arabic translations; dynamic counts, messages, dates and countries; original form option values and entered values; original document language; Arabic document/provider direction; invalid preference fallback; English restoration; browser layouts at 390, 900 and 1280 pixels across dashboards, applications, reports, stored data, settings, guides and application review/forms. Long report references wrap within their cells. Narrow application references use an ellipsis with a full-reference hover label. Flags GB/NL follow assets/flag-icons-LICENSE.txt; the Estonian flag is a locally drawn SVG.

## 12 November 2026 review

The compact header keeps account identity inside its menu and uses consistent icon controls with hover and accessible labels. Generated interface messages, months, guide instructions, file actions and native form validation follow the selected language. Arabic duration wording and original-address direction are corrected. Report actions use icons with full accessible names. Long report labels wrap; application references remain on one line and use an ellipsis only when space is limited, with a full reference hover label. Small-screen editor actions wrap into usable rows. The User Performance selector has its own mobile row.

The full audit evidence and scope are in ../language-audit/report.html and checks.json. This review build is dated 12 November 2026; publication status is recorded in ../language-audit/release-status.json. Native date-picker chrome still follows browser/operating-system language. Original document wording, entered data, file names and legal declarations stay in their original language. This is not native-speaker sign-off or full accessibility certification.
