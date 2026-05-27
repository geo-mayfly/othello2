// ============================================================
// Othello — scripted event handlers (the "demo spine")
// ============================================================
//
// Each handler receives { dispatch, toast, wait, state, setProc }
// and runs a sequence of:
//   - setProc(clientId, message, steps) -> updates the live banner
//   - wait(ms)                          -> pause (speed-scaled)
//   - dispatch(...)                     -> mutate state
//   - toast(...)                        -> bottom-left transient

const SCRIPTS = {};

// shared step builder
const STEP = (label, s = "pending") => ({ label, state: s });
const updateSteps = (steps, label, newState) =>
  steps.map(st => st.label === label ? { ...st, state: newState } : st);
const advance = (steps, doneLabel, nextLabel) => {
  let s = steps;
  if (doneLabel) s = updateSteps(s, doneLabel, "done");
  if (nextLabel) s = updateSteps(s, nextLabel, "current");
  return s;
};

// ---------------------------------------------------------------
// New client from CRM (Smith) — full intake sequence
//   Shows the client being created, data being pulled from each
//   connected source (Dynamics + SharePoint), and the resulting
//   gap analysis. Adviser brief / forms come from adviser_instruction.
// ---------------------------------------------------------------
SCRIPTS.new_client_smith = async ({ dispatch, toast, wait, setProc, state }) => {
  // 1. Bring the client into being (idempotent)
  dispatch({ type: "ADD_CLIENT", client: JSON.parse(JSON.stringify(SMITH_SHELL)) });
  dispatch({ type: "SET_MODULE", module: "clients" });
  dispatch({ type: "SELECT_CLIENT", id: "smith" });
  dispatch({ type: "SET_FILTER", filter: "needs" });

  toast("New client created in Dynamics — Smith Family Trust", "info");

  let steps = [
    STEP("Reading client record from Dynamics", "current"),
    STEP("Pulling trust documents from SharePoint"),
    STEP("Building baseline checklist for the entity"),
    STEP("Identifying gaps"),
  ];
  setProc("smith", "Reading client record from Dynamics…", steps);
  await wait(900);

  // ---- 1. Dynamics: identity contact + entity type + adviser ----
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: "smith",
    updates: {
      "investor.surname":  { value: "Smith",                          status: "verified", source: "Dynamics" },
      "investor.email":    { value: "j.smith@familytrust.example",   status: "verified", source: "Dynamics" },
      "investor.phone":    { value: "+61 4•• ••• 482",                status: "verified", source: "Dynamics" },
      "entity.type":       { value: "Trust",                          status: "verified", source: "Dynamics" },
      "adviser.name":      { value: "C. Halford",                     status: "verified", source: "Dynamics" },
      "adviser.afsl":      { value: "324178",                         status: "verified", source: "Dynamics" },
    },
  });
  dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "System", desc: "Pulled 6 fields from Microsoft Dynamics · contact, entity type, adviser" } });

  steps = advance(steps, "Reading client record from Dynamics", "Pulling trust documents from SharePoint");
  setProc("smith", "Searching SharePoint for related documents…", steps);
  await wait(900);

  // ---- 2. SharePoint: trust deed → 4 entity fields ----
  dispatch({
    type: "ADD_DOCUMENT", clientId: "smith",
    doc: { id: "trust_deed", name: "Smith_Trust_Deed.pdf", type: "Trust Deed", source: "SharePoint", added: "just now", expiry: null },
  });
  setProc("smith", "Reading Smith_Trust_Deed.pdf — extracting entity details…", steps);
  await wait(1100);
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: "smith",
    updates: {
      "entity.name":       { value: "Smith Family Trust",   status: "verified", source: "Smith_Trust_Deed.pdf · p.1" },
      "entity.abn":        { value: "47 815 392 614",        status: "verified", source: "Smith_Trust_Deed.pdf · p.1" },
      "entity.trustee":    { value: "John & Margaret Smith", status: "verified", source: "Smith_Trust_Deed.pdf · p.2" },
      "entity.trust_date": { value: "14/06/2014",            status: "verified", source: "Smith_Trust_Deed.pdf · p.1" },
    },
  });
  dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "System", desc: "Trust deed found on SharePoint · extracted entity name, ABN, trustees, establishment date" } });

  steps = advance(steps, "Pulling trust documents from SharePoint", "Building baseline checklist for the entity");
  setProc("smith", "Building baseline checklist for a trust client…", steps);
  await wait(900);
  dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "System", desc: "Baseline trust checklist applied · identity, tax, banking and AML requirements computed" } });

  steps = advance(steps, "Building baseline checklist for the entity", "Identifying gaps");
  setProc("smith", "Reconciling against the client vault…", steps);
  await wait(900);

  steps = updateSteps(steps, "Identifying gaps", "done");
  setProc("smith", "10 fields ready from sources · 13 outstanding · awaiting adviser instruction for products", steps);
  await wait(700);
  dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "System", desc: "Checklist computed · 10 ready, 13 outstanding (identity, tax, banking) — product/forms TBD" } });

  toast("Client built · awaiting adviser instruction for products", "attention");
};

