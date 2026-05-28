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

  // Activity window open/closed. Defaults closed; opens when the operator
  // clicks the status line in the header.
  const [activityOpen, setActivityOpen] = useState(false);

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

  const liveProc = proc?.clientId === client.id ? proc : null;
  const seededSeqs = client.aiSequences || [];
  const hasAnyActivity = !!liveProc || seededSeqs.length > 0;

  return (
    <div className="content" style={{ minWidth: 0, position: "relative" }}>
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
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {hasAnyActivity && (
              <div className="activity-anchor">
                <ActivityChip
                  client={client}
                  liveProc={liveProc}
                  seededSeqs={seededSeqs}
                  queued={state.procQueue.length}
                  open={activityOpen}
                  onToggle={() => setActivityOpen(o => !o)}
                />
                {activityOpen && (
                  <ActivityWindow
                    client={client}
                    liveProc={liveProc}
                    queued={state.procQueue.length}
                    onClose={() => setActivityOpen(false)}
                  />
                )}
              </div>
            )}
            <button className="btn btn-ghost btn-icon" title="More"><Icon name="more" /></button>
          </div>
        </div>
        <div className="cf-header-sub">
          {(() => {
            // Drop the redundant "{Name} — individual" chip for solo individuals
            // — the Individual entity chip already conveys the same thing.
            const members = client.members || [];
            const isSoloIndividual = client.entityType === "Individual"
              && members.length === 1
              && /individual/i.test(members[0]);
            if (isSoloIndividual) return null;
            return members.slice(0, 3).map((m, i) => (
              <span key={i} className="cf-chip">{m}</span>
            ));
          })()}
          <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8, alignItems: "center" }}>
            <span className="adviser-chip">
              <span className="adviser-avatar">{adviserInitials(client.adviser)}</span>
              <span className="adviser-name">{client.adviser}</span>
            </span>
            <span className="t-muted">·</span>
            <span className="t-muted">Updated {client.lastActivity}</span>
          </span>
        </div>
      </div>

      <div className="cf-body">
        <SummaryCards client={client} />

        <OutstandingSection client={client} runEvent={runEvent} dispatch={dispatch} />

        <ClientFileTabs client={client} fieldsFlash={fieldsFlash[client.id] || {}} formsFlash={formsFlash[client.id] || {}} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Activity chip — single status line in the client header.
// Default view of the activity surface. Shows the live action being
// processed by the AI (or "Idle · n recent" when nothing's running).
// Click to expand the floating ActivityWindow with the full sequence
// list and per-step evidence.
// ---------------------------------------------------------------
function ActivityChip({ client, liveProc, seededSeqs, queued, open, onToggle }) {
  const runningSeed = seededSeqs.find(s => s.state === "running");
  const alertCount  = seededSeqs.filter(s => s.state === "alert").length;
  const isLive = !!(liveProc || runningSeed);

  // Compact label: live proc message > running seed title > "Activity".
  const label = liveProc?.message
    || (runningSeed && runningSeed.title)
    || "Activity";

  // Subtle count next to the label so the operator can see at-a-glance
  // there's something needing attention without opening the window.
  const badgeText = alertCount > 0
    ? `${alertCount}`
    : (isLive ? null : `${seededSeqs.length}`);
  const badgeKind = alertCount > 0 ? "missing" : "";

  return (
    <button
      className={`activity-chip ${isLive ? "live" : ""} ${open ? "open" : ""}`}
      onClick={onToggle}
      title={open ? "Hide activity" : "Show activity"}
    >
      <span className="activity-chip-state">
        {isLive ? <span className="ap-dot" /> : <Icon name="activity" size={11} />}
      </span>
      <span className="activity-chip-text">{label}</span>
      {badgeText && <span className={`activity-chip-badge ${badgeKind}`}>{badgeText}</span>}
      <Icon name={open ? "chevron-up" : "chevron-down"} size={12} />
    </button>
  );
}

