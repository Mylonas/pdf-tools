# Quick PDF Tools

A free, **100% client-side** PDF toolkit — files never leave the browser. No sign-up, no watermarks, no uploads.

## Tools

- **Compress** — shrink a PDF, with before/after size
- **Merge** — combine multiple PDFs (drag to reorder)
- **Split / Extract** — pull out pages/ranges (`1-3, 5`)
- **Delete pages** — remove specific pages
- **Organize** — drag to reorder, rotate or delete individual pages (thumbnail grid)
- **Images → PDF** — JPG/PNG into one PDF
- **PDF → JPG / PNG** — export each page as an image
- **Rotate** — rotate all pages
- **Page numbers** — stamp numbers onto every page
- **Watermark** — diagonal text watermark
- **Sign** — draw or upload a signature and place it on a page
- **Extract text** — plus page/word/character counts
- **PDF → Word** — export the text as an editable `.doc`
- **Metadata** — view and strip a PDF's hidden metadata
- **OCR** — read text from scanned PDFs/images (on-device)
- **Protect / Unlock** — add or remove a PDF password

## Tech

- Static `index.html`, no build step, no backend.
- [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation and [PDF.js](https://mozilla.github.io/pdf.js/) for rendering — **vendored locally** in `vendor/`.
- Two tools lazy-load a heavier engine from jsDelivr **only when used**: [tesseract.js](https://tesseract.projectnaptha.com/) (OCR) and [qpdf-wasm](https://github.com/neslinesli93/qpdf-wasm) (password protect/unlock). The engine downloads; the user's file is still processed entirely in-browser and never uploaded.

Deploy to any static host (Cloudflare Pages).