// ---------------------------------------------------------------
// Adviser instruction — "Apply John to Fortlake Real-Income via Hub24"
// ---------------------------------------------------------------
SCRIPTS.adviser_instruction = async ({ dispatch, toast, wait, setProc, state }) => {
  const cid = state().selectedClientId || "smith";
  dispatch({ type: "SET_MODULE", module: "clients" });
  dispatch({ type: "SELECT_CLIENT", id: cid });
  toast("Adviser brief received — C. Halford", "info");
  let steps = [
    STEP("Reading adviser brief", "current"),
    STEP("Capturing investment details"),
  ];
  setProc(cid, "Reading adviser brief…", steps);
  await wait(900);

  steps = advance(steps, "Reading adviser brief", "Capturing investment details");
  setProc(cid, "Capturing investment details from the brief…", steps);
  await wait(1000);
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: cid,
    updates: {
      "investment.amount":            { value: "AUD 250,000",                status: "verified", source: "Adviser brief · 22 May 2026" },
      "investment.product":           { value: "Fortlake Real-Income Fund",  status: "verified", source: "Adviser brief" },
      "investment.platform":          { value: "Hub24",                      status: "verified", source: "Adviser brief" },
      "investment.distribution_pref": { value: "Reinvest",                   status: "verified", source: "Adviser brief" },
    },
  });
  steps = updateSteps(steps, "Capturing investment details", "done");
  setProc(cid, "Brief processed · 4 investment fields ready", steps);
  await wait(500);
  dispatch({ type: "ADD_ACTIVITY", clientId: cid, entry: { actor: "Adviser · C. Halford", desc: "Apply John to Fortlake Real-Income via Hub24 — wholesale, no advice · $250,000" } });
  toast("Adviser brief applied · 4 fields filled", "ready");
};

// ---------------------------------------------------------------
// System identifies required forms — proposes (doesn't commit)
// ---------------------------------------------------------------
SCRIPTS.system_identifies_forms = async ({ dispatch, toast, wait, setProc, state }) => {
  const cid = state().selectedClientId || "smith";
  dispatch({ type: "SELECT_CLIENT", id: cid });
  toast("Analysing entity + brief to identify required forms…", "info");
  let steps = [
    STEP("Reading entity type and product details", "current"),
    STEP("Matching against the firm's form library"),
    STEP("Proposing applicable forms"),
  ];
  setProc(cid, "Reading entity type and product details…", steps);
  await wait(900);
  steps = advance(steps, "Reading entity type and product details", "Matching against the firm's form library");
  setProc(cid, "Matching against the firm's form library…", steps);
  await wait(1100);
  steps = advance(steps, "Matching against the firm's form library", "Proposing applicable forms");
  setProc(cid, "Proposing 2 forms for your review…", steps);
  await wait(800);

  dispatch({ type: "ADD_FORM_TO_CLIENT", clientId: cid, formId: "fortlake_application", status: "proposed" });
  dispatch({ type: "ADD_FORM_TO_CLIENT", clientId: cid, formId: "hub24_application",   status: "proposed" });

  steps = updateSteps(steps, "Proposing applicable forms", "done");
  setProc(cid, "2 forms proposed — review and confirm", steps);
  await wait(500);
  dispatch({ type: "ADD_ACTIVITY", clientId: cid, entry: { actor: "System", desc: "Proposed 2 forms based on entity + brief — Fortlake application + Hub24 account" } });
  toast("2 forms proposed · review and confirm on the Forms tab", "attention");
};

// ---------------------------------------------------------------
// Operator confirms all proposed forms — flips them to awaiting
// ---------------------------------------------------------------
SCRIPTS.confirm_forms = async ({ dispatch, toast, wait, setProc, state }) => {
  const cid = state().selectedClientId || "smith";
  const client = state().clients.find(c => c.id === cid);
  const proposed = (client?.forms || []).filter(f => f.status === "proposed");
  if (proposed.length === 0) {
    toast("No proposed forms to confirm", "info");
    return;
  }
  let steps = [STEP("Confirming forms", "current"), STEP("Building checklist")];
  setProc(cid, "Confirming forms…", steps);
  await wait(600);
  for (const cf of proposed) {
    dispatch({ type: "UPDATE_FORM_STATUS", clientId: cid, formId: cf.formId, status: "awaiting" });
  }
  steps = advance(steps, "Confirming forms", "Building checklist");
  setProc(cid, "Building combined requirements checklist…", steps);
  await wait(900);
  steps = updateSteps(steps, "Building checklist", "done");
  setProc(cid, `${proposed.length} form${proposed.length === 1 ? "" : "s"} confirmed · checklist established`, steps);
  await wait(400);
  dispatch({ type: "ADD_ACTIVITY", clientId: cid, entry: { actor: "R. Lee", desc: `Confirmed ${proposed.length} required forms · checklist established` } });
  toast("Forms confirmed · checklist now in scope", "ready");
};