// ---------------------------------------------------------------
// Activity window — floating overlay opened from the chip. Holds the
// live proc card (if any) plus every seeded aiSequence with sub-steps
// and per-step evidence.
// ---------------------------------------------------------------
function ActivityWindow({ client, liveProc, queued, onClose }) {
  const seeded = client.aiSequences || [];
  const liveCard = liveProc ? procToCard(liveProc) : null;
  const cards = liveCard ? [liveCard, ...seeded] : seeded;

  const running = cards.filter(c => c.state === "running" || c.state === "live").length;
  const alert = cards.filter(c => c.state === "alert" || c.state === "queued").length;
  const done = cards.filter(c => c.state === "done").length;

  return (
    <div className="activity-window">
      <div className="activity-window-header">
        <span className="activity-window-title">Activity</span>
        <span className="activity-window-counts">
          {running > 0 && <span className="ap-count running">{running} running</span>}
          {alert > 0 && <span className="ap-count alert">{alert} need attention</span>}
          {done > 0 && <span className="ap-count done">{done} complete</span>}
        </span>
        {queued > 0 && <span className="pill" style={{ fontSize: 11 }}>{queued} queued</span>}
        <button className="btn btn-ghost btn-icon" onClick={onClose} title="Collapse"><Icon name="x" size={14} /></button>
      </div>
      <div className="activity-window-body">
        {cards.map((seq, i) => (
          <ActivityCard key={seq.id || `live-${i}`} seq={seq} initiallyOpen={seq.state === "live" || seq.state === "running" || i === 0} />
        ))}
      </div>
    </div>
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
    // Smith pre-chase wording — kept on Smith's path only. Non-Smith
    // clients fall through to id_renewal_chase below if their stale ID
    // already has a renewal request in the activity log.
    if (client.id === "smith" && isStatus("investor.id_expiry", "stale") && !covered.has("investor.id_expiry")) {
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
    // Smith-only per-field nudges — non-Smith clients get the aggregate
    // bank_review / risk_ack_chase cards added further down with proper
    // actions wired to them.
    if (client.id === "smith" && isStatus("bank.account_no", "review")) {
      push({ id: "bank_acct", sev: "attention", title: "Extracted account number pending review", why: "Low-confidence OCR match.", expects: "Operator verification" }, ["bank.account_no"]);
    }
  }

  // ---- Risk ack (Smith only — non-Smith uses risk_ack_chase below) ----
  if (client.id === "smith" && isStatus("investment.risk_ack", "missing")) {
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
  // Status-aware: if the cert is on file but expired (failed), the story
  // is "renew it"; if it's missing/review, the story is "get one filed".
  const wholesaleKeys = ["wholesale.accountant_name","wholesale.cert_expiry"];
  const wholesaleMissing = wholesaleKeys.filter(k => isAnyOf(k, "missing","review","conflict","failed"));
  if (wholesaleMissing.length > 0) {
    if (isStatus("wholesale.cert_expiry", "failed")) {
      push({
        id: "wholesale_expired",
        sev: "missing",
        title: "Wholesale certificate expired",
        why: f["wholesale.cert_expiry"]?.error || "Sophisticated-investor status must be evidenced by an unexpired accountant's certificate (24-month validity).",
        expects: "Renewed certificate from client (via their accountant)",
        action: { label: "Send renewal request", run: "auto_chase_okafor" },
      }, wholesaleMissing);
    } else {
      push({
        id: "wholesale",
        sev: "missing",
        title: "Wholesale certificate not on file",
        why: "Sophisticated-investor status must be evidenced by an accountant's certificate (24-month validity).",
        expects: "Wholesale certificate upload",
      }, wholesaleMissing);
    }
  }

  // ---- Stale Photo ID with renewal already in flight ----
  // Brennan's seed has the renewal chase already sent yesterday.
  if (isStatus("investor.id_expiry", "stale") && !covered.has("investor.id_expiry")) {
    const renewalSent = (client.activity || []).some(a => /renewal request emailed/i.test(a.desc || ""));
    if (renewalSent) {
      push({
        id: "id_renewal_chase",
        sev: "attention",
        title: "Photo ID renewal request sent · awaiting reply",
        why: `Expires ${f["investor.id_expiry"]?.value || "soon"}. First chase went out yesterday with no reply yet; auto follow-up is scheduled for 30/05/2026.`,
        expects: "Client reply with renewed Photo ID",
        action: { label: "Send follow-up now", run: "send_brennan_followup" },
      }, ["investor.id_expiry"]);
    }
  }

  // ---- Bank statement extraction in review (low confidence) ----
  // Nguyen's seed has 4 bank.* fields in review.
  const bankReviewKeys = bankKeys.filter(k => isStatus(k, "review"));
  if (bankReviewKeys.length > 0 && !bankReviewKeys.some(k => covered.has(k))) {
    push({
      id: "bank_review",
      sev: "attention",
      title: `Bank statement extraction · ${bankReviewKeys.length} field${bankReviewKeys.length === 1 ? "" : "s"} awaiting verification`,
      why: "OCR confidence on the extracted bank details is below the 80% auto-verify threshold. Confirm or correct each field.",
      expects: "Operator verification",
      action: { label: "Review bank fields", run: { type: "OPEN_RESOLVE", clientId: client.id } },
    }, bankReviewKeys);
  }

  // ---- Risk acknowledgement not signed (non-Smith path; Smith handles in slideover) ----
  if (isStatus("investment.risk_ack", "missing") && client.id !== "smith" && !covered.has("investment.risk_ack")) {
    push({
      id: "risk_ack_chase",
      sev: "attention",
      title: "Risk acknowledgement not signed",
      why: "Client signature required before lodgement. Risk-ack form has not been sent yet.",
      expects: "Signed risk-acknowledgement from client",
      action: { label: "Email risk-ack form", run: "send_nguyen_risk_ack" },
    }, ["investment.risk_ack"]);
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
            <div className="action-title">{flaggedKeys.length} flagged item{flaggedKeys.length === 1 ? "" : "s"} awaiting your review</div>
            <div className="action-why">Low-confidence extractions, validation failures and source conflicts. Open the review panel to inspect each one and approve, correct or pick the authoritative source.</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => dispatch({ type: "OPEN_RESOLVE", clientId: client.id })}
            style={{ alignSelf: "center" }}
          >
            Review &amp; resolve <Icon name="arrow-right" size={14} />
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
          {it.action && (
            <button
              className="btn btn-secondary action-cta"
              onClick={() => {
                if (typeof it.action.run === "string") runEvent(it.action.run);
                else dispatch(it.action.run);
              }}
            >
              {it.action.label} <Icon name="arrow-right" size={12} />
            </button>
          )}
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

// ---------------------------------------------------------------
// Resolve flagged items — review slideover.
// One card per field that's in review / failed / conflict status.
// Each card shows the actual data, the reason it was flagged, and an
// operator decision (confirm / accept correction / pick source /
// attest). Verifying a field dispatches UPDATE_CLIENT_FIELDS for that
// specific key plus an ADD_ACTIVITY entry, so the operator's decision
// is recorded in the audit log. Slideover auto-closes when no flagged
// items remain.
// ---------------------------------------------------------------
function ResolveSlideover() {
  const { state, dispatch, runEvent } = useStore();
  const open = state.resolveOpen;
  if (!open) return null;
  const client = state.clients.find(c => c.id === open.clientId);
  if (!client) return null;

  const f = client.fields || {};
  const close = () => dispatch({ type: "CLOSE_RESOLVE" });

  // Build the card list dynamically from the open client's flagged fields.
  // For Smith we recognise his four specific keys and render the named
  // cards (account_no / tfn / address / risk_ack). For everyone else we
  // render the generic per-field card (currently used for Nguyen's four
  // bank.* fields in review).
  const cards = [];
  const SMITH_KEYS = new Set(["bank.account_no","investor.tfn","investor.residential_address","investment.risk_ack"]);

  if (client.id === "smith") {
    cards.push({
      id: "bank.account_no",
      title: "Account number — low confidence",
      kind: "review",
      done: f["bank.account_no"]?.status === "verified",
      render: () => <ResolveAccountNo client={client} field={f["bank.account_no"]} dispatch={dispatch} />,
    });
    cards.push({
      id: "investor.tfn",
      title: "TFN checksum failed",
      kind: "failed",
      done: f["investor.tfn"]?.status === "verified",
      render: () => <ResolveTFN client={client} field={f["investor.tfn"]} dispatch={dispatch} />,
    });
    cards.push({
      id: "investor.residential_address",
      title: "Residential address — sources disagree",
      kind: "conflict",
      done: f["investor.residential_address"]?.status === "verified",
      render: () => <ResolveAddress client={client} field={f["investor.residential_address"]} dispatch={dispatch} />,
    });
    cards.push({
      id: "investment.risk_ack",
      title: "Risk acknowledgement — not yet recorded",
      kind: "missing",
      done: f["investment.risk_ack"]?.status === "verified",
      render: () => <ResolveRiskAck client={client} field={f["investment.risk_ack"]} dispatch={dispatch} />,
    });
  } else {
    // Generic path — surface any field that's in review/failed/conflict.
    const flaggedEntries = Object.entries(f).filter(([k, v]) => {
      if (!v) return false;
      if (SMITH_KEYS.has(k)) return false; // Smith-only keys
      return ["review", "failed", "conflict"].includes(v.status);
    });
    for (const [key, field] of flaggedEntries) {
      const def = FIELD_DEFS[key];
      if (!def) continue;
      const kind = field.status === "review" ? "review" : field.status === "conflict" ? "conflict" : "failed";
      cards.push({
        id: key,
        title: `${def.label} — ${field.status === "review" ? "low confidence" : field.status === "conflict" ? "sources disagree" : "validation failed"}`,
        kind,
        done: f[key]?.status === "verified",
        render: () => <ResolveGenericField client={client} fieldKey={key} field={field} def={def} dispatch={dispatch} />,
      });
    }
  }

  const pending = cards.filter(c => !c.done);
  const resolvedCount = cards.length - pending.length;

  // Auto-close once everything's resolved (give the operator 700ms to see
  // the final tick before the panel disappears).
  if (pending.length === 0) {
    setTimeout(() => dispatch({ type: "CLOSE_RESOLVE" }), 700);
  }

  return (
    <div className="resolve-backdrop" onClick={close}>
      <div className="resolve-shell" onClick={(e) => e.stopPropagation()}>
        <div className="resolve-head">
          <div>
            <div className="resolve-title">Review flagged items</div>
            <div className="resolve-sub">
              {pending.length === 0
                ? "All flagged items resolved"
                : `${pending.length} of ${cards.length} awaiting your decision`}
              {resolvedCount > 0 && pending.length > 0 && (
                <> · {resolvedCount} resolved</>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={close} title="Close"><Icon name="x" size={14} /></button>
        </div>

        <div className="resolve-body">
          {cards.map((c) => (
            <div key={c.id} className={`resolve-card ${c.kind} ${c.done ? "done" : ""}`}>
              <div className="resolve-card-head">
                <span className={`resolve-card-mark ${c.done ? "done" : c.kind}`}>
                  {c.done ? <Icon name="check" size={12} /> : (c.kind === "failed" ? <Icon name="warning" size={11} /> : <span className="ap-dot" />)}
                </span>
                <div className="resolve-card-title">{c.title}</div>
                {c.done && <span className="pill ready" style={{ fontSize: 10.5, padding: "1px 7px" }}>Resolved</span>}
              </div>
              {!c.done && (
                <div className="resolve-card-body">
                  {c.render()}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="resolve-foot">
          {pending.length > 0 ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  // Fast path — fire the appropriate batch-confirm script
                  // for this client. The slideover auto-closes as fields
                  // flip verified.
                  runEvent(client.id === "smith" ? "resolve_exceptions" : "confirm_nguyen_bank");
                }}
              >
                Resolve all (accept suggestions)
              </button>
              <span className="t-muted" style={{ fontSize: 11.5 }}>Or work through each card individually.</span>
            </>
          ) : (
            <span className="t-muted" style={{ fontSize: 12 }}>Closing…</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Individual resolution cards ----

// Generic per-field card — shows the extracted value, source line,
// confidence (if any) and a single "Confirm" action. Used for any
// non-Smith client's review/failed/conflict fields (currently Nguyen's
// four bank.* fields).
function ResolveGenericField({ client, fieldKey, field, def, dispatch }) {
  const value = field?.value || "—";
  const confidence = field?.confidence != null
    ? `${Math.round(field.confidence * 100)}%`
    : null;
  const sourceLabel = field?.source || def?.source || "—";
  const onConfirm = () => {
    dispatch({
      type: "UPDATE_CLIENT_FIELDS",
      clientId: client.id,
      updates: { [fieldKey]: { value, status: "verified", source: "Confirmed by Rachel Lee" } },
    });
    dispatch({
      type: "ADD_ACTIVITY",
      clientId: client.id,
      entry: { actor: "Rachel Lee", desc: `Confirmed ${def?.label || fieldKey} · ${value}` },
    });
  };
  return (
    <>
      <div className="resolve-why">
        {field?.status === "review"
          ? "Low-confidence OCR extraction. Confidence below the 80% auto-verify threshold."
          : field?.status === "conflict"
            ? "Two sources disagree on this value. Pick the one to use."
            : field?.error || "Validation failed."}
      </div>
      <div className="resolve-evidence">
        <div className="resolve-evidence-head">Source · {sourceLabel}</div>
        <div className="resolve-evidence-snip">
          {def?.label || fieldKey}: <strong>{value}</strong>
          {confidence && <span className="t-muted" style={{ marginLeft: 8 }}>Confidence: {confidence}</span>}
        </div>
      </div>
      <div className="resolve-actions">
        <button className="btn btn-primary" onClick={onConfirm}>Confirm {value}</button>
      </div>
    </>
  );
}

function ResolveAccountNo({ client, field, dispatch }) {
  const value = field?.value || "•••• 8412";
  const confidence = field?.confidence != null
    ? `${Math.round(field.confidence * 100)}%`
    : "62%";
  const onConfirm = () => {
    dispatch({
      type: "UPDATE_CLIENT_FIELDS",
      clientId: client.id,
      updates: { "bank.account_no": { value, status: "verified", source: "Confirmed by Rachel Lee" } },
    });
    dispatch({
      type: "ADD_ACTIVITY",
      clientId: client.id,
      entry: { actor: "Rachel Lee", desc: `Confirmed account number ${value}` },
    });
  };
  return (
    <>
      <div className="resolve-why">Low-confidence OCR extraction. Confidence below the 80% auto-verify threshold.</div>
      <div className="resolve-evidence">
        <div className="resolve-evidence-head">Source · CBA_Statement_May.pdf</div>
        <div className="resolve-evidence-snip">
          <span className="t-muted">…Statement period 01–30 Apr 2026…</span>
          <br />Account name: <strong>John A. Smith</strong>
          <br />BSB: 063-019 &nbsp; Account: <mark>{value}</mark>
          <br /><span className="t-muted">Confidence on account digits: {confidence}</span>
        </div>
      </div>
      <div className="resolve-actions">
        <button className="btn btn-primary" onClick={onConfirm}>Confirm {value}</button>
        <button className="btn btn-secondary" disabled title="Request re-extract from source">Reject &amp; re-extract</button>
      </div>
    </>
  );
}

function ResolveTFN({ client, field, dispatch }) {
  const captured = field?.value || "623 ••• 451";
  const suggested = "623 ••• 458";
  const [showInput, setShowInput] = useState(false);
  const [manualVal, setManualVal] = useState(suggested);

  const apply = (val, sourceLabel) => {
    dispatch({
      type: "UPDATE_CLIENT_FIELDS",
      clientId: client.id,
      updates: { "investor.tfn": { value: val, status: "verified", source: sourceLabel } },
    });
    dispatch({
      type: "ADD_ACTIVITY",
      clientId: client.id,
      entry: { actor: "Rachel Lee", desc: `Corrected TFN · checksum OK (${val})` },
    });
  };

  return (
    <>
      <div className="resolve-why">Modulus-11 checksum doesn't match — last digit is off by 1.</div>
      <div className="resolve-evidence">
        <div className="resolve-evidence-head">Captured value</div>
        <div className="resolve-evidence-snip">
          <span style={{ fontFamily: "var(--font-mono)" }}>{captured}</span>
          <span className="resolve-tag failed">checksum failed</span>
        </div>
        <div className="resolve-evidence-head" style={{ marginTop: 10 }}>Clarifying email reply · client · 6m ago</div>
        <div className="resolve-evidence-snip">
          <span className="t-muted">"Sorry about the typo — correct TFN is "</span><strong>{suggested}</strong>
          <span className="resolve-tag ready">checksum OK</span>
        </div>
      </div>
      <div className="resolve-actions">
        <button className="btn btn-primary" onClick={() => apply(suggested, "Corrected by Rachel Lee · client email reply · checksum OK")}>
          Accept correction {suggested}
        </button>
        <button className="btn btn-secondary" onClick={() => setShowInput(s => !s)}>
          {showInput ? "Hide manual entry" : "Enter manually"}
        </button>
      </div>
      {showInput && (
        <div className="resolve-manual">
          <label className="resolve-manual-label">Enter the correct TFN</label>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              className="resolve-input"
              value={manualVal}
              onChange={(e) => setManualVal(e.target.value)}
              placeholder="9 digits"
            />
            <button className="btn btn-secondary" onClick={() => apply(manualVal, "Manually entered by Rachel Lee · checksum OK")}>Save</button>
          </div>
        </div>
      )}
    </>
  );
}

function ResolveAddress({ client, field, dispatch }) {
  const dynVal = field?.conflict?.dynamics || "Unit 4, 42 Linden St, Carlton VIC 3053";
  const idVal  = field?.conflict?.id       || "42 Linden St, Carlton VIC 3053";

  const pick = (val, sourceLabel) => {
    dispatch({
      type: "UPDATE_CLIENT_FIELDS",
      clientId: client.id,
      updates: { "investor.residential_address": { value: val, status: "verified", source: sourceLabel } },
    });
    dispatch({
      type: "ADD_ACTIVITY",
      clientId: client.id,
      entry: { actor: "Rachel Lee", desc: `Address resolved · ${sourceLabel}` },
    });
  };

  return (
    <>
      <div className="resolve-why">Two sources disagree. Pick the one to use on the form — Dynamics has a unit number that the OCR'd ID didn't capture.</div>
      <div className="resolve-conflict">
        <div className="resolve-conflict-card">
          <div className="resolve-conflict-head">Dynamics CRM</div>
          <div className="resolve-conflict-val">{dynVal}</div>
          <div className="resolve-conflict-meta">Updated 14 May 2026 · Adviser Catherine Halford</div>
          <button className="btn btn-primary" onClick={() => pick(dynVal, "Dynamics chosen by Rachel Lee")}>Use this value</button>
        </div>
        <div className="resolve-conflict-card">
          <div className="resolve-conflict-head">Photo ID OCR</div>
          <div className="resolve-conflict-val">{idVal}</div>
          <div className="resolve-conflict-meta">Extracted just now · DVS-matched</div>
          <button className="btn btn-secondary" onClick={() => pick(idVal, "Photo ID chosen by Rachel Lee")}>Use this value</button>
        </div>
      </div>
    </>
  );
}

function ResolveRiskAck({ client, field, dispatch }) {
  const onAttest = () => {
    dispatch({
      type: "UPDATE_CLIENT_FIELDS",
      clientId: client.id,
      updates: { "investment.risk_ack": { value: "Acknowledged", status: "verified", source: "Client signature · 27 May 2026" } },
    });
    dispatch({
      type: "ADD_ACTIVITY",
      clientId: client.id,
      entry: { actor: "Rachel Lee", desc: "Risk acknowledgement recorded · signed copy on file" },
    });
  };

  return (
    <>
      <div className="resolve-why">
        Client must acknowledge fund risk before the form can be lodged. A signed risk-acknowledgement form was received via email on 27 May 2026 and is filed in the document vault.
      </div>
      <div className="resolve-evidence">
        <div className="resolve-evidence-head">Attached evidence</div>
        <div className="resolve-evidence-snip">
          <Icon name="doc" size={11} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Risk_Ack_J_Smith_Signed.pdf
          <span className="t-muted" style={{ marginLeft: 8 }}>Received 27 May 2026 · 1 page · signed by John A. Smith</span>
        </div>
      </div>
      <div className="resolve-actions">
        <button className="btn btn-primary" onClick={onAttest}>
          <Icon name="check" size={12} /> Confirm signature on file
        </button>
      </div>
    </>
  );
}

window.ClientFile = ClientFile;
window.ResolveSlideover = ResolveSlideover;
window.buildOutstandingActions = buildOutstandingActions;
