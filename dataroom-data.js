// ============================================================
// Othello — Data Room module: seed data (plain JS, no JSX)
// ============================================================
//
// Standalone module: DD questionnaire automation. Content is pre-baked
// and drawn from the build brief and the real Chester source documents
// (Quilla pre-meeting questionnaire, Diversa IM review, FSC IMQ).
//
// Real source PDFs are supplied by Copia and dropped into
// `dataroom/docs/<filename>`. The quick-view (pdf.js) opens each at its
// cited page; if a file is absent the viewer degrades to a placeholder.

// ---------------------------------------------------------------
// Knowledge base — ~25 entries. Five are ACTIVE (wired to answers);
// the rest are display-only for visual bulk.
// ---------------------------------------------------------------
const KB_DOCS = [
  {
    id: "fsc_chcf", active: true, kind: "pdf",
    title: "FSC CHCF December 2025.pdf",
    desc: "FSC Investment Manager Questionnaire s.13, Chester High Conviction Fund",
    type: "FSC IMQ", asAt: "Dec 2025", added: "1 Jun 2026", source: "Copia OneDrive",
    file: "dataroom/docs/FSC CHCF December 2025.pdf", pages: 26, feeds: ["Q1", "Q2", "Q3"],
  },
  {
    id: "copia_afsl", active: true, kind: "pdf",
    title: "2 Copia AFSL.pdf",
    desc: "Australian Financial Services Licence, Copia Investment Partners Ltd",
    type: "Licence", asAt: "—", added: "1 Jun 2026", source: "Copia OneDrive",
    file: "dataroom/docs/2 Copia AFSL.pdf", pages: 2, feeds: ["Q1"],
  },
  {
    id: "cyber_coc", active: true, kind: "pdf",
    title: "5. Copia Cyber COC 2025 - External Version.pdf",
    desc: "Certificate of Currency, Cybersecurity policy",
    type: "Certificate of Currency", asAt: "expires 14 Sep 2026", added: "1 Jun 2026", source: "Copia OneDrive",
    file: "dataroom/docs/5. Copia Cyber COC 2025 - External Version.pdf", pages: 1, feeds: ["Q4"],
  },
  {
    id: "diversa", active: true, kind: "sheet",
    title: "Diversa IM Review (completed response).xlsx",
    desc: "A previously completed questionnaire, reused as evidence",
    type: "Prior DD response", asAt: "31 Mar 2026 (data to 31 Dec 2025)", added: "1 Jun 2026", source: "Copia OneDrive",
    feeds: ["Q2", "Q4", "Q5"], hero: true,
  },
  {
    id: "bios", active: true, kind: "doc",
    title: "20250306 Fund Manager bios Chester.docx",
    desc: "Investment team biographies, Tucker, Kavanagh and Howard",
    type: "Bios", asAt: "6 Mar 2025", added: "1 Jun 2026", source: "Copia OneDrive",
    feeds: ["Q2", "reserve"],
  },

  // ---- display-only ----
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

const CHUBB_KB_DOC = {
  id: "chubb_combined", active: true, kind: "pdf",
  title: "Chubb Combined Certificate of Currency 2026.pdf",
  desc: "Combined Certificate of Currency, all five policies (user-supplied)",
  type: "Certificate of Currency", asAt: "expires 26 Oct 2026", added: "just now", source: "Uploaded · synced from DD",
  file: "dataroom/docs/Chubb Combined Certificate of Currency 2026.pdf", pages: 1, feeds: ["Q4"], justSynced: true,
};

const KB_FREEFORM = [
  {
    id: "ff_reg", title: "Regulatory standing", added: "1 Jun 2026", source: "Diversa response Q2.5.4",
    body: "No ASIC enforceable undertakings, reportable breaches or non-routine regulator interactions in the past 5 years.",
  },
  {
    id: "ff_contacts", title: "DD response contacts", added: "1 Jun 2026", source: "FSC CHCF p.1",
    body: "Rob Tucker for qualitative questions; Anthony Kavanagh and Luke Howard for quantitative questions.",
  },
];

// Spreadsheet quick-view snippets (real cells from the Diversa file).
const SHEET_SNIPPETS = {
  "1.2.6": {
    title: "Diversa IM Review, sheet 1.2.6 · FUM by asset class",
    head: ["Asset class", "FUM $m · YE 31 Dec 2025", "FUM $m · YE 31 Dec 2024", "FUM $m · YE 31 Dec 2023"],
    rows: [["Australian Equities", "$2,234.43", "$1,341.85", "$933.82"]],
    foot: "Total FUM. Australian equities is the firm's sole asset class.",
  },
  "2.1.4": {
    title: "Diversa IM Review, sheet 2.1.4 · Ownership",
    head: ["Shareholder name", "Ownership %", "Independent / Employee", "Voting (Y/N)"],
    rows: [["Rob Tucker, Anthony Kavanagh, Luke Howard", "100", "Employee", "Y"]],
    foot: "100% employee-owned by the three Portfolio Managers; no external shareholders.",
  },
  "2.7.1": {
    title: "Diversa IM Review, sheet 2.7.1 · Insurance schedule",
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

const DOC_SNIPPETS = {
  bios: {
    title: "Fund Manager bios, Chester Asset Management",
    sub: "20250306 Fund Manager bios Chester.docx · as at 6 Mar 2025",
    blocks: [
      { h: "Rob Tucker, Founder & Lead Portfolio Manager", p: "Founded Chester Asset Management in April 2017. Has applied the same Quality, Valuation and Edge approach to Australian equities since 2005. Co-founder and one-third owner." },
      { h: "Anthony Kavanagh, Portfolio Manager", p: "Co-founder of Chester Asset Management (April 2017). Portfolio Manager and one-third owner. Quantitative DD contact." },
      { h: "Luke Howard, Portfolio Manager", p: "Portfolio Manager and one-third owner. Quantitative DD contact alongside Anthony Kavanagh." },
    ],
  },
};

// Seeded data rooms (DD containers).
const DATAROOMS_SEED = [
  { id: "fiducian", name: "Fiducian IMA Review — Chester", requester: "Fiducian", status: "complete", due: "—", items: 8, done: 8, created: "12 May 2026" },
  { id: "diversa_dd", name: "Diversa IM Review — CHCF", requester: "Diversa", status: "complete", due: "—", items: 11, done: 11, created: "31 Mar 2026", hero: true },
];

const DD_META = {
  title: "Investment Manager Due Diligence Questionnaire",
  manager: "Chester Asset Management Pty Ltd",
  product: "Chester High Conviction Fund (APIR: OPS7755AU)",
  issued: "June 2026",
  requester: "Unbranded inbound request",
};

// The pre-built export artefact (the populated questionnaire as PDF).
const DD_EXPORT_PDF = "dataroom/docs/Sample DD Questionnaire - Populated (POC Output).pdf";

// ---------------------------------------------------------------
// Sectioned questionnaire. Each section is its own editable canvas.
// Answer `content` is a token array: strings (editable prose) and
// { r: {label, docId, page?, sheet?} } inline reference tags. Items may
// carry a `flagInfo` (information request / validation) and may swap to
// `contentFinal` (+ optional `table`) once resolved. `image` attaches a
// figure from the source documents.
// ---------------------------------------------------------------
const REF = (label, docId, opts = {}) => ({ r: { label, docId, ...opts } });

const DD_SECTIONS = [
  {
    id: "business", title: "Business",
    intro: "Applies to the investment manager with direct responsibility for investment decision-making.",
    items: [
      { id: "biz_inception", q: "Business inception date", content: [
        "Chester Asset Management was established in 2017. The Chester High Conviction Fund launched in April 2017 and is run on the same basis as the predecessor SGH Australia Plus Fund, which had a 3.5 year track record. Lead Portfolio Manager Rob Tucker has managed money on the same approach since 2005, including five years running the HSBC Australian Country Funds from Hong Kong." ] },

      { id: "Q2", hero: true, q: "Business ownership and structure", content: [
        "Chester Asset Management Pty Ltd is a boutique Australian equities manager, established in April 2017 by Rob Tucker and Anthony Kavanagh. It is 100% employee-owned by its three Portfolio Managers, Rob Tucker, Anthony Kavanagh and Luke Howard, with no external or institutional shareholders, and there are no planned changes to the ownership structure",
        REF("Diversa · sheet 2.1.4", "diversa", { sheet: "2.1.4" }),
        ". Copia Investment Partners Ltd provides Responsible Entity, distribution and administration services for the Chester High Conviction Fund, which lets the five-person investment team concentrate on portfolio management",
        REF("FSC CHCF pp.23-26", "fsc_chcf", { page: 23 }),
        "." ] },

      { id: "biz_changes", q: "Has ownership or structure changed in the last 5 years?", content: [
        "There have been no changes to business ownership or structure over the last five years. The business is well funded and continues to grow." ] },

      { id: "Q5", hero: true, flag: "validation", q: "Total firm-wide FUM (Firm Wide, in AUD)",
        content: [
          "Total firm-wide funds under management were A$2,234.43 million as at 31 December 2025. Australian equities is the firm's sole asset class. The three-year history is A$933.82m (31 December 2023), A$1,341.85m (31 December 2024) and A$2,234.43m (31 December 2025)",
          REF("Diversa · sheet 1.2.6", "diversa", { sheet: "1.2.6" }),
          "." ],
        contentFinal: [
          "Total firm-wide funds under management were A$2,310 million as at 31 May 2026 (manually confirmed). Australian equities is the firm's sole asset class. Recent history: A$933.82m (31 December 2023), A$1,341.85m (31 December 2024) and A$2,234.43m (31 December 2025)",
          REF("Diversa · sheet 1.2.6", "diversa", { sheet: "1.2.6" }),
          "." ],
        flagInfo: {
          type: "validation", title: "Validation required: currency check",
          copy: "This answer is drafted from the most recent source in the knowledge base, the Diversa IM Review, with FUM as at 31 December 2025. The questionnaire asks for data as at 28 February or 31 March 2026, which is later than every available source. Confirm the current figure or upload a more recent FUM report before finalising.",
          suggestedNote: "Confirmed with Copia ops: A$2.31bn as at 31 May 2026",
        } },

      { id: "biz_strategy", q: "Is the business a single-strategy business?", content: [
        "Chester is a boutique Australian equities manager applying a consistent, high-conviction philosophy across its products. It operates effectively as a single-strategy business, with some variation around the same core approach. There are three products: Chester High Conviction (retail, all-cap, led by Rob Tucker), Chester Mid-Cap (mandate, same philosophy, led by Rob Tucker) and Chester Opportunities (wholesale, small-cap, led by Anthony Kavanagh)." ] },
    ],
  },

  {
    id: "compliance", title: "Licensing & Compliance",
    intro: "Licensing, regulatory standing and governance of the manager and Responsible Entity.",
    items: [
      { id: "Q1", hero: true, q: "AFSL / Corporate Authorised Representative and special conditions", content: [
        "Chester Asset Management Pty Ltd operates as a Corporate Authorised Representative of Copia Investment Partners Ltd (ABN 22 092 872 056), which holds Australian Financial Services Licence No. 229316",
        REF("2 Copia AFSL.pdf", "copia_afsl", { page: 1 }),
        ". Copia is also the Responsible Entity for the Chester High Conviction Fund, and a copy of the licence is attached. The AFSL contains no special conditions beyond those standard for licensees of its class; its authorisations cover dealing in and advising on interests in managed investment schemes, and operating registered schemes",
        REF("FSC CHCF p.1", "fsc_chcf", { page: 1 }),
        ". Copia supervises Chester's authorised-representative activities under its licensee monitoring program." ] },

      { id: "reg_standing", q: "Regulatory standing", content: [
        "There have been no ASIC enforceable undertakings, reportable breaches or non-routine regulator interactions in the past five years",
        REF("Diversa · Q2.5.4", "diversa", { sheet: "2.1.4" }),
        "." ] },

      { id: "governance", q: "Governance and board oversight", content: [
        "Chester's governance, risk and compliance frameworks, including its internal-controls environment, are overseen by the Copia Board: Bruce Loveday (Chairman), Sam Cole (Director), Sally McDow (Director) and Michael Voskresensky (Company Secretary). No members of the investment team have operational duties. The front-office function operates independently of the back office, which is provided by the Responsible Entity." ] },

      { id: "controls", q: "Internal controls assurance (GS007)", content: [
        "Both Copia and Chester are independently assured under GS007 / ASAE 3402 Type 2 for FY2025, each with a signed audit opinion",
        REF("Copia GS007 2025", "gs007_copia", { page: 1 }),
        REF("Chester GS007 2025", "gs007_chester", { page: 1 }),
        "." ] },
    ],
  },

  {
    id: "people", title: "People",
    intro: "The investment manager and team with direct responsibility for investment decision-making.",
    items: [
      { id: "headcount", q: "Business headcount and change over three years", content: [
        "The investment team has five members (five in 2025, five in 2024, and three, briefly four, in 2023). All five are investment professionals. Operations, distribution, marketing and administration are provided by Copia, which employs 23 staff across Victoria, New South Wales and Queensland." ] },

      { id: "key_staff", input: "upload", q: "Key investment staff and biographies", content: [
        "Rob Tucker is Managing Director and Portfolio Manager, with 26 years of industry experience. Anthony Kavanagh is a Portfolio Manager with 16 years of experience. Luke Howard is a Portfolio Manager. All three are based in Melbourne and are co-owners of the business",
        REF("Fund Manager bios.docx", "bios"),
        REF("FSC CHCF pp.23-26", "fsc_chcf", { page: 23 }),
        "." ],
        flagInfo: {
          type: "upload", optional: true, title: "Bios attachment requested",
          copy: "The questionnaire asks for full biographies as an attachment. Attach the bios document for Tucker, Kavanagh and Howard, or confirm that the summary above is sufficient.",
          missingFile: "20250306 Fund Manager bios Chester.docx",
        } },

      { id: "rem", q: "Remuneration and alignment", content: [
        "Portfolio Managers receive a base salary plus a performance component linked to the investment outcomes of the Fund. Alignment with investors is supported by co-investment in the Fund by the investment team, and by the firm being 100% employee-owned." ] },

      { id: "succession", q: "Succession and key-person risk", content: [
        "Key-person risk is shared across the three Portfolio Managers, who use the same philosophy and process, and each strategy has a designated back-up decision-maker. Succession planning is in place for the senior investment staff." ] },
    ],
  },

  {
    id: "process", title: "Investment process & philosophy",
    intro: "Investment philosophy, research and portfolio-construction approach for the product.",
    items: [
      { id: "Q3", hero: true, q: "Investment philosophy (as it relates to this product)",
        content: [
          "Chester's core belief is that markets are not perfectly efficient: investor biases and other market forces create exploitable gaps between share prices and intrinsic value. The team looks for three signals, summarised as Quality, Valuation and Edge",
          REF("FSC CHCF · Q13.2 (pp.2-3)", "fsc_chcf", { page: 2 }),
          ". Quality means unusually predictable cash flows, reflected in a company's ability to generate free cash flow. Valuation means a clear margin of safety. Edge means a proprietary insight from research that points to a probable earnings surprise. The relative importance of the three signals varies with the type of company, based on the predictability and cyclicality of its cash flows. For the Chester High Conviction Fund this produces a concentrated portfolio of 25 to 40 stocks drawn primarily from the S&P/ASX 300, with up to 10% in non-index (pre-IPO) names and up to 20% cash. The Fund aims to outperform the S&P/ASX 300 Accumulation Index by 5% p.a. before fees over rolling three-year periods, with expected tracking error of 5 to 10%",
          REF("FSC CHCF · Q13.7 (pp.4-8)", "fsc_chcf", { page: 4 }),
          "." ],
        image: { src: "dataroom/docs/img/qve-framework.png", caption: "Chester's Quality, Valuation and Edge framework." } },

      { id: "style", q: "Overarching style", content: [
        "The Fund is high-conviction and active, with a flexible style bias. Its emphasis on free-cash-flow generation means it generally shows growth characteristics, but valuation support must be present to provide a margin of safety. Chester will also take more contrarian positions where it believes the market has mispriced a company by extrapolating a weak near-term outlook." ] },

      { id: "research", q: "Research process and idea generation",
        content: [
          "Research is done in-house, drawing on Chester's proprietary company financial models. The investable universe is ASX-listed or soon-to-be-listed companies, focused on the largest 300 by market capitalisation, with up to 10% in pre-IPO names expected to list within 12 months and 0 to 20% cash. Long-term thematic and sector trends, for example AI, the energy transition, demographic change and fiscal stress, focus the research effort rather than set portfolio weights, and every idea still requires bottom-up validation, valuation support and a company-specific insight. Companies are grouped by economic characteristics, predictable cash generators (around 60 to 65%), cyclicals (around 15 to 25%) and defensives, rather than by GICS sector. The process narrows a universe of 300-plus stocks to a watch list of roughly 70 to 90, and a final portfolio of 25 to 40." ],
        image: { src: "dataroom/docs/img/research-funnel.png", caption: "From the investable universe to the portfolio." } },

      { id: "sizing", q: "Position sizing and portfolio construction",
        content: [
          "The portfolio holds 25 to 40 stocks, sized by conviction rather than by benchmark weight. When a holding's weight moves 50 basis points away from its model-portfolio target, that triggers a review of the position. A strict buy discipline and an active sell discipline keep positions under continual challenge; the small, focused team maintains daily dialogue so existing holdings are reviewed against the original thesis. Analysts prepare downside as well as upside scenarios in their models, and a position that falls materially is re-underwritten",
          REF("FSC CHCF · Q13.7 (pp.4-8)", "fsc_chcf", { page: 4 }),
          "." ],
        image: { src: "dataroom/docs/img/buy-sell-discipline.png", caption: "Buy and sell discipline." } },

      { id: "benchmark_aware", q: "Is the strategy benchmark-aware?", content: [
        "The strategy is benchmark-unaware, with no targeted sector weightings. The S&P/ASX 300 is used to measure performance, not to constrain how the portfolio is built." ] },
    ],
  },

  {
    id: "performance", title: "Performance & Portfolio",
    intro: "Benchmark, objectives, fees and capacity for the product.",
    items: [
      { id: "perf_benchmark", q: "Performance benchmark", content: ["S&P/ASX 300 Accumulation Index."] },
      { id: "return_obj", q: "Return objective", content: [
        "To outperform the S&P/ASX 300 Accumulation Index by 5% p.a. before fees over rolling three-year periods",
        REF("FSC CHCF · Q13.4 (p.3)", "fsc_chcf", { page: 3 }), "." ] },
      { id: "risk_obj", q: "Risk objective", content: [
        "There is no separate risk objective. The Fund is built for investors who want to grow capital while preserving it, with expected tracking error of 5 to 10%." ] },
      { id: "fees", q: "Fee structure", content: [
        "The base management fee is 0.95% p.a. A performance fee of 15% applies to returns above the benchmark, accrued daily and paid quarterly, subject to a high-water mark. Over the past five years the performance fee has averaged about 0.45% p.a." ] },
      { id: "capacity", input: "validation", q: "Strategy capacity", content: [
        "Estimated capacity for the retail strategy is about A$2.9 billion. Capacity was last reviewed in March 2026." ],
        flagInfo: {
          type: "validation", title: "Confirm capacity figure",
          copy: "Capacity of about A$2.9bn (retail) was last reviewed in March 2026. Confirm it is still current for this response, or update it.",
          suggestedNote: "Confirmed current: capacity about A$2.9bn (retail), reviewed March 2026",
        } },
      { id: "derivatives", q: "Use of derivatives", content: [
        "The Fund does not use derivatives and is not geared." ] },
    ],
  },

  {
    id: "operations", title: "Operations & Risk",
    intro: "Insurance, service providers, risk controls and continuity.",
    items: [
      { id: "Q4", hero: true, flag: "info", q: "Certificates of currency for each policy of insurance",
        content: [
          "The Manager holds the following insurance program, placed with Chubb Insurance Australia Ltd: Professional Indemnity $10m, Directors & Officers $10m, Electronic & Computer Crime $2m, Fraud $20m and Cybersecurity $2m. A current Certificate of Currency is held for the Cybersecurity policy, which expires on 14 September 2026",
          REF("5. Copia Cyber COC 2025.pdf", "cyber_coc", { page: 1 }),
          "." ],
        contentFinal: [
          "The Manager holds the following insurance program, placed with Chubb Insurance Australia Ltd. Certificates of currency for all five policies are attached",
          REF("Chubb Combined CoC 2026.pdf", "chubb_combined", { page: 1 }),
          "." ],
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
        flagInfo: {
          type: "info", title: "Additional information required",
          copy: "The knowledge base holds a Certificate of Currency for the Cybersecurity policy only (5. Copia Cyber COC 2025 - External Version.pdf). Certificates for the Professional Indemnity, Directors & Officers, Electronic & Computer Crime and Fraud policies are not in the knowledge base. Upload the certificates to complete this response.",
          missingFile: "Chubb Combined Certificate of Currency 2026.pdf",
        } },

      { id: "providers", q: "Key service providers", content: [
        "Responsible Entity: Copia Investment Partners Ltd. Custodian: State Street (master custodian) with HSBC as sub-custodian. Fund auditor: EY." ] },

      { id: "risk_controls", q: "Risk controls and oversight", content: [
        "Risk is managed through stock, sector and cash limits, with no leverage. Portfolio risk and compliance are overseen by Copia's risk and compliance function, separately from the investment team. Stress tests and scenario analysis are run on the portfolio periodically." ] },

      { id: "bcp", q: "Business continuity and disaster recovery", content: [
        "Chester maintains a documented business continuity and disaster recovery plan as part of its policy framework",
        REF("BCP & DR Plan", "pol_bcp"),
        "." ] },
    ],
  },
];

// ---------------------------------------------------------------
// FULL questionnaire — the entirety of the Quilla "Manager
// pre-meeting questionnaire" as received, section by section and
// question by question. This drives the master/detail review
// screen: the master panel renders every question (with drafted
// responses sourced from the knowledge base) and each section
// carries the set of knowledge-base documents that feed it.
//
// Question schema:
//   { n, q, sub?, a?, note?, table?, image?, hint? }
//     n     — the question number as printed on the source
//     q     — the question text
//     sub   — sub-section heading (Process only), emitted when it changes
//     a     — drafted answer: token array (strings + REF tags). Omit for
//             questions left open for the manager to complete.
//     note  — short framing line shown above the answer
//     table — { head, rows } rendered beneath the answer
//     image — { src, caption } source figure
//     hint  — placeholder text when there is no drafted answer yet
//
// Section `sources` lists the knowledge-base documents Othello has
// matched to that section, each with a one-line note on what it feeds.
// ---------------------------------------------------------------
const SRC = (id, feeds) => ({ id, feeds });

const DD_QUESTIONNAIRE = [
  {
    id: "qb_business", title: "Business",
    intro: "Applies to the investment manager with direct responsibility for investment decision making.",
    sources: [
      SRC("diversa", "FUM history, ownership and net flows"),
      SRC("fsc_chcf", "Business overview and structure (pp.23–26)"),
      SRC("copia_afsl", "Licensing and the Copia / Chester relationship"),
      SRC("gs007_copia", "Internal-controls assurance (GS007)"),
    ],
    items: [
      { n: "1", q: "Business inception date", a: [
        "Chester Asset Management was established in 2017. The Chester High Conviction Fund launched in April 2017 and is run on the same basis as the predecessor SGH Australia Plus Fund, which had a 3.5-year track record. Lead Portfolio Manager Rob Tucker has managed money on the same approach since 2005, including five years running the HSBC Australian Country Funds from Hong Kong." ] },

      { n: "2", q: "Please detail business ownership and/or structure", a: [
        "Chester Asset Management Pty Ltd is a boutique Australian equities manager, established in April 2017 by Rob Tucker and Anthony Kavanagh. It is 100% employee-owned by its three Portfolio Managers — Rob Tucker, Anthony Kavanagh and Luke Howard — with no external or institutional shareholders, and there are no planned changes to the ownership structure",
        REF("Diversa · sheet 2.1.4", "diversa", { sheet: "2.1.4" }),
        ". Copia Investment Partners Ltd provides Responsible Entity, distribution and administration services for the Chester High Conviction Fund, which lets the investment team concentrate on portfolio management",
        REF("FSC CHCF pp.23-26", "fsc_chcf", { page: 23 }), "." ] },

      { n: "3", q: "Has the business ownership and/or structure changed in any way over the last 5 years?", a: [
        "No. There have been no changes to business ownership or structure over the last five years. The business is well funded and continues to grow." ] },

      { n: "4", q: "Please detail significant shareholders", a: [
        "The business is 100% employee-owned by its three Portfolio Managers — Rob Tucker, Anthony Kavanagh and Luke Howard — each holding a one-third interest. There are no external or institutional shareholders",
        REF("Diversa · sheet 2.1.4", "diversa", { sheet: "2.1.4" }), "." ] },

      { n: "5", q: "Please detail investment team ownership", a: [
        "Ownership sits entirely with the investment team: the three Portfolio Managers each own one-third of the business." ] },

      { n: "6", q: "Please articulate business ownership details of the Fund's key decision makers", a: [
        "The Fund's key decision makers are Rob Tucker, Anthony Kavanagh and Luke Howard. Each is a one-third owner of the business, fully aligning the decision makers with the firm and with investors." ] },

      { n: "7", q: "Please provide details of executive team / board, including whether any members of the investment team have operational duties.", a: [
        "Governance, risk and compliance are overseen by the Copia Board: Bruce Loveday (Chairman), Sam Cole (Director), Sally McDow (Director) and Michael Voskresensky (Company Secretary). No members of the investment team have operational duties; the front-office function operates independently of the back office, which is provided by the Responsible Entity." ] },

      { n: "8", q: "Is the business profitable on a base management fee only?", a: [
        "Yes. The business is profitable on base management fees alone and is well funded." ] },

      { n: "9", q: "If business is not currently past breakeven, how many years of operations can be funded from existing working capital?", a: [
        "Not applicable — the business is profitable on base management fees." ] },

      { n: "10", q: "Please provide current, or most recently disclosed, total AUM (across all strategies)", note: "Firm-wide funds under management, sole asset class Australian equities.",
        a: [ "A$2,234.43 million as at 31 December 2025 (most recently disclosed)", REF("Diversa · sheet 1.2.6", "diversa", { sheet: "1.2.6" }), "." ],
        table: { head: ["Effective date", "AUM", "Currency"], rows: [["31 Dec 2025", "2,234.43m", "AUD"]] } },

      { n: "11", q: "Please detail AUM for end of Calendar Years", a: [
        "Firm-wide FUM has grown strongly over three years", REF("Diversa · sheet 1.2.6", "diversa", { sheet: "1.2.6" }), "." ],
        table: { head: ["2025", "2024", "2023"], rows: [["A$2,234.43m", "A$1,341.85m", "A$933.82m"]] } },

      { n: "12", q: "Please detail net flows by calendar year", a: [
        "Net inflows of A$610.9m in calendar 2025." ],
        table: { head: ["2026", "2025", "2024", "2023"], rows: [["—", "A$610.9m", "—", "—"]] } },

      { n: "13", q: "Please provide split of Institutional, wholesale, retail AUM", note: "Chester High Conviction Fund classes as at 31 March 2026. Class A & I are offered via PDS; Class B & C via Information Memorandum.",
        table: { head: ["CHCF Class A (retail)", "CHCF Class B (wholesale)", "CHCF Class C (wholesale)", "CHCF Class I"], rows: [["A$1.1b", "A$27.6m", "A$3.4m", "A$419m"]] } },

      { n: "14", q: "Are there any individual clients (or client groups) that make up more than 10% of total AUM?", a: [
        "Yes. A single institutional mandate of A$671m represents 29% of Chester Asset Management's total AUM as at 31 March 2026." ] },

      { n: "15", q: "If yes, please provide percentage of AUM", table: {
        head: ["Client", "% of AUM", "Notes"], rows: [
          ["Client 1", "29%", "Institutional mandate (A$671m)"],
          ["Client 2", "—", "—"], ["Client 3", "—", "—"], ["Client 4", "—", "—"], ["Client 5", "—", "—"] ] } },

      { n: "16", q: "Is the Business a single strategy business?", a: [
        "Chester operates effectively as a single-strategy business, applying a consistent high-conviction philosophy across its products with some variation around the same core approach. There are three products: Chester High Conviction (retail, all-cap, led by Rob Tucker), Chester Mid-Cap (mandate, same philosophy, led by Rob Tucker) and Chester Opportunities (wholesale, small-cap, led by Anthony Kavanagh)." ] },

      { n: "17", q: "Does the business derive revenue from any other source?", a: [
        "No. The business derives revenue solely from investment-management fees on its Australian equities strategies." ] },

      { n: "18", q: "If yes, please articulate, including materiality to revenue:", a: [
        "Not applicable — investment-management fees are the sole source of revenue." ] },

      { n: "19", q: "If there is any context you wish to give to any of the above, please articulate here:", hint: "Open for the manager to add context. Drafted from the Business sources on the right." },
    ],
  },

  {
    id: "qb_people", title: "People",
    intro: "Applies to the investment manager and team with direct responsibility for investment decision making.",
    sources: [
      SRC("bios", "Investment-team biographies (Tucker, Kavanagh, Howard, Dalgleish, Beard)"),
      SRC("fsc_chcf", "Team, responsibilities and remuneration"),
      SRC("diversa", "Headcount and alignment"),
    ],
    items: [
      { n: "1", q: "What is the business headcount, and how has it changed over the past three years?", note: "Investment team. Operations, distribution, marketing and administration are provided by Copia (23 staff).",
        table: { head: ["Current", "2025", "2024", "2023"], rows: [["5", "5", "5", "3 (briefly 4)"]] } },

      { n: "2", q: "Please detail split by function", note: "All five team members are investment professionals; non-investment functions are provided by Copia.",
        table: { head: ["Function", "Headcount"], rows: [["Investment Team", "5"], ["Operations", "Provided by Copia"], ["Sales / Client Services", "Provided by Copia"], ["Other", "—"]] } },

      { n: "3", q: "Please provide details of key investment staff (please also provide bios)", a: [
        "The five-person investment team is led by the three founding Portfolio Managers. Full biographies are included in the Appendix",
        REF("Fund Manager bios.docx", "bios"), "." ],
        table: { head: ["Name", "Job title", "Industry exp.", "Tenure", "Location"], rows: [
          ["Rob Tucker", "Founder & Portfolio Manager", "26 yrs", "Since 2017", "Melbourne"],
          ["Anthony Kavanagh, CFA", "Portfolio Manager", "16 yrs", "Since 2017", "Melbourne"],
          ["Luke Howard, B.Com", "Portfolio Manager", "19 yrs", "Since Feb 2018", "Melbourne"],
          ["Luke Dalgleish", "Investment Analyst", "5 yrs", "Since Mar 2024", "Melbourne"],
          ["Tom Beard", "Investment Analyst / Dealer", "8 yrs", "Since Feb 2024", "Melbourne"] ] } },

      { n: "4", q: "Please detail any additions and departures over the past three years", note: "Two additions and one departure in the investment team over three years.",
        table: { head: ["Change", "Name", "Role", "When"], rows: [
          ["Addition", "Luke Dalgleish", "Investment Analyst", "Joined Mar 2024"],
          ["Addition", "Tom Beard", "Investment Analyst / Dealer", "Joined Feb 2024"],
          ["Departure", "—", "Investment Analyst / Dealer", "Departed"] ] } },

      { n: "5", q: "Please provide details of REM structures by PM / Analyst", a: [
        "Portfolio Managers and analysts receive a base salary plus a variable component linked to the investment outcomes of the Fund. The three Portfolio Managers are also one-third owners of the business." ] },

      { n: "6", q: "Is REM structured in a way that is tied to investment outcomes of the Fund?", a: [
        "Yes. The variable component of remuneration is tied to the investment outcomes of the Fund, aligning the team with investors." ] },

      { n: "7", q: "Are there any other key features of REM structures in place?", a: [
        "Equity ownership by the three Portfolio Managers is the principal long-term incentive, reinforcing alignment beyond annual remuneration." ] },

      { n: "8", q: "Are there any other features in place designed to increase alignment with Fund investors?", a: [
        "Alignment is supported by co-investment in the Fund by the investment team and by the firm being 100% employee-owned." ] },

      { n: "9", q: "Can you provide an indication of co-investment in the Fund from investment team members?", a: [
        "Members of the investment team co-invest in the Fund alongside external investors." ] },

      { n: "10", q: "Are investment staff permitted to invest outside of the internal products offered?", a: [
        "Personal investing by staff is governed by Copia's personal-account dealing and conflicts-of-interest policies",
        REF("Conflicts of Interest Policy", "pol_coi"), "." ] },

      { n: "11", q: "Can you provide any details of retention mechanisms in place for key staff?", a: [
        "Equity ownership (one-third each for the three Portfolio Managers) and performance-linked remuneration are the principal retention mechanisms for key staff." ] },

      { n: "12", q: "Is there a designated back-up to the Fund's Key Decision Maker?", a: [
        "Yes. Each strategy has a designated back-up decision-maker, and all three Portfolio Managers share the same philosophy and process. All three are experienced, astute investors with a very high degree of familiarity with the investment process, are well incentivised to remain with Chester, and departure is considered unlikely." ] },

      { n: "13", q: "Is there succession planning in place for key investment figureheads?", a: [
        "Yes. Succession planning is in place for senior investment staff; key-person risk is shared across the three Portfolio Managers, who use the same philosophy and process." ] },

      { n: "14", q: "Do you have any specialist / dedicated ESG resources?", a: [
        "ESG is integrated into the research process rather than run by a separate team; analysts assess ESG risks as part of company analysis." ] },
    ],
  },

  {
    id: "qb_process", title: "Process",
    intro: "Investment philosophy, research, portfolio construction and risk management for the strategy.",
    sources: [
      SRC("fsc_chcf", "Philosophy, research and portfolio construction (Q13)"),
      SRC("pol_rmf", "Risk Management Framework"),
      SRC("pol_proxy", "ESG and proxy-voting policy"),
      SRC("diversa", "Process responses"),
    ],
    items: [
      // Philosophy
      { sub: "Philosophy", n: "1", q: "How would you best classify the Fund's overarching style?", a: [
        "High-conviction and active, with a flexible style bias. The emphasis on free-cash-flow generation gives the portfolio a growth lean, but valuation support must be present to provide a margin of safety; the Fund will also take contrarian positions where it believes the market has mispriced a company by extrapolating a weak near-term outlook." ] },

      { sub: "Philosophy", n: "(other)", q: "If other, please articulate", a: ["Not applicable — see the style classification above."] },

      { sub: "Philosophy", n: "2", q: "Please describe your investment philosophy in a succinct manner", a: [
        "Chester's core belief is that markets are not perfectly efficient: investor biases and other market forces create exploitable gaps between share prices and intrinsic value. The team looks for three signals — Quality, Valuation and Edge",
        REF("FSC CHCF · Q13.2 (pp.2-3)", "fsc_chcf", { page: 2 }),
        ". Quality means unusually predictable cash flows; Valuation means a clear margin of safety; Edge means a proprietary insight pointing to a probable earnings surprise. This produces a concentrated portfolio of 25 to 40 stocks drawn primarily from the S&P/ASX 300, with up to 10% in non-index (pre-IPO) names and up to 20% cash." ],
        image: { src: "dataroom/docs/img/qve-framework.png", caption: "Chester's Quality, Valuation and Edge framework." } },

      // Research
      { sub: "Research", n: "3", q: "Does the research process utilise initial screens to reduce the investable universe?", a: [
        "The investable universe is ASX-listed (or soon-to-list) companies, focused on the largest 300 by market capitalisation, with up to 10% in pre-IPO names expected to list within 12 months and 0 to 20% cash. Beyond that universe screen, every idea requires bottom-up validation." ] },
      { sub: "Research", n: "(3a)", q: "If yes, please articulate key screening requirements", a: [
        "Focus on the S&P/ASX 300, predictable free-cash-flow generators, valuation support and a company-specific edge." ] },

      { sub: "Research", n: "4", q: "Are there any industry groups or thematics that are typically favoured?", a: [
        "Long-term thematic and sector trends — for example AI, the energy transition, demographic change and fiscal stress — focus the research effort rather than set portfolio weights, and every idea still requires bottom-up validation." ] },
      { sub: "Research", n: "(4a)", q: "If yes, please articulate", a: ["See the favoured thematics noted above; these guide research focus, not portfolio weights."] },

      { sub: "Research", n: "5", q: "Are there any industry groups or thematics that are typically under-represented or excluded?", a: [
        "There are no formal exclusions. Companies are grouped by economic characteristics — predictable cash generators (~60–65%), cyclicals (~15–25%) and defensives — rather than by GICS sector, and weights follow bottom-up conviction." ] },
      { sub: "Research", n: "(5a)", q: "If yes, please articulate", a: ["Not applicable — there are no blanket sector or thematic exclusions."] },

      { sub: "Research", n: "6", q: "Following your screening process, what is the size of your investible universe?", a: [
        "The process narrows a universe of 300-plus stocks to a watch list of roughly 70 to 90, and a final portfolio of 25 to 40." ],
        image: { src: "dataroom/docs/img/research-funnel.png", caption: "From the investable universe to the portfolio." } },

      { sub: "Research", n: "7", q: "Please provide some detail on how ideas are generated for research?", a: [
        "Ideas are generated in-house from Chester's proprietary company financial models, thematic and sector analysis, and continuous company engagement. Every idea requires bottom-up validation, valuation support and a company-specific insight." ] },

      { sub: "Research", n: "8", q: "How is workflow allocated to the investment team? Are analysts generalists or specialists?", a: [
        "The small, focused team works collaboratively with daily dialogue; analysts operate largely as generalists across the portfolio rather than as single-sector specialists." ] },

      { sub: "Research", n: "9", q: "Describe the detailed research analysts undertake in a succinct manner", a: [
        "Analysts build and maintain proprietary financial models, assess each company against Quality, Valuation and Edge, and prepare both upside and downside scenarios before a position is taken." ] },

      { sub: "Research", n: "10", q: "Detail the breadth of active coverage and how many financial models are actively maintained?", a: [
        "Proprietary models are actively maintained across the watch list of roughly 70 to 90 names that feeds the 25-to-40-stock portfolio." ] },

      { sub: "Research", n: "11", q: "Do you utilise external research or is everything done in house?", a: [
        "Research is done in-house, drawing on Chester's proprietary company financial models; external sell-side research is used only as an input, not as the basis for decisions." ] },

      { sub: "Research", n: "12", q: "Is there some sort of devil's advocate process when analysts present ideas?", a: [
        "Yes. The small team keeps theses under continual challenge through daily dialogue, with a structured review triggered when a position deviates from its model-portfolio target." ] },

      { sub: "Research", n: "13", q: "How is macro incorporated into the process if at all?", a: [
        "Macro and long-term thematics focus the research effort rather than drive top-down positioning; portfolio construction remains fundamentally bottom-up." ] },

      // Portfolio Construction
      { sub: "Portfolio Construction", n: "14", q: "Is the strategy Benchmark aware?", a: [
        "The strategy is benchmark-unaware, with no targeted sector weightings. The S&P/ASX 300 is used to measure performance, not to constrain how the portfolio is built." ] },

      { sub: "Portfolio Construction", n: "15", q: "How are Portfolio Managers challenged on positions?", a: [
        "Positions are continually challenged against the original thesis. When a holding's weight moves 50 basis points away from its model-portfolio target, that triggers a review, and weak positions are re-underwritten." ] },

      { sub: "Portfolio Construction", n: "16", q: "Describe your position sizing framework", a: [
        "The portfolio holds 25 to 40 stocks, sized by conviction rather than by benchmark weight. A strict buy discipline and an active sell discipline keep positions under continual challenge, with daily dialogue across the small team",
        REF("FSC CHCF · Q13.7 (pp.4-8)", "fsc_chcf", { page: 4 }), "." ],
        image: { src: "dataroom/docs/img/buy-sell-discipline.png", caption: "Buy and sell discipline." } },

      { sub: "Portfolio Construction", n: "17", q: "Please add any other detail on how portfolios are constructed", a: [
        "Holdings are drawn primarily from the S&P/ASX 300, with up to 10% in non-index (pre-IPO) names and up to 20% cash. There is no leverage." ] },

      // Risk Management
      { sub: "Risk Management", n: "18", q: "Do analysts prepare downside risk case scenarios at the stock/bond level?", a: [
        "Yes. Analysts prepare downside as well as upside scenarios for each holding in their models." ] },

      { sub: "Risk Management", n: "19", q: "Do you consider ESG Risks and do you adjust for any of these risks from a valuation perspective?", a: [
        "Yes. ESG risks are assessed as part of company analysis and reflected in valuation where material." ] },

      { sub: "Risk Management", n: "20", q: "How do you react to positions that have experienced significant weakness (> 25% down)?", a: [
        "A position that falls materially is re-underwritten against the original thesis; the active sell discipline keeps weak positions under challenge rather than held by default." ] },

      { sub: "Risk Management", n: "21", q: "How often are stress tests / scenario analysis applied to the portfolio?", a: [
        "Stress tests and scenario analysis are run on the portfolio periodically, alongside the stock-level downside cases prepared by analysts." ] },

      { sub: "Risk Management", n: "22", q: "Describe the stress testing / scenario analysis process", a: [
        "Scenario analysis is run at the portfolio level and combined with bottom-up downside cases at the stock level to understand drawdown risk under adverse conditions." ] },

      { sub: "Risk Management", n: "23", q: "Provide detail of your risk controls e.g. stock / regional / sector / leverage / cash etc.", a: [
        "Risk is managed through stock, sector and cash limits, with no leverage. Portfolio risk and compliance are overseen by Copia's risk and compliance function, separately from the investment team",
        REF("Risk Management Framework", "pol_rmf"), "." ] },

      { sub: "Risk Management", n: "24", q: "Do you have oversight from a separate risk committee / team?", a: [
        "Yes. Portfolio risk and compliance are overseen by Copia's risk and compliance function, independently of the investment team." ] },

      { sub: "Risk Management", n: "25", q: "Please add any additional information on risk management that you see fit", hint: "Open for the manager to add detail. Drafted from the Risk Management Framework on the right." },

      // Other
      { sub: "Other", n: "26", q: "Have you built any internal proprietary models that are used throughout the investment process?", a: [
        "Yes. Chester maintains proprietary company financial models used throughout research and portfolio construction." ] },

      { sub: "Other", n: "27", q: "Describe the proprietary models and how they are used in the investment process", a: [
        "The models support Quality, Valuation and Edge analysis, frame upside and downside scenarios, and underpin both position sizing and the sell discipline." ] },

      { sub: "Other", n: "28", q: "Provide some recent examples of process enhancements", hint: "Open for the manager to add recent examples." },

      { sub: "Other", n: "29", q: "How is AI/ML being incorporated into the process (if at all)?", a: [
        "AI and machine learning are monitored as potential research inputs; the process remains fundamentally bottom-up and judgement-led." ] },

      { sub: "Other", n: "30", q: "Do you have an ESG policy? If so please provide", a: [
        "Yes. ESG is integrated into the investment process, and the firm maintains relevant policies as part of its policy framework",
        REF("ESG / Proxy Voting Policy", "pol_proxy"), "." ] },
    ],
  },

  {
    id: "qb_fund", title: "Fund Features",
    intro: "Benchmark, objectives, fees, service providers and capacity for the Chester High Conviction Fund.",
    sources: [
      SRC("fsc_chcf", "Benchmark, objectives, fees and capacity"),
      SRC("diversa", "Vehicle and strategy AUM, net flows"),
      SRC("copia_afsl", "Responsible Entity and service-provider arrangements"),
    ],
    items: [
      { n: "1", q: "What is the Fund's Performance Benchmark?", a: ["S&P/ASX 300 Accumulation Index."] },

      { n: "2", q: "What is the Fund's Return Objective?", a: [
        "To outperform the S&P/ASX 300 Accumulation Index by 5% p.a. before fees over rolling three-year periods",
        REF("FSC CHCF · Q13.4 (p.3)", "fsc_chcf", { page: 3 }), "." ] },

      { n: "3", q: "Does the Fund have a Risk Objective?", a: [
        "There is no separate risk objective. The Fund is built for investors who want to grow capital while preserving it, with expected tracking error of 5 to 10%." ] },

      { n: "4", q: "What is the Fund's Fee Structure?", table: {
        head: ["Component", "Terms"], rows: [
          ["Base", "0.95% p.a."],
          ["Performance", "15% of outperformance above the benchmark, accrued daily, paid quarterly"],
          ["Hurdle", "S&P/ASX 300 Accumulation Index"],
          ["HWM reset", "Subject to a perpetual high-water mark (no reset)"] ] },
        note: "Over the past five years the performance fee has averaged about 0.45% p.a." },

      { n: "5", q: "Is the Fund currently below the performance hurdle HWM?", a: ["No. The Fund is not currently below its high-water mark."] },
      { n: "(5a)", q: "If yes, can you provide an estimate of materiality?", a: ["Not applicable — the Fund is above its high-water mark."] },

      { n: "6", q: "Are fee rebates available?", a: [
        "Fee rebates are available for institutional mandates by negotiation; retail and wholesale classes are charged at the stated rates." ] },

      { n: "7", q: "Please provide details of key service providers", table: {
        head: ["Role", "Provider"], rows: [
          ["Responsible Entity", "Copia Investment Partners Ltd"],
          ["Custodian", "State Street (master custodian), HSBC (sub-custodian)"],
          ["Fund Auditor", "EY"],
          ["Prime Broker", "Not applicable (long-only, no leverage)"] ] } },

      { n: "8", q: "If the Fund is an ETF please provide details of key service providers", a: [
        "Not applicable — the Chester High Conviction Fund is an unlisted managed fund, not an ETF." ] },

      { n: "9", q: "Can the Fund use derivatives?", a: ["No. The Fund does not use derivatives and is not geared."] },
      { n: "(9a)", q: "If yes, please articulate approved instruments", a: ["Not applicable — the Fund does not use derivatives."] },
      { n: "(9b)", q: "Are derivatives expected to play a key continuous role in the Fund's implementation?", a: ["No — the Fund is a long-only physical equities strategy."] },

      { n: "10", q: "Please provide a capacity estimate for the strategy", a: [
        "Estimated capacity for the retail strategy is about A$2.9 billion." ],
        table: { head: ["Capacity", "Currency"], rows: [["~2,900m", "AUD"]] } },

      { n: "11", q: "When was capacity last reviewed?", a: ["March 2026."] },

      { n: "12", q: "Please provide current AUM of the vehicle and strategy", note: "Chester High Conviction Fund, all classes, as at 31 March 2026.",
        table: { head: ["Vehicle", "APIR", "Effective date", "AUM"], rows: [["Chester High Conviction Fund", "OPS7755AU", "31 Mar 2026", "~A$1,550m"]] } },

      { n: "13", q: "Please detail AUM for end of Calendar Years (31 Dec)", hint: "Vehicle-level calendar-year AUM to be confirmed; firm-wide history is in the Business section.",
        table: { head: ["APIR", "2025", "2024", "2023"], rows: [["OPS7755AU", "—", "—", "—"]] } },

      { n: "14", q: "Please detail net flows by calendar year", note: "CHCF Class A, B, C and I.",
        table: { head: ["2026", "2025", "2024", "2023"], rows: [["—", "A$610.9m", "—", "—"]] } },

      { n: "15", q: "Please provide split of Institutional, wholesale, retail AUM", note: "As at 31 March 2026.",
        table: { head: ["Channel", "AUM", "Detail"], rows: [
          ["Institutional", "A$671m", "Single mandate"],
          ["Wholesale", "A$31m", "CHCF Class B & C; Chester Opps"],
          ["Retail", "A$1.52b", "CHCF Class A (A$1.1b) & Class I (A$419m)"] ] } },

      { n: "16", q: "Are there any individual clients (or client groups) that make up more than 10% of total AUM?", a: [
        "Yes — a single institutional mandate of A$671m, 29% of total AUM as at 31 March 2026." ] },

      { n: "17", q: "If yes, please provide percentage of AUM", table: {
        head: ["Client", "% of AUM", "Notes"], rows: [
          ["Client 1", "29%", "Institutional mandate (A$671m)"],
          ["Client 2", "—", "—"], ["Client 3", "—", "—"], ["Client 4", "—", "—"], ["Client 5", "—", "—"] ] } },
    ],
  },

  {
    id: "qb_appendix", title: "Appendix — Biographies",
    intro: "Chester Asset Management investment-team biographies, as supplied with the questionnaire.",
    sources: [ SRC("bios", "Full biographies for the investment team") ],
    items: [
      { n: "", q: "Rob Tucker — Founder and Portfolio Manager", a: [
        "Rob Tucker is the Founder and Portfolio Manager of Chester Asset Management, a high-conviction Australian equity manager established in 2017. He has over 20 years of investment experience, including senior portfolio-management roles at SG Hiscock and HSBC Asset Management, where he managed institutional portfolios across Australia and Asia. Under Rob's leadership, Chester has received multiple industry accolades, including Financial Newswire's 2023 Fund Manager of the Year (Australian Equities – Large Cap), Money Magazine's Best Australian Shares Fund in 2023 and 2024, and the Zenith Investment Partners Fund Awards Australian Equities Large Cap Winner in 2025." ] },

      { n: "", q: "Anthony Kavanagh, CFA — Portfolio Manager", a: [
        "Anthony brings over 15 years of investment-management experience, having held key roles at SG Hiscock and Chester Asset Management. He worked alongside Rob Tucker at SG Hiscock, where they developed a shared investment philosophy that ultimately led to the co-founding of Chester in 2017. At Chester, Anthony plays a central role in portfolio management, drawing on his deep industry expertise and longstanding commitment to delivering value for investors." ] },

      { n: "", q: "Luke Howard, B.Com — Portfolio Manager", a: [
        "Luke Howard has 18 years of investment-management experience across SG Hiscock and Perennial, with deep expertise in Australian equities. He previously worked alongside Rob Tucker at SG Hiscock, sharing a strong alignment in investment approach. Luke joined Chester Asset Management in February 2018, where he contributes to the firm's high-conviction portfolio strategy and research-driven investment process." ] },

      { n: "", q: "Luke Dalgleish — Investment Analyst", a: [
        "Luke brings 7 years of industry experience, including roles in Equity Research at JP Morgan and as an analyst at Telstra Corporation. He holds a CPA designation, has completed CFA Level I, and holds a Bachelor of Business in Banking and Finance as well as Accounting. Luke joined Chester Asset Management in March 2024, contributing to investment analysis and insights across the portfolio." ] },

      { n: "", q: "Tom Beard — Investment Analyst / Dealer", a: [
        "Tom has 4 years of investment-industry experience, having worked as an Equity Analyst at Taylor Collison and a Research Analyst at Modern Investor. He holds a Bachelor of Finance and a Bachelor of Economics. Tom joined Chester Asset Management in February 2024 and supports the team through company research and investment analysis." ] },
    ],
  },
];

// Flat helpers
const DD_ALL_ITEMS = DD_SECTIONS.flatMap(s => s.items.map(it => ({ ...it, sectionId: s.id, sectionTitle: s.title })));
const DD_REVIEW_ITEMS = DD_ALL_ITEMS.filter(it => it.flagInfo);
const DD_ITEM_COUNT = DD_ALL_ITEMS.length;
const DD_Q_COUNT = DD_QUESTIONNAIRE.reduce((n, s) => n + s.items.filter(it => it.n).length, 0);

window.KB_DOCS = KB_DOCS;
window.CHUBB_KB_DOC = CHUBB_KB_DOC;
window.KB_FREEFORM = KB_FREEFORM;
window.SHEET_SNIPPETS = SHEET_SNIPPETS;
window.DOC_SNIPPETS = DOC_SNIPPETS;
window.DATAROOMS_SEED = DATAROOMS_SEED;
window.DD_META = DD_META;
window.DD_SECTIONS = DD_SECTIONS;
window.DD_QUESTIONNAIRE = DD_QUESTIONNAIRE;
window.DD_Q_COUNT = DD_Q_COUNT;
window.DD_ALL_ITEMS = DD_ALL_ITEMS;
window.DD_REVIEW_ITEMS = DD_REVIEW_ITEMS;
window.DD_ITEM_COUNT = DD_ITEM_COUNT;
window.DD_EXPORT_PDF = DD_EXPORT_PDF;
