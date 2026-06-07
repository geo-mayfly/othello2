// ============================================================
// Othello — Data Room: a single DD container (the demo spine)
// ============================================================
//
// Phases: extracting → requirements → generating → review → finalised
//
// The generated output is a multi-section EDITABLE document — each
// section is its own Google-Docs-style canvas with inline, clickable
// knowledge-base reference tags. The review screen pairs the document
// with a right-hand AI panel (outstanding items + chat) that can edit
// the whole document or drill into a single section.

// ---- helpers shared across the module ----
const TAG_SVG = '<svg class="dr-tag-ic" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
function escHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function tokensToHtml(tokens) {
  return tokens.map(t => {
    if (typeof t === "string") return escHtml(t);
    const r = t.r;
    return `<span class="dr-tag" contenteditable="false" data-docid="${r.docId || ""}" data-page="${r.page || ""}" data-sheet="${r.sheet || ""}">${TAG_SVG}<span>${escHtml(r.label)}</span></span>`;
  }).join("");
}
const ITEM_SECTION = Object.fromEntries(DD_ALL_ITEMS.map(it => [it.id, it.sectionId]));
const SECTION_BY_ID = Object.fromEntries(DD_SECTIONS.map(s => [s.id, s]));
const QSECTION_BY_ID = Object.fromEntries(DD_QUESTIONNAIRE.map(s => [s.id, s]));

// Resolve a knowledge-base doc id against the live KB (falls back to the
// seed + the user-supplied Chubb certificate).
function resolveKbDoc(kbDocs, id) {
  return (kbDocs || []).find(d => d.id === id)
    || KB_DOCS.find(d => d.id === id)
    || (id === "chubb_combined" ? CHUBB_KB_DOC : null);
}

function itemSatisfied(dd, it) {
  const f = dd.flags[it.id];
  if (!f) return true;
  return it.flagInfo.type === "validation" ? f.validated : f.resolved;
}
function ddAllDone(dd) { return DD_REVIEW_ITEMS.every(it => itemSatisfied(dd, it)); }

// ============================================================
function DataRoomDD() {
  const { state, dispatch } = useStore();
  const dd = state.dataRoom.dd;
  const docRef = useRef(null);
  if (!dd) return null;
  const finalised = dd.phase === "finalised";

  return (
    <div className="dr-shell">
      <div className="dr-dd-header">
        <div className="dr-head-left">
          <button className="dr-crumb" onClick={() => dispatch({ type: "DR_CLOSE_DD" })}>
            <Icon name="chevron-left" size={13} /> Data Rooms
          </button>
          <div className="dr-head-titlerow">
            <h1 className="dr-dd-title">{dd.name}</h1>
            {!finalised && <PhasePill phase={dd.phase} />}
          </div>
          <div className="dr-dd-sub">{DD_META.manager} · {DD_META.product} · {dd.requester}</div>
        </div>
        {finalised && <ExportActions docRef={docRef} />}
      </div>

      {dd.phase === "extracting" && <Extraction />}
      {dd.phase === "requirements" && <Requirements />}
      {dd.phase === "generating" && <GenerationAnim />}
      {dd.phase === "review" && <QuestionnaireReview docRef={docRef} />}
      {finalised && <ReviewLayout docRef={docRef} finalised={true} />}
    </div>
  );
}

function PhasePill({ phase }) {
  const map = {
    extracting:   { c: "attention", t: "Extracting requirements" },
    requirements: { c: "accent",    t: "Requirements ready" },
    generating:   { c: "attention", t: "Generating" },
    review:       { c: "accent",    t: "Review responses" },
    finalised:    { c: "ready",     t: "Finalised" },
  }[phase] || { c: "muted", t: phase };
  return <span className={`pill ${map.c}`} style={{ fontWeight: 600 }}>{map.t}</span>;
}

