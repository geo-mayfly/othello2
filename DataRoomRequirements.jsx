// ============================================================
// Othello — Data Room: the PREPROCESS requirements screen
// ============================================================
//
// Phase 2 ("requirements"). Replaces the old six-item summary with the
// FULL questionnaire as a master panel, plus a contextual right-hand
// "sources" panel that opens when a section is selected. The panel lists
// the knowledge-base documents that will feed the section and lets the
// user tag additional documents (search the KB or upload). Questions
// only — the responses themselves are drafted later by "Process".
//
// Selection + tagging are kept in local React state so this screen is
// fully self-contained and never touches the answer-generation page.

// Resolve a knowledge-base doc id against the live KB (falls back to the
// seed + the user-supplied Chubb certificate). Named distinctly to avoid
// clashing with any same-named helper on the answer-generation page.
function reqResolveKbDoc(kbDocs, id) {
  return (kbDocs || []).find(d => d.id === id)
    || (typeof KB_DOCS !== "undefined" ? KB_DOCS.find(d => d.id === id) : null)
    || (id === "chubb_combined" && typeof CHUBB_KB_DOC !== "undefined" ? CHUBB_KB_DOC : null);
}

function reqUploadDoc(name, i) {
  return { id: "up_" + name.replace(/\W+/g, "_").toLowerCase() + "_" + i, kind: name.toLowerCase().endsWith(".pdf") ? "pdf" : "doc", title: name, type: "Uploaded", asAt: "—", added: "just now", source: "Uploaded · synced from DD", justSynced: true };
}

