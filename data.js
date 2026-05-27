// ============================================================
// Othello — single source of truth: data, forms, timings, scripts
// ============================================================
//
// Field statuses:
//   "verified"  (green)  — green check, source confirmed
//   "review"    (amber)  — AI-extracted, needs human verification
//   "stale"     (amber)  — was verified, but expiring soon
//   "missing"   (red)
//   "conflict"  (red)    — value differs between sources
//   "failed"    (red)    — validation failure (e.g. TFN checksum)

const TIMING_MULTIPLIER_DEFAULT = 1.0;

// ---------------------------------------------------------------
// Field dictionary — definitions used across forms
// ---------------------------------------------------------------
const FIELD_DEFS = {
  "investor.given_names":         { label: "Given names",          category: "Identity", aml: true,  type: "text",                   source: "Photo ID",        note: "Legal first/middle names exactly as on the ID; don't include surname." },
  "investor.surname":             { label: "Surname",              category: "Identity", aml: true,  type: "text",                   source: "Photo ID",        note: "Family name as printed on the ID." },
  "investor.dob":                 { label: "Date of birth",        category: "Identity", aml: true,  type: "date dd/mm/yyyy; age \u2265 18", source: "Photo ID", note: "DOB from the ID; ignore the document's own issue/expiry dates." },
  "investor.occupation":          { label: "Occupation",           category: "Identity", aml: true,  type: "text",                   source: "CRM / client",    note: "Current occupation; if absent, raise an outstanding action to the adviser." },
  "investor.tfn":                 { label: "Tax File Number",      category: "Tax",      aml: false, type: "9-digit, masked; TFN checksum", source: "Client input", note: "9-digit TFN; may be exempt — capture the exemption code instead if provided." },
  "investor.foreign_tax_resident":{ label: "Foreign tax resident?",category: "Tax",      aml: true,  type: "boolean",                source: "Client input",    note: "Yes/No; if Yes, trigger the FATCA/CRS self-cert and its TIN fields." },
  "investor.residential_address": { label: "Residential address",  category: "Identity", aml: true,  type: "structured; no PO Box",  source: "Photo ID / CRM",  note: "Current residential address; PO Box is not acceptable for this field." },
  "investor.email":               { label: "Email",                category: "Identity", aml: false, type: "email",                  source: "CRM",             note: "Primary contact email from the CRM." },
  "investor.phone":               { label: "Phone",                category: "Identity", aml: false, type: "phone",                  source: "CRM",             note: "Mobile preferred; landline acceptable." },
  "investor.id_type":             { label: "ID document type",     category: "Identity", aml: true,  type: "enum",                   source: "Photo ID",        note: "Driver's licence, passport, or other accepted Australian photo ID." },
  "investor.id_number":           { label: "ID number",            category: "Identity", aml: true,  type: "text",                   source: "Photo ID",        note: "Document number printed on the ID." },
  "investor.id_expiry":           { label: "ID expiry",            category: "Identity", aml: true,  type: "date",                   source: "Photo ID",        note: "Document expiry date; raise renewal if within 60 days." },
  "investor.dvs_verified":        { label: "DVS verification",     category: "Identity", aml: true,  type: "boolean",                source: "DVS",             note: "Document Verification Service confirmation of identity." },

  "entity.type":                  { label: "Entity type",          category: "Entity",   aml: true,  type: "enum",                   source: "CRM",             note: "Individual, Joint, Trust, Company, SMSF." },
  "entity.name":                  { label: "Entity name",          category: "Entity",   aml: true,  type: "text",                   source: "Trust deed",      note: "Legal name as it appears on the constitutive document." },
  "entity.abn":                   { label: "ABN",                  category: "Entity",   aml: false, type: "11-digit; ABR lookup",   source: "Trust deed / ABR",note: "11-digit Australian Business Number." },
  "entity.trustee":               { label: "Trustee",              category: "Entity",   aml: true,  type: "text",                   source: "Trust deed",      note: "Named trustee(s) as listed in the deed." },
  "entity.trust_date":            { label: "Date trust established",category: "Entity",  aml: true,  type: "date",                   source: "Trust deed",      note: "From the constitutive document." },

  "bank.institution":             { label: "Financial institution",category: "Banking",  aml: false, type: "text",                   source: "Bank statement",  note: "Bank/ADI name from a statement header." },
  "bank.bsb":                     { label: "BSB",                  category: "Banking",  aml: false, type: "6-digit; BSB lookup",    source: "Bank statement",  note: "6-digit BSB; validate against the BSB register." },
  "bank.account_no":              { label: "Account number",       category: "Banking",  aml: false, type: "6\u201310 digit",        source: "Bank statement",  note: "Account number; must belong to the investor — flag if the name differs." },
  "bank.account_name":            { label: "Account name",         category: "Banking",  aml: false, type: "text",                   source: "Bank statement",  note: "Name as printed on the account; must match the investor." },

  "investment.amount":            { label: "Investment amount",    category: "Investment",aml: false, type: "currency AUD; \u2265 $25,000", source: "Adviser instruction", note: "Initial investment; enforce the fund's $25,000 minimum; numeric only." },
  "investment.product":           { label: "Product / fund",       category: "Investment",aml: false, type: "enum",                   source: "Adviser instruction", note: "Which fund the client is being onboarded into." },
  "investment.platform":          { label: "Platform",             category: "Investment",aml: false, type: "enum",                   source: "Adviser instruction", note: "Hub24, Netwealth, Macquarie Wrap, Praemium, or direct." },
  "investment.risk_ack":          { label: "Risk acknowledgement", category: "Investment",aml: false, type: "boolean (signed)",       source: "Client signature", note: "Must be ticked/signed before lodgement; never auto-set." },
  "investment.distribution_pref": { label: "Distribution preference",category: "Investment",aml: false, type: "enum",                source: "Adviser instruction", note: "Reinvest or pay to nominated account." },

  "adviser.name":                 { label: "Adviser name",         category: "Adviser",  aml: false, type: "text",                   source: "CRM",             note: "Assigned adviser." },
  "adviser.afsl":                 { label: "AFSL number",          category: "Adviser",  aml: false, type: "text",                   source: "CRM",             note: "Australian Financial Services Licence number." },

  // FATCA/CRS specific
  "investor.tin_country":         { label: "Country of tax residence (other)", category: "Tax", aml: true, type: "country code",  source: "Client input",    note: "ISO country code where the investor is also a tax resident." },
  "investor.foreign_tin":         { label: "Foreign tax identification number", category: "Tax", aml: true, type: "text",          source: "Client input",    note: "Foreign tax ID issued by the country named above; if no TIN issued, capture the reason." },

  // Wholesale certificate specific
  "wholesale.accountant_name":    { label: "Certifying accountant",  category: "Adviser",  aml: false, type: "text",                source: "Wholesale certificate", note: "Name and firm of the qualified accountant who certified eligibility." },
  "wholesale.cert_expiry":        { label: "Certificate expiry",     category: "Adviser",  aml: false, type: "date",                source: "Wholesale certificate", note: "24 months from certification date; drives expiry monitoring." },

  // Direct debit specific
  "bank.debit_authority":         { label: "Direct debit authority", category: "Banking",  aml: false, type: "boolean (signed)",   source: "Client signature",      note: "Signed authority to debit the nominated account; must be wet-signed or e-signed." },
};

