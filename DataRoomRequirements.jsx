// ============================================================
// Othello — Data Room: the PREPROCESS requirements screen
// ============================================================
//
// Phase 2 ("requirements"). Shows the FULL extracted questionnaire as a
// master panel with an always-visible contextual right-hand panel:
//
//   · click a SECTION header  → the panel lists the knowledge-base
//     documents that will feed it, and lets the user tag more / upload.
//   · click an individual QUESTION → the panel shows that question's
//     metadata: the generation prompt and the information Othello can
//     draw on to draft the answer.
//
// The user can also add a section manually ("Add a section"), pre-staged
// with the team biographies. Questions only — the responses themselves are
// drafted later by "Process". All selection / tagging / added sections are
// kept in local React state so the screen never touches the answer page.

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

// Inline reference tokens carried on an answer (specific sheets / pages a
// question's response cites). Used to make the question panel specific.
function reqRefs(item) {
  return (item.a || []).filter(t => t && t.r).map(t => t.r);
}

// The generation prompt for a single question — synthesised from the
// question, its section and any on-file context so it reads like the
// instruction Othello would run to draft the answer.
function reqPrompt(item, section) {
  const guide = item.hint
    ? item.hint.replace(/\s+Drafted from.*$/, "").trim()
    : `Draft a concise, factual response, written in ${DD_META.manager}'s voice.`;
  const ctx = item.note ? ` Reconcile it with what is already on file: ${item.note}` : "";
  return `Answer "${item.q}" for ${DD_META.manager} (${DD_META.product}). ${guide} Pull the figures and wording from the ${section.title} knowledge base on the right, cite each source inline, and flag anything that cannot be verified against a document.${ctx}`;
}

// ============================================================
// The preprocess requirements screen.
// ============================================================
function RequirementsReview() {
  const { dispatch } = useStore();

  // The displayed questionnaire is stateful so the user can add sections.
  const [sections, setSections] = useState(DD_QUESTIONNAIRE);
  // Selection — { secId, qIdx }. qIdx null ⇒ section-level (sources panel);
  // otherwise the index of the selected question (metadata panel).
  const [sel, setSel] = useState({ secId: DD_QUESTIONNAIRE[0]?.id || null, qIdx: null });
  const [adding, setAdding] = useState(false);

  // user-tagged docs, kept on the screen: { [sectionId]: [docId, …] }
  const [tagged, setTagged] = useState({});
  const tag   = (sec, id) => setTagged(t => ({ ...t, [sec]: Array.from(new Set([...(t[sec] || []), id])) }));
  const untag = (sec, id) => setTagged(t => ({ ...t, [sec]: (t[sec] || []).filter(x => x !== id) }));

  const selSection = sections.find(s => s.id === sel.secId) || null;
  const selItem = selSection && sel.qIdx != null ? selSection.items[sel.qIdx] : null;

  // live stats — update as sections are added
  const qCount = sections.reduce((n, s) => n + s.items.filter(it => it.n).length, 0);
  const srcDocCount = new Set(sections.flatMap(s => s.sources.map(x => x.id))).size;

  const addSection = (built) => {
    setSections(prev => [...prev, built]);
    setSel({ secId: built.id, qIdx: null });
    setAdding(false);
  };

  return (
    <div className="dr-req-screen">
      <div className="dr-req-summary">
        <div className="dr-req-headblock">
          <div className="dr-req-eyebrow"><Icon name="check" size={11} /> Preprocess complete</div>
          <div className="dr-req-h">Requirements extracted</div>
          <div className="dr-req-subh">The full questionnaire, ready to draft. Select a section to review the documents that will feed it, or a single question to see the prompt and information behind its answer.</div>
        </div>
        <div className="dr-req-stats">
          <div className="dr-req-stat"><Icon name="chat" size={14} className="dr-req-stat-ic" /><span className="n">{qCount}</span><span className="l">questions</span></div>
          <div className="dr-req-stat"><Icon name="docs" size={14} className="dr-req-stat-ic" /><span className="n">{sections.length}</span><span className="l">sections</span></div>
          <div className="dr-req-stat"><Icon name="folders" size={14} className="dr-req-stat-ic" /><span className="n">{srcDocCount}</span><span className="l">source docs</span></div>
        </div>
      </div>

      <div className="dr-review-layout">
        <div className="dr-doc-pane dr-q-pane split">
          <div className="dr-doc dr-q-doc">
            <div className="dr-doc-headline">
              <div className="dr-doc-h1">{DD_META.title}</div>
              <div className="dr-doc-meta">{DD_META.manager} · {DD_META.product}</div>
              <div className="dr-q-hintbar">
                <Icon name="folders" size={13} /> Select a section to review its source documents, or a question to inspect the prompt and information used to answer it.
              </div>
            </div>

            {sections.map(s => (
              <ReqSection key={s.id} section={s}
                          sectionSelected={sel.secId === s.id && sel.qIdx === null}
                          selectedQIdx={sel.secId === s.id ? sel.qIdx : null}
                          onSelectSection={() => setSel({ secId: s.id, qIdx: null })}
                          onSelectQuestion={(idx) => setSel({ secId: s.id, qIdx: idx })}
                          taggedCount={(tagged[s.id] || []).length} />
            ))}

            {adding
              ? <AddSectionComposer onAdd={addSection} onCancel={() => setAdding(false)} />
              : <button className="dr-addsection-btn" onClick={() => setAdding(true)}><Icon name="plus" size={14} /> Add a section</button>}

            <div className="dr-q-actionbar">
              <span className="t-muted">Responses are drafted from the knowledge base · you can edit everything afterward.</span>
              <button className="btn btn-primary" onClick={() => dispatch({ type: "DR_SET_PHASE", phase: "generating" })}><Icon name="sparkle" size={14} /> Process</button>
            </div>
          </div>
        </div>

        {selItem ? (
          <QuestionPanel section={selSection} item={selItem}
                         tagged={tagged[sel.secId] || []} />
        ) : selSection ? (
          <SourcePanel section={selSection}
                       tagged={tagged[sel.secId] || []}
                       onTag={(id) => tag(sel.secId, id)}
                       onUntag={(id) => untag(sel.secId, id)} />
        ) : null}
      </div>
    </div>
  );
}

