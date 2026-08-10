# Quick PDF Tools

A free, **100% client-side** PDF toolkit — files never leave the browser. No sign-up, no watermarks, no uploads.

## Tools

- **Merge** — combine multiple PDFs (drag to reorder)
- **Split / Extract** — pull out pages/ranges (`1-3, 5`)
- **Images → PDF** — JPG/PNG into one PDF
- **PDF → JPG** — export each page as an image
- **Rotate** — rotate all pages

## Tech

- Static `index.html`, no build step, no backend.
- [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation, [PDF.js](https://mozilla.github.io/pdf.js/) for rendering — currently loaded via jsDelivr CDN.
- To go fully offline/self-hosted (stronger privacy claim), vendor the two libraries locally and update the `<script>` tags.

Deploy to any static host (Cloudflare Pages).