// ---------------------------------------------------------------
// Form catalogue
// ---------------------------------------------------------------
const FORMS = {
  fortlake_application: {
    id: "fortlake_application",
    title: "Fortlake Real-Income Fund — Application",
    short: "Fortlake Application",
    description: "New-investor application for the Fortlake Real-Income managed fund: identity, tax residency, bank and investment details.",
    category: "Fund applications",
    status: "live",
    source: "Mapped from Fortlake_Application.pdf · approved 12 May by R. Lee",
    lastUpdated: "12 May 2026",
    sourcePlatform: "Fortlake",
    sections: [
      { title: "Section 3 — Individual investor details", fields: ["investor.given_names","investor.surname","investor.dob","investor.occupation","investor.tfn","investor.foreign_tax_resident","investor.residential_address"] },
      { title: "Section 4 — Identification", fields: ["investor.id_type","investor.id_number","investor.id_expiry","investor.dvs_verified"] },
      { title: "Section 7 — Bank account details", fields: ["bank.institution","bank.bsb","bank.account_no","bank.account_name"] },
      { title: "Section 10 — Investment allocation", fields: ["investment.amount","investment.product","investment.distribution_pref","investment.risk_ack"] },
      { title: "Section 12 — Adviser details", fields: ["adviser.name","adviser.afsl"] },
    ],
  },
  fatca_crs: {
    id: "fatca_crs",
    title: "FATCA / CRS Self-Certification",
    short: "FATCA / CRS",
    description: "Foreign tax-residency declaration, required where the investor is a tax resident outside Australia.",
    category: "Identity & AML",
    status: "live",
    source: "Mapped from FATCA_CRS_v3.pdf · approved 04 Mar by R. Lee",
    lastUpdated: "04 Mar 2026",
    sourcePlatform: "ATO",
    sections: [
      { title: "Section 1 — Investor", fields: ["investor.given_names","investor.surname","investor.dob","investor.residential_address"] },
      { title: "Section 2 — Tax residency", fields: ["investor.foreign_tax_resident","investor.tfn","investor.tin_country","investor.foreign_tin"] },
    ],
  },
  wholesale_cert: {
    id: "wholesale_cert",
    title: "Wholesale / Sophisticated Investor Certificate",
    short: "Wholesale Certificate",
    description: "Accountant-certified eligibility for wholesale offers; time-limited (24 months) — drives expiry monitoring.",
    category: "Identity & AML",
    status: "live",
    source: "Mapped from Wholesale_Cert_template.pdf · approved 28 Feb by R. Lee",
    lastUpdated: "28 Feb 2026",
    sourcePlatform: "—",
    sections: [
      { title: "Investor", fields: ["investor.given_names","investor.surname","investor.residential_address"] },
      { title: "Accountant declaration", fields: ["wholesale.accountant_name","wholesale.cert_expiry"] },
    ],
  },
  hub24_application: {
    id: "hub24_application",
    title: "Hub24 Account Application",
    short: "Hub24 Application",
    description: "Platform account opening for the investment wrap: account holders, designation and adviser details.",
    category: "Platform",
    status: "live",
    source: "Mapped from Hub24_Acct_App.pdf · approved 21 Apr by R. Lee",
    lastUpdated: "21 Apr 2026",
    sourcePlatform: "Hub24",
    sections: [
      { title: "Account holder", fields: ["investor.given_names","investor.surname","investor.dob","investor.residential_address","investor.tfn"] },
      { title: "Designation", fields: ["entity.type","entity.name","entity.abn"] },
      { title: "Adviser", fields: ["adviser.name","adviser.afsl"] },
    ],
  },
  ewm_direct_debit: {
    id: "ewm_direct_debit",
    title: "EWM Direct Debit Request",
    short: "Direct Debit Request",
    description: "Authorises the fund to debit the nominated bank account for the investment.",
    category: "Banking",
    status: "review",        // <-- mapping-in-review
    confirmedCount: 8,
    totalCount: 9,
    source: "Proposed from EWM_DD_Request_v2.pdf · pending approval",
    lastUpdated: "today",
    sourcePlatform: "EWM",
    sections: [
      { title: "Authorisation", fields: ["investor.given_names","investor.surname","investor.residential_address","bank.institution","bank.bsb","bank.account_no","bank.account_name","investment.amount","bank.debit_authority"] },
    ],
  },
};