// ---------------------------------------------------------------
// Document uploaded — Photo ID for Smith — the reference §8.1 sequence
// ---------------------------------------------------------------
SCRIPTS.upload_photo_id = async ({ dispatch, toast, wait, setProc }) => {
  dispatch({ type: "SET_MODULE", module: "clients" });
  dispatch({ type: "SELECT_CLIENT", id: "smith" });
  toast("New document received — Photo_ID_J_Smith.pdf", "info");

  let steps = [
    STEP("Classifying document", "current"),
    STEP("Extracting details (OCR + AI)"),
    STEP("Matching to Fortlake application"),
    STEP("Validating against rules"),
    STEP("Cross-checking the client vault"),
    STEP("Updating checklist"),
  ];
  setProc("smith", "Classifying document…", steps);
  await wait(TIMINGS.classify);
  steps = advance(steps, "Classifying document", "Extracting details (OCR + AI)");
  setProc("smith", "Extracting details (OCR + AI)…", steps);
  await wait(TIMINGS.extract);
  steps = advance(steps, "Extracting details (OCR + AI)", "Matching to Fortlake application");
  setProc("smith", "Found 9 fields · matching to Fortlake Real-Income application…", steps);
  await wait(TIMINGS.match);
  steps = advance(steps, "Matching to Fortlake application", "Validating against rules");
  setProc("smith", "Validating against rules (AML-required, address format)…", steps);
  await wait(TIMINGS.validate);
  steps = advance(steps, "Validating against rules", "Cross-checking the client vault");
  setProc("smith", "Cross-checking the client vault for existing data…", steps);
  await wait(TIMINGS.crosscheck);
  steps = advance(steps, "Cross-checking the client vault", "Updating checklist");
  setProc("smith", "Updating checklist — 4 fields resolved, 1 needs verification", steps);
  await wait(TIMINGS.updateChecklist);

  // mutate fields: id details extracted as "review" (AI-extracted)
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: "smith",
    updates: {
      "investor.given_names":         { value: "John Anthony", status: "review",   source: "Photo_ID_J_Smith.pdf · 0.96", confidence: 0.96 },
      "investor.surname":             { value: "Smith",        status: "review",   source: "Photo_ID_J_Smith.pdf · 0.98", confidence: 0.98 },
      "investor.dob":                 { value: "18/02/1972",   status: "review",   source: "Photo_ID_J_Smith.pdf · 0.97", confidence: 0.97 },
      "investor.residential_address": { value: "42 Linden St, Carlton VIC 3053", status: "review", source: "Photo_ID_J_Smith.pdf · 0.94", confidence: 0.94 },
      "investor.id_type":             { value: "Driver's licence", status: "review", source: "Photo_ID_J_Smith.pdf", confidence: 0.98 },
      "investor.id_number":           { value: "VIC 0481 ••••",   status: "review", source: "Photo_ID_J_Smith.pdf", confidence: 0.98 },
      "investor.id_expiry":           { value: "14/06/2026",   status: "stale",    source: "Photo_ID_J_Smith.pdf · expires in 18 days" },
    },
  });
  dispatch({
    type: "ADD_DOCUMENT", clientId: "smith",
    doc: { id: "photo_id", name: "Photo_ID_J_Smith.pdf", type: "Photo ID", source: "Upload", added: "just now", expiry: { date: "14/06/2026", daysAway: 18, status: "attention" } },
  });
  dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "System", desc: "Extracted 9 fields from Photo_ID_J_Smith.pdf · 4 mapped, ID expires in 18 days" } });

  steps = updateSteps(steps, "Updating checklist", "done");
  setProc("smith", "Awaiting your verification", steps);
  await wait(800);

  toast("Checklist updated — 4 resolved, 1 needs you", "attention");
};

// ---------------------------------------------------------------
// Verification returned (DVS)  — flips the AI-extracted ID fields to verified
// ---------------------------------------------------------------
SCRIPTS.dvs_returned = async ({ dispatch, toast, wait, setProc }) => {
  dispatch({ type: "SET_MODULE", module: "clients" });
  dispatch({ type: "SELECT_CLIENT", id: "smith" });
  toast("Verification returned from DVS", "info");
  let steps = [
    STEP("Confirming match", "current"),
    STEP("Updating identity fields"),
  ];
  setProc("smith", "Confirming match…", steps);
  await wait(TIMINGS.dvsConfirm);
  steps = advance(steps, "Confirming match", "Updating identity fields");
  setProc("smith", "Updating identity fields…", steps);
  await wait(500);
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: "smith",
    updates: {
      "investor.given_names":         { value: "John Anthony", status: "verified", source: "DVS confirmed" },
      "investor.surname":             { value: "Smith",        status: "verified", source: "DVS confirmed" },
      "investor.dob":                 { value: "18/02/1972",   status: "verified", source: "DVS confirmed" },
      "investor.residential_address": { value: "42 Linden St, Carlton VIC 3053", status: "verified", source: "DVS confirmed" },
      "investor.id_type":             { value: "Driver's licence", status: "verified", source: "DVS" },
      "investor.id_number":           { value: "VIC 0481 ••••",   status: "verified", source: "DVS" },
      "investor.dvs_verified":        { value: "Yes",          status: "verified", source: "DVS" },
    },
  });
  steps = updateSteps(steps, "Updating identity fields", "done");
  setProc("smith", "ID verified · 7 fields updated", steps);
  await wait(500);
  dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "System", desc: "ID verified via DVS · 7 identity fields confirmed" } });
  toast("ID verified · 7 fields updated", "ready");
};

// ---------------------------------------------------------------
// Client reply (tax residency)
// ---------------------------------------------------------------
SCRIPTS.client_reply_tax = async ({ dispatch, toast, wait, setProc }) => {
  dispatch({ type: "SET_MODULE", module: "clients" });
  dispatch({ type: "SELECT_CLIENT", id: "smith" });
  toast("Reply received from client (email)", "info");
  let steps = [STEP("Reading reply", "current"), STEP("Updating tax-residency answer")];
  setProc("smith", "Reading reply…", steps);
  await wait(800);
  steps = advance(steps, "Reading reply", "Updating tax-residency answer");
  setProc("smith", "Updating tax-residency answer…", steps);
  await wait(700);
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: "smith",
    updates: {
      "investor.foreign_tax_resident": { value: "No", status: "verified", source: "Client reply · 27 May" },
    },
  });
  steps = updateSteps(steps, "Updating tax-residency answer", "done");
  setProc("smith", "1 field resolved", steps);
  await wait(400);
  dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "Client · J. Smith", desc: "Replied with tax-residency answer — Australian resident only" } });
  toast("1 field resolved (tax residency)", "ready");
};

