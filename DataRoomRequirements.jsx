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

// Lowercase the first letter for mid-sentence flow, but leave all-caps
// acronyms (AUM, ESG, ETF, REM …) intact.
function lcFirst(s) { return s && /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }

// Matches the imperative "Please detail / provide / describe … X" asks so
// the X can be lifted into a natural instruction.
const REQ_IMP = /^(?:please\s+)?(?:provide details of|provide some detail on|provide an indication of|provide details|provide|detail|describe|articulate|outline|list|add)\s+(.+)$/i;

// Domain content hints — what kinds of facts to look for, keyed by the
// wording of the question. Ordered specific → general; matches are unioned
// and capped so the brief stays focused.
const REQ_CONTENT_HINTS = [
  [/inception|date the business|established|launch|track record/i,
    ["Date the business / fund was established or launched", "Length and continuity of the track record", "Any predecessor strategy, fund or mandate"]],
  [/ownership|shareholder|employee-owned|equity ownership|owned by/i,
    ["Shareholding percentages by individual or entity", "Legal entity / group structure and any parent links", "Whether there are any external or institutional holders", "Any recent or planned changes to ownership"]],
  [/legal entity|holding company|parent company|group structure|corporate structure/i,
    ["Legal entity structure and any group / parent links", "Roles of related or outsourced service entities"]],
  [/board|executive team|governance|director|operational duties/i,
    ["Board / executive members and their roles", "Separation of the front office from operations / back office"]],
  [/profitab|breakeven|working capital|profitable/i,
    ["Whether the business is profitable on base fees alone", "Reliance on performance fees", "Working-capital runway if pre-breakeven"]],
  [/\baum\b|funds under management|\bfum\b|net flows|capacity|calendar year/i,
    ["AUM / FUM figures with their as-at dates and currency", "Calendar-year history and net inflows / outflows", "Capacity estimate and when it was last reviewed"]],
  [/institutional|wholesale|retail|10% of total|client group|concentration/i,
    ["Split of AUM by channel or unit class", "The largest client(s) and their % of total AUM", "Segregated mandate vs pooled-fund split"]],
  [/single strategy|other source|revenue|strategies/i,
    ["Number and type of strategies / products run", "All sources of revenue", "Materiality of any non-management-fee revenue"]],
  [/headcount|split by function|number of staff/i,
    ["Total headcount and how it has changed over three years", "Split between investment and non-investment functions", "Which functions are outsourced, and to whom"]],
  [/key investment staff|bios|biograph|portfolio manager|analyst|investment team/i,
    ["Each person's name, title and role", "Years of industry experience and tenure at the firm", "Prior firms, qualifications and designations"]],
  [/addition|departure|joiner|leaver|turnover/i,
    ["Joiners and leavers over the past three years", "Roles affected and the dates of each change"]],
  [/\brem\b|remuneration|incentive|co-invest|alignment|retention/i,
    ["Base vs variable pay structure", "How pay is linked to the fund's investment outcomes", "Equity ownership / co-investment and other retention mechanisms"]],
  [/back-up|succession|key decision|key person/i,
    ["Designated back-up decision-maker(s)", "Succession plan for senior investment staff", "How key-person risk is spread across the team"]],
  [/esg/i,
    ["Whether ESG is integrated or run by a dedicated team", "The ESG / proxy-voting policy", "How ESG risk feeds valuation and stock selection"]],
  [/style|philosophy|classify|overarching/i,
    ["The stated investment style / bias", "Core beliefs and the source of edge", "The market inefficiency being exploited"]],
  [/screen|universe|idea|coverage|financial models|in house|external research|generalist|specialist|devil|macro|workflow/i,
    ["How the investable universe is defined and screened", "How ideas are generated, validated and challenged", "Names covered / modelled, and internal vs external research"]],
  [/benchmark aware|position siz|construct|challenged on position|number of (stocks|holdings)|sizing/i,
    ["Number of holdings and how positions are sized", "Whether the portfolio is benchmark-aware", "Buy and sell discipline triggers"]],
  [/downside|stress|scenario|risk control|risk committee|significant weakness|drawdown/i,
    ["Stock- and portfolio-level downside / stress testing", "Risk limits (stock, sector, cash, leverage)", "Independent risk oversight outside the investment team"]],
  [/proprietary|internal.*model|machine learning|ai\b|enhancement/i,
    ["Proprietary tools / models and how they are used", "Recent process enhancements", "Any use of AI / ML in the process"]],
  [/performance benchmark/i,
    ["The named benchmark index"]],
  [/return objective|outperform|return target/i,
    ["The return target relative to benchmark", "The measurement time horizon", "Whether it is stated gross or net of fees"]],
  [/risk objective|tracking error/i,
    ["The stated risk objective", "Expected tracking-error range"]],
  [/fee structure|fee rebate|hurdle|high-water|\bhwm\b|performance fee/i,
    ["Base and performance fee terms", "The hurdle / benchmark", "High-water-mark treatment and the average performance fee", "Whether rebates are available"]],
  [/service provider|custodian|auditor|prime broker|responsible entity/i,
    ["Responsible Entity / trustee", "Custodian and any sub-custodian", "Fund auditor", "Prime broker, if any"]],
  [/\betf\b/i,
    ["Whether the fund is listed or an ETF", "Market makers / authorised participants, if applicable"]],
  [/derivative|gearing|leverage|geared/i,
    ["Whether derivatives or leverage are used", "Approved instruments", "Their role in implementation"]],
];