// ---------------------------------------------------------------
// Smith hero client — fields, with starting values (post-CRM arrival)
// Updates flow through reducer; initial state is "just arrived from CRM"
// ---------------------------------------------------------------
const SMITH_INITIAL_FIELDS = {
  "investor.given_names":          { value: "—", status: "missing", source: "—" },
  "investor.surname":              { value: "—", status: "missing", source: "—" },
  "investor.dob":                  { value: "—", status: "missing", source: "—" },
  "investor.occupation":           { value: "—", status: "missing", source: "—" },
  "investor.tfn":                  { value: "—", status: "missing", source: "—" },
  "investor.foreign_tax_resident": { value: "—", status: "missing", source: "—" },
  "investor.residential_address":  { value: "—", status: "missing", source: "—" },
  "investor.email":                { value: "—", status: "missing", source: "—" },
  "investor.phone":                { value: "—", status: "missing", source: "—" },
  "investor.id_type":              { value: "—", status: "missing", source: "—" },
  "investor.id_number":            { value: "—", status: "missing", source: "—" },
  "investor.id_expiry":            { value: "—", status: "missing", source: "—" },
  "investor.dvs_verified":         { value: "—", status: "missing", source: "—" },

  "entity.type":                   { value: "—", status: "missing", source: "—" },
  "entity.name":                   { value: "—", status: "missing", source: "—" },
  "entity.abn":                    { value: "—", status: "missing", source: "—" },
  "entity.trustee":                { value: "—", status: "missing", source: "—" },
  "entity.trust_date":             { value: "—", status: "missing", source: "—" },

  "bank.institution":              { value: "—", status: "missing", source: "—" },
  "bank.bsb":                      { value: "—", status: "missing", source: "—" },
  "bank.account_no":               { value: "—", status: "missing", source: "—" },
  "bank.account_name":             { value: "—", status: "missing", source: "—" },

  "investment.amount":             { value: "—", status: "missing", source: "—" },
  "investment.product":            { value: "—", status: "missing", source: "—" },
  "investment.platform":           { value: "—", status: "missing", source: "—" },
  "investment.risk_ack":           { value: "—", status: "missing", source: "—" },
  "investment.distribution_pref":  { value: "—", status: "missing", source: "—" },

  "adviser.name":                  { value: "—", status: "missing", source: "—" },
  "adviser.afsl":                  { value: "—", status: "missing", source: "—" },
};

