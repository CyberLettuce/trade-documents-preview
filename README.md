# Trade Documents preview

Two independently usable, browser-only prototypes:

- [React — Exporter and Chamber](https://cyberlettuce.github.io/trade-documents-preview/)
- [Vue — Exporter and Chamber](https://cyberlettuce.github.io/trade-documents-preview/vue/)
- [Accessibility evidence](https://cyberlettuce.github.io/trade-documents-preview/previews/wcag22/)
- [Acceptance review and reviewer pack](https://cyberlettuce.github.io/trade-documents-preview/previews/acceptance-review/)

## How the website is made

Both implementations use JavaScript, HTML and CSS, with DM Sans and local SVG icons. React's deployed application is prebuilt in `assets/`; this repository is a release-source mirror, not a complete original React development project. The readable Vue 3 source is under `vue/`, using browser-loaded modules and Vue templates. Node scripts package and check the static release. GitHub Actions publishes it through GitHub Pages.

PDF.js renders uploaded PDFs and extracts readable text; PDF-lib produces separate stamped copies. Local fonts, language catalogues and PDF libraries are served with the site. No application data is sent to a translation service at runtime.

## Data and access

Data stays in the current browser: localStorage for records/preferences and IndexedDB for uploaded PDF/image bytes. React and Vue use separate record stores. Public hosting is not access control. The Basic/Administrator screens demonstrate permissions; they are not server-enforced security. There is no shared database, real login, payment collection, email delivery or official certification.

Keep this browser-only model for the current comparison. A production service requires a separately agreed architecture, access policy, shared storage, backups, audit trail and issuance rules.

## Running and maintaining it

Serve this folder over HTTP and open `/` or `/vue/`. Do not use file://. Run `node --test tests/vue/*.test.mjs` for model regressions. `node scripts/package-pages.mjs <fresh-output-folder>` packages only active tracked dependencies. Browser checks run in GitHub Actions; no local browser installation is required.

The cloud acceptance workflows cover Chromium, Firefox and WebKit. WebKit on Linux is not a real Safari/iPhone certification. See the review report for tested revisions, findings and the outstanding human/device checks. A clean automated scan is not a WCAG 2.2 conformance declaration.

See [Vue details](vue/README.md), [Languages](LANGUAGES.md), [PDFs and stamping](DOCUMENT_STAMPING.md), and [Account management](ACCOUNT_MANAGEMENT.md).
