// ============================================================
// Othello — Data Room: Knowledge Base module (stand-alone)
// ============================================================
//
// One unified evidence library. Every piece of knowledge — uploaded
// documents and freeform notes alike — is a single row. Clicking a row
// opens a detail overlay with the generated summary, metadata and the
// underlying document/knowledge (see KbItemDetail in DataRoomDocViewer).
//
// New items can be added two ways: paste freeform text, or upload a
// document. Either way the add flow shows a short "processing" pass that
// detects the type and generates a summary before the row lands.

function KnowledgeBase() {
  const { state, dispatch } = useStore();
  const { kbDocs, kbFreeform } = state.dataRoom;
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  // Normalise documents + freeform notes into one item shape.
  const noteItems = kbFreeform.map(n => ({
    _entity: "note", id: n.id, kind: "note", title: n.title,
    type: "Note", asAt: "—", added: n.added, source: n.source,
    desc: n.body, body: n.body, summary: n.summary || n.body,
    justAdded: n.justAdded,
  }));
  const docItems = kbDocs.map(d => ({ _entity: "doc", ...d }));
  const combined = [...noteItems, ...docItems];

  // Freshly added / synced items float to the top; everything else keeps
  // its natural order.
  const isFresh = i => i.justAdded || i.justSynced;
  const ordered = [...combined.filter(isFresh), ...combined.filter(i => !isFresh(i))];

  const visible = ordered.filter(it => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return `${it.title} ${it.type} ${it.desc || ""} ${it.summary || ""}`.toLowerCase().includes(q);
  });

  const openItem = (it) => dispatch({ type: "DR_OPEN_KB_ITEM", id: it.id });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Knowledge Base</div>
          <div className="page-sub">Copia's evidence library. Documents and freeform notes live here once and keep compounding — open any item to see its summary, metadata and source content.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="cl-search-wrap" style={{ marginBottom: 0, minWidth: 240 }}>
            <Icon name="search" size={14} />
            <input className="cl-search" placeholder="Search the knowledge base…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={14} /> Add item</button>
        </div>
      </div>

      <div className="kb-stat-row">
        <div className="kb-stat"><span className="kb-stat-num">{combined.length}</span><span className="kb-stat-label">items</span></div>
        <div className="kb-stat"><span className="kb-stat-num">{kbDocs.length}</span><span className="kb-stat-label">documents</span></div>
        <div className="kb-stat"><span className="kb-stat-num">{kbFreeform.length}</span><span className="kb-stat-label">freeform notes</span></div>
      </div>

      <div className="bordered kb-table">
        <div className="kb-row kb-row-head">
          <span>Item</span><span>Type</span><span>As-at</span><span>Added</span><span>Source</span><span />
        </div>
        {visible.map(it => (
          <div key={it.id} className={`kb-row ${isFresh(it) ? "kb-row-new" : ""}`} onClick={() => openItem(it)}>
            <span className="kb-doc-cell">
              <Icon name={docIcon(it.kind)} size={15} className="kb-doc-icon" />
              <span style={{ minWidth: 0 }}>
                <span className="kb-doc-title">{it.title}</span>
                {(it.desc || it.summary) && <div className="kb-doc-desc">{it.desc || it.summary}</div>}
              </span>
            </span>
            <span><span className="kb-type">{it.type}</span></span>
            <span className="t-secondary">{it.asAt}</span>
            <span className="t-muted">{it.added}</span>
            <span className="t-muted">{it.source}</span>
            <span className="kb-chevron"><Icon name="chevron-right" size={15} /></span>
          </div>
        ))}
        {visible.length === 0 && <div className="kb-empty">No items match “{query.trim()}”.</div>}
      </div>

      {adding && <AddKbItem onClose={() => setAdding(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------
// Add to knowledge base — paste text or upload a document, with a
// short processing pass that detects the type and generates a summary.
// ---------------------------------------------------------------
function AddKbItem({ onClose }) {
  const { dispatch, toast } = useStore();
  const [tab, setTab] = useState("text");          // text | doc
  const [phase, setPhase] = useState("input");     // input | processing | done
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);          // { name }
  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState(null);
  const [newId, setNewId] = useState(null);
  const fileRef = useRef(null);
  const timers = useRef([]);

  const steps = tab === "text"
    ? ["Reading pasted content", "Detecting type", "Extracting key details", "Generating summary", "Indexing for retrieval"]
    : ["Uploading file", "Extracting text", "Detecting type", "Extracting key details", "Generating summary", "Indexing for retrieval"];

  const canStart = tab === "text" ? (title.trim() && body.trim()) : !!file;

  const start = () => {
    let m;
    if (tab === "text") {
      m = { entity: "note", title: title.trim(), type: "Note", asAt: "—", kind: "note", summary: summarizeText(body) };
    } else {
      const type = detectDocType(file.name);
      const kind = detectKind(file.name);
      m = { entity: "doc", title: file.name, type, asAt: "—", kind,
            summary: `Newly uploaded ${type.toLowerCase()}. Type detected and metadata generated on upload; open the item to view the source file.` };
    }
    setMeta(m);
    setStep(0);
    setPhase("processing");
  };

  // Run the processing steps, then commit the item to the knowledge base.
  useEffect(() => {
    if (phase !== "processing") return;
    let i = 0;
    const tick = () => {
      i += 1;
      if (i < steps.length) {
        setStep(i);
        timers.current.push(setTimeout(tick, 640));
      } else {
        setStep(steps.length);
        timers.current.push(setTimeout(commit, 560));
      }
    };
    timers.current.push(setTimeout(tick, 640));
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, [phase]);

  const commit = () => {
    const id = `kb_${Date.now()}`;
    if (meta.entity === "note") {
      dispatch({ type: "DR_KB_ADD_NOTE", note: {
        id, title: meta.title, body: body.trim(), summary: meta.summary,
        source: "Pasted text", added: "just now", justAdded: true,
      } });
    } else {
      dispatch({ type: "DR_KB_ADD", doc: {
        id, kind: meta.kind, title: meta.title, type: meta.type, asAt: meta.asAt,
        added: "just now", source: "Uploaded", summary: meta.summary, justAdded: true,
      } });
    }
    setNewId(id);
    setPhase("done");
    toast("Added to the knowledge base", "ready");
  };

  const viewItem = () => { dispatch({ type: "DR_OPEN_KB_ITEM", id: newId }); onClose(); };

  return (
    <div className="preview-backdrop" onClick={onClose}>
      <div className="kb-add" onClick={e => e.stopPropagation()}>
        <div className="kb-add-head">
          <div className="kb-add-title">Add to knowledge base</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" /></button>
        </div>

        <div className="kb-add-body">
          {phase === "input" && (
            <>
              <div className="kb-add-tabs">
                <div className="seg">
                  <button className={tab === "text" ? "on" : ""} onClick={() => setTab("text")}>Paste text</button>
                  <button className={tab === "doc" ? "on" : ""} onClick={() => setTab("doc")}>Upload document</button>
                </div>
              </div>

              {tab === "text" ? (
                <>
                  <label className="kb-field-label">Title</label>
                  <input className="kb-input" placeholder="e.g. Regulatory standing" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
                  <label className="kb-field-label">Content</label>
                  <textarea className="kb-textarea" rows={7} placeholder="Paste the knowledge you want to capture…" value={body} onChange={e => setBody(e.target.value)} />
                  <div className="kb-field-hint"><Icon name="sparkle" size={12} /> Othello will detect the type and generate a summary automatically.</div>
                </>
              ) : (
                <>
                  <input type="file" ref={fileRef} style={{ display: "none" }}
                         onChange={e => { const f = e.target.files?.[0]; if (f) setFile({ name: f.name }); e.target.value = ""; }} />
                  <div className={`kb-dropzone ${file ? "has-file" : ""}`} onClick={() => fileRef.current?.click()}>
                    <Icon name={file ? docIcon(detectKind(file.name)) : "upload"} size={22} />
                    <div className="kb-dropzone-title">{file ? file.name : "Choose a file to upload"}</div>
                    <div className="kb-dropzone-sub">{file ? "Click to choose a different file" : "PDF, Word, Excel or email"}</div>
                  </div>
                  <div className="kb-field-hint"><Icon name="sparkle" size={12} /> Othello will extract the text, detect the type and generate a summary.</div>
                </>
              )}
            </>
          )}

          {phase === "processing" && (
            <div className="dr-proc" style={{ margin: "10px auto 6px" }}>
              <div className="dr-proc-spinner"><span /></div>
              <div className="dr-proc-title">Processing “{meta.title}”</div>
              <div className="dr-proc-steps">
                {steps.map((s, i) => (
                  <div key={i} className={`dr-proc-step ${i < step ? "done" : i === step ? "current" : ""}`}>
                    <span className="dr-proc-dot">{i < step ? <Icon name="check" size={11} /> : null}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="kb-add-done">
              <div className="kb-add-done-icon"><Icon name="check" size={18} /></div>
              <div className="kb-add-done-title">Added to the knowledge base</div>
              <div className="kb-gen-card">
                <div className="kb-gen-row"><span className="kb-gen-k">Title</span><span className="kb-gen-v">{meta.title}</span></div>
                <div className="kb-gen-row"><span className="kb-gen-k">Type</span><span className="kb-gen-v"><span className="kb-type">{meta.type}</span></span></div>
                <div className="kb-gen-row"><span className="kb-gen-k">Summary</span><span className="kb-gen-v">{meta.summary}</span></div>
              </div>
            </div>
          )}
        </div>

        {phase === "input" && (
          <div className="kb-add-foot">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={!canStart} onClick={start}><Icon name="plus" size={14} /> Add to knowledge base</button>
          </div>
        )}
        {phase === "done" && (
          <div className="kb-add-foot">
            <button className="btn btn-secondary" onClick={onClose}>Done</button>
            <button className="btn btn-primary" onClick={viewItem}>View item</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function docIcon(kind) {
  if (kind === "sheet") return "sheet";
  if (kind === "eml") return "mail";
  if (kind === "doc") return "file-text";
  if (kind === "note") return "file-text";
  return "doc";
}

// A short, display-ready summary for any KB item, with a graceful fallback
// for display-only documents that don't carry one.
function kbSummary(item) {
  if (item && item.summary) return item.summary;
  if (item && item.kind === "note") return item.body || "";
  if (item && item.desc) return item.desc;
  const t = (item && item.type) || "Document";
  const asAt = item && item.asAt && item.asAt !== "—" ? `, as at ${item.asAt}` : "";
  return `${t} held in Copia's evidence library${asAt}.`;
}

// Condense pasted prose into a one-line summary.
function summarizeText(text) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const m = clean.match(/^(.{40,180}?[.!?])(\s|$)/);
  if (m) return m[1];
  return clean.length > 180 ? clean.slice(0, 177) + "…" : clean;
}

function detectDocType(name) {
  const n = (name || "").toLowerCase();
  if (/certificate|currency|coc\b/.test(n)) return "Certificate of Currency";
  if (/afsl|licen[cs]e/.test(n)) return "Licence";
  if (/gs007|assurance|audit/.test(n)) return "Assurance report";
  if (/policy|manual|framework|\bplan\b/.test(n)) return "Policy";
  if (/questionnaire|imq|due diligence/.test(n)) return "Questionnaire";
  if (/\bbio/.test(n)) return "Bios";
  if (/report|update|review/.test(n)) return "Report";
  return "Document";
}

function detectKind(name) {
  const n = (name || "").toLowerCase();
  if (/\.(xlsx?|csv)$/.test(n)) return "sheet";
  if (/\.(eml|msg)$/.test(n)) return "eml";
  if (/\.docx?$/.test(n)) return "doc";
  return "pdf";
}

window.KnowledgeBase = KnowledgeBase;
window.AddKbItem = AddKbItem;
window.docIcon = docIcon;
window.kbSummary = kbSummary;