// the required-for-fortlake set
const FORTLAKE_REQUIRED = [
  "investor.given_names","investor.surname","investor.dob","investor.occupation","investor.tfn","investor.foreign_tax_resident","investor.residential_address",
  "investor.id_type","investor.id_number","investor.id_expiry","investor.dvs_verified",
  "bank.institution","bank.bsb","bank.account_no","bank.account_name",
  "investment.amount","investment.product","investment.distribution_pref","investment.risk_ack",
  "adviser.name","adviser.afsl",
];

// ---------------------------------------------------------------
// Smith shell — NOT seeded into the client list. The demo's
// new_client_smith event dispatches ADD_CLIENT with this shape, so
// the client only exists once the demo brings them into being.
// ---------------------------------------------------------------
const SMITH_SHELL = {
  id: "smith",
  name: "Smith Family Trust",
  entityType: "Trust",
  members: ["John Smith — individual & trustee","Margaret Smith — individual & trustee","Smith Family Trust — investing entity"],
  accounts: ["Hub24 \u00b7 Trust account"],
  onboardingTo: {
    product: "Fortlake Real-Income Fund",
    productType: "wholesale managed fund",
    route: "Hub24",
    amount: "AUD 250,000",
    support: "wholesale, no advice",
  },
  adviser: "C. Halford",
  status: "needs",
  lastActivity: "just now",
  fields: SMITH_INITIAL_FIELDS,
  forms: [],
  documents: [],
  activity: [],
};

