# Exporter dashboard views

Chamber Setup → Exporter dashboard contains Dashboard views & appearance. Chamber administrators select the default (Stats or Announcements), permit personal choice, choose the announcement layout and accent, and save these settings independently of the existing announcement draft/publish controls. The original content editor, publishing permissions, expiry and authored content remain in place. Announcements views use the same current published updates. Drafts and unpublished/expired updates are excluded.

Exporter Settings → Dashboard contains Choose dashboard view. It is on by default when the Chamber permits personal selection. Explicitly saved opt-outs remain off. Without a saved personal view, the initial view follows the Chamber default. When off, or when the Chamber disallows personal choice, the Chamber default is used and the dashboard toggle is hidden. A previously chosen view is retained when either control is turned off.

Data stays browser-only. Settings are scoped by Chamber using trade-documents-dashboard-layout-v1. Exporter opt-in and view are scoped by Chamber plus exporter account using trade-documents-dashboard-view-v1. Existing application, stored-record and announcement data are not rewritten. Different browsers do not share this data. Concurrent Chamber settings edits are checked by revision before saving. Storage failures retain the existing setting and show an error.

Readable sources are assets/dashboard-views2.js, assets/dashboard-view-logic2.js and assets/dashboard-views2.css; editable authoring files and tests are in ../dashboard-views. New interface labels support English, Dutch, Estonian and Arabic. Custom section headings and announcement content keep their original wording.

Release date: 12 November 2026. Publication status is recorded in ../dashboard-views/release-status.json.