// ---------------------------------------------------------------
// Adviser confirms occupation
// ---------------------------------------------------------------
SCRIPTS.adviser_occupation = async ({ dispatch, toast, wait, setProc }) => {
  dispatch({ type: "SET_MODULE", module: "clients" });
  dispatch({ type: "SELECT_CLIENT", id: "smith" });
  toast("Adviser updated occupation in Dynamics", "info");
  let steps = [STEP("Syncing changed records", "current"), STEP("Validating")];
  setProc("smith", "Syncing changed records…", steps);
  await wait(800);
  steps = advance(steps, "Syncing changed records", "Validating");
  setProc("smith", "Validating…", steps);
  await wait(700);
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: "smith",
    updates: {
      "investor.occupation": { value: "Senior Counsel", status: "verified", source: "Dynamics · synced" },
    },
  });
  steps = updateSteps(steps, "Validating", "done");
  setProc("smith", "1 field updated", steps);
  await wait(400);
  dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "Adviser · C. Halford", desc: "Updated occupation in Dynamics" } });
  toast("Occupation updated · Verified from Dynamics", "ready");
};

// ---------------------------------------------------------------
// Source sync — Bank statement lands in SharePoint
//   triggers a doc ingest with a LOW-CONFIDENCE on account number
// ---------------------------------------------------------------
SCRIPTS.upload_bank_statement = async ({ dispatch, toast, wait, setProc }) => {
  dispatch({ type: "SET_MODULE", module: "clients" });
  dispatch({ type: "SELECT_CLIENT", id: "smith" });
  toast("Bank statement received via SharePoint", "info");
  let steps = [
    STEP("Classifying document", "current"),
    STEP("Extracting details (OCR + AI)"),
    STEP("Validating against rules"),
    STEP("Cross-checking the client vault"),
    STEP("Updating checklist"),
  ];
  setProc("smith", "Classifying document…", steps);
  await wait(TIMINGS.classify);
  steps = advance(steps, "Classifying document", "Extracting details (OCR + AI)");
  setProc("smith", "Extracting details (OCR + AI)…", steps);
  await wait(TIMINGS.extract);

  // exception beat: low-confidence + TFN checksum failure
  toast("Low confidence on 1 extracted field (account number) — flagging for review", "attention");

  steps = advance(steps, "Extracting details (OCR + AI)", "Validating against rules");
  setProc("smith", "Validating against rules…", steps);
  await wait(TIMINGS.validate);

  toast("Validation failed: TFN checksum doesn't match — needs correction", "missing");

  steps = advance(steps, "Validating against rules", "Cross-checking the client vault");
  setProc("smith", "Cross-checking the client vault…", steps);
  await wait(TIMINGS.crosscheck);

  toast("Conflict: residential address differs between Dynamics and the uploaded ID — needs your decision", "missing");

  steps = advance(steps, "Cross-checking the client vault", "Updating checklist");
  setProc("smith", "Updating checklist — 2 ready, 2 flagged for review", steps);
  await wait(TIMINGS.updateChecklist);

  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: "smith",
    updates: {
      "bank.institution":   { value: "Commonwealth Bank of Australia", status: "verified", source: "Statement.pdf header" },
      "bank.bsb":           { value: "063-019",  status: "verified", source: "Statement.pdf · BSB-register match" },
      "bank.account_no":    { value: "•••• 8412",status: "review",   source: "Statement.pdf · 0.62 (low confidence)", confidence: 0.62 },
      "bank.account_name":  { value: "John A. Smith",  status: "verified", source: "Statement.pdf" },
      "investor.tfn":       { value: "623 ••• 451",    status: "failed",   source: "Client input · TFN checksum failed", error: "TFN checksum failed" },
      // conflict on address
      "investor.residential_address": { value: "42 Linden St, Carlton VIC 3053", status: "conflict", source: "Dynamics: 'Unit 4, 42 Linden St…' · ID: '42 Linden St'", conflict: { dynamics: "Unit 4, 42 Linden St, Carlton VIC 3053", id: "42 Linden St, Carlton VIC 3053" } },
    },
  });

  dispatch({
    type: "ADD_DOCUMENT", clientId: "smith",
    doc: { id: "bank_stmt", name: "CBA_Statement_May.pdf", type: "Bank Statement", source: "SharePoint", added: "just now", expiry: null },
  });
  dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "System", desc: "Bank statement processed · 1 low-confidence, 1 validation failure, 1 conflict — flagged for review" } });

  steps = updateSteps(steps, "Updating checklist", "done");
  setProc("smith", "Awaiting your review on 3 fields", steps);
  await wait(700);
};