// ============================================================
// The preprocess requirements screen.
// ============================================================
function RequirementsReview() {
  const { dispatch } = useStore();
  const [selectedId, setSelectedId] = useState(null);

  // user-tagged docs, kept on the screen: { [sectionId]: [docId, …] }
  const [tagged, setTagged] = useState({});
  const tag   = (sec, id) => setTagged(t => ({ ...t, [sec]: Array.from(new Set([...(t[sec] || []), id])) }));
  const untag = (sec, id) => setTagged(t => ({ ...t, [sec]: (t[sec] || []).filter(x => x !== id) }));

  const selected = selectedId ? QSECTION_BY_ID[selectedId] : null;

  // distinct knowledge-base documents that feed the questionnaire
  const srcDocCount = new Set(DD_QUESTIONNAIRE.flatMap(s => s.sources.map(x => x.id))).size;

  return (
    <div className="dr-req-screen">
      <div className="dr-req-summary">
        <div>
          <div className="dr-req-h">Requirements extracted</div>
          <div className="dr-req-subh">The full questionnaire, ready to draft. Click any section to review the knowledge-base documents that will feed it — and tag more if needed.</div>
        </div>
        <div className="dr-req-stats">
          <div className="dr-req-stat"><span className="n">{DD_Q_COUNT}</span><span className="l">questions</span></div>
          <div className="dr-req-stat"><span className="n">{DD_QUESTIONNAIRE.length}</span><span className="l">sections</span></div>
          <div className="dr-req-stat"><span className="n">{srcDocCount}</span><span className="l">source docs</span></div>
        </div>
      </div>

      <div className="dr-review-layout">
        <div className={`dr-doc-pane dr-q-pane ${selected ? "split" : ""}`}>
          <div className="dr-doc dr-q-doc">
            <div className="dr-doc-headline">
              <div className="dr-doc-h1">{DD_META.title}</div>
              <div className="dr-doc-meta">{DD_META.manager} · {DD_META.product}</div>
              <div className="dr-q-hintbar">
                <Icon name="folders" size={13} /> Click any section to see the knowledge-base documents that feed it — and tag additional documents for that section.
              </div>
            </div>

            {DD_QUESTIONNAIRE.map(s => (
              <ReqSection key={s.id} section={s} selected={selectedId === s.id}
                          onSelect={setSelectedId} taggedCount={(tagged[s.id] || []).length} />
            ))}

            <div className="dr-q-actionbar">
              <span className="t-muted">Responses are drafted from the knowledge base · you can edit everything afterward.</span>
              <button className="btn btn-primary" onClick={() => dispatch({ type: "DR_SET_PHASE", phase: "generating" })}><Icon name="sparkle" size={14} /> Process</button>
            </div>
          </div>
        </div>

        {selected && (
          <SourcePanel section={selected}
                       tagged={tagged[selectedId] || []}
                       onTag={(id) => tag(selectedId, id)}
                       onUntag={(id) => untag(selectedId, id)}
                       onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  );
}

// A single questionnaire section in the master panel.
function ReqSection({ section, selected, onSelect, taggedCount }) {
  const srcCount = section.sources.length + taggedCount;
  let lastSub = null;
  return (
    <div className={`dr-qsection ${selected ? "selected" : ""}`} id={`reqsec-${section.id}`}>
      <div className="dr-qsection-head" onClick={() => onSelect(selected ? null : section.id)}>
        <div style={{ minWidth: 0 }}>
          <div className="dr-qsection-title">{section.title}</div>
          <div className="dr-qsection-intro">{section.intro}</div>
        </div>
        <div className="dr-qsection-head-right">
          <span className="dr-qsection-srcs"><Icon name="folders" size={12} /> {srcCount} source{srcCount === 1 ? "" : "s"}</span>
          <span className="dr-qsection-cta">{selected ? "Sources shown" : "View sources"} <Icon name="chevron-right" size={12} /></span>
        </div>
      </div>
      <div className="dr-qsection-body">
        {section.items.map((it, i) => {
          const subHead = it.sub && it.sub !== lastSub ? it.sub : null;
          if (it.sub) lastSub = it.sub;
          return (
            <React.Fragment key={i}>
              {subHead && <div className="dr-q-subhead">{subHead}</div>}
              <ReqItem item={it} />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// A single question (questions only — answers are drafted by Process).
function ReqItem({ item }) {
  const isBio = !item.n;
  return (
    <div className={`dr-q-item ${isBio ? "bio" : ""}`}>
      <div className="dr-q-q">
        {item.n ? <span className="dr-q-num">{item.n}</span> : null}
        <span className="dr-q-text">{item.q}</span>
      </div>
      {item.note && <div className="dr-q-note">{item.note}</div>}
    </div>
  );
}

// ---------------------------------------------------------------
// Right-hand contextual panel — suggested + tagged source documents
// ---------------------------------------------------------------
function SourcePanel({ section, tagged, onTag, onUntag, onClose }) {
  const { state, dispatch, toast } = useStore();
  const kbDocs = state.dataRoom.kbDocs;
  const [adding, setAdding] = useState(false);

  const suggested = section.sources
    .map(s => ({ ...s, doc: reqResolveKbDoc(kbDocs, s.id) }))
    .filter(s => s.doc);
  const taggedDocs = tagged.map(id => reqResolveKbDoc(kbDocs, id)).filter(Boolean);
  const presentIds = new Set([...section.sources.map(s => s.id), ...tagged]);

  const openDoc = (d) => dispatch({
    type: "DR_OPEN_DOC", docId: d.id,
    page: d.kind === "pdf" ? 1 : undefined,
    sheet: d.kind === "sheet" ? Object.keys(SHEET_SNIPPETS)[0] : undefined,
  });

  const onUpload = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    files.forEach((f, i) => {
      const doc = reqUploadDoc(f.name, i);
      dispatch({ type: "DR_KB_ADD", doc });
      onTag(doc.id);
    });
    setAdding(false);
    toast(`${files.length} document${files.length === 1 ? "" : "s"} added to the knowledge base · tagged to ${section.title}`, "ready");
  };

  return (
    <div className="dr-src-panel">
      <div className="dr-src-top">
        <button className="dr-ai-back" onClick={onClose}><Icon name="chevron-left" size={13} /> Hide sources</button>
        <div className="dr-src-title">{section.title}</div>
        <div className="dr-src-sub">Knowledge-base documents Othello will reference when drafting this section.</div>
      </div>

      <div className="dr-src-scroll">
        <div className="dr-src-label">Suggested documents <span className="t-muted">· {suggested.length}</span></div>
        <div className="dr-src-list">
          {suggested.map(s => <SrcCard key={s.id} doc={s.doc} feeds={s.feeds} onOpen={() => openDoc(s.doc)} />)}
          {suggested.length === 0 && <div className="dr-ai-empty">No documents matched yet — tag one below.</div>}
        </div>

        {taggedDocs.length > 0 && (
          <>
            <div className="dr-src-label">Tagged for this section <span className="t-muted">· {taggedDocs.length}</span></div>
            <div className="dr-src-list">
              {taggedDocs.map(d => <SrcCard key={d.id} doc={d} tagged onOpen={() => openDoc(d)} onRemove={() => onUntag(d.id)} />)}
            </div>
          </>
        )}

        <button className="btn btn-secondary dr-src-addbtn" onClick={() => setAdding(a => !a)}>
          <Icon name="plus" size={13} /> Tag additional documents
        </button>
        {adding && <TagDocsPicker presentIds={presentIds} onTag={onTag} onUpload={onUpload} />}
      </div>
    </div>
  );
}

function SrcCard({ doc, feeds, tagged, onOpen, onRemove }) {
  return (
    <div className="dr-src-card" onClick={onOpen}>
      <Icon name={docIcon(doc.kind)} size={15} className="dr-src-card-ic" />
      <div className="dr-src-card-main">
        <div className="dr-src-card-title">{doc.title}</div>
        <div className="dr-src-card-meta">{doc.type}{doc.asAt && doc.asAt !== "—" ? ` · ${doc.asAt}` : ""}</div>
        {feeds && <div className="dr-src-card-feeds">{feeds}</div>}
      </div>
      <div className="dr-src-card-side">
        {doc.active && <span className="pill ready kb-active-pill"><span className="dot ready" /> Active</span>}
        {doc.hero && !doc.active && <span className="pill accent kb-active-pill">Prior DD</span>}
        {tagged && <button className="dr-src-remove" title="Remove from section" onClick={(e) => { e.stopPropagation(); onRemove(); }}><Icon name="x" size={12} /></button>}
      </div>
    </div>
  );
}

function TagDocsPicker({ presentIds, onTag, onUpload }) {
  const { state } = useStore();
  const kbDocs = state.dataRoom.kbDocs;
  const [q, setQ] = useState("");
  const fileRef = useRef(null);
  const candidates = kbDocs.filter(d =>
    !presentIds.has(d.id) &&
    (!q.trim() || `${d.title} ${d.type} ${d.desc || ""}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="dr-src-picker">
      <input type="file" ref={fileRef} multiple style={{ display: "none" }} onChange={onUpload} />
      <button className="dr-src-uploadrow" onClick={() => fileRef.current?.click()}>
        <Icon name="upload" size={14} /> <span>Upload a new document…</span>
      </button>
      <div className="dr-src-picker-search">
        <Icon name="search" size={13} />
        <input className="cl-search" placeholder="Search the knowledge base…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="dr-src-picker-list">
        {candidates.length === 0 && <div className="dr-src-picker-empty">No other documents match.</div>}
        {candidates.map(d => (
          <div key={d.id} className="dr-src-picker-row" onClick={() => onTag(d.id)}>
            <Icon name={docIcon(d.kind)} size={14} className="dr-src-card-ic" />
            <div className="dr-src-picker-main">
              <div className="dr-src-picker-title">{d.title}</div>
              <div className="dr-src-card-meta">{d.type}</div>
            </div>
            <span className="dr-src-picker-add"><Icon name="plus" size={13} /> Tag</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.RequirementsReview = RequirementsReview;
