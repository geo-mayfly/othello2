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
    summary: "The FSC standard Investment Manager Questionnaire (section 13), completed for the Chester High Conviction Fund. Covers investment philosophy, process, performance objectives, fees and the investment team. The primary qualitative source for answering questions about the Fund.",
    type: "FSC IMQ", asAt: "Dec 2025", added: "1 Jun 2026", source: "Copia OneDrive",
    file: "dataroom/docs/FSC CHCF December 2025.pdf", pages: 26, feeds: ["Q1", "Q2", "Q3"],
  },
  {
    id: "copia_afsl", active: true, kind: "pdf",
    title: "2 Copia AFSL.pdf",
    desc: "Australian Financial Services Licence, Copia Investment Partners Ltd",
    summary: "Australian Financial Services Licence No. 229316, held by Copia Investment Partners Ltd, the Responsible Entity. Chester operates as a Corporate Authorised Representative under this licence, which carries no special conditions beyond those standard for its class.",
    type: "Licence", asAt: "—", added: "1 Jun 2026", source: "Copia OneDrive",
    file: "dataroom/docs/2 Copia AFSL.pdf", pages: 2, feeds: ["Q1"],
  },
  {
    id: "cyber_coc", active: true, kind: "pdf",
    title: "5. Copia Cyber COC 2025 - External Version.pdf",
    desc: "Certificate of Currency, Cybersecurity policy",
    summary: "Certificate of currency for the Cybersecurity policy placed with Chubb Insurance Australia Ltd, with a $2m limit, expiring 14 September 2026. Evidence for the insurance section of due-diligence questionnaires.",
    type: "Certificate of Currency", asAt: "expires 14 Sep 2026", added: "1 Jun 2026", source: "Copia OneDrive",
    file: "dataroom/docs/5. Copia Cyber COC 2025 - External Version.pdf", pages: 1, feeds: ["Q4"],
  },
  {
    id: "diversa", active: true, kind: "sheet",
    title: "Diversa IM Review (completed response).xlsx",
    desc: "A previously completed questionnaire, reused as evidence",
    summary: "A completed Diversa IM Review questionnaire, reused as evidence. Holds the firm's FUM history, ownership breakdown and full insurance schedule. Often the most recent quantitative source in the library.",
    type: "Prior DD response", asAt: "31 Mar 2026 (data to 31 Dec 2025)", added: "1 Jun 2026", source: "Copia OneDrive",
    feeds: ["Q2", "Q4", "Q5"], hero: true,
  },
  {
    id: "bios", active: true, kind: "doc",
    title: "20250306 Fund Manager bios Chester.docx",
    desc: "Investment team biographies, Tucker, Kavanagh and Howard",
    summary: "Biographies of the three portfolio managers — Rob Tucker, Anthony Kavanagh and Luke Howard — covering experience, ownership and responsibilities. Used to answer key-staff and team questions.",
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

  // Policy pack — real Copia/Chester policies (Q6 documents). Rows with a
  // `file` preview via pdf.js; the few without a supplied file stay
  // display-only and degrade to a clean placeholder.
  { id: "pol_best_exec", kind: "doc", title: "Best Execution Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_bcp", kind: "pdf", title: "BCP & Disaster Recovery Plan.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/BCP & Disaster Recovery Plan.pdf", policy: true },
  { id: "pol_trade_alloc", kind: "pdf", title: "Trade Allocation Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/Trade Allocation Policy.pdf", policy: true },
  { id: "pol_rmf", kind: "pdf", title: "Risk Management Framework.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/Risk Management Framework.pdf", policy: true },
  { id: "pol_proxy", kind: "pdf", title: "Proxy Voting Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/Proxy Voting Policy.pdf", policy: true },
  { id: "pol_compliance", kind: "pdf", title: "Compliance Manual.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/Compliance Manual.pdf", policy: true },
  { id: "pol_counterparty", kind: "doc", title: "Counterparty Exposure Limits.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_soft_dollar", kind: "doc", title: "Soft Dollar Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_related_party", kind: "doc", title: "Related-Party Transactions Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", policy: true },
  { id: "pol_coi", kind: "pdf", title: "Conflicts of Interest Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/Conflicts of Interest Policy.pdf", policy: true },
  { id: "pol_data_sec", kind: "pdf", title: "Data & Information Security Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/Data & Information Security Policy.pdf", policy: true },
  { id: "pol_broker", kind: "pdf", title: "Broker Selection Policy.pdf", type: "Policy", asAt: "2025", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/Broker Selection Policy.pdf", policy: true },
  { id: "pol_risk_appetite", kind: "pdf", title: "Risk Appetite Statement.pdf", type: "Policy", asAt: "Aug 2024", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/Risk Appetite Statement.pdf", policy: true },
  { id: "pol_compliance_plan", kind: "pdf", title: "Chester Compliance Plan.pdf", type: "Policy", asAt: "Jan 2024", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/Chester Compliance Plan.pdf", policy: true },
  { id: "pol_deriv_risk", kind: "pdf", title: "Derivative Risk Management Statement.pdf", type: "Policy", asAt: "Dec 2024", added: "1 Jun 2026", source: "Policy pack", file: "dataroom/docs/Derivative Risk Management Statement.pdf", policy: true },
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
    summary: "Confirms a clean five-year regulatory record — no enforceable undertakings, reportable breaches or non-routine regulator interactions.",
  },
  {
    id: "ff_contacts", title: "DD response contacts", added: "1 Jun 2026", source: "FSC CHCF p.1",
    body: "Rob Tucker for qualitative questions; Anthony Kavanagh and Luke Howard for quantitative questions.",
    summary: "Named points of contact for due-diligence responses, split between qualitative and quantitative questions.",
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
      { id: "biz_inception", q: "Please state the date the business was established, and provide a brief history of the firm and its investment track record.", content: [
        "Chester Asset Management was established in 2017. The Chester High Conviction Fund launched in April 2017 and is run on the same basis as the predecessor SGH Australia Plus Fund, which had a 3.5 year track record. Lead Portfolio Manager Rob Tucker has managed money on the same approach since 2005, including five years running the HSBC Australian Country Funds from Hong Kong." ] },

      { id: "Q2", hero: true, q: "Describe the ownership and corporate structure of the business, including all shareholders and any planned changes to ownership.", content: [
        "Chester Asset Management Pty Ltd is a boutique Australian equities manager, established in April 2017 by Rob Tucker and Anthony Kavanagh. It is 100% employee-owned by its three Portfolio Managers, Rob Tucker, Anthony Kavanagh and Luke Howard, with no external or institutional shareholders, and there are no planned changes to the ownership structure",
        REF("Diversa · sheet 2.1.4", "diversa", { sheet: "2.1.4" }),
        ". Copia Investment Partners Ltd provides Responsible Entity, distribution and administration services for the Chester High Conviction Fund, which lets the five-person investment team concentrate on portfolio management",
        REF("FSC CHCF pp.23-26", "fsc_chcf", { page: 23 }),
        "." ] },

      { id: "biz_changes", q: "Have there been any changes to the ownership or structure of the business in the last five years? If so, please provide details.", content: [
        "There have been no changes to business ownership or structure over the last five years. The business is well funded and continues to grow." ] },

      { id: "Q5", hero: true, flag: "validation", q: "State total firm-wide funds under management (in AUD), including a three-year history and the date the figures are 'as at'.",
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

      { id: "biz_strategy", q: "Is the business a single-strategy business? Please describe the range of strategies and products offered.", content: [
        "Chester is a boutique Australian equities manager applying a consistent, high-conviction philosophy across its products. It operates effectively as a single-strategy business, with some variation around the same core approach. There are three products: Chester High Conviction (retail, all-cap, led by Rob Tucker), Chester Mid-Cap (mandate, same philosophy, led by Rob Tucker) and Chester Opportunities (wholesale, small-cap, led by Anthony Kavanagh)." ] },
    ],
  },

  {
    id: "compliance", title: "Licensing & Compliance",
    intro: "Licensing, regulatory standing and governance of the manager and Responsible Entity.",
    items: [
      { id: "Q1", hero: true, q: "Provide details of the AFSL held (or Corporate Authorised Representative arrangement), including the licence number and any special conditions.", content: [
        "Chester Asset Management Pty Ltd operates as a Corporate Authorised Representative of Copia Investment Partners Ltd (ABN 22 092 872 056), which holds Australian Financial Services Licence No. 229316",
        REF("2 Copia AFSL.pdf", "copia_afsl", { page: 1 }),
        ". Copia is also the Responsible Entity for the Chester High Conviction Fund, and a copy of the licence is attached. The AFSL contains no special conditions beyond those standard for licensees of its class; its authorisations cover dealing in and advising on interests in managed investment schemes, and operating registered schemes",
        REF("FSC CHCF p.1", "fsc_chcf", { page: 1 }),
        ". Copia supervises Chester's authorised-representative activities under its licensee monitoring program." ] },

      { id: "reg_standing", q: "Describe the firm's regulatory standing over the past five years, including any breaches, enforceable undertakings or non-routine interactions with regulators.", content: [
        "There have been no ASIC enforceable undertakings, reportable breaches or non-routine regulator interactions in the past five years",
        REF("Diversa · Q2.5.4", "diversa", { sheet: "2.1.4" }),
        "." ] },

      { id: "governance", q: "Describe the governance and board oversight arrangements for the manager and the Responsible Entity.", content: [
        "Chester's governance, risk and compliance frameworks, including its internal-controls environment, are overseen by the Copia Board: Bruce Loveday (Chairman), Sam Cole (Director), Sally McDow (Director) and Michael Voskresensky (Company Secretary). No members of the investment team have operational duties. The front-office function operates independently of the back office, which is provided by the Responsible Entity." ] },

      { id: "controls", q: "Confirm whether the firm holds independent internal-controls assurance (GS007 / ASAE 3402) and provide the most recent report.", content: [
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
      { id: "headcount", q: "State the total business headcount and describe how it has changed over the last three years.", content: [
        "The investment team has five members (five in 2025, five in 2024, and three, briefly four, in 2023). All five are investment professionals. Operations, distribution, marketing and administration are provided by Copia, which employs 23 staff across Victoria, New South Wales and Queensland." ] },

      { id: "key_staff", input: "upload", q: "Provide biographies for the key investment staff responsible for managing the strategy, attached as a separate document.", content: [
        "Rob Tucker is Managing Director and Portfolio Manager, with 26 years of industry experience. Anthony Kavanagh is a Portfolio Manager with 16 years of experience. Luke Howard is a Portfolio Manager. All three are based in Melbourne and are co-owners of the business",
        REF("Fund Manager bios.docx", "bios"),
        REF("FSC CHCF pp.23-26", "fsc_chcf", { page: 23 }),
        "." ],
        flagInfo: {
          type: "upload", optional: true, title: "Bios attachment requested",
          copy: "The questionnaire asks for full biographies as an attachment. Attach the bios document for Tucker, Kavanagh and Howard, or confirm that the summary above is sufficient.",
          missingFile: "20250306 Fund Manager bios Chester.docx",
        } },

      { id: "rem", q: "Describe the remuneration structure for investment staff and how it aligns their interests with investors.", content: [
        "Portfolio Managers receive a base salary plus a performance component linked to the investment outcomes of the Fund. Alignment with investors is supported by co-investment in the Fund by the investment team, and by the firm being 100% employee-owned." ] },

      { id: "succession", q: "Describe the firm's succession planning and how key-person risk is identified and managed.", content: [
        "Key-person risk is shared across the three Portfolio Managers, who use the same philosophy and process, and each strategy has a designated back-up decision-maker. Succession planning is in place for the senior investment staff." ] },
    ],
  },

  {
    id: "process", title: "Investment process & philosophy",
    intro: "Investment philosophy, research and portfolio-construction approach for the product.",
    items: [
      { id: "Q3", hero: true, q: "Describe the investment philosophy as it relates to this product.",
        content: [
          "Chester's core belief is that markets are not perfectly efficient: investor biases and other market forces create exploitable gaps between share prices and intrinsic value. The team looks for three signals, summarised as Quality, Valuation and Edge",
          REF("FSC CHCF · Q13.2 (pp.2-3)", "fsc_chcf", { page: 2 }),
          ". Quality means unusually predictable cash flows, reflected in a company's ability to generate free cash flow. Valuation means a clear margin of safety. Edge means a proprietary insight from research that points to a probable earnings surprise. The relative importance of the three signals varies with the type of company, based on the predictability and cyclicality of its cash flows. For the Chester High Conviction Fund this produces a concentrated portfolio of 25 to 40 stocks drawn primarily from the S&P/ASX 300, with up to 10% in non-index (pre-IPO) names and up to 20% cash. The Fund aims to outperform the S&P/ASX 300 Accumulation Index by 5% p.a. before fees over rolling three-year periods, with expected tracking error of 5 to 10%",
          REF("FSC CHCF · Q13.7 (pp.4-8)", "fsc_chcf", { page: 4 }),
          "." ],
        image: { src: "dataroom/docs/img/qve-framework.png", caption: "Chester's Quality, Valuation and Edge framework." } },

      { id: "style", q: "Describe the overarching investment style of the strategy.", content: [
        "The Fund is high-conviction and active, with a flexible style bias. Its emphasis on free-cash-flow generation means it generally shows growth characteristics, but valuation support must be present to provide a margin of safety. Chester will also take more contrarian positions where it believes the market has mispriced a company by extrapolating a weak near-term outlook." ] },

      { id: "research", q: "Describe the research process and approach to idea generation.",
        content: [
          "Research is done in-house, drawing on Chester's proprietary company financial models. The investable universe is ASX-listed or soon-to-be-listed companies, focused on the largest 300 by market capitalisation, with up to 10% in pre-IPO names expected to list within 12 months and 0 to 20% cash. Long-term thematic and sector trends, for example AI, the energy transition, demographic change and fiscal stress, focus the research effort rather than set portfolio weights, and every idea still requires bottom-up validation, valuation support and a company-specific insight. Companies are grouped by economic characteristics, predictable cash generators (around 60 to 65%), cyclicals (around 15 to 25%) and defensives, rather than by GICS sector. The process narrows a universe of 300-plus stocks to a watch list of roughly 70 to 90, and a final portfolio of 25 to 40." ],
        image: { src: "dataroom/docs/img/research-funnel.png", caption: "From the investable universe to the portfolio." } },

      { id: "sizing", q: "Describe the approach to position sizing and portfolio construction.",
        content: [
          "The portfolio holds 25 to 40 stocks, sized by conviction rather than by benchmark weight. When a holding's weight moves 50 basis points away from its model-portfolio target, that triggers a review of the position. A strict buy discipline and an active sell discipline keep positions under continual challenge; the small, focused team maintains daily dialogue so existing holdings are reviewed against the original thesis. Analysts prepare downside as well as upside scenarios in their models, and a position that falls materially is re-underwritten",
          REF("FSC CHCF · Q13.7 (pp.4-8)", "fsc_chcf", { page: 4 }),
          "." ],
        image: { src: "dataroom/docs/img/buy-sell-discipline.png", caption: "Buy and sell discipline." } },

      { id: "benchmark_aware", q: "Is the strategy benchmark-aware? Please explain how the benchmark is used in constructing the portfolio.", content: [
        "The strategy is benchmark-unaware, with no targeted sector weightings. The S&P/ASX 300 is used to measure performance, not to constrain how the portfolio is built." ] },
    ],
  },

  {
    id: "performance", title: "Performance & Portfolio",
    intro: "Benchmark, objectives, fees and capacity for the product.",
    items: [
      { id: "perf_benchmark", q: "State the performance benchmark for the strategy.", content: ["S&P/ASX 300 Accumulation Index."] },
      { id: "return_obj", q: "State the return objective for the strategy.", content: [
        "To outperform the S&P/ASX 300 Accumulation Index by 5% p.a. before fees over rolling three-year periods",
        REF("FSC CHCF · Q13.4 (p.3)", "fsc_chcf", { page: 3 }), "." ] },
      { id: "risk_obj", q: "State the risk objective for the strategy, including any expected tracking error.", content: [
        "There is no separate risk objective. The Fund is built for investors who want to grow capital while preserving it, with expected tracking error of 5 to 10%." ] },
      { id: "fees", q: "Provide the fee structure for the product, including management and performance fees.", content: [
        "The base management fee is 0.95% p.a. A performance fee of 15% applies to returns above the benchmark, accrued daily and paid quarterly, subject to a high-water mark. Over the past five years the performance fee has averaged about 0.45% p.a." ] },
      { id: "capacity", input: "validation", q: "State the estimated capacity of the strategy and the date it was last reviewed.", content: [
        "Estimated capacity for the retail strategy is about A$2.9 billion. Capacity was last reviewed in March 2026." ],
        flagInfo: {
          type: "validation", title: "Confirm capacity figure",
          copy: "Capacity of about A$2.9bn (retail) was last reviewed in March 2026. Confirm it is still current for this response, or update it.",
          suggestedNote: "Confirmed current: capacity about A$2.9bn (retail), reviewed March 2026",
        } },
      { id: "derivatives", q: "Describe the use of derivatives within the strategy and whether the portfolio is geared.", content: [
        "The Fund does not use derivatives and is not geared." ] },
    ],
  },

  {
    id: "operations", title: "Operations & Risk",
    intro: "Insurance, service providers, risk controls and continuity.",
    items: [
      { id: "Q4", hero: true, flag: "info", q: "Provide a current certificate of currency for each policy of insurance held by the manager.",
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

      { id: "providers", q: "List the key service providers to the fund, including the Responsible Entity, custodian, administrator and auditor.", content: [
        "Responsible Entity: Copia Investment Partners Ltd. Custodian: State Street (master custodian) with HSBC as sub-custodian. Fund auditor: EY." ] },

      { id: "risk_controls", q: "Describe the risk controls and oversight framework in place across the portfolio.", content: [
        "Risk is managed through stock, sector and cash limits, with no leverage. Portfolio risk and compliance are overseen by Copia's risk and compliance function, separately from the investment team. Stress tests and scenario analysis are run on the portfolio periodically." ] },

      { id: "bcp", q: "Describe the firm's business continuity and disaster recovery arrangements.", content: [
        "Chester maintains a documented business continuity and disaster recovery plan as part of its policy framework",
        REF("BCP & DR Plan", "pol_bcp"),
        "." ] },
    ],
  },
];

// Flat helpers
const DD_ALL_ITEMS = DD_SECTIONS.flatMap(s => s.items.map(it => ({ ...it, sectionId: s.id, sectionTitle: s.title })));
const DD_REVIEW_ITEMS = DD_ALL_ITEMS.filter(it => it.flagInfo);
const DD_ITEM_COUNT = DD_ALL_ITEMS.length;

window.KB_DOCS = KB_DOCS;
window.CHUBB_KB_DOC = CHUBB_KB_DOC;
window.KB_FREEFORM = KB_FREEFORM;
window.SHEET_SNIPPETS = SHEET_SNIPPETS;
window.DOC_SNIPPETS = DOC_SNIPPETS;
window.DATAROOMS_SEED = DATAROOMS_SEED;
window.DD_META = DD_META;
window.DD_SECTIONS = DD_SECTIONS;
window.DD_ALL_ITEMS = DD_ALL_ITEMS;
window.DD_REVIEW_ITEMS = DD_REVIEW_ITEMS;
window.DD_ITEM_COUNT = DD_ITEM_COUNT;
window.DD_EXPORT_PDF = DD_EXPORT_PDF;
