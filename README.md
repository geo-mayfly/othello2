# Othello — AI Portal Demo

Static React + Babel single-page demo. Open `index.html` (served from the project root) to run it; no build step is required.

## Local preview

```sh
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Deployment

This is a pure static site — Vercel serves `index.html` and the sibling
`.jsx`, `.js`, `.css`, and `uploads/` assets directly with no build step.

## Data Room module

A stand-alone module (Knowledge Base + Data Rooms in the left nav) for DD
questionnaire automation. Self-contained and pre-baked — it does not use the
demo control panel. Data lives in `dataroom-data.js`; views are
`DataRoomKB.jsx`, `DataRoomList.jsx`, `DataRoomDD.jsx`, `DataRoomDocViewer.jsx`.
The reference quick-view uses pdf.js (CDN). Drop Copia's source PDFs into
`dataroom/docs/` — see `dataroom/docs/README.md` for the exact filenames.