// ---------------------------------------------------------------
// Resolve exceptions — clears the 3 flagged items in one beat for demo
// ---------------------------------------------------------------
SCRIPTS.resolve_exceptions = async ({ dispatch, toast, wait, setProc, state }) => {
  dispatch({ type: "SELECT_CLIENT", id: "smith" });
  toast("Resolving flagged items…", "info");
  let steps = [STEP("Recording your decisions", "current"), STEP("Re-validating")];
  setProc("smith", "Recording your decisions…", steps);
  await wait(700);
  steps = advance(steps, "Recording your decisions", "Re-validating");
  setProc("smith", "Re-validating…", steps);
  await wait(700);
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: "smith",
    updates: {
      "bank.account_no":              { value: "•••• 8412", status: "verified", source: "Confirmed by R. Lee" },
      "investor.tfn":                 { value: "623 ••• 458", status: "verified", source: "Corrected by R. Lee · checksum OK" },
      "investor.residential_address": { value: "Unit 4, 42 Linden St, Carlton VIC 3053", status: "verified", source: "Resolved · Dynamics chosen by R. Lee" },
      "investment.risk_ack":          { value: "Acknowledged", status: "verified", source: "Client signature · 27 May" },
    },
  });
  steps = updateSteps(steps, "Re-validating", "done");

  // Re-check whether the form is now actually ready (derived)
  const smith = state().clients.find(c => c.id === "smith");
  // Apply our just-dispatched updates locally for the check (the reducer hasn't necessarily ticked yet)
  const checkFields = { ...smith.fields,
    "bank.account_no":              { ...smith.fields["bank.account_no"], status: "verified" },
    "investor.tfn":                 { ...smith.fields["investor.tfn"], status: "verified" },
    "investor.residential_address": { ...smith.fields["investor.residential_address"], status: "verified" },
    "investment.risk_ack":          { ...smith.fields["investment.risk_ack"], status: "verified" },
  };
  const required = requiredFieldsFor("fortlake_application");
  const allReady = required.every(k => checkFields[k]?.status === "verified");

  if (allReady) {
    setProc("smith", "3 exceptions resolved · all required fields ready", steps);
    dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "R. Lee", desc: "Resolved 3 flagged items · Fortlake application ready for review" } });
    toast("Fortlake application ready for review", "ready");
  } else {
    const missing = required.filter(k => checkFields[k]?.status !== "verified");
    setProc("smith", `3 exceptions resolved · ${missing.length} field${missing.length === 1 ? "" : "s"} still outstanding`, steps);
    dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "R. Lee", desc: `Resolved 3 flagged items · ${missing.length} still outstanding before review` } });
    toast(`3 resolved · ${missing.length} field${missing.length === 1 ? "" : "s"} still outstanding`, "attention");
  }
  await wait(500);
};

// ---------------------------------------------------------------
// Form ready (auto from after-flow — opens the preview)
// ---------------------------------------------------------------
SCRIPTS.open_fortlake_review = async ({ dispatch, toast, wait, state }) => {
  dispatch({ type: "SELECT_CLIENT", id: "smith" });
  await wait(200);
  const smith = state().clients.find(c => c.id === "smith");
  if (deriveFormStatus(smith, "fortlake_application") !== "ready") {
    toast("Fortlake isn't ready yet — some required fields still need attention", "attention");
    return;
  }
  dispatch({ type: "OPEN_PREVIEW", clientId: "smith", formId: "fortlake_application" });
};

// ---------------------------------------------------------------
// Approve & dispatch
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// Approve & dispatch — generic, takes {clientId, formId}
// ---------------------------------------------------------------
SCRIPTS.dispatch_form = async ({ dispatch, toast, wait, setProc, state }, opts = {}) => {
  const clientId = opts.clientId || state().selectedClientId;
  const formId = opts.formId || "fortlake_application";
  const client = state().clients.find(c => c.id === clientId);
  const formDef = FORMS[formId];
  if (!client || !formDef) return;
  if (deriveFormStatus(client, formId) !== "ready") {
    toast(`Can't dispatch — ${formDef.short} still has outstanding fields`, "missing");
    return;
  }
  dispatch({ type: "CLOSE_PREVIEW" });
  const designationRaw = formDef.sourcePlatform && formDef.sourcePlatform !== "—" ? formDef.sourcePlatform : "EWM";
  const designation = designationRaw;
  let steps = [
    STEP("Packaging completed form", "current"),
    STEP(`Dispatching to ${designation}`),
    STEP("Awaiting confirmation"),
  ];
  setProc(clientId, "Packaging completed form…", steps);
  dispatch({ type: "UPDATE_FORM_STATUS", clientId, formId, status: "dispatched" });
  await wait(TIMINGS.package);
  steps = advance(steps, "Packaging completed form", `Dispatching to ${designation}`);
  setProc(clientId, `Dispatching to ${designation}…`, steps);
  await wait(TIMINGS.dispatch);
  steps = advance(steps, `Dispatching to ${designation}`, "Awaiting confirmation");
  setProc(clientId, "Awaiting confirmation…", steps);
  await wait(TIMINGS.awaitConfirm);
  const refPrefix = designation.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "EWM";
  const confRef = `${refPrefix}-${Math.floor(40000 + Math.random() * 9000)}`;
  dispatch({ type: "UPDATE_FORM_STATUS", clientId, formId, status: "confirmed", note: confRef });
  dispatch({ type: "ADD_DOCUMENT", clientId, doc: { id: `${formId}_pop_${Date.now()}`, name: `${formDef.short.replace(/\s+/g,"_")}_${client.name.split(" ")[0]}.pdf`, type: "Application (completed)", source: "Othello", added: "just now", expiry: null } });
  dispatch({ type: "ADD_ACTIVITY", clientId, entry: { actor: "R. Lee", desc: `Approved & dispatched ${formDef.short} to ${designation}` } });
  dispatch({ type: "ADD_ACTIVITY", clientId, entry: { actor: "System", desc: `Confirmation received from ${designation} · ref ${confRef} · filed` } });

  // If every form in scope is now terminal (confirmed/dispatched), move the client to Done
  const after = state().clients.find(c => c.id === clientId);
  const terminal = (s) => s === "confirmed" || s === "dispatched";
  if (after && after.forms.length > 0 && after.forms.every(f => terminal(f.status) || f.formId === formId)) {
    dispatch({ type: "SET_CLIENT_STATUS", clientId, status: "done", lastActivity: "just now" });
    dispatch({ type: "ADD_ACTIVITY", clientId, entry: { actor: "System", desc: `All forms complete · ${client.name} moved to Done` } });
    dispatch({ type: "SET_FILTER", filter: "done" });
  }
  steps = updateSteps(steps, "Awaiting confirmation", "done");
  setProc(clientId, "Confirmation received · filed to client vault · reminder set", steps);
  await wait(800);
  toast(`Confirmation received (ref ${confRef}) · filed · reminder set`, "ready");

  // Spine chaining: when Fortlake dispatches, auto-dispatch Hub24 too
  // (it travels alongside Fortlake in the spine). Skipped if Hub24 isn't
  // in scope or is already terminal.
  if (clientId === "smith" && formId === "fortlake_application") {
    const latest = state().clients.find(c => c.id === clientId);
    const hub24 = latest?.forms.find(f => f.formId === "hub24_application");
    if (hub24 && !terminal(hub24.status)) {
      await wait(600);
      await SCRIPTS.dispatch_form({ dispatch, toast, wait, setProc, state }, { clientId: "smith", formId: "hub24_application" });
    }
  }
};