// A single questionnaire section in the master panel.
function ReqSection({ section, sectionSelected, selectedQIdx, onSelectSection, onSelectQuestion, taggedCount }) {
  const srcCount = section.sources.length + taggedCount;
  let lastSub = null;
  const active = sectionSelected || selectedQIdx != null;
  return (
    <div className={`dr-qsection ${sectionSelected ? "selected" : ""} ${active ? "active" : ""}`} id={`reqsec-${section.id}`}>
      <div className="dr-qsection-head" onClick={onSelectSection}>
        <div style={{ minWidth: 0 }}>
          <div className="dr-qsection-title">{section.title}{section.custom && <span className="dr-qsection-badge">Added</span>}</div>
          <div className="dr-qsection-intro">{section.intro}</div>
        </div>
        <div className="dr-qsection-head-right">
          <span className="dr-qsection-srcs"><Icon name="folders" size={12} /> {srcCount} source{srcCount === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div className="dr-qsection-body">
        {section.items.map((it, i) => {
          const subHead = it.sub && it.sub !== lastSub ? it.sub : null;
          if (it.sub) lastSub = it.sub;
          return (
            <React.Fragment key={i}>
              {subHead && <div className="dr-q-subhead">{subHead}</div>}
              <ReqItem item={it} selected={selectedQIdx === i} onSelect={() => onSelectQuestion(i)} />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// A single question. Questions only — answers are drafted by Process.
// Clicking a question selects it and opens its metadata in the panel.
function ReqItem({ item, selected, onSelect }) {
  const isBio = !item.n;
  return (
    <div className={`dr-q-item ${isBio ? "bio" : ""} ${selected ? "selected" : ""}`} onClick={onSelect}>
      <div className="dr-q-q">
        {item.n ? <span className="dr-q-num">{item.n}</span> : null}
        <span className="dr-q-text">{item.q}</span>
        <Icon name="chevron-right" size={14} className="dr-q-chevron" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Right-hand panel — SECTION mode: suggested + tagged source documents
// ---------------------------------------------------------------
function SourcePanel({ section, tagged, onTag, onUntag }) {
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
        <div className="dr-src-eyebrow"><Icon name="folders" size={12} /> Knowledge base · sources</div>
        <div className="dr-src-title">{section.title}</div>
        <div className="dr-src-sub">Documents Othello will reference when drafting this section.</div>
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

// ---------------------------------------------------------------
// Right-hand panel — QUESTION mode: the prompt + information behind the
// answer Othello will draft for a single question.
// ---------------------------------------------------------------
function QuestionPanel({ section, item, tagged }) {
  const { state, dispatch } = useStore();
  const kbDocs = state.dataRoom.kbDocs;

  const suggested = section.sources
    .map(s => ({ ...s, doc: reqResolveKbDoc(kbDocs, s.id) }))
    .filter(s => s.doc);
  const taggedDocs = tagged.map(id => reqResolveKbDoc(kbDocs, id)).filter(Boolean);
  const refs = reqRefs(item);

  const openDoc = (d) => dispatch({
    type: "DR_OPEN_DOC", docId: d.id,
    page: d.kind === "pdf" ? 1 : undefined,
    sheet: d.kind === "sheet" ? Object.keys(SHEET_SNIPPETS)[0] : undefined,
  });
  const openRef = (r) => dispatch({ type: "DR_OPEN_DOC", docId: r.docId, page: r.page, sheet: r.sheet });

  return (
    <div className="dr-src-panel">
      <div className="dr-src-top">
        <div className="dr-src-eyebrow"><Icon name="sparkle" size={12} /> {item.n ? `Question ${item.n}` : "Entry"} · {section.title}</div>
        <div className="dr-src-title">{item.q}</div>
      </div>

      <div className="dr-src-scroll">
        <div className="dr-src-label">Generation prompt</div>
        <div className="dr-q-prompt">
          <Icon name="sparkle" size={13} className="dr-q-prompt-ic" />
          <span>{reqPrompt(item, section)}</span>
        </div>

        {refs.length > 0 && (
          <>
            <div className="dr-src-label">Cited in the draft</div>
            <div className="dr-q-refs">
              {refs.map((r, i) => (
                <button key={i} className="dr-q-ref" onClick={() => openRef(r)}>
                  <Icon name="external" size={11} /> {r.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="dr-src-label">Information used to answer <span className="t-muted">· what each document provides</span></div>
        <div className="dr-src-list">
          {suggested.map(s => <SrcCard key={s.id} doc={s.doc} feeds={s.feeds} onOpen={() => openDoc(s.doc)} />)}
          {taggedDocs.map(d => <SrcCard key={d.id} doc={d} feeds="Tagged to this section" onOpen={() => openDoc(d)} />)}
          {suggested.length === 0 && taggedDocs.length === 0 && <div className="dr-ai-empty">No documents tagged to this section yet.</div>}
        </div>

        {(item.note || item.hint) && (
          <>
            <div className="dr-src-label">On file</div>
            <div className="dr-q-context">{item.note || "Open question — the manager supplies this context; Othello drafts a prompt for them from the section sources."}</div>
          </>
        )}
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
      {tagged && (
        <div className="dr-src-card-side">
          <button className="dr-src-remove" title="Remove from section" onClick={(e) => { e.stopPropagation(); onRemove(); }}><Icon name="x" size={12} /></button>
        </div>
      )}
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
// Add-a-section composer — pre-staged with the team biographies so the
// demo always re-introduces them as a manually-added section.
// ---------------------------------------------------------------
function AddSectionComposer({ onAdd, onCancel }) {
  const staged = typeof DD_STAGED_SECTION !== "undefined" ? DD_STAGED_SECTION : { title: "", intro: "", sources: [], items: [] };
  const [title, setTitle] = useState(staged.title);
  const [rows, setRows] = useState(staged.items.map(it => it.q));

  const setRow = (i, v) => setRows(r => r.map((x, j) => (j === i ? v : x)));
  const addRow = () => setRows(r => [...r, ""]);
  const removeRow = (i) => setRows(r => r.filter((_, j) => j !== i));

  const submit = () => {
    const cleaned = rows.map(r => r.trim()).filter(Boolean);
    const stagedItems = staged.items;
    const items = (cleaned.length ? cleaned : stagedItems.map(it => it.q)).map((q, i) => ({
      n: String(i + 1), q, custom: true,
      // carry the staged biography where the row still matches it, so the
      // added section is coherent and "Process" can draft the bios.
      a: stagedItems[i] && stagedItems[i].q === q ? stagedItems[i].a : undefined,
    }));
    onAdd({
      ...staged,
      id: "qb_custom_" + Date.now(),
      title: title.trim() || staged.title,
      custom: true,
      items,
    });
  };

  return (
    <div className="dr-addsection">
      <div className="dr-addsection-head">
        <span className="dr-addsection-ic"><Icon name="plus" size={15} /></span>
        <div>
          <div className="dr-addsection-title">Add a section</div>
          <div className="dr-addsection-sub">New sections are drafted from the knowledge base, the same as the extracted ones.</div>
        </div>
      </div>

      <label className="dr-addsection-flabel">Section title</label>
      <input className="dr-addsection-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Team Biographies" />

      <label className="dr-addsection-flabel">Questions to draft</label>
      <div className="dr-addsection-rows">
        {rows.map((r, i) => (
          <div className="dr-addsection-row" key={i}>
            <span className="dr-addsection-rownum">{i + 1}</span>
            <input className="dr-addsection-input" value={r} onChange={e => setRow(i, e.target.value)} placeholder="Add a question or entry…" />
            <button className="dr-addsection-rowx" title="Remove" onClick={() => removeRow(i)}><Icon name="x" size={13} /></button>
          </div>
        ))}
      </div>
      <button className="dr-addsection-addrow" onClick={addRow}><Icon name="plus" size={12} /> Add another question</button>

      <div className="dr-addsection-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}><Icon name="check" size={13} /> Add section</button>
      </div>
    </div>
  );
}

window.RequirementsReview = RequirementsReview;
