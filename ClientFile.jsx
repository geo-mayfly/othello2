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
        <div className="cf-main">
          <SummaryCards client={client} />

          {isHero && <OutstandingSection client={client} runEvent={runEvent} dispatch={dispatch} />}

          <ClientFileTabs client={client} fieldsFlash={fieldsFlash[client.id] || {}} formsFlash={formsFlash[client.id] || {}} />
        </div>
        <ActivityPanel
          client={client}
          liveProc={proc?.clientId === client.id ? proc : null}
          queued={state.procQueue.length}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Activity panel — floating right-column inside the client container.
// Renders the live proc (if running on this client) as the top card,
// plus every seeded aiSequence entry from data.js. Each card is its
// own expandable record of an AI work item with sub-steps + evidence.
// ---------------------------------------------------------------
function ActivityPanel({ client, liveProc, queued }) {
  const seeded = client.aiSequences || [];
  const liveCard = liveProc ? procToCard(liveProc) : null;
  const cards = liveCard ? [liveCard, ...seeded] : seeded;

  if (cards.length === 0) return null;

  const running = cards.filter(c => c.state === "running" || c.state === "live").length;
  const alert = cards.filter(c => c.state === "alert" || c.state === "queued").length;
  const done = cards.filter(c => c.state === "done").length;

  return (
    <aside className="activity-panel">
      <div className="activity-panel-header">
        <span className="activity-panel-title">Activity</span>
        <span className="activity-panel-counts">
          {running > 0 && <span className="ap-count running">{running} running</span>}
          {alert > 0 && <span className="ap-count alert">{alert} need attention</span>}
          {done > 0 && <span className="ap-count done">{done} complete</span>}
        </span>
        {queued > 0 && <span className="pill" style={{ fontSize: 11 }}>{queued} queued</span>}
      </div>
      <div className="activity-panel-body">
        {cards.map((seq, i) => (
          <ActivityCard key={seq.id || `live-${i}`} seq={seq} initiallyOpen={seq.state === "live" || seq.state === "running" || i === 0} />
        ))}
      </div>
    </aside>
  );
}

function procToCard(proc) {
  // Translate the active proc.steps shape into the aiSequence card shape.
  // The live card animates and is always rendered at the top.
  const steps = (proc.steps || []).map((s, i) => ({
    label: s.label,
    state: s.state === "done" ? "done" : (s.state === "current" ? "current" : "pending"),
    evidence: null,
  }));
  // If a distribution strip is attached, append its rows as steps (preserves
  // the existing dispatch-flow story inside the new activity-panel chrome).
  if (Array.isArray(proc.dist) && proc.dist.length > 0) {
    proc.dist.forEach(d => {
      steps.push({
        label: d.label,
        state: d.state === "done" ? "done" : (d.state === "current" ? "current" : "pending"),
        evidence: d.target || null,
      });
    });
  }
  return {
    id: "live",
    title: proc.message || "Processing…",
    icon: "send",
    state: "live",
    source: null,
    summary: null,
    steps,
  };
}

function ActivityCard({ seq, initiallyOpen }) {
  const [open, setOpen] = useState(!!initiallyOpen);
  const stateClass = seq.state === "live" ? "live"
                   : seq.state === "running" ? "running"
                   : seq.state === "alert" ? "alert"
                   : seq.state === "queued" ? "queued"
                   : "done";

  const StateGlyph = () => {
    if (seq.state === "done") return <Icon name="check" size={12} />;
    if (seq.state === "alert") return <Icon name="warning" size={12} />;
    if (seq.state === "queued") return <Icon name="clock" size={12} />;
    return <span className="ap-dot" />; // live / running
  };

  return (
    <div className={`activity-card ${stateClass}`}>
      <div className="activity-card-header" onClick={() => setOpen(o => !o)}>
        <span className="activity-card-state"><StateGlyph /></span>
        <div className="activity-card-titles">
          <div className="activity-card-title">{seq.title}</div>
          {seq.summary && <div className="activity-card-summary">{seq.summary}</div>}
        </div>
        <div className="activity-card-meta">
          {seq.startedAgo && !seq.completedAgo && <span className="t-muted" style={{ fontSize: 11 }}>{seq.startedAgo}</span>}
          {seq.completedAgo && <span className="t-muted" style={{ fontSize: 11 }}>{seq.completedAgo} ago</span>}
        </div>
        <Icon name={open ? "chevron-down" : "chevron-right"} size={12} />
      </div>
      {open && seq.steps && seq.steps.length > 0 && (
        <div className="activity-card-body">
          {seq.source && (
            <div className="activity-card-source">
              <Icon name="doc" size={11} />
              <span>{seq.source}</span>
            </div>
          )}
          {seq.steps.map((s, i) => (
            <div key={i} className={`activity-step ${s.state}`}>
              <span className="activity-step-mark">
                {s.state === "done" && <Icon name="check" size={10} style={{ color: "white" }} />}
                {s.state === "alert" && <Icon name="warning" size={10} />}
                {s.state === "queued" && <Icon name="clock" size={10} />}
              </span>
              <span className="activity-step-label">{s.label}</span>
              {s.evidence && <span className="activity-step-evidence">{s.evidence}</span>}
            </div>
          ))}
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
          {onb.product ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{onb.product}</div>
              <div className="t-secondary" style={{ fontSize: 12.5, marginBottom: 10 }}>{onb.productType}</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 13, color: "var(--text-secondary)" }}>
                <span>Route</span><span style={{ color: "var(--text-primary)" }}>via {onb.route}</span>
                <span>Amount</span><span style={{ color: "var(--text-primary)" }} className="t-mono">{onb.amount}</span>
                <span>Support</span><span style={{ color: "var(--text-primary)" }}>{onb.support}</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--text-secondary)" }}>Awaiting adviser instruction</div>
              <div className="t-secondary" style={{ fontSize: 12.5 }}>
                Product, platform and investment amount will populate once the adviser brief is received.
              </div>
            </>
          )}
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

  // Flagged-item count = fields with data but unresolved (review/conflict/failed).
  // Used to surface a "Resolve flagged items" CTA so the operator has a clear
  // action point — the alternative was a magic auto-resolve with no UI hook.
  const FLAGGED = new Set(["review", "conflict", "failed"]);
  const flaggedKeys = Object.entries(client.fields || {})
    .filter(([, f]) => f && FLAGGED.has(f.status))
    .map(([k]) => k);
  const canResolveFlagged = client.id === "smith" && flaggedKeys.length > 0;

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
      {canResolveFlagged && (
        <div className="action-row" style={{ alignItems: "center", background: "var(--attention-soft)", borderColor: "transparent" }}>
          <span className="action-sev attention"><StatusGlyph status="review" size={14} /></span>
          <div className="action-body">
            <div className="action-title">{flaggedKeys.length} flagged item{flaggedKeys.length === 1 ? "" : "s"} awaiting your decision</div>
            <div className="action-why">Low-confidence extractions, validation failures and source conflicts — confirm to clear them in one pass.</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => runEvent("resolve_exceptions")}
            style={{ alignSelf: "center" }}
          >
            Resolve flagged items <Icon name="arrow-right" size={14} />
          </button>
        </div>
      )}
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
      <span className="oc-mark"><Icon name="check" size={18} /></span>
      <div>
        <div className="oc-title">Lodged</div>
        <div className="oc-stats">{fieldsTotal} fields · {terminal.length} form{terminal.length === 1 ? "" : "s"}</div>
      </div>
      <span className="oc-cta">Audit logged</span>
    </div>
  );
}

window.ClientFile = ClientFile;
window.buildOutstandingActions = buildOutstandingActions;