// Kept as an alias for older code paths
SCRIPTS.dispatch_fortlake = (ctx) => SCRIPTS.dispatch_form(ctx, { clientId: "smith", formId: "fortlake_application" });

// ---------------------------------------------------------------
// Photo ID renewal chase (Smith)
// ---------------------------------------------------------------
SCRIPTS.chase_smith_id = async ({ dispatch, toast, wait, setProc }) => {
  dispatch({ type: "SELECT_CLIENT", id: "smith" });
  let steps = [STEP("Drafting renewal request to client", "current"), STEP("Sending via Microsoft 365")];
  setProc("smith", "Drafting renewal request to client…", steps);
  await wait(TIMINGS.draftChase);
  steps = advance(steps, "Drafting renewal request to client", "Sending via Microsoft 365");
  setProc("smith", "Sending via Microsoft 365…", steps);
  await wait(TIMINGS.send);
  steps = updateSteps(steps, "Sending via Microsoft 365", "done");
  setProc("smith", "Renewal request sent · awaiting client", steps);
  await wait(500);
  dispatch({ type: "ADD_ACTIVITY", clientId: "smith", entry: { actor: "System", desc: "Photo ID renewal request emailed to J. Smith via Microsoft 365" } });
  toast("Photo ID renewal request sent · awaiting client", "info");
};

// ---------------------------------------------------------------
// REVERSE BEAT — Okafor's wholesale certificate expires
// ---------------------------------------------------------------
SCRIPTS.expire_okafor = async ({ dispatch, toast, wait, setProc }) => {
  dispatch({ type: "SET_MODULE", module: "clients" });
  dispatch({ type: "SELECT_CLIENT", id: "okafor" });
  toast("Wholesale certificate expired — Okafor, David", "missing");
  let steps = [STEP("Re-evaluating affected forms", "current")];
  setProc("okafor", "Re-evaluating affected forms…", steps);
  await wait(1000);
  steps = updateSteps(steps, "Re-evaluating affected forms", "done");
  setProc("okafor", "1 form no longer compliant · client cannot be advised", steps);
  await wait(500);
  dispatch({ type: "UPDATE_FORM_STATUS", clientId: "okafor", formId: "wholesale_cert", status: "blocked", note: "Certificate expired" });
  dispatch({ type: "SET_CLIENT_STATUS", clientId: "okafor", status: "needs", lastActivity: "just now" });
  dispatch({ type: "ADD_ACTIVITY", clientId: "okafor", entry: { actor: "System", desc: "Wholesale certificate expired · application blocked · liability flagged" } });
  dispatch({ type: "ADD_COMPLIANCE", row: { clientId: "okafor", client: "Okafor, David", document: "Wholesale Certificate", state: "Expired", daysText: "0 days (today)", severity: "missing" } });
  toast("Okafor can no longer be advised — auto-chase available", "missing");
};

// ---------------------------------------------------------------
// Auto-chase sent (Okafor renewal)
// ---------------------------------------------------------------
SCRIPTS.auto_chase_okafor = async ({ dispatch, toast, wait, setProc }) => {
  dispatch({ type: "SELECT_CLIENT", id: "okafor" });
  let steps = [STEP("Drafting renewal request to client", "current"), STEP("Sending via Microsoft 365")];
  setProc("okafor", "Drafting renewal request to client…", steps);
  await wait(TIMINGS.draftChase);
  steps = advance(steps, "Drafting renewal request to client", "Sending via Microsoft 365");
  setProc("okafor", "Sending via Microsoft 365…", steps);
  await wait(TIMINGS.send);
  steps = updateSteps(steps, "Sending via Microsoft 365", "done");
  setProc("okafor", "Renewal request sent · awaiting client", steps);
  await wait(500);
  dispatch({ type: "ADD_ACTIVITY", clientId: "okafor", entry: { actor: "System", desc: "Renewal request emailed to client via Microsoft 365" } });
  toast("Renewal request sent · awaiting client", "info");
};

