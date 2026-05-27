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
