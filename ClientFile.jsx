// ============================================================
// Othello — Client file (the detail surface — main demo stage)
// ============================================================

function adviserInitials(name) {
  if (!name) return "?";
  // "Catherine Halford" → "CH", "C. Halford" → "CH", "Sanjay Patel" → "SP"
  const parts = name.replace(/\./g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ClientFile() {
  const { state, dispatch, runEvent } = useStore();
  const { selectedClientId, proc, fieldsFlash, formsFlash, clients } = state;
  const client = clients.find(c => c.id === selectedClientId);

  // empty state
  if (!client) {
    return <Overview />;
  }

  const isHero = client.id === "smith";
  const { ready, total } = isHero ? countReadiness(client) : { ready: 0, total: 0 };
  const readinessPill = isHero && total > 0
    ? (ready === total ? { kind: "ready", text: "Ready to lodge" } : { kind: ready >= total * 0.7 ? "attention" : "missing", text: `${ready} of ${total} ready` })
    : null;
  const statusTag = client.status === "needs" ? { kind: "missing", text: "Needs you" } : client.status === "in_progress" ? { kind: "attention", text: "In progress" } : { kind: "ready", text: "Done" };

  return (
    <div className="content" style={{ minWidth: 0 }}>
      <div className="cf-header">
        <div className="cf-header-top">
          <div className="cf-name">{client.name}</div>
          <span className="cf-chip">{client.entityType}</span>
          {readinessPill && (
            <span className={`pill ${readinessPill.kind}`} style={{ fontWeight: 600 }}>
              <StatusGlyph status={readinessPill.kind === "ready" ? "verified" : readinessPill.kind === "attention" ? "review" : "missing"} />
              {readinessPill.text}
            </span>
          )}
          <span className={`pill ${statusTag.kind}`}>{statusTag.text}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => dispatch({ type: "SET_CHAT_OPEN", open: true })}>
              <Icon name="chat" size={14} /> Ask about this client
            </button>
            <button className="btn btn-ghost btn-icon" title="More"><Icon name="more" /></button>
          </div>
        </div>
        <div className="cf-header-sub">
          {client.members.slice(0, 3).map((m, i) => (
            <span key={i} className="cf-chip">{m}</span>
          ))}
          <span style={{ marginLeft: "auto", display: "inline-flex", gap: 12, alignItems: "center" }}>
            <span className="adviser-chip">
              <span className="adviser-avatar">{adviserInitials(client.adviser)}</span>
              <span>
                <span className="adviser-name">{client.adviser}</span>
                <span className="adviser-role"> · Adviser</span>
              </span>
            </span>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            <span>{client.lastActivity}</span>
          </span>
        </div>
      </div>

      <div className="cf-body">
        {proc?.clientId === client.id && <ProcessingBanner proc={proc} queued={state.procQueue.length} />}

        <SummaryCards client={client} />

        {isHero && <OutstandingSection client={client} runEvent={runEvent} dispatch={dispatch} />}

        <ClientFileTabs client={client} fieldsFlash={fieldsFlash[client.id] || {}} formsFlash={formsFlash[client.id] || {}} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Processing banner
// ---------------------------------------------------------------
function ProcessingBanner({ proc, queued }) {
  // Expand by default when a distribution beat is running, so the
  // four destinations are visible without an extra click.
  const hasDist = Array.isArray(proc.dist) && proc.dist.length > 0;
  const [expanded, setExpanded] = useState(hasDist);
  // Keep it expanded once a dist starts; it auto-closes when proc clears.
  useEffect(() => { if (hasDist) setExpanded(true); }, [hasDist]);

  return (
    <div className="proc-banner">
      <div className="proc-dot"></div>
      <div className="proc-msg">{proc.message}</div>
      {queued > 0 && <span className="pill" style={{ fontSize: 11 }}>{queued} queued</span>}
      {proc.steps?.length > 0 && (
        <span className="proc-expand" onClick={() => setExpanded(e => !e)}>
          {expanded ? "▾ hide" : "▸ details"}
        </span>
      )}
      {expanded && proc.steps?.length > 0 && (
        <div style={{ flexBasis: "100%" }}>
          <div className="proc-steps">
            {proc.steps.map((s, i) => (
              <div key={i} className={`proc-step ${s.state}`}>
                <span className="step-mark">{s.state === "done" && <Icon name="check" size={11} style={{ color: "white" }} />}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          {hasDist && (
            <div className="dist-strip">
              <div className="dist-title">Distribution & record-keeping</div>
              {proc.dist.map((d) => (
                <div key={d.id} className={`dist-step ${d.state}`}>
                  <span className="dist-step-mark">
                    {d.state === "done"
                      ? <Icon name="check" size={11} style={{ color: "white" }} />
                      : <Icon name={d.icon || "send"} size={11} />}
                  </span>
                  <span>{d.label}</span>
                  <span className="dist-step-target">{d.target}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Summary cards
// ---------------------------------------------------------------
function SummaryCards({ client }) {
  const onb = client.onboardingTo || {};
  const isHero = client.id === "smith";
  const r = isHero ? countReadiness(client) : { ready: 0, total: 0 };
  const confirmedForms = (client.forms || []).filter(f => f.status !== "proposed");
  const formsReady = confirmedForms.filter(f => {
    const eff = deriveFormStatus(client, f.formId);
    return eff === "ready" || eff === "dispatched" || eff === "confirmed";
  }).length;
  const outstanding = isHero ? buildOutstandingActions(client).length : null;
  const formsCount = confirmedForms.length;
  const hasChecklist = r.total > 0;

  return (
    <div className="cf-section">
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12 }}>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="t-label" style={{ marginBottom: 6 }}>Onboarding to</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{onb.product}</div>
          <div className="t-secondary" style={{ fontSize: 12.5, marginBottom: 10 }}>{onb.productType}</div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 13, color: "var(--text-secondary)" }}>
            <span>Route</span><span style={{ color: "var(--text-primary)" }}>via {onb.route}</span>
            <span>Amount</span><span style={{ color: "var(--text-primary)" }} className="t-mono">{onb.amount}</span>
            <span>Support</span><span style={{ color: "var(--text-primary)" }}>{onb.support}</span>
          </div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="t-label" style={{ marginBottom: 6 }}>Household & accounts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {client.members.map((m, i) => (
              <div key={i} style={{ fontSize: 13 }}>{m}</div>
            ))}
            <div style={{ height: 1, background: "var(--border-subtle)", margin: "6px 0" }}></div>
            {client.accounts.map((a, i) => (
              <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)" }}>{a}</div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div className="t-label" style={{ marginBottom: 6 }}>Progress</div>
          {isHero && hasChecklist ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 600 }}>{r.ready}<span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}>/{r.total}</span></span>
                <span className="t-secondary">fields ready</span>
              </div>
              <div className="ready-bar" style={{ maxWidth: "none", margin: 0 }}>
                <div className="ready-bar-fill" style={{ width: `${(r.ready / r.total) * 100}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12.5, color: "var(--text-secondary)" }}>
                <span>{outstanding} outstanding</span>
                <span>{formsReady}/{formsCount} forms ready</span>
              </div>
            </>
          ) : isHero ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Awaiting form selection</div>
              <div className="t-secondary" style={{ fontSize: 12.5 }}>
                The required data and overall flow are driven by the forms in scope. Confirm proposed forms or add forms manually to establish the checklist.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{client.readinessSummary}</div>
              <div className="t-secondary">{formsCount} form{formsCount === 1 ? "" : "s"} in scope</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Outstanding actions
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// Outstanding actions — derived from actual field state
// ---------------------------------------------------------------
//
// Generates outstanding-action rows that cover EVERY problem field —
// using sensible grouping for the bulk cases (e.g. all identity
// missing -> one "Upload Photo ID" row that covers 8 fields).
//
// A `covered` Set tracks which keys have been surfaced by a row, and
// a final catch-all sweep ensures no problem field is silently hidden.
//
function buildOutstandingActions(client) {
  // No confirmed forms in scope → no checklist established → nothing to surface
  const confirmedForms = (client.forms || []).filter(f => f.status !== "proposed");
  if (confirmedForms.length === 0) return [];

  const f = client.fields || {};
  const problems = getProblemFields(client); // keys whose status is NOT verified/stale
  const out = [];
  const covered = new Set();
  const push = (row, keys = []) => { out.push(row); keys.forEach(k => covered.add(k)); };

  const idKeys = ["investor.given_names","investor.surname","investor.dob","investor.residential_address","investor.id_type","investor.id_number","investor.id_expiry","investor.dvs_verified"];
  const bankKeys = ["bank.institution","bank.bsb","bank.account_no","bank.account_name"];
  const isStatus = (k, s) => f[k]?.status === s;
  const isAnyOf = (k, ...ss) => ss.includes(f[k]?.status);

  // ---- Identity ----
  const allIdMissing = idKeys.every(k => isStatus(k, "missing"));
  if (allIdMissing) {
    push({ id: "id_bulk", sev: "missing", title: "Identity details not on file", why: "Photo ID not uploaded — given names, DOB, address, ID number and expiry all missing.", expects: "Photo ID (Driver's licence or passport)" }, idKeys.filter(k => !covered.has(k)));
  } else {
    const reviewIdKeys = idKeys.filter(k => isStatus(k, "review"));
    if (reviewIdKeys.length >= 2) {
      push({ id: "id_verify", sev: "attention", title: `${reviewIdKeys.length} extracted identity field${reviewIdKeys.length === 1 ? "" : "s"} pending DVS verification`, why: "AI-extracted values are kept off the form until DVS confirms them.", expects: "DVS verification return" }, reviewIdKeys);
    }
    if (isStatus("investor.id_expiry", "stale") && !covered.has("investor.id_expiry")) {
      push({ id: "id_exp", sev: "attention", title: "Photo ID expires in 18 days", why: "Within the chase window — a renewal request will be drafted automatically.", expects: "Renewed Photo ID from client" }, ["investor.id_expiry"]);
    }
    if (isStatus("investor.residential_address", "conflict") && !covered.has("investor.residential_address")) {
      push({ id: "addr", sev: "missing", title: "Address differs — Dynamics vs uploaded ID", why: "Both values are on file but they disagree.", expects: "Operator decision on which source is authoritative" }, ["investor.residential_address"]);
    }
  }

  // ---- Occupation ----
  if (isStatus("investor.occupation", "missing")) {
    push({ id: "occupation", sev: "missing", title: "Occupation not on file", why: "AML-required; not present in Dynamics or any uploaded document.", expects: "Adviser to update in Dynamics" }, ["investor.occupation"]);
  }

  // ---- Tax residency ----
  if (isStatus("investor.foreign_tax_resident", "missing")) {
    push({ id: "tax", sev: "missing", title: "Tax-residency answer missing", why: "Required for AML; the client hasn't confirmed whether they're a foreign tax resident.", expects: "Client email reply" }, ["investor.foreign_tax_resident"]);
  }

  // ---- TFN ----
  if (isStatus("investor.tfn", "failed")) {
    push({ id: "tfn", sev: "missing", title: "TFN failed checksum", why: "The value provided doesn't pass validation.", expects: "Corrected TFN from the client" }, ["investor.tfn"]);
  } else if (isStatus("investor.tfn", "missing")) {
    push({ id: "tfn_missing", sev: "missing", title: "TFN not provided", why: "Required from the investor; capture or record the exemption code instead.", expects: "Client to provide" }, ["investor.tfn"]);
  }

  // ---- Banking ----
  const allBankMissing = bankKeys.every(k => isStatus(k, "missing"));
  if (allBankMissing) {
    push({ id: "bank_bulk", sev: "missing", title: "Bank account details missing", why: "Distribution and direct-debit accounts not on file.", expects: "Bank statement upload" }, bankKeys);
  } else {
    const bankMissing = bankKeys.filter(k => isStatus(k, "missing"));
    if (bankMissing.length > 0) {
      const labels = bankMissing.map(k => FIELD_DEFS[k]?.label || k).join(", ");
      push({ id: "bank_partial", sev: "missing", title: `Bank details incomplete — ${bankMissing.length} field${bankMissing.length === 1 ? "" : "s"} missing`, why: `Outstanding: ${labels}.`, expects: "Bank statement upload" }, bankMissing);
    }
    if (isStatus("bank.account_no", "review")) {
      push({ id: "bank_acct", sev: "attention", title: "Extracted account number pending review", why: "Low-confidence OCR match.", expects: "Operator verification" }, ["bank.account_no"]);
    }
  }

  // ---- Risk ack ----
  if (isStatus("investment.risk_ack", "missing")) {
    push({ id: "risk", sev: "attention", title: "Risk acknowledgement not signed", why: "Client signature required before lodgement.", expects: "Client signature" }, ["investment.risk_ack"]);
  }

  // ---- FATCA / CRS unique fields ----
  const fatcaKeys = ["investor.tin_country","investor.foreign_tin"];
  const fatcaMissing = fatcaKeys.filter(k => isAnyOf(k, "missing","review","conflict","failed"));
  if (fatcaMissing.length > 0) {
    push({
      id: "fatca",
      sev: "missing",
      title: `FATCA / CRS self-certification — ${fatcaMissing.length} field${fatcaMissing.length === 1 ? "" : "s"} missing`,
      why: "Foreign tax-residency declaration needed; country of tax residence and matching TIN.",
      expects: "Signed FATCA / CRS form from client",
    }, fatcaMissing);
  }

  // ---- Wholesale Certificate unique fields ----
  const wholesaleKeys = ["wholesale.accountant_name","wholesale.cert_expiry"];
  const wholesaleMissing = wholesaleKeys.filter(k => isAnyOf(k, "missing","review","conflict","failed"));
  if (wholesaleMissing.length > 0) {
    push({
      id: "wholesale",
      sev: "missing",
      title: "Wholesale certificate not on file",
      why: "Sophisticated-investor status must be evidenced by an accountant's certificate (24-month validity).",
      expects: "Wholesale certificate upload",
    }, wholesaleMissing);
  }

  // ---- Direct Debit authority ----
  if (isAnyOf("bank.debit_authority", "missing","review","conflict","failed")) {
    push({
      id: "dd_auth",
      sev: "attention",
      title: "Direct-debit authority not signed",
      why: "Client signature required to authorise debits from the nominated account.",
      expects: "Signed direct-debit authority",
    }, ["bank.debit_authority"]);
  }

  // ---- Catch-all ----
  for (const p of problems) {
    if (covered.has(p.key)) continue;
    const sev = ["missing","conflict","failed"].includes(p.field.status) ? "missing" : "attention";
    push({
      id: `other:${p.key}`,
      sev,
      title: `${p.def?.label || p.key} — ${statusLabel(p.field.status)}`,
      why: p.field.error || p.field.source || "Required field.",
      expects: "Source document or system update",
    }, [p.key]);
  }

  const sevOrder = { missing: 0, attention: 1 };
  out.sort((a, b) => sevOrder[a.sev] - sevOrder[b.sev]);
  return out;
}

function OutstandingSection({ client, runEvent }) {
  const { dispatch } = useStore();
  // Hide entirely until at least one form has been confirmed (checklist established)
  const confirmedForms = (client.forms || []).filter(f => f.status !== "proposed");
  if (confirmedForms.length === 0) return null;

  const items = buildOutstandingActions(client);

  if (items.length === 0) {
    const fortlakeReady = deriveFormStatus(client, "fortlake_application") === "ready";
    const allTerminal = confirmedForms.every(f => f.status === "confirmed" || f.status === "dispatched");
    return (
      <div className="cf-section">
        <div className="cf-section-title">Outstanding</div>
        <div className="empty-state">
          <Icon name="check" size={24} style={{ color: "var(--ready)" }} />
          <div className="t-card-title" style={{ color: "var(--text-primary)" }}>Nothing outstanding</div>
          {fortlakeReady ? (
            <>
              <div className="t-secondary" style={{ marginTop: 4 }}>Fortlake application ready to lodge.</div>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => dispatch({ type: "OPEN_PREVIEW", clientId: client.id, formId: "fortlake_application" })}>
                Review & approve <Icon name="arrow-right" size={14} />
              </button>
            </>
          ) : (
            <div className="t-secondary" style={{ marginTop: 4 }}>All required fields are in. Awaiting next form-side check.</div>
          )}
        </div>
        {allTerminal && <OutcomeCredit client={client} />}
      </div>
    );
  }

  return (
    <div className="cf-section">
      <div className="cf-section-title-row">
        <span className="cf-section-title">Outstanding <span className="pill missing" style={{ marginLeft: 6 }}>{items.length}</span></span>
        <span className="t-muted">Sorted by compliance impact, then age</span>
      </div>
      {items.map(it => (
        <div key={it.id} className="action-row">
          <span className={`action-sev ${it.sev}`}><StatusGlyph status={it.sev === "missing" ? "missing" : "review"} size={14} /></span>
          <div className="action-body">
            <div className="action-title">{it.title}</div>
            <div className="action-why">{it.why}</div>
            {it.expects && (
              <div className="action-await">
                <Icon name="clock" size={11} />
                Awaiting: {it.expects}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------
// Outcome credit — celebratory summary once every form has dispatched.
// Shown inline at the bottom of the "nothing outstanding" empty state.
// ---------------------------------------------------------------
function OutcomeCredit({ client }) {
  const terminal = (client.forms || []).filter(f => f.status === "confirmed" || f.status === "dispatched");
  const { total: fieldsTotal } = countReadiness(client);
  return (
    <div className="outcome-credit">
      <span className="oc-mark"><Icon name="shield-check" size={22} /></span>
      <div>
        <div className="oc-title">{client.name} · onboarded end-to-end</div>
        <div className="oc-stats">
          <span className="oc-stat"><strong>{fieldsTotal}</strong> fields resolved</span>
          <span className="oc-stat"><strong>{terminal.length}</strong> form{terminal.length === 1 ? "" : "s"} lodged</span>
          <span className="oc-stat">Othello time: <strong>~12 min</strong></span>
          <span className="oc-stat" style={{ color: "var(--text-muted)" }}>(typical manual cycle: 2.5 hrs)</span>
        </div>
      </div>
      <span className="oc-cta">Filed · audit logged</span>
    </div>
  );
}

window.ClientFile = ClientFile;
window.buildOutstandingActions = buildOutstandingActions;
