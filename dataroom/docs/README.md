# Data Room — source documents

The Data Room reference quick-view (pdf.js) opens each cited document at its
page. Files here are matched to `dataroom-data.js` (`KB_DOCS[].file`) by their
**exact filename** — including spaces and punctuation. Any referenced file that
is missing degrades to a clean placeholder, so the demo still runs.

## Committed — quick-view works

**Demonstration artefacts**
- `Chubb Combined Certificate of Currency 2026.pdf` — mock combined CoC, created for the Flag-A remediation beat.
- `Sample DD Questionnaire - Populated (POC Output).pdf` — the export the "Generate PDF" button downloads.

**Copia / Chester source documents**
- `FSC CHCF December 2025.pdf` — opens at p.1/p.23 (Q1) and p.2–8 (Q3)
- `2 Copia AFSL.pdf` — opens at p.1 (Q1)
- `5. Copia Cyber COC 2025 - External Version.pdf` — (Q4)
- `8 & 9 Copia - GS007 Type 2 Report 2025 (FINAL+signed Audit Opinion).pdf`
- `8 & 9 Chester - GS007 Type 2 Report 2025 (FINAL+signed Audit Opinion).pdf`
- `3 Copia - FS71.pdf`
- `4 Copia - FS70.pdf`

**Policy pack** (the "Question 6" set — renamed from their original filenames to
the clean titles `KB_DOCS` uses):
- `BCP & Disaster Recovery Plan.pdf` — also cited in the DD (Q6)
- `Trade Allocation Policy.pdf`
- `Risk Management Framework.pdf`
- `Proxy Voting Policy.pdf`
- `Compliance Manual.pdf`
- `Conflicts of Interest Policy.pdf`
- `Data & Information Security Policy.pdf` (Copia Cyber Security Policy)
- `Broker Selection Policy.pdf`
- `Risk Appetite Statement.pdf`
- `Chester Compliance Plan.pdf`
- `Derivative Risk Management Statement.pdf`

## Not supplied — degrade to placeholder

These `KB_DOCS` rows have no file yet, so their quick-view shows the placeholder:
- `Apr26 OC Micro-Cap Fund — Monthly Fund Update.pdf`
- `Apr26 OC Mid-Cap Fund — Monthly Fund Update.pdf`
- `Apr26 OC Premium Small Companies Fund — Monthly Fund Update.pdf`
- Policy rows with no matching document in the pack: `Best Execution Policy`,
  `Counterparty Exposure Limits`, `Soft Dollar Policy`, `Related-Party Transactions Policy`.

## Rendered from baked snippets — no file needed

- The Diversa `.xlsx` (sheets 1.2.6, 2.1.4, 2.7.1) renders from `SHEET_SNIPPETS`.
- The Fund Manager bios `.docx` renders from `DOC_SNIPPETS`.

> The `.docx`/`.xlsx`/`.eml` originals (Diversa, bios, DD request, Quilla
> questionnaire, Fiducian email) are not committed — the viewer has no inline
> renderer for those formats, so they would show a placeholder. Convert them to
> PDF to enable a real quick-view.