// The kinds of content to look for — domain hints unioned with the exact
// table columns the answer needs to populate.
function reqLookFor(item) {
  const out = [];
  for (const [re, hints] of REQ_CONTENT_HINTS)
    if (re.test(item.q)) for (const h of hints) if (!out.includes(h)) out.push(h);
  let bullets = out.slice(0, 5);
  if (bullets.length === 0) bullets = ["The specific facts the question asks for", "Supporting figures with their as-at dates", "A source document that evidences each point"];
  if (item.table && item.table.head) {
    const cols = item.table.head.filter(h => h && h.trim());
    if (cols.length) bullets.push("Values for the table columns: " + cols.join(" · "));
  }
  return bullets;
}

function joinList(a) { a = a.filter(Boolean); return a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }

// One editable, plain-language instruction for the agent: what to produce,
// the content to look for, and which documents to draw on. Composed from the
// question and the content hints; the user can edit it freely in the panel.
function reqInstruction(item, section) {
  const sec = section.title;
  if (item.hint) {
    return `Open field — invite the manager to add any context they wish, in their own words, drawing on the ${sec} documents below where useful.`;
  }
  const body = item.q.trim().replace(/\s+/g, " ").replace(/[?:.,\s]+$/, "");
  let lead;
  if (section.custom || /biograph/i.test(section.title)) {
    lead = `Draft a short professional biography for ${body}.`;
  } else if (/^if\b/i.test(body)) {
    const after = body.replace(/^if[^,]*,\s*/i, "");
    const im2 = after.match(REQ_IMP);
    lead = im2 ? `Where the preceding answer applies, set out ${lcFirst(im2[1])}.` : `Where the preceding answer applies, ${lcFirst(after.replace(/^please\s+/i, ""))}.`;
  } else {
    const im = body.match(REQ_IMP);
    lead = im ? `Set out ${lcFirst(im[1])}.` : `Answer the question: ${body}?`;
  }
  const all = reqLookFor(item);
  const cols = all.find(b => b.startsWith("Values for the table columns"));
  const hints = all.filter(b => !b.startsWith("Values for the table columns"));
  let s = lead;
  if (hints.length) s += ` Look for ${joinList(hints.map(lcFirst))}.`;
  if (cols) s += ` Populate the table: ${cols.replace(/^Values for the table columns:\s*/, "")}.`;
  s += ` Draw on the ${sec} documents listed below and keep the response factual and concise.`;
  return s;
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
          <div className="dr-req-subh">The full questionnaire, ready to draft. Select a section to review the documents that will feed it, or a single question to see what it covers and the documents behind it.</div>
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
                <Icon name="folders" size={13} /> Select a section to review its source documents, or a question to see what it covers and the documents used to answer it.
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
          <QuestionPanel key={`${sel.secId}:${sel.qIdx}`} section={selSection} item={selItem}
                         tagged={tagged[sel.secId] || []}
                         onTag={(id) => tag(sel.secId, id)}
                         onUntag={(id) => untag(sel.secId, id)} />
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
// Shared documents + tagging block — rendered identically whether a
// SECTION or an individual QUESTION is selected. Tagging is always keyed
// to the section the docs belong to.
// ---------------------------------------------------------------
function SourceDocs({ section, tagged, onTag, onUntag }) {
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
    <>
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
    </>
  );
}

// Right-hand panel — SECTION mode.
function SourcePanel({ section, tagged, onTag, onUntag }) {
  return (
    <div className="dr-src-panel">
      <div className="dr-src-top">
        <div className="dr-src-eyebrow"><Icon name="folders" size={12} /> Knowledge base · sources</div>
        <div className="dr-src-title">{section.title}</div>
        <div className="dr-src-sub">Documents Othello will reference when drafting this section.</div>
      </div>
      <div className="dr-src-scroll">
        <SourceDocs section={section} tagged={tagged} onTag={onTag} onUntag={onUntag} />
      </div>
    </div>
  );
}

// A single, editable instruction textarea that auto-grows to its content.
function EditableInstruction({ value }) {
  const [text, setText] = useState(value);
  const grow = (el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } };
  return (
    <textarea className="dr-q-instruction" value={text} ref={grow} spellCheck={false}
              onChange={(e) => { setText(e.target.value); grow(e.target); }} />
  );
}

// Right-hand panel — QUESTION mode: one editable instruction for the agent,
// then the identical documents + tagging block.
function QuestionPanel({ section, item, tagged, onTag, onUntag }) {
  return (
    <div className="dr-src-panel">
      <div className="dr-src-top">
        <div className="dr-src-eyebrow"><Icon name="chat" size={12} /> {item.n ? `Question ${item.n}` : "Entry"} · {section.title}</div>
        <div className="dr-src-title">{item.q}</div>
      </div>
      <div className="dr-src-scroll">
        <div className="dr-src-label">Instruction <span className="t-muted">· editable</span></div>
        <EditableInstruction value={reqInstruction(item, section)} />
        <SourceDocs section={section} tagged={tagged} onTag={onTag} onUntag={onUntag} />
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