// ---------------------------------------------------------------
// Phase 1 — requirement extraction
// ---------------------------------------------------------------
function Extraction() {
  const { state, dispatch } = useStore();
  const speed = state.speed || 1;
  const STEPS = [
    "Reading the uploaded questionnaire…",
    "Detecting format & structure…",
    `Extracting ${DD_ITEM_COUNT} requirements across ${DD_SECTIONS.length} sections…`,
    "Matching against the knowledge base…",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return; setStep(i);
        await new Promise(r => setTimeout(r, 850 / speed));
      }
      if (cancelled) return; setStep(STEPS.length);
      await new Promise(r => setTimeout(r, 500 / speed));
      if (!cancelled) dispatch({ type: "DR_SET_PHASE", phase: "requirements" });
    })();
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="dr-body-centered">
      <div className="dr-proc">
        <div className="dr-proc-spinner"><span /></div>
        <div className="dr-proc-title">Processing “{state.dataRoom.dd.uploaded || "Sample DD Questionnaire.docx"}”</div>
        <div className="dr-proc-steps">
          {STEPS.map((s, i) => (
            <div key={i} className={`dr-proc-step ${i < step ? "done" : i === step ? "current" : ""}`}>
              <span className="dr-proc-dot">{i < step ? <Icon name="check" size={12} /> : null}</span>{s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Phase 2 — review & modify requirements (chat-refine politely disabled)
// ---------------------------------------------------------------
function Requirements() {
  const { dispatch } = useStore();
  const [selected, setSelected] = useState(DD_SECTIONS[0].id);
  const sec = SECTION_BY_ID[selected];
  return (
    <div className="dr-body-scroll">
      <div className="dr-req-summary">
        <div>
          <div className="dr-req-h">Requirements extracted</div>
          <div className="dr-req-subh">Review the items below and refine a section if needed, then process to draft the responses.</div>
        </div>
        <div className="dr-req-stats">
          <div className="dr-req-stat"><span className="n">{DD_ITEM_COUNT}</span><span className="l">requirements</span></div>
          <div className="dr-req-stat"><span className="n">{DD_SECTIONS.length}</span><span className="l">sections</span></div>
          <div className="dr-req-stat"><span className="n">{DD_REVIEW_ITEMS.length}</span><span className="l">need input</span></div>
        </div>
      </div>
      <div className="dr-req-grid">
        <div className="dr-req-list">
          {DD_SECTIONS.map(s => {
            const flagged = s.items.filter(it => it.flagInfo).length;
            return (
              <div key={s.id} className={`dr-req-row ${selected === s.id ? "active" : ""}`} onClick={() => setSelected(s.id)}>
                <div className="dr-req-num">{s.items.length}</div>
                <div className="dr-req-body">
                  <div className="dr-req-topic">{s.title}{flagged > 0 && <span className="pill attention dr-flag-pill"><Icon name="warning" size={10} /> {flagged} to review</span>}</div>
                  <div className="dr-req-text">{s.items.map(it => it.q).join(" · ")}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="dr-req-detail">
          <div className="t-label">{sec.title} · {sec.items.length} items</div>
          <div className="dr-req-detail-text">{sec.intro}</div>
          <ol className="dr-req-itemlist">{sec.items.map(it => <li key={it.id}>{it.q}{it.flagInfo && <span className="pill attention dr-flag-pill"><Icon name="warning" size={10} /> {it.flagInfo.type === "validation" ? "validate" : "input"}</span>}</li>)}</ol>
          <div className="dr-refine">
            <div className="dr-refine-head"><Icon name="chat" size={13} /> Refine with the chat agent</div>
            <div className="dr-refine-msg">Adjust the scope or wording for this section. Available in the full build.</div>
            <div className="dr-refine-input">
              <input className="chat-input" placeholder="Refine this section…" disabled />
              <button className="btn btn-secondary" disabled>Send</button>
            </div>
          </div>
        </div>
      </div>
      <div className="dr-actionbar">
        <span className="t-muted">Each section is drafted from the knowledge base. You can edit everything afterward.</span>
        <button className="btn btn-primary" onClick={() => dispatch({ type: "DR_SET_PHASE", phase: "generating" })}><Icon name="sparkle" size={14} /> Process</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Phase 3 — generation animation (drafts the document section by section)
// ---------------------------------------------------------------
function GenerationAnim() {
  const { state, dispatch } = useStore();
  const speed = state.speed || 1;
  const [done, setDone] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await new Promise(r => setTimeout(r, 500 / speed));
      for (let i = 0; i < DD_SECTIONS.length; i++) {
        if (cancelled) return; setDone(i + 1);
        await new Promise(r => setTimeout(r, 800 / speed));
      }
      await new Promise(r => setTimeout(r, 400 / speed));
      if (!cancelled) dispatch({ type: "DR_SET_PHASE", phase: "review" });
    })();
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="dr-body-centered">
      <div className="dr-proc">
        <div className="dr-proc-spinner"><span /></div>
        <div className="dr-proc-title">Drafting responses from approved sources…</div>
        <div className="dr-proc-steps">
          {DD_SECTIONS.map((s, i) => (
            <div key={s.id} className={`dr-proc-step ${i < done ? "done" : i === done ? "current" : ""}`}>
              <span className="dr-proc-dot">{i < done ? <Icon name="check" size={12} /> : null}</span>Drafting “{s.title}”
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Review / finalised — editable document + AI panel
// ---------------------------------------------------------------
function ReviewLayout({ docRef, finalised }) {
  const { dispatch } = useStore();

  // delegate clicks on inline reference tags → open the quick-view
  const onDocClick = (e) => {
    const tag = e.target.closest && e.target.closest(".dr-tag");
    if (!tag) return;
    e.preventDefault();
    dispatch({ type: "DR_OPEN_DOC", docId: tag.dataset.docid, page: tag.dataset.page ? Number(tag.dataset.page) : undefined, sheet: tag.dataset.sheet || undefined });
  };

  return (
    <div className="dr-review-layout">
      <div className={`dr-doc-pane ${finalised ? "full" : ""}`} ref={docRef} onClick={onDocClick}>
        <div className="dr-doc">
          <div className="dr-doc-headline">
            <div className="dr-doc-h1">{DD_META.title}</div>
            <div className="dr-doc-meta">{DD_META.manager} · {DD_META.product} · {finalised ? "Finalised draft" : "Draft for review"}</div>
          </div>
          {DD_SECTIONS.map(s => <SectionCanvas key={s.id} section={s} />)}
        </div>
      </div>
      {!finalised && <AIPanel docRef={docRef} />}
    </div>
  );
}

// ===============================================================
// Questionnaire review — the full questionnaire as a master panel,
// with a contextual right-hand "sources" panel that opens when a
// section is selected. The panel lists the knowledge-base documents
// that feed the section and lets the user tag additional ones.
// ===============================================================
function QuestionnaireReview({ docRef }) {
  const { state, dispatch } = useStore();
  const dd = state.dataRoom.dd;
  const selectedId = dd.selectedSectionId;
  const selected = selectedId ? QSECTION_BY_ID[selectedId] : null;

  // user-tagged docs, kept on the screen: { [sectionId]: [docId, …] }
  const [tagged, setTagged] = useState({});
  const tag   = (sec, id) => setTagged(t => ({ ...t, [sec]: Array.from(new Set([...(t[sec] || []), id])) }));
  const untag = (sec, id) => setTagged(t => ({ ...t, [sec]: (t[sec] || []).filter(x => x !== id) }));

  const select = (id) => dispatch({ type: "DR_SELECT_SECTION", sectionId: id });

  // delegate clicks on inline reference tags → open the quick-view
  const onDocClick = (e) => {
    const refTag = e.target.closest && e.target.closest(".dr-tag");
    if (!refTag) return;
    e.preventDefault();
    dispatch({ type: "DR_OPEN_DOC", docId: refTag.dataset.docid, page: refTag.dataset.page ? Number(refTag.dataset.page) : undefined, sheet: refTag.dataset.sheet || undefined });
  };

  return (
    <div className="dr-review-layout">
      <div className={`dr-doc-pane dr-q-pane ${selected ? "split" : ""}`} ref={docRef} onClick={onDocClick}>
        <div className="dr-doc dr-q-doc">
          <div className="dr-doc-headline">
            <div className="dr-doc-h1">{DD_META.title}</div>
            <div className="dr-doc-meta">{DD_META.manager} · {DD_META.product} · Draft for review</div>
            <div className="dr-q-hintbar">
              <Icon name="folders" size={13} /> Click any section to see the knowledge-base documents that feed it — and tag additional documents for that section.
            </div>
          </div>

          {DD_QUESTIONNAIRE.map(s => (
            <QSection key={s.id} section={s} selected={selectedId === s.id}
                      onSelect={select} taggedCount={(tagged[s.id] || []).length} />
          ))}

          <div className="dr-q-actionbar">
            <span className="t-muted">Full questionnaire · {DD_Q_COUNT} questions across {DD_QUESTIONNAIRE.length} sections · responses drafted from the knowledge base.</span>
            <button className="btn btn-primary" onClick={() => dispatch({ type: "DR_FINALISE" })}><Icon name="check" size={14} /> Finalise responses</button>
          </div>
        </div>
      </div>

      {selected && (
        <SourcePanel section={selected}
                     tagged={tagged[selectedId] || []}
                     onTag={(id) => tag(selectedId, id)}
                     onUntag={(id) => untag(selectedId, id)}
                     onClose={() => select(null)} />
      )}
    </div>
  );
}

// A single questionnaire section in the master panel.
function QSection({ section, selected, onSelect, taggedCount }) {
  const srcCount = section.sources.length + taggedCount;
  let lastSub = null;
  return (
    <div className={`dr-qsection ${selected ? "selected" : ""}`} id={`qsec-${section.id}`}>
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
              <QItem item={it} />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// A single question + drafted response.
function QItem({ item }) {
  const isBio = !item.n;
  return (
    <div className={`dr-q-item ${isBio ? "bio" : ""}`}>
      <div className="dr-q-q">
        {item.n ? <span className="dr-q-num">{item.n}</span> : null}
        <span className="dr-q-text">{item.q}</span>
      </div>
      {item.note && <div className="dr-q-note">{item.note}</div>}
      {item.a
        ? <EditableAnswer tokens={item.a} revision="q" />
        : <div className="dr-q-hint">{item.hint || "Open for the manager to complete — drafted from the section's sources."}</div>}
      {item.table && <CanvasTable table={item.table} />}
      {item.image && (
        <figure className="dr-figure" contentEditable={false}>
          <img src={item.image.src} alt={item.image.caption} loading="lazy" />
          <figcaption>{item.image.caption}</figcaption>
        </figure>
      )}
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
    .map(s => ({ ...s, doc: resolveKbDoc(kbDocs, s.id) }))
    .filter(s => s.doc);
  const taggedDocs = tagged.map(id => resolveKbDoc(kbDocs, id)).filter(Boolean);
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
      const doc = genericDoc(f.name, i);
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

// ---------------------------------------------------------------
// A single section canvas
// ---------------------------------------------------------------
function SectionCanvas({ section }) {
  const { state, dispatch } = useStore();
  const dd = state.dataRoom.dd;
  const selected = dd.selectedSectionId === section.id;
  const flaggedCount = section.items.filter(it => it.flagInfo && !itemSatisfied(dd, it)).length;

  return (
    <div className={`dr-canvas ${selected ? "selected" : ""}`} id={`sec-${section.id}`}>
      <div className="dr-canvas-head" onClick={() => dispatch({ type: "DR_SELECT_SECTION", sectionId: selected ? null : section.id })}>
        <div>
          <div className="dr-canvas-title">{section.title}</div>
          <div className="dr-canvas-intro">{section.intro}</div>
        </div>
        <div className="dr-canvas-head-right">
          {flaggedCount > 0 && <span className="pill attention"><Icon name="warning" size={11} /> {flaggedCount}</span>}
          <span className="dr-canvas-select">{selected ? "Selected" : "Review section"}</span>
        </div>
      </div>
      {section.items.map(it => <ItemBlock key={it.id} item={it} />)}
    </div>
  );
}

function ItemBlock({ item }) {
  const { state } = useStore();
  const dd = state.dataRoom.dd;
  const f = item.flagInfo ? dd.flags[item.id] : null;
  const resolved = item.flagInfo ? itemSatisfied(dd, item) : true;
  const useFinal = item.contentFinal && (item.flag === "info" ? (f && f.resolved) : (f && f.validated));
  const tokens = useFinal ? item.contentFinal : item.content;
  const showTable = item.table && useFinal;

  return (
    <div className="dr-item">
      <div className="dr-item-q">
        {item.q}
        {item.flagInfo && !resolved && <span className="pill attention dr-item-status"><Icon name="warning" size={10} /> {item.flagInfo.type === "validation" ? "validation required" : "input required"}</span>}
        {item.flagInfo && resolved && <span className="pill ready dr-item-status"><Icon name="check" size={10} /> {f && f.validated ? "validated" : "resolved"}</span>}
      </div>
      <EditableAnswer tokens={tokens} revision={useFinal ? "final" : "draft"} />
      {showTable && <CanvasTable table={item.table} />}
      {item.image && (
        <figure className="dr-figure" contentEditable={false}>
          <img src={item.image.src} alt={item.image.caption} loading="lazy" />
          <figcaption>{item.image.caption}</figcaption>
        </figure>
      )}
    </div>
  );
}

// Uncontrolled contentEditable — innerHTML is set imperatively so React
// re-renders never clobber the user's edits. Re-set only when `revision`
// flips (draft → final on resolve).
function EditableAnswer({ tokens, revision }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.innerHTML = tokensToHtml(tokens); }, [revision]);
  return <div className="dr-canvas-answer" ref={ref} contentEditable suppressContentEditableWarning spellCheck={false} />;
}

function CanvasTable({ table }) {
  return (
    <table className="dr-table" contentEditable={false}>
      <thead><tr>{table.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
      <tbody>{table.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

// ---------------------------------------------------------------
// AI panel — top: outstanding items / section flags · bottom: chat
// ---------------------------------------------------------------
function AIPanel({ docRef }) {
  const { state, dispatch } = useStore();
  const dd = state.dataRoom.dd;
  const selectedSection = dd.selectedSectionId ? SECTION_BY_ID[dd.selectedSectionId] : null;
  const [upload, setUpload] = useState(null); // { itemId, kind } | { kind:"chat" }
  const allDone = ddAllDone(dd);

  return (
    <div className="dr-ai-panel">
      <div className="dr-ai-top">
        {selectedSection ? (
          <>
            <div className="dr-ai-secthead">
              <button className="dr-ai-back" onClick={() => dispatch({ type: "DR_SELECT_SECTION", sectionId: null })}>
                <Icon name="chevron-left" size={13} /> Whole document
              </button>
            </div>
            <div className="dr-ai-title">{selectedSection.title}</div>
            <div className="dr-ai-sub">{selectedSection.intro}</div>
            <div className="dr-ai-cards">
              {selectedSection.items.filter(it => it.flagInfo).length === 0
                ? <div className="dr-ai-empty">No outstanding items in this section. Edit the text directly, or ask the assistant below.</div>
                : selectedSection.items.filter(it => it.flagInfo).map(it => <FlagCard key={it.id} item={it} onUpload={() => setUpload({ itemId: it.id, kind: it.flagInfo.type })} />)}
            </div>
          </>
        ) : (
          <>
            <div className="dr-ai-title">Outstanding items <span className="pill attention" style={{ fontSize: 10 }}>{DD_REVIEW_ITEMS.filter(it => !itemSatisfied(dd, it)).length}</span></div>
            <div className="dr-ai-sub">Items that still need a decision before you can finalise. Select one to act on it.</div>
            <div className="dr-ai-list">
              {DD_REVIEW_ITEMS.map(it => {
                const ok = itemSatisfied(dd, it);
                return (
                  <div key={it.id} className={`dr-ai-item ${ok ? "ok" : ""}`} onClick={() => { dispatch({ type: "DR_SELECT_SECTION", sectionId: ITEM_SECTION[it.id] }); scrollToSection(docRef, ITEM_SECTION[it.id]); }}>
                    <span className={`dr-ai-item-ic ${ok ? "ok" : it.flagInfo.type}`}>{ok ? <Icon name="check" size={12} /> : <Icon name="warning" size={12} />}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="dr-ai-item-title">{it.q}</div>
                      <div className="dr-ai-item-sub">{it.sectionTitle} · {ok ? "resolved" : it.flagInfo.title}</div>
                    </div>
                    <Icon name="chevron-right" size={13} style={{ color: "var(--text-muted)" }} />
                  </div>
                );
              })}
            </div>
            <div className="dr-ai-finalise">
              <button className="btn btn-primary" disabled={!allDone} onClick={() => dispatch({ type: "DR_FINALISE" })}>
                <Icon name="check" size={14} /> {allDone ? "Finalise document" : `${DD_REVIEW_ITEMS.filter(it => !itemSatisfied(dd, it)).length} item(s) left`}
              </button>
            </div>
          </>
        )}
      </div>

      <AIChat docRef={docRef} section={selectedSection} onAttach={() => setUpload({ kind: "chat" })} />

      {upload && <FileUploadModal ctx={upload} onClose={() => setUpload(null)} />}
    </div>
  );
}

function scrollToSection(docRef, sectionId) {
  const el = docRef?.current?.querySelector(`#sec-${sectionId}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// flag / input card (section mode)
function FlagCard({ item, onUpload }) {
  const { state, dispatch, toast } = useStore();
  const dd = state.dataRoom.dd;
  const f = dd.flags[item.id];
  const info = item.flagInfo;
  const done = itemSatisfied(dd, item);
  const [note, setNote] = useState(info.suggestedNote || "");

  if (done) {
    return (
      <div className="dr-fcard resolved">
        <div className="dr-fcard-head"><span className="pill ready"><Icon name="check" size={11} /> {f.validated ? "Validated" : "Resolved"}</span> {item.q}</div>
        {f.auditNote && <div className="dr-fcard-note">Audit note: “{f.auditNote}”</div>}
      </div>
    );
  }
  return (
    <div className="dr-fcard">
      <div className="dr-fcard-head"><span className="pill attention"><Icon name="warning" size={11} /> {info.title}</span></div>
      <div className="dr-fcard-copy">{info.copy}</div>
      {info.type === "validation" ? (
        <>
          <div className="t-label" style={{ marginTop: 10 }}>Audit note</div>
          <textarea className="dr-textarea" rows={2} value={note} onChange={e => setNote(e.target.value)} />
          <div className="dr-fcard-actions">
            <button className="btn btn-primary" onClick={() => { dispatch({ type: "DR_VALIDATE", itemId: item.id, auditNote: note }); toast("Marked as validated · audit note stored", "ready"); }}>Mark as validated</button>
          </div>
        </>
      ) : (
        <div className="dr-fcard-actions">
          <button className="btn btn-secondary" onClick={onUpload}><Icon name="upload" size={13} /> Upload document</button>
          {info.optional && <button className="btn btn-ghost" onClick={() => { dispatch({ type: "DR_RESOLVE_INFO", itemId: item.id }); toast("Marked as sufficient", "ready"); }}>Summary is sufficient</button>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Chat — global edits or section-scoped Q&A (scripted, on-rails)
// ---------------------------------------------------------------
function AIChat({ docRef, section, onAttach }) {
  const { state, dispatch, toast } = useStore();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef(null);
  const speed = state.speed || 1;
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [msgs, thinking]);

  const replaceAcross = (pairs) => {
    let count = 0;
    const nodes = docRef?.current?.querySelectorAll(".dr-canvas-answer") || [];
    nodes.forEach(node => {
      const walk = (n) => {
        if (n.nodeType === 3) {
          let txt = n.nodeValue;
          pairs.forEach(([from, to]) => { txt = txt.replace(from, (m) => { count++; return to; }); });
          if (txt !== n.nodeValue) n.nodeValue = txt;
        } else if (!(n.classList && n.classList.contains("dr-tag"))) {
          n.childNodes.forEach(walk);
        }
      };
      node.childNodes.forEach(walk);
    });
    return count;
  };

  const respond = (text) => {
    const lower = text.toLowerCase();
    // headline live edit: rename Copia → Chester
    if (/copia/.test(lower) && /chester/.test(lower) && /(change|replace|rename|swap|update)/.test(lower)) {
      const n = replaceAcross([
        [/Copia Investment Partners Ltd/g, "Chester Asset Management Pty Ltd"],
        [/Copia Investments/g, "Chester Asset Management Pty Ltd"],
        [/\bCopia\b/g, "Chester Asset Management Pty Ltd"],
      ]);
      return `Done. I replaced ${n} reference${n === 1 ? "" : "s"} to Copia with "Chester Asset Management Pty Ltd" across the document. Review the highlighted sections and revert anything you want to keep.`;
    }
    if (/(source|where.*from|reference|cite)/.test(lower)) {
      return "Every answer cites its source. For example, the firm-wide FUM figure comes from the Diversa IM Review, sheet 1.2.6. Click any reference tag to open the source at the cited page.";
    }
    if (/(shorten|concise|tighten|trim)/.test(lower)) {
      return `In the full build I can rewrite ${section ? `the ${section.title} section` : "any section"} to a target length. For this demo the live example is the reference rename. Try "change references to Copia to Chester Asset Management".`;
    }
    if (section) {
      return `Noted for the ${section.title} section. You can resolve its items in the cards above, edit the text directly, or attach a document with the paperclip.`;
    }
    return 'I can edit the document on instruction. Try "change references to Copia to Chester Asset Management Pty Ltd", select a section to work on its items, or attach a file with the paperclip.';
  };

  const send = async (text) => {
    if (!text.trim() || thinking) return;
    setMsgs(m => [...m, { role: "user", text }]); setInput("");
    setThinking(true);
    await new Promise(r => setTimeout(r, 700 / speed));
    const reply = respond(text);
    setThinking(false);
    setMsgs(m => [...m, { role: "bot", text: reply }]);
    if (/replaced \d+ reference/.test(reply)) toast("Document updated · references renamed", "ready");
  };

  const chips = section
    ? [`What's missing in ${section.title}?`, "Summarise this section"]
    : ["Change references to Copia to Chester Asset Management Pty Ltd", "What's the source for the FUM figure?"];

  return (
    <div className="dr-ai-chat">
      <div className="dr-ai-chat-head">
        <Icon name="sparkle" size={13} /> {section ? `Editing: ${section.title}` : "Edit the whole document"}
      </div>
      <div className="dr-ai-chat-body" ref={bodyRef}>
        {msgs.length === 0 && <div className="chat-msg-bot">{section ? `Ask about the ${section.title} section, or resolve its items above.` : "Instruct me to edit the document, across all sections or one at a time."}</div>}
        {msgs.map((m, i) => m.role === "user"
          ? <div key={i} className="chat-msg-user">{m.text}</div>
          : <div key={i} className="chat-msg-bot">{m.text}</div>)}
        {thinking && <div className="chat-thinking"><span className="dots"><span /><span /><span /></span><span>Working…</span></div>}
      </div>
      {msgs.length < 2 && (
        <div className="chat-chips">{chips.map((c, i) => <button key={i} className="chat-chip" onClick={() => send(c)}>{c}</button>)}</div>
      )}
      <div className="dr-ai-chat-input">
        <button className="btn btn-ghost btn-icon" title="Attach files" onClick={onAttach}><Icon name="upload" size={15} /></button>
        <input className="chat-input" placeholder={section ? `Ask about ${section.title}…` : "Instruct the assistant…"} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(input); }} />
        <button className="btn btn-primary btn-icon" onClick={() => send(input)}><Icon name="send" size={14} /></button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// File upload modal — drag-drop, per-file "add to knowledge base"
// ---------------------------------------------------------------
function FileUploadModal({ ctx, onClose }) {
  const { dispatch, toast } = useStore();
  const item = ctx.itemId ? DD_ALL_ITEMS.find(i => i.id === ctx.itemId) : null;
  const preset = item?.flagInfo?.missingFile;
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  const addFiles = (names) => setFiles(f => [...f, ...names.map(n => ({ name: n, sync: true }))]);
  const onPick = (e) => { addFiles(Array.from(e.target.files || []).map(f => f.name)); e.target.value = ""; };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); addFiles(Array.from(e.dataTransfer.files || []).map(f => f.name)); };
  const toggle = (i) => setFiles(f => f.map((x, j) => j === i ? { ...x, sync: !x.sync } : x));

  const confirm = () => {
    const list = files.length ? files : (preset ? [{ name: preset, sync: true }] : []);
    if (list.length === 0) { onClose(); return; }
    const anySync = list.some(f => f.sync);
    if (ctx.itemId === "Q4") {
      dispatch({ type: "DR_RESOLVE_INFO", itemId: "Q4", sync: anySync, kbDoc: anySync ? CHUBB_KB_DOC : null });
      toast(`${list[0].name} added · insurance response completed`, "ready");
      if (anySync) setTimeout(() => toast("Synced to knowledge base · +1 document", "ready"), 450);
    } else if (ctx.itemId) {
      dispatch({ type: "DR_RESOLVE_INFO", itemId: ctx.itemId, sync: false });
      toast(`${list[0].name} attached · item resolved`, "ready");
      list.filter(f => f.sync).forEach((f, i) => dispatch({ type: "DR_KB_ADD", doc: genericDoc(f.name, i) }));
    } else {
      // chat attachment
      const synced = list.filter(f => f.sync);
      synced.forEach((f, i) => dispatch({ type: "DR_KB_ADD", doc: genericDoc(f.name, i) }));
      toast(synced.length ? `${synced.length} file(s) added to the knowledge base` : "Files attached", "ready");
    }
    onClose();
  };

  return (
    <div className="preview-backdrop" onClick={onClose}>
      <div className="dr-upload" onClick={e => e.stopPropagation()}>
        <div className="dr-upload-head">
          <div className="t-card-title">Upload documents</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" /></button>
        </div>
        <input type="file" ref={fileRef} multiple style={{ display: "none" }} onChange={onPick} />
        <div className={`dr-upload-drop ${drag ? "drag" : ""}`}
             onDragOver={e => { e.preventDefault(); setDrag(true); }}
             onDragLeave={() => setDrag(false)} onDrop={onDrop} onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={22} />
          <div style={{ fontWeight: 500, marginTop: 8 }}>Drag &amp; drop files here</div>
          <div className="t-muted" style={{ fontSize: 12, marginTop: 2 }}>or click to browse</div>
          {preset && files.length === 0 && <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={(e) => { e.stopPropagation(); addFiles([preset]); }}>Use staged: {preset}</button>}
        </div>
        {files.length > 0 && (
          <div className="dr-upload-list">
            {files.map((f, i) => (
              <div key={i} className="dr-upload-row">
                <Icon name="doc" size={15} style={{ color: "var(--text-muted)" }} />
                <span style={{ flex: 1, minWidth: 0 }} className="dr-upload-name">{f.name}</span>
                <label className="dr-upload-toggle">
                  <input type="checkbox" checked={f.sync} onChange={() => toggle(i)} /> Add to knowledge base
                </label>
              </div>
            ))}
          </div>
        )}
        <div className="dr-upload-foot">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={confirm} disabled={files.length === 0 && !preset}>
            {ctx.itemId ? "Attach & resolve" : "Add files"}
          </button>
        </div>
      </div>
    </div>
  );
}

function genericDoc(name, i) {
  return { id: "up_" + name.replace(/\W+/g, "_").toLowerCase() + "_" + i, kind: name.toLowerCase().endsWith(".pdf") ? "pdf" : "doc", title: name, type: "Uploaded", asAt: "—", added: "just now", source: "Uploaded · synced from DD", justSynced: true };
}

// ---------------------------------------------------------------
// Finalise & export
// ---------------------------------------------------------------
function ExportActions({ docRef }) {
  const { toast } = useStore();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const doc = docRef?.current?.querySelector(".dr-doc");
    const text = doc ? doc.innerText : "";
    try { await navigator.clipboard.writeText(text); } catch (e) {}
    setCopied(true); toast("Completed document copied to clipboard", "ready");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="dr-head-actions">
      <span className="dr-head-status"><Icon name="check" size={13} /> Ready to share</span>
      <button className="btn btn-secondary" onClick={copy}><Icon name="copy" size={14} /> {copied ? "Copied" : "Copy"}</button>
      <a className="btn btn-primary" href={DD_EXPORT_PDF} download><Icon name="download" size={14} /> Generate PDF</a>
    </div>
  );
}

window.DataRoomDD = DataRoomDD;