// ---------------------------------------------------------------
// Renewal received (Okafor) — completes the reverse-beat loop
// ---------------------------------------------------------------
SCRIPTS.renewal_received_okafor = async ({ dispatch, toast, wait, setProc }) => {
  dispatch({ type: "SET_MODULE", module: "clients" });
  dispatch({ type: "SELECT_CLIENT", id: "okafor" });
  toast("Renewal received from client", "info");
  let steps = [STEP("Processing new certificate", "current"), STEP("Validating expiry date")];
  setProc("okafor", "Processing new certificate…", steps);
  await wait(1000);
  steps = advance(steps, "Processing new certificate", "Validating expiry date");
  setProc("okafor", "Validating expiry date…", steps);
  await wait(800);
  steps = updateSteps(steps, "Validating expiry date", "done");
  setProc("okafor", "Certificate updated · expires 14 Nov 2028", steps);
  await wait(500);

  // unblock the form, refresh the doc, clear compliance
  dispatch({ type: "UPDATE_FORM_STATUS", clientId: "okafor", formId: "wholesale_cert", status: "ready", note: undefined });
  dispatch({ type: "ADD_DOCUMENT", clientId: "okafor", doc: { id: "wholesale_cert_new", name: "Wholesale_Cert_2028.pdf", type: "Wholesale Certificate", source: "Client reply", added: "just now", expiry: { date: "14/11/2028", daysAway: 900, status: "ready" } } });
  dispatch({ type: "REMOVE_COMPLIANCE", clientId: "okafor" });
  dispatch({ type: "SET_CLIENT_STATUS", clientId: "okafor", status: "in_progress", lastActivity: "just now" });
  dispatch({ type: "ADD_ACTIVITY", clientId: "okafor", entry: { actor: "Client · D. Okafor", desc: "Sent renewed wholesale certificate · expires 14 Nov 2028" } });
  toast("Certificate updated · Okafor cleared from compliance panel", "ready");
};

// ---------------------------------------------------------------
// Resolvers for the unique-to-secondary-form fields
//   These fire when the operator clicks "Resolve" on a row for a
//   field that belongs to FATCA / Wholesale Cert / Direct Debit
//   (i.e. forms added via "+ Add form" after the spine is done).
// ---------------------------------------------------------------
SCRIPTS.resolve_fatca_fields = async ({ dispatch, toast, wait, setProc, state }) => {
  const cid = state().selectedClientId;
  if (!cid) return;
  toast("FATCA / CRS self-certification returned from client", "info");
  let steps = [STEP("Reading FATCA form", "current"), STEP("Validating tax-residency declaration")];
  setProc(cid, "Reading FATCA form…", steps);
  await wait(900);
  steps = advance(steps, "Reading FATCA form", "Validating tax-residency declaration");
  setProc(cid, "Validating tax-residency declaration…", steps);
  await wait(800);
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: cid,
    updates: {
      "investor.foreign_tax_resident": { value: "Yes — United States", status: "verified", source: "FATCA self-cert · client" },
      "investor.tin_country":          { value: "US",                  status: "verified", source: "FATCA self-cert · client" },
      "investor.foreign_tin":          { value: "•••-••-4128",         status: "verified", source: "FATCA self-cert · client" },
    },
  });
  steps = updateSteps(steps, "Validating tax-residency declaration", "done");
  setProc(cid, "FATCA fields resolved · 3 fields updated", steps);
  await wait(400);
  dispatch({ type: "ADD_ACTIVITY", clientId: cid, entry: { actor: "Client", desc: "Returned FATCA / CRS self-certification — US tax resident, TIN provided" } });
  toast("FATCA captured · 3 fields resolved", "ready");
};

SCRIPTS.resolve_wholesale_fields = async ({ dispatch, toast, wait, setProc, state }) => {
  const cid = state().selectedClientId;
  if (!cid) return;
  toast("Wholesale / sophisticated-investor certificate uploaded", "info");
  let steps = [STEP("Reading certificate", "current"), STEP("Validating accountant against ASIC register")];
  setProc(cid, "Reading Wholesale_Cert.pdf…", steps);
  await wait(900);
  steps = advance(steps, "Reading certificate", "Validating accountant against ASIC register");
  setProc(cid, "Validating accountant credentials with ASIC register…", steps);
  await wait(1000);
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: cid,
    updates: {
      "wholesale.accountant_name": { value: "Anders & Pritchard CA", status: "verified", source: "Wholesale_Cert.pdf · ASIC-verified" },
      "wholesale.cert_expiry":     { value: "27/05/2028",            status: "verified", source: "Wholesale_Cert.pdf · 24-month validity" },
    },
  });
  dispatch({ type: "ADD_DOCUMENT", clientId: cid, doc: { id: `wholesale_cert_${Date.now()}`, name: "Wholesale_Cert_Smith_2026.pdf", type: "Wholesale Certificate", source: "Upload", added: "just now", expiry: { date: "27/05/2028", daysAway: 730, status: "ready" } } });
  steps = updateSteps(steps, "Validating accountant against ASIC register", "done");
  setProc(cid, "Wholesale certificate filed · expires 27 May 2028", steps);
  await wait(400);
  dispatch({ type: "ADD_ACTIVITY", clientId: cid, entry: { actor: "R. Lee", desc: "Uploaded wholesale certificate · accountant ASIC-verified · expires 27 May 2028" } });
  toast("Wholesale certificate captured · 2 fields resolved", "ready");
};

