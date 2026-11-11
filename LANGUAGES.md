# Interface languages

The Exporter and Chamber workspaces support English, Dutch, Estonian and Arabic. Use the header language menu or the language control in Settings. The browser remembers the choice using only the trade-documents-language-v1 preference.

Arabic uses a right-to-left document and Fluent provider, mirrored navigation and directional controls. Telephone numbers, email addresses, application references and original document pages retain their appropriate direction. Arabic uses a neutral Arabic-letter icon rather than a country flag.

The language catalogues and runtime are readable source in assets/language-nl-1.js, assets/language-other-1.js and assets/language-runtime-1.js. Layout adjustments are in assets/language-1.css. English remains the business-data language: do not translate stored status values, option values, routes, IDs, CSV keys or submitted data. User-entered names, references, addresses, descriptions and notes retain their original wording. The interface choice does not translate issued forms or document previews.

Translations run locally in the browser, without a translation service or uploading application data. The existing browser-only application storage is retained. New catalogue or runtime releases should use new asset names and update the active module graph to avoid stale browser caches.

Checks for this release: module parsing; English/Dutch/Estonian/Arabic translations; dynamic counts, messages, dates and countries; original form option values and entered values; original document language; Arabic document/provider direction; invalid preference fallback; English restoration; browser layouts at 390, 900 and 1280 pixels across dashboards, applications, reports, stored data, settings, guides and application review/forms. Narrow report references use an ellipsis with a full-reference hover label. Flags GB/NL follow assets/flag-icons-LICENSE.txt; the Estonian flag is a locally drawn SVG.
