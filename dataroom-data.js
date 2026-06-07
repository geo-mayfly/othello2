// ============================================================
// Othello — Data Room module: seed data (plain JS, no JSX)
// ============================================================
//
// Standalone module: DD questionnaire automation. All content here is
// pre-baked ("smoke and mirrors") and drawn verbatim from the build
// brief §5–§7 and the populated output artefact. Nothing here is parsed
// or generated at runtime.
//
// Real source PDFs are supplied by Copia and dropped into
// `dataroom/docs/<filename>`. The quick-view (pdf.js) opens each at its
// cited page; if a file is absent the viewer degrades to a placeholder.

// ---------------------------------------------------------------
// Knowledge base — ~25 entries. Five are ACTIVE (wired to answers);
// the rest are display-only for visual bulk. Filenames are the real
// artefacts from Copia's OneDrive set.
// ---------------------------------------------------------------
const KB_DOCS = [
  // ---- active (wired to answers) ----
  {
    id: "fsc_chcf", active: true, kind: "pdf",
    title: "FSC CHCF December 2025.pdf",
    desc: "FSC Investment Manager Questionnaire s.13 — Chester High Conviction Fund",
    type: "FSC IMQ", asAt: "Dec 2025", added: "1 Jun 2026", source: "Copia OneDrive",
    file: "dataroom/docs/FSC CHCF December 2025.pdf", pages: 26, feeds: ["Q1", "Q2", "Q3"],
  },
  {
    id: "copia_afsl", active: true, kind: "pdf",
    title: "2 Copia AFSL.pdf",
    desc: "Australian Financial Services Licence — Copia Investment Partners Ltd",
    type: "Licence", asAt: "—", added: "1 Jun 2026", source: "Copia OneDrive",
    file: "dataroom/docs/2 Copia AFSL.pdf", pages: 2, feeds: ["Q1"],
  },
  {
    id: "cyber_coc", active: true, kind: "pdf",
    title: "5. Copia Cyber COC 2025 - External Version.pdf",
    desc: "Certificate of Currency — Cybersecurity policy",
    type: "Certificate of Currency", asAt: "expires 14 Sep 2026", added: "1 Jun 2026", source: "Copia OneDrive",
    file: "dataroom/docs/5. Copia Cyber COC 2025 - External Version.pdf", pages: 1, feeds: ["Q4"],
  },
  {
    id: "diversa", active: true, kind: "sheet",
    title: "Diversa IM Review (completed response).xlsx",
    desc: "Prior DD response — a previously completed questionnaire, first-class KB evidence",
    type: "Prior DD response", asAt: "31 Mar 2026 (data to 31 Dec 2025)", added: "1 Jun 2026", source: "Copia OneDrive",
    feeds: ["Q2", "Q4", "Q5"], hero: true,
  },
  {
    id: "bios", active: true, kind: "doc",
    title: "20250306 Fund Manager bios Chester.docx",
    desc: "Investment team biographies — Tucker, Kavanagh, Howard",
    type: "Bios", asAt: "6 Mar 2025", added: "1 Jun 2026", source: "Copia OneDrive",
    feeds: ["Q2", "reserve"],
  },

  // ---- display-only (visual bulk) ----
  { id: "gs007_copia", kind: "pdf", title: "8 & 9 Copia - GS007 Type 2 Report 2025 (FINAL+signed Audit Opinion).pdf", type: "Assurance report", asAt: "FY2025", added: "1 Jun 2026", source: "Copia OneDrive", file: "dataroom/docs/8 & 9 Copia - GS007 Type 2 Report 2025 (FINAL+signed Audit Opinion).pdf" },
  { id: "gs007_chester", kind: "pdf", title: "8 & 9 Chester - GS007 Type 2 Report 2025 (FINAL+signed Audit Opinion).pdf", type: "Assurance report", asAt: "FY2025", added: "1 Jun 2026", source: "Copia OneDrive", file: "dataroom/docs/8 & 9 Chester - GS007 Type 2 Report 2025 (FINAL+signed Audit Opinion).pdf" },
  { id: "fs71", kind: "pdf", title: "3 Copia - FS71.pdf", type: "ASIC form", asAt: "—", added: "1 Jun 2026", source: "Copia OneDrive", file: "dataroom/docs/3 Copia - FS71.pdf" },
  { id: "fs70", kind: "pdf", title: "4 Copia - FS70.pdf", type: "ASIC form", asAt: "—", added: "1 Jun 2026", source: "Copia OneDrive", file: "dataroom/docs/4 Copia - FS70.pdf" },
  { id: "dd_request", kind: "doc", title: "00 2026_M04 Due Diligence Request_Chester FINAL.docx", type: "DD request", asAt: "Apr 2026", added: "1 Jun 2026", source: "Copia OneDrive" },
  { id: "quilla", kind: "doc", title: "Quilla Manager pre-meeting questionnaire_Standard FINAL copy.docx", type: "Questionnaire", asAt: "—", added: "1 Jun 2026", source: "Copia OneDrive" },
  { id: "eml_fiducian", kind: "eml", title: "RE: IMA Due Diligence_Chester Fiducian.eml", type: "Email", asAt: "—", added: "1 Jun 2026", source: "Copia OneDrive" },
  { id: "oc_micro", kind: "pdf", title: "Apr26 OC Micro-Cap Fund — Monthly Fund Update.pdf", type: "Fund update", asAt: "Apr 2026", added: "1 Jun 2026", source: "Copia OneDrive", file: "dataroom/docs/Apr26 OC Micro-Cap Fund — Monthly Fund Update.pdf" },
  { id: "oc_mid", kind: "pdf", title: "Apr26 OC Mid-Cap Fund — Monthly Fund Update.pdf", type: "Fund update", asAt: "Apr 2026", added: "1 Jun 2026", source: "Copia OneDrive", file: "dataroom/docs/Apr26 OC Mid-Cap Fund — Monthly Fund Update.pdf" },
  { id: "oc_premium", kind: "pdf", title: "Apr26 OC Premium Small Companies Fund — Monthly Fund Update.pdf", type: "Fund update", asAt: "Apr 2026", added: "1 Jun 2026", source: "Copia OneDrive", file: "dataroom/docs/Apr26 OC Premium Small Companies Fund — Monthly Fund Update.pdf" },

  // ---- Question 6 policy pack, unzipped into individual entries ----
  { id: "pol_best_exec", kind: "doc", title: "Best Execution Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_bcp", kind: "doc", title: "BCP & Disaster Recovery Plan.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_trade_alloc", kind: "doc", title: "Trade Allocation Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_rmf", kind: "doc", title: "Risk Management Framework.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_proxy", kind: "doc", title: "Proxy Voting Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_compliance", kind: "doc", title: "Compliance Manual.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_counterparty", kind: "doc", title: "Counterparty Exposure Limits.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_soft_dollar", kind: "doc", title: "Soft Dollar Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_related_party", kind: "doc", title: "Related-Party Transactions Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_coi", kind: "doc", title: "Conflicts of Interest Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_data_sec", kind: "doc", title: "Data & Information Security Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_broker", kind: "doc", title: "Broker Selection Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
];

// The Chubb combined certificate is staged but not in the KB until the
// user syncs it during the Flag A remediation beat.
const CHUBB_KB_DOC = {
  id: "chubb_combined", active: true, kind: "pdf",
  title: "Chubb Combined Certificate of Currency 2026.pdf",
  desc: "Combined Certificate of Currency — all five policies (user-supplied)",
  type: "Certificate of Currency", asAt: "expires 26 Oct 2026", added: "just now", source: "Uploaded · synced from DD",
  file: "dataroom/docs/Chubb Combined Certificate of Currency 2026.pdf", pages: 1, feeds: ["Q4"], justSynced: true,
};

// ---------------------------------------------------------------
// Freeform text entries — knowledge that isn't a document.
// ---------------------------------------------------------------
const KB_FREEFORM = [
  {
    id: "ff_reg", title: "Regulatory standing", added: "1 Jun 2026", source: "Diversa response Q2.5.4",
    body: "No ASIC enforceable undertakings, reportable breaches or non-routine regulator interactions in the past 5 years.",
  },
  {
    id: "ff_contacts", title: "DD response contacts", added: "1 Jun 2026", source: "FSC CHCF p.1",
    body: "Rob Tucker (qualitative); Anthony Kavanagh / Luke Howard (quantitative).",
  },
];

// ---------------------------------------------------------------
// Spreadsheet quick-view snippets — rendered as tables when a Diversa
// reference chip is clicked. Values are the real cells from the file.
// ---------------------------------------------------------------
const SHEET_SNIPPETS = {
  "1.2.6": {
    title: "Diversa IM Review — sheet 1.2.6 · FUM by asset class",
    head: ["Asset class", "FUM $m · YE 31 Dec 2025", "FUM $m · YE 31 Dec 2024", "FUM $m · YE 31 Dec 2023"],
    rows: [["Australian Equities", "$2,234.43", "$1,341.85", "$933.82"]],
    foot: "Total FUM — Australian equities is the firm's sole asset class.",
  },
  "2.1.4": {
    title: "Diversa IM Review — sheet 2.1.4 · Ownership",
    head: ["Shareholder name", "Ownership %", "Independent / Employee", "Voting (Y/N)"],
    rows: [["Rob Tucker, Anthony Kavanagh, Luke Howard", "100", "Employee", "Y"]],
    foot: "100% employee-owned by the three Portfolio Managers; no external shareholders.",
  },
  "2.7.1": {
    title: "Diversa IM Review — sheet 2.7.1 · Insurance schedule",
    head: ["Insurance type", "Provider", "Level of cover", "Expiry", "Corporate guarantees?"],
    rows: [
      ["Professional Indemnity (PI)", "Chubb", "$10,000,000", "26/10/2026", "No"],
      ["Directors & Officers (D&O)", "Chubb", "$10,000,000", "26/10/2026", "No"],
      ["Electronic & Computer Crime", "Chubb", "$2,000,000", "14/09/2026", "No"],
      ["Fraud", "Chubb", "$20,000,000", "26/10/2026", "No"],
      ["Cybersecurity", "Chubb", "$2,000,000", "14/09/2026", "No"],
    ],
    foot: "Insurer for all policies: Chubb Insurance Australia Ltd.",
  },
};

// ---------------------------------------------------------------
// Simple "document" quick-view bodies for non-PDF active references
// (e.g. the bios .docx we don't render as PDF).
// ---------------------------------------------------------------
const DOC_SNIPPETS = {
  bios: {
    title: "Fund Manager bios — Chester Asset Management",
    sub: "20250306 Fund Manager bios Chester.docx · as at 6 Mar 2025",
    blocks: [
      { h: "Rob Tucker — Founder & Lead Portfolio Manager", p: "Founded Chester Asset Management in April 2017. Has applied the same Quality–Valuation–Edge approach to Australian equities since 2005. Co-founder and 1/3 owner." },
      { h: "Anthony Kavanagh — Portfolio Manager", p: "Co-founder of Chester Asset Management (April 2017). Portfolio Manager and 1/3 owner. Quantitative DD contact." },
      { h: "Luke Howard — Portfolio Manager", p: "Portfolio Manager and 1/3 owner. Joined the founding team; quantitative DD contact alongside Anthony Kavanagh." },
    ],
  },
};

// ---------------------------------------------------------------
// Seeded data rooms (DD containers). The live demo creates a new one;
// the two completed entries are the "every finished DD compounds" story.
// ---------------------------------------------------------------
const DATAROOMS_SEED = [
  { id: "fiducian", name: "Fiducian IMA Review — Chester", requester: "Fiducian", status: "complete", due: "—", items: 8, done: 8, created: "12 May 2026" },
  { id: "diversa_dd", name: "Diversa IM Review — CHCF", requester: "Diversa", status: "complete", due: "—", items: 11, done: 11, created: "31 Mar 2026", hero: true },
];

// ---------------------------------------------------------------
// The incoming DD — the 5 extracted requirements (verbatim).
// ---------------------------------------------------------------
const DD_META = {
  title: "Investment Manager Due Diligence Questionnaire",
  manager: "Chester Asset Management Pty Ltd",
  product: "Chester High Conviction Fund (APIR: OPS7755AU)",
  issued: "June 2026",
  requester: "Unbranded inbound request",
};

const DD_QUESTIONS = [
  {
    id: "Q1", n: 1, topic: "Licensing", flag: null,
    text: "Provide a copy of the organisation's Australian Financial Services Licence (AFSL) or international equivalent. Where the organisation operates as a Corporate Authorised Representative (CAR), provide the relevant AFSL. Does the AFSL contain any special conditions? If yes, provide details.",
    source: "Diversa IM Review Q2.5.1 + Q2.5.2",
  },
  {
    id: "Q2", n: 2, topic: "Ownership and structure", flag: null,
    text: "Please detail business ownership and/or structure.",
    source: "Quilla Pre-Meeting Questionnaire, BUSINESS Q2",
  },
  {
    id: "Q3", n: 3, topic: "Investment philosophy", flag: null,
    text: "Provide a summary of your investment philosophy (as it relates to this product).",
    source: "Diversa IM Review Q9.1.14",
  },
  {
    id: "Q4", n: 4, topic: "Insurance", flag: "info",
    text: "A copy of the certificates of currency from the Manager's insurance brokers certifying in respect of each policy of Insurance: (a) the period that the Insurance is current; and (b) the name of the insurer(s); and (c) the amount insured and the limits of liability.",
    source: "Chester/Fiducian DD Request, Item 5",
  },
  {
    id: "Q5", n: 5, topic: "Funds under management", flag: "validation",
    text: "Total FUM (Firm Wide) (in AUD) — Ensure you provide the latest FUM data e.g. as at 28 February or 31 March 2026.",
    source: "Diversa IM Review Q1.2.5",
  },
];

// ---------------------------------------------------------------
// Model responses (pre-baked generation content, Brief §6 / populated
// output). `draft` is what streams first; `final` is the end-state
// after remediation/validation. `references` are click-through chips.
// ---------------------------------------------------------------
const DD_RESPONSES = {
  Q1: {
    body: "Chester Asset Management Pty Ltd (CAM) operates as a Corporate Authorised Representative of Copia Investment Partners Ltd (ABN 22 092 872 056), holder of Australian Financial Services Licence No. 229316. Copia also acts as Responsible Entity for the Chester High Conviction Fund. A copy of the licence is attached. The AFSL contains no special conditions beyond those standard for licensees of its class; authorisations cover dealing in, and advising on, interests in managed investment schemes and operating registered schemes. Copia oversees CAM's authorised-representative activities under its licensee monitoring and supervision program.",
    references: [
      { label: "2 Copia AFSL.pdf", docId: "copia_afsl", page: 1, primary: true },
      { label: "FSC CHCF December 2025.pdf · p.1", docId: "fsc_chcf", page: 1 },
      { label: "FSC CHCF December 2025.pdf · p.23", docId: "fsc_chcf", page: 23 },
      { label: "Copia GS007 Type 2 Report 2025", docId: "gs007_copia", page: 1 },
    ],
  },
  Q2: {
    body: "Chester Asset Management Pty Ltd is a boutique Australian equities manager established in April 2017 by Rob Tucker and Anthony Kavanagh. The business is 100% employee-owned by its three Portfolio Managers — Rob Tucker, Anthony Kavanagh and Luke Howard — with no external or institutional shareholders, and no changes to the ownership structure are planned. CAM outsources non-core functions by design: Copia Investment Partners Ltd provides Responsible Entity, distribution and administration services for the Chester High Conviction Fund, leaving the five-person investment team focused solely on portfolio management.",
    references: [
      { label: "FSC CHCF December 2025.pdf · pp.23–26", docId: "fsc_chcf", page: 23 },
      { label: "Diversa IM Review · sheet 2.1.4", docId: "diversa", sheet: "2.1.4" },
      { label: "20250306 Fund Manager bios Chester.docx", docId: "bios" },
    ],
  },
  Q3: {
    body: "Chester's philosophy is grounded in the view that equity markets are not perfectly efficient, and that disciplined fundamental research can exploit mispricing over the medium term. For the Chester High Conviction Fund this is expressed through the team's Quality–Valuation–Edge (QVE) framework: each position must demonstrate business quality (assessed across operating, financial and corporate-governance risk), trade at a discount to assessed intrinsic value, and offer an identifiable analytical edge not reflected in consensus. The Fund is benchmark-unaware and concentrated — 25 to 40 stocks drawn primarily from the S&P/ASX 300, with up to 10% in non-index (pre-IPO) names and up to 20% cash — and targets outperformance of the S&P/ASX 300 Accumulation Index of 5% p.a. over rolling three-year periods, with expected tracking error of 5–10%. Equal emphasis is placed on minimising capital drawdown: the team treats avoidance of permanent capital loss as the most reliable driver of long-term outperformance. The approach has been applied consistently since the Fund's inception in April 2017 — and by lead Portfolio Manager Rob Tucker on the same basis since 2005.",
    references: [
      { label: "FSC CHCF December 2025.pdf · Q13.2 (pp.2–3)", docId: "fsc_chcf", page: 2, primary: true },
      { label: "FSC CHCF · Q13.4 & Q13.6 (p.3)", docId: "fsc_chcf", page: 3 },
      { label: "FSC CHCF · Q13.7 (pp.4–8)", docId: "fsc_chcf", page: 4 },
    ],
  },
  Q4: {
    // pre-remediation draft
    body: "The Manager maintains the following insurance program, placed with Chubb Insurance Australia Ltd: Professional Indemnity $10m; Directors & Officers $10m; Electronic & Computer Crime $2m; Fraud $20m; Cybersecurity $2m. A current Certificate of Currency is held for the Cybersecurity policy (expiry 14 September 2026).",
    references: [
      { label: "5. Copia Cyber COC 2025 - External Version.pdf", docId: "cyber_coc", page: 1 },
    ],
    flag: {
      type: "info",
      title: "Additional information required",
      copy: "The knowledge base contains a Certificate of Currency for the Cybersecurity policy only (5. Copia Cyber COC 2025 - External Version.pdf). Certificates of Currency for the Professional Indemnity, Directors & Officers, Electronic & Computer Crime and Fraud policies are not in the knowledge base. Upload the certificates to complete this response.",
      missingFile: "Chubb Combined Certificate of Currency 2026.pdf",
    },
    // post-remediation end-state
    final: {
      body: "The Manager maintains the following insurance program, placed with Chubb Insurance Australia Ltd. Certificates of currency for all five policies are attached.",
      table: {
        head: ["Policy", "Insurer", "Limit", "Expiry"],
        rows: [
          ["Professional Indemnity", "Chubb Insurance Australia Ltd", "$10m", "26 Oct 2026"],
          ["Directors & Officers", "Chubb Insurance Australia Ltd", "$10m", "26 Oct 2026"],
          ["Electronic & Computer Crime", "Chubb Insurance Australia Ltd", "$2m", "14 Sep 2026"],
          ["Fraud", "Chubb Insurance Australia Ltd", "$20m", "26 Oct 2026"],
          ["Cybersecurity", "Chubb Insurance Australia Ltd", "$2m", "14 Sep 2026"],
        ],
      },
      references: [
        { label: "5. Copia Cyber COC 2025 - External Version.pdf", docId: "cyber_coc", page: 1 },
        { label: "Chubb Combined Certificate of Currency 2026.pdf", docId: "chubb_combined", page: 1, primary: true },
        { label: "Diversa IM Review · sheet 2.7.1", docId: "diversa", sheet: "2.7.1" },
      ],
    },
  },
  Q5: {
    // draft (from most recent KB source — 31 Dec 2025)
    body: "Total firm-wide FUM was A$2,234.43 million as at 31 December 2025. Australian equities is the firm's sole asset class. Three-year history: A$933.82m (31 Dec 2023); A$1,341.85m (31 Dec 2024); A$2,234.43m (31 Dec 2025).",
    references: [
      { label: "Diversa IM Review · sheet 1.2.6", docId: "diversa", sheet: "1.2.6" },
    ],
    flag: {
      type: "validation",
      title: "Validation required — currency check",
      copy: "This answer is drafted from the most recent source in the knowledge base (Diversa IM Review, FUM table as at 31 December 2025). The questionnaire requests data as at 28 February or 31 March 2026, which post-dates every available source. Confirm the current figure or upload a more recent FUM report before finalising.",
      suggestedNote: "Confirmed with Copia ops — A$2.31bn as at 31 May 2026",
    },
    // validated end-state
    final: {
      body: "Total firm-wide FUM was A$2,310 million as at 31 May 2026 (manually confirmed). Australian equities is the firm's sole asset class. Recent history: A$933.82m (31 Dec 2023); A$1,341.85m (31 Dec 2024); A$2,234.43m (31 Dec 2025).",
      references: [
        { label: "Diversa IM Review · sheet 1.2.6", docId: "diversa", sheet: "1.2.6" },
        { label: "User validation note · 10 Jun 2026", docId: null },
      ],
    },
  },
};

// The pre-built export artefact (the populated questionnaire as PDF).
const DD_EXPORT_PDF = "dataroom/docs/Sample DD Questionnaire - Populated (POC Output).pdf";

window.KB_DOCS = KB_DOCS;
window.CHUBB_KB_DOC = CHUBB_KB_DOC;
window.KB_FREEFORM = KB_FREEFORM;
window.SHEET_SNIPPETS = SHEET_SNIPPETS;
window.DOC_SNIPPETS = DOC_SNIPPETS;
window.DATAROOMS_SEED = DATAROOMS_SEED;
window.DD_META = DD_META;
window.DD_QUESTIONS = DD_QUESTIONS;
window.DD_RESPONSES = DD_RESPONSES;
window.DD_EXPORT_PDF = DD_EXPORT_PDF;