// ---------------------------------------------------------------
// Seed clients (list) — Smith is added by the demo, not seeded
// ---------------------------------------------------------------
const SEED_CLIENTS = [
  {
    id: "nguyen",
    name: "Nguyen Super Fund (SMSF)",
    entityType: "SMSF",
    members: ["Linh Nguyen — trustee","Mai Nguyen — trustee","Nguyen Super Fund — investing entity"],
    accounts: ["Hub24 \u00b7 SMSF account","Fortlake holding"],
    onboardingTo: { product: "Fortlake Real-Income Fund + Hub24 account", productType: "wholesale fund + platform", route: "Hub24", amount: "AUD 480,000", support: "wholesale, no advice" },
    adviser: "S. Patel",
    status: "in_progress",
    lastActivity: "12m ago",
    fields: {},   // not interactive; presented only via the list and overview
    forms: [
      { formId: "fortlake_application", status: "awaiting" },
      { formId: "hub24_application", status: "awaiting" },
    ],
    documents: [],
    activity: [
      { time: "12m ago", actor: "System", desc: "Bank statement uploaded · extracting BSB and account number" },
    ],
    readinessSummary: "9 of 16 ready",
  },
  {
    id: "okafor",
    name: "Okafor, David",
    entityType: "Individual",
    members: ["David Okafor — individual"],
    accounts: ["Netwealth \u00b7 wholesale offer"],
    onboardingTo: { product: "Aurum Wholesale Opportunity Fund", productType: "wholesale offer", route: "Netwealth", amount: "AUD 320,000", support: "wholesale, no advice" },
    adviser: "C. Halford",
    status: "needs",
    lastActivity: "3h ago",
    fields: {},
    forms: [
      { formId: "wholesale_cert", status: "blocked", note: "Certificate expired 4 days ago" },
    ],
    documents: [
      { id: "wholesale_cert_old", name: "Wholesale_Cert_2024.pdf", type: "Wholesale Certificate", source: "Uploaded", added: "23 months ago", expiry: { date: "23/05/2026", daysAway: -4, status: "expired" } },
    ],
    activity: [
      { time: "4d ago", actor: "System", desc: "Wholesale certificate expired · application blocked" },
    ],
    readinessSummary: "Certificate expired",
  },
  {
    id: "brennan",
    name: "Brennan Family Trust",
    entityType: "Trust",
    members: ["Aoife Brennan — trustee","Brennan Family Trust"],
    accounts: ["Macquarie CMA"],
    onboardingTo: { product: "Macquarie Cash Management Account", productType: "cash account", route: "Macquarie", amount: "AUD 600,000", support: "personal advice" },
    adviser: "S. Patel",
    status: "in_progress",
    lastActivity: "1d ago",
    fields: {},
    forms: [],
    documents: [],
    activity: [
      { time: "1d ago", actor: "System", desc: "Renewal request emailed to client · awaiting reply" },
    ],
    readinessSummary: "Awaiting client reply",
  },
  {
    id: "whitlam",
    name: "Whitlam, Eleanor",
    entityType: "Individual",
    members: ["Eleanor Whitlam — individual"],
    accounts: ["Hub24"],
    onboardingTo: { product: "Fortlake Real-Income Fund", productType: "wholesale managed fund", route: "Hub24", amount: "AUD 150,000", support: "wholesale, no advice" },
    adviser: "C. Halford",
    status: "done",
    lastActivity: "8d ago",
    fields: {},
    forms: [],
    documents: [],
    activity: [
      { time: "8d ago", actor: "System", desc: "Confirmation received from Hub24 · ref HUB-48104 · filed" },
    ],
    readinessSummary: "Completed",
  },
  {
    id: "costa",
    name: "Costa Holdings Pty Ltd",
    entityType: "Company",
    members: ["Costa Holdings Pty Ltd — investing entity"],
    accounts: ["Netwealth wrap"],
    onboardingTo: { product: "Netwealth wrap account", productType: "platform", route: "Netwealth", amount: "AUD 1,250,000", support: "personal advice" },
    adviser: "S. Patel",
    status: "done",
    lastActivity: "14d ago",
    fields: {},
    forms: [],
    documents: [],
    activity: [
      { time: "14d ago", actor: "System", desc: "Confirmation received from Netwealth · filed" },
    ],
    readinessSummary: "Completed",
  },
];

// ---------------------------------------------------------------
// Processing-state durations (ms) — single multiplier applied
// ---------------------------------------------------------------
const TIMINGS = {
  classify: 800,
  extract: 2500,
  match: 1500,
  validate: 1200,
  crosscheck: 1000,
  updateChecklist: 500,
  dvsConfirm: 700,
  dvsReturn: 800,
  package: 800,
  dispatch: 1200,
  awaitConfirm: 1500,
  syncRecord: 800,
  mapUpdate: 1000,
  draftChase: 1000,
  send: 800,
  chatSearch: 600,
  chatRead: 1200,
  chatCompose: 800,
};

// ---------------------------------------------------------------
// Scripted chat answers for the hero client (Smith)
// ---------------------------------------------------------------
const CHAT_SUGGESTIONS_DEFAULT = [
  "What's still outstanding?",
  "When does their ID expire?",
  "What's the ABN on the trust deed?",
  "What's the investment amount?",
];

