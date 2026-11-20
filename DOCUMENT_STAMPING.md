# PDF uploads, previews and stamping

Current scope, 20 November 2026. Both versions retain original uploaded PDF bytes in IndexedDB in the current browser. The Application document pack can preview them and offer the original for download. This replaces the earlier filename-only behavior. It does not transfer files between users or browsers.

## Review and accessible reading

Document view renders the original pages. Text view extracts real PDF text, available structure tags and non-password form values. It preserves available heading/list/table structure and warns when reading order is incomplete. Scanned/image-only PDFs require a checked transcript or an accessible source copy; OCR is not implemented. Text view is an alternative reading view, not remediation of the source PDF. It does not reproduce every stamp, image or layout detail.

## Stamping

A Chamber user opens Stamp document, chooses a sample certification or QR stamp and places it on the selected page. Mouse placement and keyboard alternatives are available. Stamps can be moved and resized. The output is saved separately; the original remains unchanged. The sample QR contains the application reference and is not a verification service. Sample stamps and signatures are not valid certification.

PDF-lib preserves source text, form values and page geometry where supported. The explicit rendered-copy fallback creates page images, which loses selectable text and does not produce a tagged accessible PDF. Password protection, signatures, unsupported XFA and malformed documents require separate handling; universal PDF compatibility is not claimed. Use original-file download or a flattened/accessible source copy when necessary. Do not treat a stamped copy as retaining the original digital signature's validity.

## Numbering

Eligible C of O and EUR1 records receive a ten-character lowercase alphanumeric certificate number on submission, with a Chamber fallback for imported pending records. Existing numbers are retained. Collision checks are limited to records in the current browser. The certificate number appears in the relevant document previews and print layouts. Application references are separate, using the exporter code, generated number and document identifier.

## Evidence and limits

The current cloud acceptance report covers preview and stamping checks with tagged/untagged text, no-text pages, form fields, rotated pages, mixed dimensions, crop boxes, malformed input and original retention. It records actual Chromium print-to-PDF output and browser zoom. PDF Text view uses reader-based stream extraction for WebKit compatibility. Follow the linked report for exact engine results and the final revision.

Physical printer alignment, office-produced PDFs from the user's usual systems, official-paper accuracy and assistive-technology reading of generated/stamped downloads require the supplied reviewer tasks. A tagged browser-generated print PDF is not automatically PDF/UA compliant. There is no server-backed issuance or audit trail in this prototype.

[Review evidence and test pack](https://cyberlettuce.github.io/trade-documents-preview/previews/acceptance-review/)
