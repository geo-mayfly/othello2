// ============================================================
// Othello — Data Room: a single DD container (the demo spine)
// ============================================================
//
// Phases: extracting → requirements → generating → generated → finalised
// Everything is pre-baked and self-driving (no demo-control wiring, no
// live model calls).

function DataRoomDD() {
  const { state, dispatch } = useStore();
  const dd = state.dataRoom.dd;
  if (!dd) return null;

  return (
    <div className="page dr-dd">
      <div className="dr-dd-header">
        <button className="btn btn-ghost" onClick={() => dispatch({ type: "DR_CLOSE_DD" })}>
          <Icon name="chevron-left" size={14} /> Data Rooms
        </button>
        <div style={{ flex: 1 }}>
          <div className="dr-dd-title">{dd.name}</div>
          <div className="dr-dd-sub">{DD_META.manager} · {DD_META.product} · {dd.requester}</div>
        </div>
        <PhasePill phase={dd.phase} />
      </div>

      {dd.phase === "extracting" && <Extraction />}
      {dd.phase === "requirements" && <Requirements />}
      {(dd.phase === "generating" || dd.phase === "generated" || dd.phase === "finalised") && <Generation />}
    </div>
  );
}

function PhasePill({ phase }) {
  const map = {
    extracting:   { c: "attention", t: "Extracting requirements" },
    requirements: { c: "accent",    t: "Requirements ready" },
    generating:   { c: "attention", t: "Generating" },
    generated:    { c: "accent",    t: "Review responses" },
    finalised:    { c: "ready",     t: "Finalised" },
  }[phase] || { c: "muted", t: phase };
  return <span className={`pill ${map.c}`} style={{ fontWeight: 600 }}>{map.t}</span>;
}