SCRIPTS.resolve_dd_auth = async ({ dispatch, toast, wait, setProc, state }) => {
  const cid = state().selectedClientId;
  if (!cid) return;
  toast("Direct-debit authority signed by client", "info");
  let steps = [STEP("Recording client signature", "current")];
  setProc(cid, "Recording client signature…", steps);
  await wait(800);
  dispatch({
    type: "UPDATE_CLIENT_FIELDS", clientId: cid,
    updates: {
      "bank.debit_authority": { value: "Signed", status: "verified", source: "E-signature · 27 May 2026" },
    },
  });
  steps = updateSteps(steps, "Recording client signature", "done");
  setProc(cid, "Direct-debit authority captured", steps);
  await wait(400);
  dispatch({ type: "ADD_ACTIVITY", clientId: cid, entry: { actor: "Client · J. Smith", desc: "Signed direct-debit authority via e-signature" } });
  toast("Direct-debit authority signed · 1 field resolved", "ready");
};

// ---------------------------------------------------------------
// Additional-products flow scripts
//   These show the user manually adding a form (operator action),
//   then the system auto-detecting a new document via a connected
//   system and resolving the matching outstanding items.
// ---------------------------------------------------------------
SCRIPTS.add_fatca_form = async ({ dispatch, toast, wait, setProc, state }) => {
  const cid = state().selectedClientId || "smith";
  dispatch({ type: "SELECT_CLIENT", id: cid });
  dispatch({ type: "ADD_FORM_TO_CLIENT", clientId: cid, formId: "fatca_crs", status: "awaiting" });
  dispatch({ type: "ADD_ACTIVITY", clientId: cid, entry: { actor: "R. Lee", desc: "Added FATCA / CRS Self-Certification to required forms" } });
  toast("FATCA / CRS added · 2 fields outstanding", "attention");
  // brief banner so the user sees it land
  setProc(cid, "Updating checklist · 2 new fields required for FATCA / CRS", []);
  await wait(800);
};

SCRIPTS.add_wholesale_form = async ({ dispatch, toast, wait, setProc, state }) => {
  const cid = state().selectedClientId || "smith";
  dispatch({ type: "SELECT_CLIENT", id: cid });
  dispatch({ type: "ADD_FORM_TO_CLIENT", clientId: cid, formId: "wholesale_cert", status: "awaiting" });
  dispatch({ type: "ADD_ACTIVITY", clientId: cid, entry: { actor: "R. Lee", desc: "Added Wholesale / Sophisticated Investor Certificate to required forms" } });
  toast("Wholesale Certificate added · 2 fields outstanding", "attention");
  setProc(cid, "Updating checklist · 2 new fields required", []);
  await wait(800);
};

SCRIPTS.add_dd_form = async ({ dispatch, toast, wait, setProc, state }) => {
  const cid = state().selectedClientId || "smith";
  dispatch({ type: "SELECT_CLIENT", id: cid });
  dispatch({ type: "ADD_FORM_TO_CLIENT", clientId: cid, formId: "ewm_direct_debit", status: "awaiting" });
  dispatch({ type: "ADD_ACTIVITY", clientId: cid, entry: { actor: "R. Lee", desc: "Added EWM Direct Debit Request to required forms" } });
  toast("Direct Debit Request added · 1 field outstanding", "attention");
  setProc(cid, "Updating checklist · 1 new field required", []);
  await wait(800);
};

// Reframe the resolvers as "system detected via connected system"
SCRIPTS.detect_fatca_reply = async (ctx) => {
  // identical effect to resolve_fatca_fields, kept as a separate handle for the demo flow
  return SCRIPTS.resolve_fatca_fields(ctx);
};
SCRIPTS.detect_wholesale_cert = async (ctx) => {
  return SCRIPTS.resolve_wholesale_fields(ctx);
};
SCRIPTS.detect_dd_signed = async (ctx) => {
  return SCRIPTS.resolve_dd_auth(ctx);
};

// Generic dispatch trigger by form id (used in additional-products flow)
SCRIPTS.dispatch_fatca   = (ctx) => SCRIPTS.dispatch_form(ctx, { clientId: "smith", formId: "fatca_crs" });
SCRIPTS.dispatch_wholesale = (ctx) => SCRIPTS.dispatch_form(ctx, { clientId: "smith", formId: "wholesale_cert" });
SCRIPTS.dispatch_dd      = (ctx) => SCRIPTS.dispatch_form(ctx, { clientId: "smith", formId: "ewm_direct_debit" });

// ---------------------------------------------------------------
// Dispatch Hub24 — shipped alongside Fortlake in the spine
// ---------------------------------------------------------------
SCRIPTS.dispatch_hub24 = (ctx) => SCRIPTS.dispatch_form(ctx, { clientId: "smith", formId: "hub24_application" });

// Combined: dispatch Fortlake then Hub24 (spine final step)
// Skips whichever is already done so the user can either click
// Approve in the populated-form modal (does Fortlake) and then the
// breakpoint resumes to auto-dispatch Hub24, OR Skip in the panel
// dispatches both.
SCRIPTS.dispatch_spine_forms = async (ctx) => {
  const smith = ctx.state().clients.find(c => c.id === "smith");
  const fortlakeStatus = smith?.forms.find(f => f.formId === "fortlake_application")?.status;
  const hub24Status    = smith?.forms.find(f => f.formId === "hub24_application")?.status;
  if (fortlakeStatus !== "confirmed" && fortlakeStatus !== "dispatched") {
    await SCRIPTS.dispatch_form(ctx, { clientId: "smith", formId: "fortlake_application" });
    await new Promise(r => setTimeout(r, 500 / (ctx.state().speed || 1)));
  }
  if (hub24Status !== "confirmed" && hub24Status !== "dispatched") {
    await SCRIPTS.dispatch_form(ctx, { clientId: "smith", formId: "hub24_application" });
  }
};

window.SCRIPTS = SCRIPTS;
