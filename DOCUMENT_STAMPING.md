# Document stamping

Release: 2026-11-16-document-stamping

Supporting PDFs open through one Stamp document button in the Chamber application pack. Three black rectangular sample stamp styles can be placed, moved, resized, removed, saved to a separate PDF and printed across all pages. The original PDF and stamp placements remain in IndexedDB in the same browser, scoped by Chamber, application and attachment. Artwork records retain their own date, signatory and reference.

The interface supports English, Dutch, Estonian and Arabic. Document content and stamp artwork retain their original language. Sample signatures and stamps are demonstration material, not valid certification. Existing exporter stamp requests remain available.

Compatibility checks cover scanned and selectable-text pages, mixed sizes, cropped pages, rotations of 0/90/180/270 degrees and password-protected files. A password is used to open a file and is not stored. Signed originals remain unchanged; a separate flattened copy is produced. Pure XFA forms require a flattened PDF from the source application. Corrupt PDFs can fail to open. Universal PDF compatibility is not claimed.

The supporting-document upload in the existing exporter prototype retains filenames only. A Chamber user therefore selects the original PDF in the stamping window. Real cross-user file transfer, official stamp assets, server-enforced authorization and an issuance audit trail require a production backend.

Verification: 429 automated language, state and sizing checks, 20 dashboard renders across four languages, PDF placement and export checks. Earlier browser checks exercised drag/drop and downloads, including a password-protected source. The English phone layout was inspected before browser control was stopped. Remaining visual mobile/RTL checks were not completed because the user requested no PC control or additional installation. Responsive rules and the translated component output were checked without a browser.

Stamp tray update: one vertical, independently scrolling left-hand column at every width. The QR stamp contains the application reference as scannable text; it does not link to a certificate-verification service. A QR and a certification stamp can coexist on each page.

C of O (UK and Arab) and EUR1 applications receive a cryptographically random ten-character certificate number containing lowercase letters and digits when a blank pending application is opened for Chamber review. Approval also assigns a missing eligible number. Existing numbers, closed applications and locks held by other officers are preserved. Numbers are checked for collisions against the applications retained in this browser. The software-generated application reference format is unchanged.
