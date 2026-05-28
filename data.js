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
    source: "Mapped from Fortlake_Application.pdf · approved 12 May by Rachel Lee",
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
    source: "Mapped from FATCA_CRS_v3.pdf · approved 04 Mar by Rachel Lee",
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
    source: "Mapped from Wholesale_Cert_template.pdf · approved 28 Feb by Rachel Lee",
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
    source: "Mapped from Hub24_Acct_App.pdf · approved 21 Apr by Rachel Lee",
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
  netwealth_wrap: {
    id: "netwealth_wrap",
    title: "Netwealth Wrap Account — Application",
    short: "Netwealth Wrap Application",
    description: "Platform wrap account opening: account holder, banking, investment and adviser details.",
    category: "Platform",
    status: "live",
    source: "Mapped from Netwealth_Wrap_App.pdf · approved 18 Apr by Rachel Lee",
    lastUpdated: "18 Apr 2026",
    sourcePlatform: "Netwealth",
    sections: [
      { title: "Account holder", fields: ["entity.type","entity.name","entity.abn","entity.trustee"] },
      { title: "Authorised signatory", fields: ["investor.given_names","investor.surname","investor.dob","investor.residential_address"] },
      { title: "Bank account", fields: ["bank.institution","bank.bsb","bank.account_no","bank.account_name"] },
      { title: "Investment", fields: ["investment.amount","investment.product"] },
      { title: "Adviser", fields: ["adviser.name","adviser.afsl"] },
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
  // onboardingTo starts empty \u2014 populated by SCRIPTS.adviser_instruction so
  // step 2 ("Adviser brief received") has something visible to do.
  onboardingTo: { product: null, productType: null, route: null, amount: null, support: null },
  adviser: "Catherine Halford",
  status: "needs",
  lastActivity: "just now",
  fields: SMITH_INITIAL_FIELDS,
  forms: [],
  documents: [],
  activity: [],
  aiSequences: [],
};

// ---------------------------------------------------------------
// Seed clients (list) — Smith is added by the demo, not seeded
// ---------------------------------------------------------------
const SEED_CLIENTS = [
  // ---- Nguyen — in-flight SMSF, bank statement just landed (review state)
  {
    id: "nguyen",
    name: "Nguyen Super Fund (SMSF)",
    entityType: "SMSF",
    members: ["Linh Nguyen — trustee","Mai Nguyen — trustee","Nguyen Super Fund — investing entity"],
    accounts: ["Hub24 \u00b7 SMSF account","Fortlake holding"],
    onboardingTo: { product: "Fortlake Real-Income Fund + Hub24 account", productType: "wholesale fund + platform", route: "Hub24", amount: "AUD 480,000", support: "wholesale, no advice" },
    adviser: "Sanjay Patel",
    status: "in_progress",
    lastActivity: "12m ago",
    fields: {
      "investor.given_names":          { value: "Linh Tuan", status: "verified", source: "DVS \u00b7 26/05/2026" },
      "investor.surname":              { value: "Nguyen", status: "verified", source: "DVS \u00b7 26/05/2026" },
      "investor.dob":                  { value: "23/03/1965", status: "verified", source: "DVS \u00b7 26/05/2026" },
      "investor.occupation":           { value: "Engineering Manager", status: "verified", source: "Dynamics" },
      "investor.tfn":                  { value: "412 \u2022\u2022\u2022 765", status: "verified", source: "Client input \u00b7 checksum OK" },
      "investor.foreign_tax_resident": { value: "No", status: "verified", source: "Client input" },
      "investor.residential_address":  { value: "14 Brunswick Rd, Brunswick VIC 3056", status: "verified", source: "DVS / Dynamics" },
      "investor.email":                { value: "l.nguyen@nguyensuper.example", status: "verified", source: "Dynamics" },
      "investor.phone":                { value: "+61 4\u2022\u2022 \u2022\u2022\u2022 217", status: "verified", source: "Dynamics" },
      "investor.id_type":              { value: "Driver\u2019s licence (VIC)", status: "verified", source: "Photo_ID_L_Nguyen.pdf" },
      "investor.id_number":            { value: "082 491 776", status: "verified", source: "Photo_ID_L_Nguyen.pdf" },
      "investor.id_expiry":            { value: "07/11/2027", status: "verified", source: "Photo_ID_L_Nguyen.pdf" },
      "investor.dvs_verified":         { value: "Yes (26/05/2026)", status: "verified", source: "DVS" },
      "entity.type":                   { value: "SMSF", status: "verified", source: "Dynamics" },
      "entity.name":                   { value: "Nguyen Super Fund", status: "verified", source: "Trust_Deed_Nguyen.pdf \u00b7 p.1" },
      "entity.abn":                    { value: "26 481 029 374", status: "verified", source: "Trust_Deed_Nguyen.pdf \u00b7 ABR match" },
      "entity.trustee":                { value: "Linh T. Nguyen, Mai Nguyen", status: "verified", source: "Trust_Deed_Nguyen.pdf \u00b7 p.2" },
      "entity.trust_date":             { value: "08/03/2018", status: "verified", source: "Trust_Deed_Nguyen.pdf \u00b7 p.1" },
      "bank.institution":              { value: "Westpac", status: "review", source: "Bank_Statement_Westpac.pdf \u00b7 header (0.92)", confidence: 0.92 },
      "bank.bsb":                      { value: "033 089", status: "review", source: "Bank_Statement_Westpac.pdf \u00b7 BSB register match (0.92)", confidence: 0.92 },
      "bank.account_no":               { value: "\u2022\u2022\u2022\u2022 9067", status: "review", source: "Bank_Statement_Westpac.pdf \u00b7 0.78 (low confidence)", confidence: 0.78 },
      "bank.account_name":             { value: "Nguyen Super Fund — ATF Nguyen Super Fund", status: "review", source: "Bank_Statement_Westpac.pdf \u00b7 95% match to entity", confidence: 0.95 },
      "investment.amount":             { value: "AUD 480,000", status: "verified", source: "Adviser brief \u00b7 25 May 2026" },
      "investment.product":            { value: "Fortlake Real-Income Fund", status: "verified", source: "Adviser brief" },
      "investment.platform":           { value: "Hub24", status: "verified", source: "Adviser brief" },
      "investment.risk_ack":           { value: "\u2014", status: "missing", source: "\u2014" },
      "investment.distribution_pref":  { value: "Reinvest", status: "verified", source: "Adviser brief" },
      "adviser.name":                  { value: "Sanjay Patel", status: "verified", source: "Dynamics" },
      "adviser.afsl":                  { value: "324 178", status: "verified", source: "Dynamics" },
    },
    forms: [
      { formId: "fortlake_application", status: "awaiting" },
      { formId: "hub24_application", status: "awaiting" },
    ],
    documents: [
      { id: "trust_deed_nguyen", name: "Trust_Deed_Nguyen_Super.pdf", type: "Trust Deed", source: "SharePoint", added: "3d ago", expiry: null },
      { id: "photo_id_l_nguyen", name: "Photo_ID_L_Nguyen.pdf", type: "Photo ID (Driver\u2019s licence)", source: "Uploaded", added: "2d ago", expiry: { date: "07/11/2027", daysAway: 528, status: "ok" } },
      { id: "photo_id_m_nguyen", name: "Photo_ID_M_Nguyen.pdf", type: "Photo ID (Driver\u2019s licence)", source: "Uploaded", added: "2d ago", expiry: { date: "14/02/2028", daysAway: 627, status: "ok" } },
      { id: "bank_stmt_nguyen", name: "Bank_Statement_Westpac_May26.pdf", type: "Bank Statement", source: "SharePoint", added: "12m ago", expiry: null },
    ],
    activity: [
      { time: "3d ago", actor: "Adviser \u00b7 Sanjay Patel", desc: "Apply Nguyen Super to Fortlake Real-Income via Hub24 — SMSF, $480,000 \u00b7 reinvest" },
      { time: "3d ago", actor: "System", desc: "Client added from Dynamics CRM \u00b7 SMSF entity profile pulled" },
      { time: "3d ago", actor: "System", desc: "Trust deed found on SharePoint \u00b7 5 entity fields extracted (name, ABN, trustees, establishment date)" },
      { time: "2d ago", actor: "System", desc: "Photo ID uploaded for L. Nguyen \u00b7 9 fields extracted \u00b7 awaiting DVS" },
      { time: "2d ago", actor: "System", desc: "Photo ID uploaded for M. Nguyen \u00b7 9 fields extracted \u00b7 awaiting DVS" },
      { time: "2d ago", actor: "System", desc: "DVS verification returned \u00b7 4 identity fields confirmed for L. Nguyen" },
      { time: "2d ago", actor: "System", desc: "DVS verification returned \u00b7 4 identity fields confirmed for M. Nguyen" },
      { time: "1d ago", actor: "System", desc: "TFN validated for L. Nguyen \u00b7 checksum OK" },
      { time: "12m ago", actor: "System", desc: "Bank statement uploaded \u00b7 extracting BSB and account number" },
      { time: "10m ago", actor: "System", desc: "Banking fields extracted from Westpac statement \u00b7 account number flagged low-confidence (0.78)" },
      { time: "8m ago", actor: "System", desc: "Account name fuzzy match — 95% to \u2018Nguyen Super Fund\u2019 \u00b7 flagged for review" },
    ],
    readinessSummary: "Awaiting bank verification",
  aiSequences: [
      {
        id: "nguyen_bank_extract", title: "Extracting bank statement", icon: "doc",
        state: "running", source: "Bank_Statement_Westpac_May26.pdf", startedAgo: "12m",
        summary: "4 of 5 steps \u00b7 1 field flagged low-confidence",
        steps: [
          { label: "Classify document", state: "done", evidence: "Bank statement \u00b7 Westpac format v3" },
          { label: "Extract details (OCR + AI)", state: "done", evidence: "4 banking fields extracted in 1.8s" },
          { label: "BSB register lookup", state: "done", evidence: "033 089 \u00b7 Westpac Brunswick (validated)" },
          { label: "Account name fuzzy match", state: "current", evidence: "95% match \u2018Nguyen Super Fund\u2019 vs entity \u2018Nguyen Super Fund\u2019" },
          { label: "Update checklist", state: "pending", evidence: null },
        ],
      },
      {
        id: "nguyen_dvs_linh", title: "DVS verification \u2014 L. Nguyen", icon: "shield-check",
        state: "done", source: "Photo_ID_L_Nguyen.pdf", startedAgo: "2d", completedAgo: "2d",
        summary: "4 of 4 attributes matched \u00b7 ref DVS-37214",
        steps: [
          { label: "Match given names", state: "done", evidence: "Linh Tuan \u00b7 exact" },
          { label: "Match surname", state: "done", evidence: "Nguyen \u00b7 exact" },
          { label: "Match DOB", state: "done", evidence: "23/03/1965 \u00b7 exact" },
          { label: "Match document number", state: "done", evidence: "082 491 776 \u00b7 exact" },
        ],
      },
      {
        id: "nguyen_dvs_mai", title: "DVS verification \u2014 M. Nguyen", icon: "shield-check",
        state: "done", source: "Photo_ID_M_Nguyen.pdf", startedAgo: "2d", completedAgo: "2d",
        summary: "4 of 4 attributes matched \u00b7 ref DVS-37215",
        steps: [
          { label: "Match given names", state: "done", evidence: "Mai \u00b7 exact" },
          { label: "Match surname", state: "done", evidence: "Nguyen \u00b7 exact" },
          { label: "Match DOB", state: "done", evidence: "08/12/1968 \u00b7 exact" },
          { label: "Match document number", state: "done", evidence: "114 327 802 \u00b7 exact" },
        ],
      },
      {
        id: "nguyen_deed_abr", title: "ABR lookup against trust deed", icon: "doc",
        state: "done", source: "Trust_Deed_Nguyen_Super.pdf", startedAgo: "3d", completedAgo: "3d",
        summary: "ABN 26 481 029 374 confirmed against ABR",
        steps: [
          { label: "Extract entity details", state: "done", evidence: "Name, ABN, trustees, establishment date" },
          { label: "ABR API lookup", state: "done", evidence: "26 481 029 374 \u00b7 active \u00b7 SMSF" },
          { label: "Trustee names cross-check", state: "done", evidence: "Linh T. Nguyen, Mai Nguyen \u00b7 match" },
        ],
      },
      {
        id: "nguyen_tfn_check", title: "TFN checksum validation", icon: "shield-check",
        state: "done", source: "Client input", startedAgo: "1d", completedAgo: "1d",
        summary: "412 \u2022\u2022\u2022 765 \u00b7 checksum OK",
        steps: [
          { label: "Format check (9 digits)", state: "done", evidence: "pass" },
          { label: "Modulus-11 checksum", state: "done", evidence: "computed digit matches input" },
        ],
      },
    ],
  },

  // ---- Okafor — long-standing wholesale client, certificate just expired
  {
    id: "okafor",
    name: "Okafor, David",
    entityType: "Individual",
    members: ["David Okafor — individual"],
    accounts: ["Netwealth \u00b7 wholesale offer"],
    onboardingTo: { product: "Aurum Capital \u00b7 Wholesale Opportunity Fund", productType: "wholesale offer", route: "Netwealth", amount: "AUD 320,000", support: "wholesale, no advice" },
    adviser: "Catherine Halford",
    status: "needs",
    lastActivity: "3h ago",
    fields: {
      "investor.given_names":          { value: "David Olusegun", status: "verified", source: "DVS \u00b7 23/05/2024" },
      "investor.surname":              { value: "Okafor", status: "verified", source: "DVS \u00b7 23/05/2024" },
      "investor.dob":                  { value: "11/04/1976", status: "verified", source: "DVS \u00b7 23/05/2024" },
      "investor.occupation":           { value: "Investment Banker, MD", status: "verified", source: "Dynamics" },
      "investor.tfn":                  { value: "619 \u2022\u2022\u2022 037", status: "verified", source: "Client input \u00b7 checksum OK" },
      "investor.foreign_tax_resident": { value: "No", status: "verified", source: "Client input" },
      "investor.residential_address":  { value: "Apt 4B, 18 Macleay St, Potts Point NSW 2011", status: "verified", source: "Photo ID / Dynamics" },
      "investor.email":                { value: "d.okafor@example.com", status: "verified", source: "Dynamics" },
      "investor.phone":                { value: "+61 4\u2022\u2022 \u2022\u2022\u2022 928", status: "verified", source: "Dynamics" },
      "investor.id_type":              { value: "Passport (AUS)", status: "verified", source: "Photo_ID_D_Okafor.pdf" },
      "investor.id_number":            { value: "PA8472190", status: "verified", source: "Photo_ID_D_Okafor.pdf" },
      "investor.id_expiry":            { value: "14/02/2031", status: "verified", source: "Photo_ID_D_Okafor.pdf" },
      "investor.dvs_verified":         { value: "Yes (23/05/2024)", status: "verified", source: "DVS" },
      "bank.institution":              { value: "Westpac Private", status: "verified", source: "Bank_Statement_Apr26.pdf" },
      "bank.bsb":                      { value: "033 188", status: "verified", source: "Bank_Statement_Apr26.pdf" },
      "bank.account_no":               { value: "\u2022\u2022\u2022\u2022 1075", status: "verified", source: "Bank_Statement_Apr26.pdf" },
      "bank.account_name":             { value: "D O Okafor", status: "verified", source: "Bank_Statement_Apr26.pdf" },
      "investment.amount":             { value: "AUD 320,000", status: "verified", source: "Adviser brief \u00b7 02 May 2024" },
      "investment.product":            { value: "Aurum Wholesale Opportunity Fund", status: "verified", source: "Adviser brief" },
      "investment.platform":           { value: "Netwealth", status: "verified", source: "Adviser brief" },
      "investment.risk_ack":           { value: "Acknowledged", status: "verified", source: "Client signature \u00b7 04 May 2024" },
      "investment.distribution_pref":  { value: "Reinvest", status: "verified", source: "Adviser brief" },
      "adviser.name":                  { value: "Catherine Halford", status: "verified", source: "Dynamics" },
      "adviser.afsl":                  { value: "324 178", status: "verified", source: "Dynamics" },
      "wholesale.accountant_name":     { value: "Patel & Wong Chartered Accountants", status: "verified", source: "Wholesale_Cert_2024.pdf" },
      "wholesale.cert_expiry":         { value: "23/05/2026", status: "failed", source: "Wholesale_Cert_2024.pdf \u00b7 expired 4 days ago", error: "Certificate expired — renewal required before lodgement" },
    },
    forms: [
      { formId: "wholesale_cert", status: "blocked", note: "Certificate expired 4 days ago" },
    ],
    documents: [
      { id: "wholesale_cert_old", name: "Wholesale_Cert_2024.pdf", type: "Wholesale Certificate", source: "Uploaded", added: "23 months ago", expiry: { date: "23/05/2026", daysAway: -4, status: "expired" } },
      { id: "photo_id_okafor", name: "Photo_ID_D_Okafor.pdf", type: "Photo ID (Passport)", source: "Uploaded", added: "23 months ago", expiry: { date: "14/02/2031", daysAway: 1722, status: "ok" } },
      { id: "bank_stmt_okafor", name: "Bank_Statement_WPC_Apr26.pdf", type: "Bank Statement", source: "Uploaded", added: "4 weeks ago", expiry: null },
      { id: "tax_decl_okafor", name: "Tax_Declaration_2024.pdf", type: "Tax declaration", source: "SharePoint", added: "12 months ago", expiry: null },
    ],
    activity: [
      { time: "23 months ago", actor: "Adviser \u00b7 Catherine Halford", desc: "Onboard D. Okafor to Aurum Wholesale Opportunity — wholesale via Patel & Wong cert, $320,000" },
      { time: "23 months ago", actor: "System", desc: "Photo ID uploaded \u00b7 DVS confirmed \u00b7 4 identity fields verified" },
      { time: "23 months ago", actor: "System", desc: "Wholesale certificate filed \u00b7 24-month validity \u00b7 expiry 23/05/2026" },
      { time: "23 months ago", actor: "System", desc: "Application dispatched to Netwealth \u00b7 ref NWL-31429 \u00b7 confirmed" },
      { time: "12 months ago", actor: "Catherine Halford", desc: "Annual review — wholesale status confirmed, no changes" },
      { time: "8 weeks ago", actor: "System", desc: "Wholesale certificate expiry monitor \u00b7 56 days until renewal due" },
      { time: "4 weeks ago", actor: "System", desc: "Bank statement uploaded \u00b7 4 banking fields refreshed" },
      { time: "14 days ago", actor: "System", desc: "Wholesale certificate expiry in 14 days \u00b7 auto-chase queued" },
      { time: "4d ago", actor: "System", desc: "Wholesale certificate expired \u00b7 application blocked" },
      { time: "4d ago", actor: "System", desc: "Aurum Wholesale Opportunity application paused pending cert renewal" },
      { time: "3h ago", actor: "System", desc: "Auto-chase queued \u00b7 awaiting trigger" },
    ],
    readinessSummary: "Certificate expired",
  aiSequences: [
      {
        id: "okafor_cert_monitor", title: "Wholesale certificate expiry monitor", icon: "warning",
        state: "alert", source: "Wholesale_Cert_2024.pdf", startedAgo: "23 months", completedAgo: "4d",
        summary: "Certificate expired 23/05/2026 \u00b7 application blocked",
        steps: [
          { label: "Read certification date", state: "done", evidence: "23/05/2024 \u00b7 Patel & Wong CA" },
          { label: "Compute expiry (24-month rule)", state: "done", evidence: "23/05/2026" },
          { label: "Pre-expiry chase scheduled", state: "done", evidence: "14 days before expiry" },
          { label: "Expiry reached \u2014 application blocked", state: "alert", evidence: "23/05/2026 \u00b7 4 days ago" },
        ],
      },
      {
        id: "okafor_chase_draft", title: "Renewal request \u2014 drafting email", icon: "send",
        state: "queued", source: "Microsoft 365 \u00b7 outbox", startedAgo: "4d",
        summary: "Awaiting auto-chase trigger",
        steps: [
          { label: "Identify expired item", state: "done", evidence: "Wholesale_Cert_2024.pdf" },
          { label: "Compose renewal request", state: "done", evidence: "Template: cert-renewal-v3 \u00b7 personalised" },
          { label: "Schedule send", state: "queued", evidence: "Next business day 09:00 AEDT" },
        ],
      },
      {
        id: "okafor_orig_dvs", title: "DVS verification \u2014 D. Okafor", icon: "shield-check",
        state: "done", source: "Photo_ID_D_Okafor.pdf", startedAgo: "23 months", completedAgo: "23 months",
        summary: "4 of 4 attributes matched \u00b7 ref DVS-19833",
        steps: [
          { label: "Match given names", state: "done", evidence: "David Olusegun \u00b7 exact" },
          { label: "Match surname", state: "done", evidence: "Okafor \u00b7 exact" },
          { label: "Match DOB", state: "done", evidence: "11/04/1976 \u00b7 exact" },
          { label: "Match document number", state: "done", evidence: "PA8472190 \u00b7 exact" },
        ],
      },
      {
        id: "okafor_bank_refresh", title: "Bank statement refresh", icon: "doc",
        state: "done", source: "Bank_Statement_WPC_Apr26.pdf", startedAgo: "4 weeks", completedAgo: "4 weeks",
        summary: "4 banking fields verified \u00b7 account name match",
        steps: [
          { label: "Extract banking details", state: "done", evidence: "Westpac Private \u00b7 BSB 033 188" },
          { label: "Account name match", state: "done", evidence: "D O Okafor \u00b7 100% match" },
          { label: "Update field provenance", state: "done", evidence: "4 fields refreshed" },
        ],
      },
    ],
  },

  // ---- Brennan — Photo ID renewal in flight (chase email out, awaiting reply)
  {
    id: "brennan",
    name: "Brennan Family Trust",
    entityType: "Trust",
    members: ["Aoife Brennan — trustee","Brennan Family Trust"],
    accounts: ["Macquarie CMA"],
    onboardingTo: { product: "Macquarie Cash Management Account", productType: "cash account", route: "Macquarie", amount: "AUD 600,000", support: "personal advice" },
    adviser: "Sanjay Patel",
    status: "in_progress",
    lastActivity: "1d ago",
    fields: {
      "investor.given_names":          { value: "Aoife Marie", status: "verified", source: "DVS \u00b7 12/06/2024" },
      "investor.surname":              { value: "Brennan", status: "verified", source: "DVS \u00b7 12/06/2024" },
      "investor.dob":                  { value: "17/05/1979", status: "verified", source: "DVS \u00b7 12/06/2024" },
      "investor.occupation":           { value: "Solicitor", status: "verified", source: "Dynamics" },
      "investor.tfn":                  { value: "528 \u2022\u2022\u2022 904", status: "verified", source: "Client input \u00b7 checksum OK" },
      "investor.foreign_tax_resident": { value: "No", status: "verified", source: "FATCA self-cert \u00b7 14 months ago" },
      "investor.residential_address":  { value: "5 Domain Rd, Toorak VIC 3142", status: "verified", source: "DVS / Dynamics" },
      "investor.email":                { value: "a.brennan@example.com", status: "verified", source: "Dynamics" },
      "investor.phone":                { value: "+61 4\u2022\u2022 \u2022\u2022\u2022 071", status: "verified", source: "Dynamics" },
      "investor.id_type":              { value: "Driver\u2019s licence (VIC)", status: "stale", source: "Photo_ID_A_Brennan_2022.pdf \u00b7 renewal due" },
      "investor.id_number":            { value: "078 421 553", status: "stale", source: "Photo_ID_A_Brennan_2022.pdf \u00b7 renewal due" },
      "investor.id_expiry":            { value: "08/06/2026", status: "stale", source: "Photo_ID_A_Brennan_2022.pdf \u00b7 11 days remaining" },
      "investor.dvs_verified":         { value: "Yes (12/06/2024)", status: "stale", source: "DVS \u00b7 pending re-verification on renewal" },
      "investor.tin_country":          { value: "\u2014", status: "verified", source: "FATCA self-cert \u00b7 not foreign resident" },
      "investor.foreign_tin":          { value: "\u2014", status: "verified", source: "FATCA self-cert \u00b7 not foreign resident" },
      "entity.type":                   { value: "Trust", status: "verified", source: "Dynamics" },
      "entity.name":                   { value: "Brennan Family Trust", status: "verified", source: "Trust_Deed_Brennan.pdf \u00b7 p.1" },
      "entity.abn":                    { value: "62 304 871 248", status: "verified", source: "Trust_Deed_Brennan.pdf \u00b7 ABR match" },
      "entity.trustee":                { value: "Aoife M. Brennan", status: "verified", source: "Trust_Deed_Brennan.pdf \u00b7 p.2" },
      "entity.trust_date":             { value: "22/11/2016", status: "verified", source: "Trust_Deed_Brennan.pdf \u00b7 p.1" },
      "bank.institution":              { value: "Macquarie Bank", status: "verified", source: "Bank_Statement_MQB.pdf" },
      "bank.bsb":                      { value: "182 222", status: "verified", source: "Bank_Statement_MQB.pdf" },
      "bank.account_no":               { value: "\u2022\u2022\u2022\u2022 1057", status: "verified", source: "Bank_Statement_MQB.pdf" },
      "bank.account_name":             { value: "Brennan Family Trust", status: "verified", source: "Bank_Statement_MQB.pdf" },
      "adviser.name":                  { value: "Sanjay Patel", status: "verified", source: "Dynamics" },
      "adviser.afsl":                  { value: "324 178", status: "verified", source: "Dynamics" },
    },
    forms: [
      { formId: "fatca_crs", status: "confirmed", note: "ATO-29841" },
    ],
    documents: [
      { id: "trust_deed_brennan", name: "Trust_Deed_Brennan_Family.pdf", type: "Trust Deed", source: "SharePoint", added: "18 months ago", expiry: null },
      { id: "photo_id_brennan_2022", name: "Photo_ID_A_Brennan_2022.pdf", type: "Photo ID (Driver\u2019s licence)", source: "Uploaded", added: "23 months ago", expiry: { date: "08/06/2026", daysAway: 11, status: "expiring" } },
      { id: "bank_stmt_brennan", name: "Bank_Statement_MQB.pdf", type: "Bank Statement", source: "Uploaded", added: "16 months ago", expiry: null },
      { id: "fatca_brennan", name: "FATCA_CRS_Brennan.pdf", type: "FATCA/CRS self-certification", source: "Othello", added: "14 months ago", expiry: null },
    ],
    activity: [
      { time: "23 months ago", actor: "Adviser \u00b7 Sanjay Patel", desc: "Onboard Brennan Family Trust to Macquarie CMA — personal advice, $600,000" },
      { time: "23 months ago", actor: "System", desc: "Photo ID uploaded \u00b7 DVS confirmed \u00b7 4 identity fields verified" },
      { time: "23 months ago", actor: "System", desc: "Trust deed processed \u00b7 5 entity fields extracted" },
      { time: "23 months ago", actor: "System", desc: "Macquarie CMA opened \u00b7 ref MQF-21075 \u00b7 filed" },
      { time: "14 months ago", actor: "System", desc: "FATCA / CRS self-certification confirmed \u00b7 ATO ref ATO-29841 \u00b7 filed" },
      { time: "6 months ago", actor: "System", desc: "Photo ID expiry monitor armed \u00b7 chase window opens 14 days before 08/06/2026" },
      { time: "2d ago", actor: "System", desc: "Photo ID expiry in 11 days \u00b7 auto-chase scheduled" },
      { time: "1d ago", actor: "System", desc: "Photo ID renewal request emailed to A. Brennan via Microsoft 365 \u00b7 awaiting reply" },
      { time: "6h ago", actor: "System", desc: "No reply yet \u00b7 follow-up scheduled for 30/05/2026" },
    ],
    readinessSummary: "Awaiting client reply",
  aiSequences: [
      {
        id: "brennan_id_renewal_chase", title: "Photo ID renewal \u2014 awaiting reply", icon: "clock",
        state: "running", source: "Microsoft 365 \u00b7 inbox monitor", startedAgo: "1d",
        summary: "11 days until expiry \u00b7 1 reminder sent, no reply yet",
        steps: [
          { label: "Detect upcoming expiry", state: "done", evidence: "08/06/2026 \u00b7 within 14-day chase window" },
          { label: "Draft renewal request", state: "done", evidence: "Template: id-renewal-v2" },
          { label: "Send via Microsoft 365", state: "done", evidence: "a.brennan@example.com \u00b7 sent 1d ago" },
          { label: "Watching for reply", state: "current", evidence: "No matching inbound \u00b7 follow-up scheduled 30/05/2026" },
        ],
      },
      {
        id: "brennan_id_monitor", title: "Photo ID expiry monitor", icon: "warning",
        state: "running", source: "Othello policy engine", startedAgo: "6 months",
        summary: "Chase window open \u00b7 11 days remaining",
        steps: [
          { label: "Read expiry from ID", state: "done", evidence: "08/06/2026 \u00b7 Driver\u2019s licence (VIC)" },
          { label: "Set chase window", state: "done", evidence: "14 days before expiry" },
          { label: "Window opened", state: "done", evidence: "25/05/2026 \u00b7 chase triggered" },
          { label: "Tracking until renewal", state: "current", evidence: "Pending new ID upload" },
        ],
      },
      {
        id: "brennan_orig_dvs", title: "DVS verification \u2014 A. Brennan", icon: "shield-check",
        state: "done", source: "Photo_ID_A_Brennan_2022.pdf", startedAgo: "23 months", completedAgo: "23 months",
        summary: "4 of 4 attributes matched \u00b7 ref DVS-19002",
        steps: [
          { label: "Match given names", state: "done", evidence: "Aoife Marie \u00b7 exact" },
          { label: "Match surname", state: "done", evidence: "Brennan \u00b7 exact" },
          { label: "Match DOB", state: "done", evidence: "17/05/1979 \u00b7 exact" },
          { label: "Match document number", state: "done", evidence: "078 421 553 \u00b7 exact" },
        ],
      },
      {
        id: "brennan_deed_abr", title: "ABR lookup against trust deed", icon: "doc",
        state: "done", source: "Trust_Deed_Brennan_Family.pdf", startedAgo: "18 months", completedAgo: "18 months",
        summary: "ABN 62 304 871 248 confirmed against ABR",
        steps: [
          { label: "Extract entity details", state: "done", evidence: "Name, ABN, trustee, date" },
          { label: "ABR API lookup", state: "done", evidence: "62 304 871 248 \u00b7 active \u00b7 Trust" },
          { label: "Trustee cross-check", state: "done", evidence: "Aoife M. Brennan \u00b7 match" },
        ],
      },
      {
        id: "brennan_fatca_processing", title: "FATCA / CRS self-cert processed", icon: "shield-check",
        state: "done", source: "FATCA_CRS_Brennan.pdf", startedAgo: "14 months", completedAgo: "14 months",
        summary: "Non-foreign-resident declaration \u00b7 ATO ref ATO-29841",
        steps: [
          { label: "Extract declaration", state: "done", evidence: "Foreign tax resident: No" },
          { label: "Cross-check with TFN status", state: "done", evidence: "Consistent \u00b7 Australian only" },
          { label: "File and notify ATO", state: "done", evidence: "ref ATO-29841 \u00b7 acknowledged" },
        ],
      },
    ],
  },

  // ---- Whitlam — completed 8 days ago, all-green Fortlake + Hub24
  {
    id: "whitlam",
    name: "Whitlam, Eleanor",
    entityType: "Individual",
    members: ["Eleanor Whitlam — individual"],
    accounts: ["Hub24"],
    onboardingTo: { product: "Fortlake Real-Income Fund", productType: "wholesale managed fund", route: "Hub24", amount: "AUD 150,000", support: "wholesale, no advice" },
    adviser: "Catherine Halford",
    status: "done",
    lastActivity: "8d ago",
    fields: {
      "investor.given_names":          { value: "Eleanor Marie", status: "verified", source: "DVS \u00b7 19/05/2026" },
      "investor.surname":              { value: "Whitlam", status: "verified", source: "DVS \u00b7 19/05/2026" },
      "investor.dob":                  { value: "12/09/1968", status: "verified", source: "DVS \u00b7 19/05/2026" },
      "investor.occupation":           { value: "Retired", status: "verified", source: "Dynamics" },
      "investor.tfn":                  { value: "823 \u2022\u2022\u2022 754", status: "verified", source: "Client input \u00b7 checksum OK" },
      "investor.foreign_tax_resident": { value: "No", status: "verified", source: "Client input" },
      "investor.residential_address":  { value: "8 Riverside Dr, South Yarra VIC 3141", status: "verified", source: "DVS / Dynamics" },
      "investor.email":                { value: "ewhitlam@example.com", status: "verified", source: "Dynamics" },
      "investor.phone":                { value: "+61 4\u2022\u2022 \u2022\u2022\u2022 109", status: "verified", source: "Dynamics" },
      "investor.id_type":              { value: "Driver\u2019s licence (VIC)", status: "verified", source: "Photo_ID_E_Whitlam.pdf" },
      "investor.id_number":            { value: "047 281 933", status: "verified", source: "Photo_ID_E_Whitlam.pdf" },
      "investor.id_expiry":            { value: "23/11/2028", status: "verified", source: "Photo_ID_E_Whitlam.pdf" },
      "investor.dvs_verified":         { value: "Yes (19/05/2026)", status: "verified", source: "DVS" },
      "entity.type":                   { value: "Individual", status: "verified", source: "Dynamics" },
      "entity.name":                   { value: "\u2014", status: "verified", source: "n/a \u00b7 individual investor" },
      "entity.abn":                    { value: "\u2014", status: "verified", source: "n/a \u00b7 individual investor" },
      "bank.institution":              { value: "Commonwealth Bank", status: "verified", source: "Bank_Statement_CBA.pdf" },
      "bank.bsb":                      { value: "063 132", status: "verified", source: "Bank_Statement_CBA.pdf" },
      "bank.account_no":               { value: "\u2022\u2022\u2022\u2022 8917", status: "verified", source: "Bank_Statement_CBA.pdf" },
      "bank.account_name":             { value: "E M Whitlam", status: "verified", source: "Bank_Statement_CBA.pdf" },
      "investment.amount":             { value: "AUD 150,000", status: "verified", source: "Adviser brief \u00b7 18 May 2026" },
      "investment.product":            { value: "Fortlake Real-Income Fund", status: "verified", source: "Adviser brief" },
      "investment.platform":           { value: "Hub24", status: "verified", source: "Adviser brief" },
      "investment.risk_ack":           { value: "Acknowledged", status: "verified", source: "Client signature \u00b7 20 May 2026" },
      "investment.distribution_pref":  { value: "Reinvest", status: "verified", source: "Adviser brief" },
      "adviser.name":                  { value: "Catherine Halford", status: "verified", source: "Dynamics" },
      "adviser.afsl":                  { value: "324 178", status: "verified", source: "Dynamics" },
    },
    forms: [
      { formId: "fortlake_application", status: "confirmed", note: "FRT-48104" },
      { formId: "hub24_application", status: "confirmed", note: "HUB-48104" },
    ],
    documents: [
      { id: "photo_id_whitlam", name: "Photo_ID_E_Whitlam.pdf", type: "Photo ID (Driver\u2019s licence)", source: "Uploaded", added: "10 days ago", expiry: { date: "23/11/2028", daysAway: 909, status: "ok" } },
      { id: "bank_stmt_whitlam", name: "Bank_Statement_CBA_Apr26.pdf", type: "Bank Statement", source: "SharePoint", added: "9 days ago", expiry: null },
      { id: "fortlake_form_whitlam", name: "Fortlake_Application_Whitlam.pdf", type: "Application (completed)", source: "Othello", added: "8 days ago", expiry: null },
      { id: "hub24_form_whitlam", name: "Hub24_Application_Whitlam.pdf", type: "Application (completed)", source: "Othello", added: "8 days ago", expiry: null },
    ],
    activity: [
      { time: "11 days ago", actor: "Adviser \u00b7 Catherine Halford", desc: "Apply E. Whitlam to Fortlake Real-Income via Hub24 — wholesale, no advice \u00b7 $150,000" },
      { time: "10 days ago", actor: "System", desc: "Client added from Dynamics CRM \u00b7 6 identity fields pulled" },
      { time: "10 days ago", actor: "System", desc: "Photo ID uploaded \u00b7 9 fields extracted (OCR + AI)" },
      { time: "10 days ago", actor: "System", desc: "DVS verification returned \u00b7 7 identity fields confirmed" },
      { time: "9 days ago", actor: "System", desc: "Bank statement uploaded \u00b7 4 banking fields extracted \u00b7 account name matches investor" },
      { time: "9 days ago", actor: "System", desc: "TFN validated \u00b7 checksum OK" },
      { time: "9 days ago", actor: "System", desc: "Forms identified — Fortlake Application + Hub24 Account Application" },
      { time: "8 days ago", actor: "Rachel Lee", desc: "Approved & dispatched Fortlake Application to Fortlake Asset Management" },
      { time: "8 days ago", actor: "System", desc: "Adviser copy emailed to Catherine Halford" },
      { time: "8 days ago", actor: "System", desc: "Submitted to Fortlake \u00b7 ref FRT-48104" },
      { time: "8 days ago", actor: "System", desc: "Filed to /Clients/Whitlam_Eleanor/Forms/Fortlake_Application_2026.pdf" },
      { time: "8 days ago", actor: "System", desc: "Confirmation received from Fortlake \u00b7 ref FRT-48104 \u00b7 filed \u00b7 audit logged" },
      { time: "8 days ago", actor: "Rachel Lee", desc: "Approved & dispatched Hub24 Account Application" },
      { time: "8 days ago", actor: "System", desc: "Confirmation received from Hub24 \u00b7 ref HUB-48104 \u00b7 filed \u00b7 audit logged" },
      { time: "8 days ago", actor: "System", desc: "All forms complete \u00b7 Whitlam moved to Done" },
    ],
    readinessSummary: "Completed",
  aiSequences: [
      {
        id: "whitlam_id_ocr", title: "Photo ID OCR + AI extraction", icon: "doc",
        state: "done", source: "Photo_ID_E_Whitlam.pdf", startedAgo: "10 days", completedAgo: "10 days",
        summary: "9 identity fields extracted in 2.1s",
        steps: [
          { label: "Classify document", state: "done", evidence: "Driver\u2019s licence (VIC) \u00b7 96% confidence" },
          { label: "OCR text", state: "done", evidence: "9 fields detected" },
          { label: "Structure extraction", state: "done", evidence: "Names, DOB, address, doc number, expiry" },
        ],
      },
      {
        id: "whitlam_dvs", title: "DVS verification \u2014 E. Whitlam", icon: "shield-check",
        state: "done", source: "Photo_ID_E_Whitlam.pdf", startedAgo: "10 days", completedAgo: "10 days",
        summary: "4 of 4 attributes matched \u00b7 ref DVS-38221",
        steps: [
          { label: "Match given names", state: "done", evidence: "Eleanor Marie \u00b7 exact" },
          { label: "Match surname", state: "done", evidence: "Whitlam \u00b7 exact" },
          { label: "Match DOB", state: "done", evidence: "12/09/1968 \u00b7 exact" },
          { label: "Match document number", state: "done", evidence: "047 281 933 \u00b7 exact" },
        ],
      },
      {
        id: "whitlam_bank_extract", title: "Bank statement extracted + validated", icon: "doc",
        state: "done", source: "Bank_Statement_CBA_Apr26.pdf", startedAgo: "9 days", completedAgo: "9 days",
        summary: "4 banking fields verified \u00b7 BSB lookup OK \u00b7 name match 100%",
        steps: [
          { label: "Extract banking details", state: "done", evidence: "Commonwealth Bank \u00b7 BSB 063 132" },
          { label: "BSB register lookup", state: "done", evidence: "063 132 \u00b7 CBA Carlton (validated)" },
          { label: "Account name match", state: "done", evidence: "E M Whitlam vs Eleanor Marie Whitlam \u00b7 95%" },
        ],
      },
      {
        id: "whitlam_tfn_check", title: "TFN checksum validation", icon: "shield-check",
        state: "done", source: "Client input", startedAgo: "9 days", completedAgo: "9 days",
        summary: "823 \u2022\u2022\u2022 754 \u00b7 checksum OK",
        steps: [
          { label: "Format check", state: "done", evidence: "9 digits" },
          { label: "Modulus-11 checksum", state: "done", evidence: "pass" },
        ],
      },
      {
        id: "whitlam_fortlake_pkg", title: "Fortlake application packaging", icon: "send",
        state: "done", source: "Othello", startedAgo: "8 days", completedAgo: "8 days",
        summary: "26 fields populated \u00b7 form ready for dispatch",
        steps: [
          { label: "Map fields onto form", state: "done", evidence: "Section 3, 4, 7, 10, 12 \u00b7 26 fields" },
          { label: "Validate AML completeness", state: "done", evidence: "8/8 AML-required fields present" },
          { label: "Render PDF", state: "done", evidence: "Fortlake_Application_Whitlam.pdf" },
        ],
      },
      {
        id: "whitlam_distribution", title: "Distribution & record-keeping", icon: "send",
        state: "done", source: "Othello", startedAgo: "8 days", completedAgo: "8 days",
        summary: "4 destinations recorded",
        steps: [
          { label: "Adviser copy", state: "done", evidence: "Catherine Halford" },
          { label: "Platform submission \u00b7 Fortlake", state: "done", evidence: "ref FRT-48104" },
          { label: "Filed to record-keeping vault", state: "done", evidence: "/Clients/Whitlam_Eleanor/Forms/" },
          { label: "Audit trail entry", state: "done", evidence: "Rachel Lee \u00b7 20 May 2026" },
        ],
      },
    ],
  },

  // ---- Costa — completed 14 days ago, $1.25M Netwealth wrap (company)
  {
    id: "costa",
    name: "Costa Holdings Pty Ltd",
    entityType: "Company",
    members: ["Costa Holdings Pty Ltd — investing entity","Anthony Costa — director","Maria Costa — director"],
    accounts: ["Netwealth wrap"],
    onboardingTo: { product: "Netwealth wrap account", productType: "platform", route: "Netwealth", amount: "AUD 1,250,000", support: "personal advice" },
    adviser: "Sanjay Patel",
    status: "done",
    lastActivity: "14d ago",
    fields: {
      "investor.given_names":          { value: "Anthony Joseph", status: "verified", source: "DVS \u00b7 12/05/2026" },
      "investor.surname":              { value: "Costa", status: "verified", source: "DVS \u00b7 12/05/2026" },
      "investor.dob":                  { value: "04/07/1958", status: "verified", source: "DVS \u00b7 12/05/2026" },
      "investor.occupation":           { value: "Company director", status: "verified", source: "Dynamics" },
      "investor.tfn":                  { value: "397 \u2022\u2022\u2022 142", status: "verified", source: "Client input \u00b7 checksum OK" },
      "investor.foreign_tax_resident": { value: "No", status: "verified", source: "Client input" },
      "investor.residential_address":  { value: "27 Acland St, St Kilda VIC 3182", status: "verified", source: "DVS / Dynamics" },
      "investor.email":                { value: "tony@costaholdings.example", status: "verified", source: "Dynamics" },
      "investor.phone":                { value: "+61 4\u2022\u2022 \u2022\u2022\u2022 638", status: "verified", source: "Dynamics" },
      "investor.id_type":              { value: "Passport (AUS)", status: "verified", source: "Photo_ID_A_Costa.pdf" },
      "investor.id_number":            { value: "PA5621038", status: "verified", source: "Photo_ID_A_Costa.pdf" },
      "investor.id_expiry":            { value: "08/03/2032", status: "verified", source: "Photo_ID_A_Costa.pdf" },
      "investor.dvs_verified":         { value: "Yes (12/05/2026)", status: "verified", source: "DVS" },
      "entity.type":                   { value: "Company", status: "verified", source: "Dynamics" },
      "entity.name":                   { value: "Costa Holdings Pty Ltd", status: "verified", source: "ASIC_Extract_Costa.pdf \u00b7 ABR match" },
      "entity.abn":                    { value: "84 622 481 037", status: "verified", source: "ASIC_Extract_Costa.pdf \u00b7 ABR match" },
      "entity.trustee":                { value: "Anthony J. Costa, Maria L. Costa (directors)", status: "verified", source: "ASIC_Extract_Costa.pdf" },
      "bank.institution":              { value: "ANZ Business", status: "verified", source: "Bank_Statement_ANZ.pdf" },
      "bank.bsb":                      { value: "013 030", status: "verified", source: "Bank_Statement_ANZ.pdf" },
      "bank.account_no":               { value: "\u2022\u2022\u2022\u2022 8431", status: "verified", source: "Bank_Statement_ANZ.pdf" },
      "bank.account_name":             { value: "Costa Holdings Pty Ltd", status: "verified", source: "Bank_Statement_ANZ.pdf" },
      "investment.amount":             { value: "AUD 1,250,000", status: "verified", source: "Adviser brief \u00b7 09 May 2026" },
      "investment.product":            { value: "Netwealth managed accounts", status: "verified", source: "Adviser brief" },
      "investment.platform":           { value: "Netwealth", status: "verified", source: "Adviser brief" },
      "adviser.name":                  { value: "Sanjay Patel", status: "verified", source: "Dynamics" },
      "adviser.afsl":                  { value: "324 178", status: "verified", source: "Dynamics" },
    },
    forms: [
      { formId: "netwealth_wrap", status: "confirmed", note: "NWL-42198" },
    ],
    documents: [
      { id: "asic_costa", name: "ASIC_Extract_Costa_Holdings.pdf", type: "ASIC company extract", source: "Uploaded", added: "16 days ago", expiry: null },
      { id: "photo_id_a_costa", name: "Photo_ID_A_Costa.pdf", type: "Photo ID (Passport)", source: "Uploaded", added: "15 days ago", expiry: { date: "08/03/2032", daysAway: 2110, status: "ok" } },
      { id: "photo_id_m_costa", name: "Photo_ID_M_Costa.pdf", type: "Photo ID (Passport)", source: "Uploaded", added: "15 days ago", expiry: { date: "21/07/2029", daysAway: 1149, status: "ok" } },
      { id: "bank_stmt_costa", name: "Bank_Statement_ANZ_Mar26.pdf", type: "Bank Statement", source: "Uploaded", added: "15 days ago", expiry: null },
      { id: "netwealth_form_costa", name: "Netwealth_Wrap_Costa_Holdings.pdf", type: "Application (completed)", source: "Othello", added: "14 days ago", expiry: null },
    ],
    activity: [
      { time: "17 days ago", actor: "Adviser \u00b7 Sanjay Patel", desc: "Onboard Costa Holdings to Netwealth wrap — personal advice, $1,250,000" },
      { time: "16 days ago", actor: "System", desc: "Client added from Dynamics CRM \u00b7 entity type Company" },
      { time: "16 days ago", actor: "System", desc: "ASIC extract uploaded \u00b7 4 entity fields extracted (ABN, name, directors)" },
      { time: "15 days ago", actor: "System", desc: "Director ID copies uploaded for A. Costa and M. Costa \u00b7 9 identity fields extracted each" },
      { time: "15 days ago", actor: "System", desc: "DVS verification returned \u00b7 all 8 identity fields confirmed across both directors" },
      { time: "15 days ago", actor: "System", desc: "Bank statement uploaded \u00b7 account name matches entity exactly" },
      { time: "15 days ago", actor: "System", desc: "Forms identified — Netwealth Wrap Account Application" },
      { time: "14 days ago", actor: "Rachel Lee", desc: "Approved & dispatched Netwealth Wrap Application to Netwealth" },
      { time: "14 days ago", actor: "System", desc: "Adviser copy emailed to Sanjay Patel" },
      { time: "14 days ago", actor: "System", desc: "Submitted to Netwealth \u00b7 ref NWL-42198" },
      { time: "14 days ago", actor: "System", desc: "Filed to /Clients/Costa_Holdings/Forms/Netwealth_Wrap_2026.pdf" },
      { time: "14 days ago", actor: "System", desc: "Confirmation received from Netwealth \u00b7 ref NWL-42198 \u00b7 filed \u00b7 audit logged" },
      { time: "14 days ago", actor: "System", desc: "All forms complete \u00b7 Costa Holdings moved to Done" },
    ],
    readinessSummary: "Completed",
  aiSequences: [
      {
        id: "costa_asic_extract", title: "ASIC extract \u2014 entity verification", icon: "doc",
        state: "done", source: "ASIC_Extract_Costa_Holdings.pdf", startedAgo: "16 days", completedAgo: "16 days",
        summary: "ABN 84 622 481 037 confirmed \u00b7 2 directors verified",
        steps: [
          { label: "Classify document", state: "done", evidence: "ASIC company extract \u00b7 current" },
          { label: "Extract entity + directors", state: "done", evidence: "Costa Holdings Pty Ltd \u00b7 2 directors" },
          { label: "ABR API lookup", state: "done", evidence: "84 622 481 037 \u00b7 active \u00b7 Australian Private Company" },
          { label: "Director cross-check", state: "done", evidence: "Anthony J. Costa, Maria L. Costa \u00b7 match" },
        ],
      },
      {
        id: "costa_dvs_a", title: "DVS verification \u2014 A. Costa", icon: "shield-check",
        state: "done", source: "Photo_ID_A_Costa.pdf", startedAgo: "15 days", completedAgo: "15 days",
        summary: "4 of 4 attributes matched \u00b7 ref DVS-38104",
        steps: [
          { label: "Match given names", state: "done", evidence: "Anthony Joseph \u00b7 exact" },
          { label: "Match surname", state: "done", evidence: "Costa \u00b7 exact" },
          { label: "Match DOB", state: "done", evidence: "04/07/1958 \u00b7 exact" },
          { label: "Match document number", state: "done", evidence: "PA5621038 \u00b7 exact" },
        ],
      },
      {
        id: "costa_dvs_m", title: "DVS verification \u2014 M. Costa", icon: "shield-check",
        state: "done", source: "Photo_ID_M_Costa.pdf", startedAgo: "15 days", completedAgo: "15 days",
        summary: "4 of 4 attributes matched \u00b7 ref DVS-38105",
        steps: [
          { label: "Match given names", state: "done", evidence: "Maria Louise \u00b7 exact" },
          { label: "Match surname", state: "done", evidence: "Costa \u00b7 exact" },
          { label: "Match DOB", state: "done", evidence: "12/03/1961 \u00b7 exact" },
          { label: "Match document number", state: "done", evidence: "PA6201943 \u00b7 exact" },
        ],
      },
      {
        id: "costa_bank_extract", title: "Bank statement extracted + validated", icon: "doc",
        state: "done", source: "Bank_Statement_ANZ_Mar26.pdf", startedAgo: "15 days", completedAgo: "15 days",
        summary: "4 banking fields verified \u00b7 account in entity name",
        steps: [
          { label: "Extract banking details", state: "done", evidence: "ANZ Business \u00b7 BSB 013 030" },
          { label: "BSB register lookup", state: "done", evidence: "013 030 \u00b7 ANZ Business Banking" },
          { label: "Account name match", state: "done", evidence: "Costa Holdings Pty Ltd \u00b7 100% match to entity" },
        ],
      },
      {
        id: "costa_netwealth_pkg", title: "Netwealth wrap application packaging", icon: "send",
        state: "done", source: "Othello", startedAgo: "14 days", completedAgo: "14 days",
        summary: "20 fields populated \u00b7 form ready for dispatch",
        steps: [
          { label: "Map fields onto form", state: "done", evidence: "5 sections \u00b7 20 fields" },
          { label: "Validate AML completeness", state: "done", evidence: "All required fields present" },
          { label: "Render PDF", state: "done", evidence: "Netwealth_Wrap_Costa_Holdings.pdf" },
        ],
      },
      {
        id: "costa_distribution", title: "Distribution & record-keeping", icon: "send",
        state: "done", source: "Othello", startedAgo: "14 days", completedAgo: "14 days",
        summary: "4 destinations recorded",
        steps: [
          { label: "Adviser copy", state: "done", evidence: "Sanjay Patel" },
          { label: "Platform submission \u00b7 Netwealth", state: "done", evidence: "ref NWL-42198" },
          { label: "Filed to record-keeping vault", state: "done", evidence: "/Clients/Costa_Holdings/Forms/" },
          { label: "Audit trail entry", state: "done", evidence: "Rachel Lee \u00b7 14 May 2026" },
        ],
      },
    ],
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
      answer: "AUD 250,000 into the Fortlake Real-Income Fund via Hub24, distributions reinvested. This is from the adviser brief — Catherine Halford, 22 May 2026.",
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
  { clientId: "brennan", client: "Brennan Family Trust", document: "Photo ID (Aoife Brennan)", state: "Expiring", daysText: "11 days · 08/06/2026", severity: "attention" },
];

// ---------------------------------------------------------------
// Source integrations
// ---------------------------------------------------------------
// Each entry has a logo `key` that maps to a brand-styled component in
// SourcesSettings.jsx (see <SourceLogo />). Keep keys ASCII + stable.
const SOURCES = [
  // ---- CRM ----
  { cat: "CRM", logo: "dynamics", name: "Microsoft Dynamics 365", provider: "Microsoft",
    description: "Sync contacts, households, accounts and adviser activities.",
    verified: true, state: "connected", scope: "Contacts · Accounts · Activities", lastSync: "4m ago" },
  { cat: "CRM", logo: "fin365", name: "Fin365", provider: "Fin365 Pty Ltd",
    description: "Wealth-specific CRM for adviser firms — books of business, fee tracking.",
    verified: true, state: "available" },
  { cat: "CRM", logo: "salesforce", name: "Salesforce Financial Services Cloud", provider: "Salesforce",
    description: "FSC standard objects, householding, and adviser pipelines.",
    verified: true, state: "available" },

  // ---- Document storage ----
  { cat: "Document storage", logo: "sharepoint", name: "SharePoint", provider: "Microsoft",
    description: "Read client document libraries; watch folders for new uploads.",
    verified: true, state: "connected", scope: "Client document libraries", lastSync: "9m ago" },
  { cat: "Document storage", logo: "onedrive", name: "OneDrive", provider: "Microsoft",
    description: "Personal and team drives; auto-classify new documents.",
    verified: true, state: "available" },
  { cat: "Document storage", logo: "googledrive", name: "Google Drive", provider: "Google",
    description: "Shared drive monitoring with optional OCR for scans.",
    verified: true, state: "available" },

  // ---- Identity & AML ----
  { cat: "Identity & AML", logo: "dvs", name: "Document Verification Service", provider: "Attorney-General's Department",
    description: "Government ID checks against driver's-licence, passport and visa registers.",
    verified: true, state: "connected", scope: "ID verification results", lastSync: "22m ago" },
  { cat: "Identity & AML", logo: "frankieone", name: "FrankieOne", provider: "FrankieOne",
    description: "Digital onboarding, biometric matching and AUSTRAC-aligned KYC.",
    verified: true, state: "available" },
  { cat: "Identity & AML", logo: "refinitiv", name: "Refinitiv World-Check", provider: "LSEG",
    description: "Sanctions, PEP and adverse-media screening for ongoing monitoring.",
    verified: true, state: "available" },

  // ---- Registries ----
  { cat: "Registries", logo: "abr", name: "Australian Business Register", provider: "ATO",
    description: "ABN, ACN and entity-type lookups with name and GST status.",
    verified: true, state: "connected", scope: "ABN / ACN lookups", lastSync: "12m ago" },
  { cat: "Registries", logo: "asic", name: "ASIC Connect", provider: "ASIC",
    description: "Company extracts, director searches and business name registrations.",
    verified: true, state: "connected", scope: "Company extracts · Directors", lastSync: "1h ago" },
  { cat: "Registries", logo: "ato", name: "ATO TFN validation", provider: "Australian Taxation Office",
    description: "TFN modulus-11 checksum and (where authorised) lookup.",
    verified: true, state: "available" },

  // ---- Investment platforms ----
  { cat: "Investment platforms", logo: "hub24", name: "Hub24", provider: "Hub24 Limited",
    description: "Wrap account opening, holdings, contributions and pension payments.",
    verified: true, state: "available" },
  { cat: "Investment platforms", logo: "netwealth", name: "Netwealth", provider: "Netwealth Group",
    description: "Wrap and super account opening; managed-account model mappings.",
    verified: true, state: "available" },
  { cat: "Investment platforms", logo: "macquarie", name: "Macquarie Wrap", provider: "Macquarie",
    description: "Wrap account opening, CMA opening and reporting feeds.",
    verified: true, state: "available" },
  { cat: "Investment platforms", logo: "praemium", name: "Praemium", provider: "Praemium",
    description: "SMA and wrap administration with consolidated reporting.",
    verified: true, state: "available" },

  // ---- E-signature ----
  { cat: "E-signature", logo: "docusign", name: "DocuSign", provider: "DocuSign Inc.",
    description: "Send populated forms for signature; capture signed PDF + audit cert.",
    verified: true, state: "connected", scope: "Envelopes · Audit certificates", lastSync: "31m ago" },
  { cat: "E-signature", logo: "adobesign", name: "Adobe Acrobat Sign", provider: "Adobe",
    description: "Alternate e-signature provider with the same envelope semantics.",
    verified: true, state: "available" },

  // ---- Email / notifications ----
  { cat: "Email & notifications", logo: "m365", name: "Microsoft 365", provider: "Microsoft",
    description: "Send client requests; capture replies as activity; calendar holds.",
    verified: true, state: "connected", scope: "Outbound + reply capture", lastSync: "1m ago" },
  { cat: "Email & notifications", logo: "gworkspace", name: "Google Workspace", provider: "Google",
    description: "Gmail outbound + reply tracking; Calendar holds for review meetings.",
    verified: true, state: "available" },
  { cat: "Email & notifications", logo: "twilio", name: "Twilio SMS", provider: "Twilio",
    description: "SMS chase reminders for time-critical client requests.",
    verified: false, state: "available" },
];

// expose globally
Object.assign(window, {
  FIELD_DEFS, FORMS, SMITH_INITIAL_FIELDS, SMITH_SHELL, FORTLAKE_REQUIRED, SEED_CLIENTS,
  TIMINGS, TIMING_MULTIPLIER_DEFAULT, CHAT_SUGGESTIONS_DEFAULT, CHAT_SCRIPTED,
  OVERVIEW_METRICS, COMPLIANCE_SEED, SOURCES,
});
