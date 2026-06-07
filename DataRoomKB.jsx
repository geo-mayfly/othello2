// ============================================================
// Othello — Data Room: Knowledge Base module (stand-alone)
// ============================================================
//
// Static, pre-seeded document library + freeform notes. Per-document
// metadata (title, type, as-at, added, source). Upload is visible but
// staged. The document count increments when the Flag-A remediation
// syncs the Chubb certificate to the KB.

function KnowledgeBase() {
  const { state, dispatch, toast } = useStore();
  const { kbDocs, kbFreeform } = state.dataRoom;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | active
  const fileRef = useRef(null);

  const visible = kbDocs.filter(d => {
    if (filter === "active" && !d.active) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!`${d.title} ${d.type} ${d.desc || ""}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeCount = kbDocs.filter(d => d.active).length;

  const openDoc = (d) => dispatch({ type: "DR_OPEN_DOC", docId: d.id, page: d.kind === "pdf" ? 1 : undefined, sheet: d.kind === "sheet" ? Object.keys(SHEET_SNIPPETS)[0] : undefined });

  const onStagedFile = (e) => {
    const f = e.target.files?.[0];
    if (f) toast(`“${f.name}” staged — syncs to the knowledge base in production`, "info");
    e.target.value = "";
  };

  return (
    <div className="page">
      <input type="file" ref={fileRef} style={{ display: "none" }} onChange={onStagedFile} />
      <div className="page-header">
        <div>
          <div className="page-title">Knowledge Base</div>
          <div className="page-sub">Copia's evidence library. Every document lives here once and keeps compounding — finished questionnaires become first-class evidence for the next one.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="cl-search-wrap" style={{ marginBottom: 0, minWidth: 220 }}>
            <Icon name="search" size={14} />
            <input className="cl-search" placeholder="Search the knowledge base…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}><Icon name="upload" size={14} /> Upload</button>
        </div>
      </div>

      <div className="kb-stat-row">
        <div className="kb-stat"><span className="kb-stat-num">{kbDocs.length}</span><span className="kb-stat-label">documents</span></div>
        <div className="kb-stat"><span className="kb-stat-num">{kbFreeform.length}</span><span className="kb-stat-label">freeform notes</span></div>
        <div className="kb-stat"><span className="kb-stat-num">{activeCount}</span><span className="kb-stat-label">wired to answers</span></div>
        <div style={{ flex: 1 }} />
        <div className="seg">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "active" ? "on" : ""} onClick={() => setFilter("active")}>Active</button>
        </div>
      </div>

      {/* Freeform notes */}
      <div className="cf-section">
        <div className="cf-section-title">Freeform notes <span className="t-muted">— knowledge that isn't a document</span></div>
        <div className="kb-note-grid">
          {kbFreeform.map(n => (
            <div key={n.id} className="kb-note">
              <div className="kb-note-head"><Icon name="file-text" size={14} /> {n.title}</div>
              <div className="kb-note-body">{n.body}</div>
              <div className="kb-note-foot">Source: {n.source} · added {n.added}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Document library */}
      <div className="cf-section">
        <div className="cf-section-title">Document library <span className="t-muted">— {visible.length} shown</span></div>
        <div className="bordered" style={{ background: "var(--bg-surface)", overflow: "hidden" }}>
          <div className="kb-row kb-row-head">
            <span>Document</span><span>Type</span><span>As-at</span><span>Added</span><span>Source</span><span>Feeds</span>
          </div>
          {visible.map(d => (
            <div key={d.id} className={`kb-row ${d.justSynced ? "kb-row-new" : ""}`} onClick={() => openDoc(d)}>
              <span className="kb-doc-cell">
                <Icon name={docIcon(d.kind)} size={15} className="kb-doc-icon" />
                <span>
                  <span className="kb-doc-title">{d.title}</span>
                  {d.active && <span className="pill ready kb-active-pill"><span className="dot ready" /> Active</span>}
                  {d.hero && <span className="pill accent kb-active-pill">Prior DD</span>}
                  {d.desc && <div className="kb-doc-desc">{d.desc}</div>}
                </span>
              </span>
              <span className="t-secondary">{d.type}</span>
              <span className="t-secondary">{d.asAt}</span>
              <span className="t-muted">{d.added}</span>
              <span className="t-muted">{d.source}</span>
              <span>{(d.feeds || []).filter(f => f !== "reserve").map(f => <span key={f} className="pill kb-feed-pill">{f}</span>)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function docIcon(kind) {
  if (kind === "sheet") return "sheet";
  if (kind === "eml") return "mail";
  if (kind === "doc") return "file-text";
  return "doc";
}

window.KnowledgeBase = KnowledgeBase;
window.docIcon = docIcon;
