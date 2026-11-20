# Interface languages

Current scope, 20 November 2026: English, Dutch, Estonian, Arabic, Swedish and Portuguese in both React and Vue, for both Exporter and Chamber. The header/sidebar flag menu and Settings offer the same choices. Arabic uses right-to-left layout and the Saudi flag. Labels use Dutch and Estonian, as requested.

## Source and storage

Shared active dictionaries are `assets/locales/{nl,et,ar,sv,pt}.js`, loaded on demand by `assets/locale-loader.js`. PDF-reading wording is merged from `assets/pdf-accessibility-i18n.js`. React uses `assets/language-runtime-review1-57775012.js`; Vue uses `vue/language.js`. Older language bundles are historical files, not the active dictionary source.

React stores its interface choice under `trade-documents-language-v1`. Vue retains it in its separate UI preferences. Translation runs locally. Original document artwork, file contents and entered names, references, addresses and goods descriptions retain their source language. Stored enum values, route names and CSV keys are not rewritten. Native browser/operating-system controls can use the device language.

## Review status

Cloud checks exercise six-language layouts, both themes, Arabic direction, mobile widths, language-switch recovery, signatures and PDF reading views. All five dictionary files preserve their dynamic placeholders. The acceptance review corrected the Swedish Yes/No choice (`Nej`) and number abbreviations (`Nr.` / Portuguese `N.º`).

These checks establish layout and selected wording fixes, not fluent-speaker sign-off. A context sheet is available at `previews/acceptance-review/language-review.csv`. Review trade terminology, plural forms, validation messages and instructions in full tasks with a fluent speaker for each language. English document artwork is intentionally excluded from UI translation.

When changing shared modules, keep release query versions consistent throughout the active import graph so that a browser does not create duplicate runtime/state instances.