// ---------------------------------------------------------------
// Phase 1 — requirement extraction (processing animation)
// ---------------------------------------------------------------
function Extraction() {
  const { state, dispatch } = useStore();
  const speed = state.speed || 1;
  const STEPS = [
    "Reading the uploaded questionnaire…",
    "Detecting format & structure…",
    "Extracting requirements…",
    "Matching against the knowledge base…",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        setStep(i);
        await new Promise(r => setTimeout(r, 850 / speed));
      }
      if (cancelled) return;
      setStep(STEPS.length);
      await new Promise(r => setTimeout(r, 500 / speed));
      if (!cancelled) dispatch({ type: "DR_SET_PHASE", phase: "requirements" });
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="dr-proc">
      <div className="dr-proc-spinner"><span /></div>
      <div className="dr-proc-title">Processing “{state.dataRoom.dd.uploaded || "Sample DD Questionnaire.docx"}”</div>
      <div className="dr-proc-steps">
        {STEPS.map((s, i) => (
          <div key={i} className={`dr-proc-step ${i < step ? "done" : i === step ? "current" : ""}`}>
            <span className="dr-proc-dot">{i < step ? <Icon name="check" size={12} /> : null}</span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Phase 2 — review & modify requirements (chat-refine politely disabled)
// ---------------------------------------------------------------
function Requirements() {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState(DD_QUESTIONS[0].id);
  const q = DD_QUESTIONS.find(x => x.id === selected);

  return (
    <>
      <div className="dr-req-banner">
        <Icon name="sparkle" size={15} />
        <span><strong>{DD_QUESTIONS.length} requirements extracted.</strong> Excel platform review, Word checklist, PDF — any format in, the same requirements list out. Refine an item with the chat agent, or process them all.</span>
      </div>
      <div className="dr-req-grid">
        <div className="dr-req-list">
          {DD_QUESTIONS.map(item => (
            <div key={item.id} className={`dr-req-row ${selected === item.id ? "active" : ""}`} onClick={() => setSelected(item.id)}>
              <div className="dr-req-num">{item.n}</div>
              <div className="dr-req-body">
                <div className="dr-req-topic">{item.topic}{item.flag && <span className={`pill ${item.flag === "info" ? "attention" : "attention"} dr-flag-pill`}><Icon name="warning" size={10} /> {item.flag === "info" ? "may need info" : "currency check"}</span>}</div>
                <div className="dr-req-text">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="dr-req-detail">
          <div className="t-label">Requirement {q.n}</div>
          <div className="dr-req-detail-text">{q.text}</div>
          <div className="dr-req-source">Recognised from: {q.source}</div>
          <div className="dr-refine">
            <div className="dr-refine-head"><Icon name="chat" size={13} /> Refine with the chat agent</div>
            <div className="dr-refine-msg">You can narrow scope, change tone, or merge overlapping items here. Available in the full build.</div>
            <div className="dr-refine-input">
              <input className="chat-input" placeholder="e.g. “tighten this to the fund only”…" disabled />
              <button className="btn btn-secondary" disabled>Send</button>
            </div>
          </div>
        </div>
      </div>
      <div className="dr-actionbar">
        <span className="t-muted">All requirements look right? Othello will compile references from the knowledge base and draft each response.</span>
        <button className="btn btn-primary" onClick={() => dispatch({ type: "DR_SET_PHASE", phase: "generating" })}>
          <Icon name="sparkle" size={14} /> Process
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------
// Phase 3 — generation (streaming) + flags + finalise & export
// ---------------------------------------------------------------
function Generation() {
  const { state, dispatch } = useStore();
  const dd = state.dataRoom.dd;
  const phase = dd.phase;
  const total = DD_QUESTIONS.length;
  const [activeIndex, setActiveIndex] = useState(phase === "generating" ? 0 : total);
  const [reviewOpen, setReviewOpen] = useState(false);

  // advance to the next card after one finishes streaming
  const onStreamed = (i) => {
    const def = DD_QUESTIONS[i];
    dispatch({ type: "DR_SET_Q_STATUS", qid: def.id, status: def.flag ? "flagged" : "complete" });
    setTimeout(() => {
      if (i + 1 < total) setActiveIndex(i + 1);
      else { setActiveIndex(total); dispatch({ type: "DR_SET_PHASE", phase: "generated" }); }
    }, 320 / (state.speed || 1));
  };

  const flaggedUnresolved = dd.questions.filter(q => {
    const def = DD_QUESTIONS.find(x => x.id === q.id);
    if (!def.flag) return false;
    return def.flag === "info" ? !q.resolved : !q.validated;
  });
  const streamingDone = activeIndex >= total;

  const allDone = streamingDone && dd.questions.every(q => {
    const def = DD_QUESTIONS.find(x => x.id === q.id);
    if (def.flag === "info") return q.resolved;
    if (def.flag === "validation") return q.validated;
    return q.status === "complete";
  });

  return (
    <>
      <div className="dr-gen-toolbar">
        <span className="t-muted">
          {!streamingDone ? "Drafting responses from approved sources…"
            : flaggedUnresolved.length > 0 ? `${flaggedUnresolved.length} item${flaggedUnresolved.length === 1 ? "" : "s"} need your review before finalising.`
            : "Every response is drafted and traceable to an approved source."}
        </span>
        {streamingDone && flaggedUnresolved.length > 0 && phase !== "finalised" && (
          <button className="btn btn-primary" onClick={() => setReviewOpen(true)}>
            <Icon name="alert" size={14} /> Review ({flaggedUnresolved.length})
          </button>
        )}
      </div>

      <div className="dr-responses">
        {DD_QUESTIONS.map((def, i) => (
          i <= activeIndex && (
            <ResponseCard
              key={def.id}
              def={def}
              qState={dd.questions.find(q => q.id === def.id)}
              streaming={i === activeIndex && phase === "generating"}
              onStreamed={() => onStreamed(i)}
              onResolve={() => setReviewOpen(true)}
            />
          )
        ))}
      </div>

      {streamingDone && phase !== "finalised" && (
        <div className="dr-actionbar">
          <span className="t-muted">{allDone ? "All five responses approved." : "Resolve the flagged items to finalise."}</span>
          <button className="btn btn-primary" disabled={!allDone} onClick={() => dispatch({ type: "DR_FINALISE" })}>
            <Icon name="check" size={14} /> Finalise generation
          </button>
        </div>
      )}

      {phase === "finalised" && <ExportBar />}

      {reviewOpen && <ReviewModal onClose={() => setReviewOpen(false)} />}
    </>
  );
}

// ---------------------------------------------------------------
// A single response card with streaming reveal + reference chips
// ---------------------------------------------------------------
function ResponseCard({ def, qState, streaming, onStreamed, onResolve }) {
  const { state, dispatch } = useStore();
  const speed = state.speed || 1;
  const resp = DD_RESPONSES[def.id];

  const resolved = def.flag === "info" ? qState.resolved : def.flag === "validation" ? qState.validated : true;
  const showFinal = !!def.flag && resolved && resp.final;
  const body = showFinal ? resp.final.body : resp.body;
  const references = showFinal ? resp.final.references : resp.references;
  const flaggedNow = !!def.flag && !resolved;

  const [streamed, setStreamed] = useState(!streaming);
  useEffect(() => { if (!streaming) setStreamed(true); }, [streaming]);

  const statusPill = streaming && !streamed
    ? <span className="pill attention"><span className="dr-streaming-dot" /> Generating…</span>
    : flaggedNow
      ? <span className="pill attention"><Icon name="warning" size={11} /> {def.flag === "info" ? "Information request" : "Validation required"}</span>
      : <span className="pill ready"><Icon name="check" size={11} /> Complete{qState.validated ? " · manually validated" : ""}</span>;

  return (
    <div className="dr-card">
      <div className="dr-card-head">
        <div className="dr-card-title">Question {def.n} — {def.topic}</div>
        {statusPill}
      </div>
      <div className="dr-card-q">{def.text}</div>
      <div className="dr-card-body">
        {streaming && !streamed
          ? <StreamingText text={body} wordMs={42 / speed} onDone={() => { setStreamed(true); onStreamed(); }} />
          : <span>{body}</span>}
      </div>

      {showFinal && resp.final.table && <InsuranceTable table={resp.final.table} />}

      {streamed && (
        <div className="dr-refs">
          {references.map((r, i) => (
            r.docId
              ? <button key={i} className={`dr-chip ${r.primary ? "primary" : ""}`} onClick={() => dispatch({ type: "DR_OPEN_DOC", docId: r.docId, page: r.page, sheet: r.sheet })}>
                  <Icon name={r.sheet ? "sheet" : "doc"} size={11} /> {r.label}
                </button>
              : <span key={i} className="dr-chip static">{r.label}</span>
          ))}
        </div>
      )}

      {streamed && flaggedNow && (
        <div className={`dr-flag ${def.flag}`}>
          <div className="dr-flag-title"><Icon name="warning" size={13} /> {resp.flag.title}</div>
          <div className="dr-flag-copy">{resp.flag.copy}</div>
          <button className="btn btn-secondary dr-flag-btn" onClick={onResolve}>
            {def.flag === "info" ? "Upload & resolve" : "Validate response"}
          </button>
        </div>
      )}
    </div>
  );
}

function StreamingText({ text, wordMs, onDone }) {
  const [shown, setShown] = useState("");
  const doneRef = useRef(false);
  useEffect(() => {
    const words = text.split(" ");
    let i = 0;
    setShown("");
    doneRef.current = false;
    const id = setInterval(() => {
      i++;
      setShown(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(id);
        if (!doneRef.current) { doneRef.current = true; onDone && onDone(); }
      }
    }, Math.max(12, wordMs));
    return () => clearInterval(id);
  }, []);
  return <span>{shown}<span className="dr-caret" /></span>;
}

function InsuranceTable({ table }) {
  return (
    <table className="dr-table">
      <thead><tr>{table.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
      <tbody>{table.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

// ---------------------------------------------------------------
// Review modal — flag A (information request) + flag B (validation)
// ---------------------------------------------------------------
function ReviewModal({ onClose }) {
  const { state, dispatch, toast } = useStore();
  const dd = state.dataRoom.dd;
  const flagged = DD_QUESTIONS.filter(def => def.flag).map(def => ({
    def, qState: dd.questions.find(q => q.id === def.id),
  }));
  const remaining = flagged.filter(f => f.def.flag === "info" ? !f.qState.resolved : !f.qState.validated);

  // auto-close shortly after the last flag is cleared
  useEffect(() => { if (remaining.length === 0) { const t = setTimeout(onClose, 700); return () => clearTimeout(t); } }, [remaining.length]);

  return (
    <div className="preview-backdrop" onClick={onClose}>
      <div className="dr-review" onClick={e => e.stopPropagation()}>
        <div className="dr-review-head">
          <div>
            <div className="t-card-title">Review flagged items</div>
            <div className="t-muted" style={{ fontSize: 12 }}>{remaining.length === 0 ? "All items resolved." : `${remaining.length} item${remaining.length === 1 ? "" : "s"} require your input before finalising.`}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="dr-review-body">
          {flagged.map(({ def, qState }) => def.flag === "info"
            ? <InfoRequestItem key={def.id} def={def} qState={qState} />
            : <ValidationItem key={def.id} def={def} qState={qState} />)}
        </div>
        <div className="dr-review-foot">
          <button className="btn btn-primary" onClick={onClose}>{remaining.length === 0 ? "Done" : "Close"}</button>
        </div>
      </div>
    </div>
  );
}

function InfoRequestItem({ def, qState }) {
  const { dispatch, toast } = useStore();
  const resp = DD_RESPONSES[def.id];
  const [sync, setSync] = useState(true);
  const fileRef = useRef(null);

  const resolve = (fileName) => {
    dispatch({ type: "DR_RESOLVE_INFO", qid: def.id, sync });
    toast(`${fileName} added — response completed`, "ready");
    if (sync) setTimeout(() => toast("Synced to knowledge base · +1 document", "ready"), 450);
  };

  if (qState.resolved) {
    return (
      <div className="dr-review-item resolved">
        <div className="dr-review-item-head"><span className="pill ready"><Icon name="check" size={11} /> Resolved</span> <strong>Q{def.n} — {def.topic}</strong></div>
        <div className="t-secondary" style={{ fontSize: 13 }}>Certificates uploaded; the full insurance schedule is now in the response{DD_RESPONSES[def.id] ? "" : ""}.</div>
      </div>
    );
  }
  return (
    <div className="dr-review-item">
      <input type="file" ref={fileRef} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; resolve(f ? f.name : resp.flag.missingFile); e.target.value = ""; }} />
      <div className="dr-review-item-head"><span className="pill attention"><Icon name="warning" size={11} /> Information request</span> <strong>Q{def.n} — {def.topic}</strong></div>
      <div className="dr-flag-copy" style={{ marginTop: 8 }}>{resp.flag.copy}</div>
      <label className="dr-sync-row">
        <input type="checkbox" checked={sync} onChange={e => setSync(e.target.checked)} />
        Sync this document to the knowledge base for future use
      </label>
      <div className="dr-review-actions">
        <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}><Icon name="upload" size={13} /> Upload document</button>
        <button className="btn btn-primary" onClick={() => resolve(resp.flag.missingFile)}>Use staged: {resp.flag.missingFile}</button>
      </div>
    </div>
  );
}

function ValidationItem({ def, qState }) {
  const { dispatch, toast } = useStore();
  const resp = DD_RESPONSES[def.id];
  const [note, setNote] = useState(resp.flag.suggestedNote);
  const [editing, setEditing] = useState(false);

  if (qState.validated) {
    return (
      <div className="dr-review-item resolved">
        <div className="dr-review-item-head"><span className="pill ready"><Icon name="check" size={11} /> Validated</span> <strong>Q{def.n} — {def.topic}</strong></div>
        <div className="t-secondary" style={{ fontSize: 13 }}>Audit note: “{qState.auditNote}”</div>
      </div>
    );
  }
  return (
    <div className="dr-review-item">
      <div className="dr-review-item-head"><span className="pill attention"><Icon name="warning" size={11} /> Validation required</span> <strong>Q{def.n} — {def.topic}</strong></div>
      <div className="dr-flag-copy" style={{ marginTop: 8 }}>{resp.flag.copy}</div>
      <div className="t-label" style={{ marginTop: 12 }}>Audit note</div>
      <textarea className="dr-textarea" value={note} onChange={e => setNote(e.target.value)} rows={2} />
      <div className="dr-review-actions">
        <button className="btn btn-secondary" onClick={() => setEditing(true)} disabled={editing}>Edit response</button>
        <button className="btn btn-primary" onClick={() => { dispatch({ type: "DR_VALIDATE", qid: def.id, auditNote: note }); toast("Marked as validated · audit note stored", "ready"); }}>Mark as validated</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Finalise & export
// ---------------------------------------------------------------
function ExportBar() {
  const { state, toast } = useStore();
  const dd = state.dataRoom.dd;
  const [copied, setCopied] = useState(false);

  const composeText = () => {
    const lines = [`${DD_META.title} — Completed Draft`, `Manager: ${DD_META.manager}`, `Product: ${DD_META.product}`, ""];
    for (const def of DD_QUESTIONS) {
      const q = dd.questions.find(x => x.id === def.id);
      const resp = DD_RESPONSES[def.id];
      const resolved = def.flag === "info" ? q.resolved : def.flag === "validation" ? q.validated : true;
      const body = (def.flag && resolved && resp.final) ? resp.final.body : resp.body;
      lines.push(`Question ${def.n} — ${def.topic}`);
      lines.push(def.text);
      lines.push(body);
      if (q.auditNote) lines.push(`Audit note: ${q.auditNote}`);
      lines.push("");
    }
    return lines.join("\n");
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(composeText()); } catch (e) {}
    setCopied(true);
    toast("Completed responses copied to clipboard", "ready");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dr-export">
      <div className="dr-export-icon"><Icon name="check" size={18} /></div>
      <div style={{ flex: 1 }}>
        <div className="t-card-title">All five responses approved — ready to export</div>
        <div className="t-muted" style={{ fontSize: 12.5, marginTop: 2 }}>Today's answers drew partly on the last questionnaire you completed. Every DD you finish makes the next one faster.</div>
      </div>
      <button className="btn btn-secondary" onClick={copy}><Icon name="copy" size={14} /> {copied ? "Copied" : "Copy to clipboard"}</button>
      <a className="btn btn-primary" href={DD_EXPORT_PDF} download>
        <Icon name="download" size={14} /> Generate PDF
      </a>
    </div>
  );
}

window.DataRoomDD = DataRoomDD;
window.ResponseCard = ResponseCard;
window.ReviewModal = ReviewModal;