const CHAT_SCRIPTED = {
  smith: {
    "what's still outstanding?": {
      answer: "Three required fields are still outstanding for the Smith Family Trust:\n\n1. Tax residency answer — needed for AML\n2. Occupation — not on file\n3. Bank account details (institution, BSB, account number)\n\nThe Fortlake application can't move to Ready for review until those clear.",
      source: "Smith Family Trust · checklist (live)",
    },
    "when does their id expire?": {
      answer: "John Smith's Australian driver's licence expires on 14/06/2026 — that's 18 days away, so it's been flagged amber on the checklist. There's no renewal action raised yet because we're outside the 14-day chase window, but I can raise one if you'd like.",
      source: "Photo_ID_J_Smith.pdf",
    },
    "what's the abn on the trust deed?": {
      answer: "The ABN on file for the Smith Family Trust is 47 815 392 614. It was extracted from Trust Deed.pdf and matches the Dynamics record.",
      source: "Trust Deed.pdf · Dynamics",
    },
    "what's the investment amount?": {
      answer: "AUD 250,000 into the Fortlake Real-Income Fund via Hub24, distributions reinvested. This is from the adviser brief — C. Halford, 22 May 2026.",
      source: "Adviser brief · 22 May 2026",
    },
    "who's the trustee?": {
      answer: "John and Margaret Smith are jointly named as trustees of the Smith Family Trust in the constitutive deed dated 14 June 2014.",
      source: "Trust Deed.pdf, p.2",
    },
    "what platform are they going on?": {
      answer: "Hub24 — they're being onboarded into the Fortlake Real-Income Fund via the Hub24 wrap, on a wholesale (no advice) basis.",
      source: "Adviser brief",
    },
  },
};

// ---------------------------------------------------------------
// Overview metrics & compliance
// ---------------------------------------------------------------
const OVERVIEW_METRICS = {
  formsProcessed: { value: 312, unit: "this month", delta: "+24%", sparkline: [180,205,212,235,260,278,295,312] },
  hoursSaved:     { value: 480, unit: "hrs",        delta: "+18%", sparkline: [310,340,360,400,420,440,460,480] },
  fteDisplaced:   { value: 3.5, unit: "FTE",        delta: "+0.4", sparkline: [2.4,2.7,2.9,3.0,3.2,3.3,3.4,3.5] },
  cycleTime:      { value: 1.4, unit: "days",       delta: "−9.6 days", sparkline: [11,9,7,5,3.2,2.4,1.8,1.4], down: false },
};

const COMPLIANCE_SEED = [
  { clientId: "okafor",  client: "Okafor, David", document: "Wholesale Certificate", state: "Expired", daysText: "4 days overdue", severity: "missing" },
  { clientId: "brennan", client: "Brennan Family Trust", document: "Photo ID (Aoife Brennan)", state: "Expiring", daysText: "11 days", severity: "attention" },
];

// ---------------------------------------------------------------
// Source integrations
// ---------------------------------------------------------------
const SOURCES = [
  { cat: "CRM", name: "Microsoft Dynamics", state: "connected", scope: "Contacts, accounts, activities", lastSync: "4m ago" },
  { cat: "CRM", name: "Fin365", state: "available" },
  { cat: "Document storage", name: "SharePoint", state: "connected", scope: "Client document libraries", lastSync: "9m ago" },
  { cat: "Document storage", name: "OneDrive", state: "available" },
  { cat: "Identity & verification", name: "Document Verification Service (DVS)", state: "connected", scope: "ID verification results", lastSync: "22m ago" },
  { cat: "Identity & verification", name: "Digital onboarding", state: "available" },
  { cat: "Investment platforms", name: "Hub24", state: "available" },
  { cat: "Investment platforms", name: "Netwealth", state: "available" },
  { cat: "Investment platforms", name: "Macquarie Wrap", state: "available" },
  { cat: "Investment platforms", name: "Praemium", state: "available" },
  { cat: "Email / notifications", name: "Microsoft 365", state: "connected", scope: "Send client requests, capture replies", lastSync: "1m ago" },
];

// expose globally
Object.assign(window, {
  FIELD_DEFS, FORMS, SMITH_INITIAL_FIELDS, SMITH_SHELL, FORTLAKE_REQUIRED, SEED_CLIENTS,
  TIMINGS, TIMING_MULTIPLIER_DEFAULT, CHAT_SUGGESTIONS_DEFAULT, CHAT_SCRIPTED,
  OVERVIEW_METRICS, COMPLIANCE_SEED, SOURCES,
});
