// ============================================================
// Othello — Data Room: a single DD container (the demo spine)
// ============================================================
//
// Phases: extracting → requirements → generating → review → finalised
//
// The generated output is a multi-section EDITABLE document. Each
// QUESTION is its own Google-Docs-style rich-text canvas — answer prose
// with inline clickable reference tags, an inline centered figure and,
// once resolved, its data table. Thematic sections are lightweight group
// headers over those question canvases. The review screen pairs the
// document with a right-hand AI panel: pick a question to see its
// validation requirement and a chat scoped to editing just that answer,
// or work on the whole document with nothing selected.

// ---- helpers shared across the module ----
const TAG_SVG = '<svg class="dr-tag-ic" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
function escHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function tokensToHtml(tokens) {
  return tokens.map(t => {
    if (typeof t === "string") return escHtml(t);
    const r = t.r;
    return `<span class="dr-tag" contenteditable="false" data-docid="${r.docId || ""}" data-page="${r.page || ""}" data-sheet="${r.sheet || ""}">${TAG_SVG}<span>${escHtml(r.label)}</span></span>`;
  }).join("");
}
const SECTION_BY_ID = Object.fromEntries(DD_SECTIONS.map(s => [s.id, s]));

function itemSatisfied(dd, it) {
  const f = dd.flags[it.id];
  if (!f) return true;
  return it.flagInfo.type === "validation" ? f.validated : f.resolved;
}
function ddAllDone(dd) { return DD_REVIEW_ITEMS.every(it => itemSatisfied(dd, it)); }

// A question swaps to its "final" content once its flag is resolved/validated.
function itemUsesFinal(dd, item) { return !!(item.contentFinal && itemSatisfied(dd, item)); }

// Build the inner HTML for one question's editable canvas. Embeds (reference
// tags, figure, table) are contenteditable=false so the caret skips over them.
function figureToHtml(img) {
  return `<figure class="dr-figure" contenteditable="false"><img src="${escHtml(img.src)}" alt="${escHtml(img.caption)}" loading="lazy"/><figcaption>${escHtml(img.caption)}</figcaption></figure>`;
}
function tableToHtml(table) {
  const head = table.head.map(h => `<th>${escHtml(h)}</th>`).join("");
  const rows = table.rows.map(r => `<tr>${r.map(c => `<td>${escHtml(c)}</td>`).join("")}</tr>`).join("");
  return `<table class="dr-table" contenteditable="false"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}
function itemToHtml(item, dd) {
  const useFinal = itemUsesFinal(dd, item);
  let html = `<div class="dr-qprose">${tokensToHtml(useFinal ? item.contentFinal : item.content)}</div>`;
  if (item.image) html += figureToHtml(item.image);
  if (item.table && useFinal) html += tableToHtml(item.table);
  return html;
}

// Trim a question's prose to its opening sentence, preserving any inline
// reference tags that fall within it. Used by the per-question "shorten" chat.
function shortenProse(prose) {
  let done = false; const remove = [];
  Array.from(prose.childNodes).forEach(node => {
    if (done) { remove.push(node); return; }
    if (node.nodeType === 3) {
      const m = node.nodeValue.match(/^[\s\S]*?[.?!](?=\s|$)/);
      if (m && m[0].trim().length) { node.nodeValue = m[0]; done = true; }
    }
  });
  remove.forEach(n => n.parentNode && n.parentNode.removeChild(n));
  return done;
}

// Parse a free-text edit instruction like: replace "X" with "Y" / change X to Y.
function parseReplace(text) {
  let m = text.match(/["'“”](.+?)["'“”]\s*(?:to|with|into|by|=>|->|→)\s*["'“”](.+?)["'“”]/i);
  if (m) return [m[1], m[2]];
  m = text.match(/\b(?:replace|change|swap|rename|substitute|update)\s+(.+?)\s+(?:to|with|into|by)\s+(.+)/i);
  if (m) return [m[1].replace(/^["'“”]+|["'“”]+$/g, "").trim(), m[2].replace(/[\s.!?"'“”]+$/g, "").replace(/^["'“”]+/g, "").trim()];
  return null;
}

// ============================================================
function DataRoomDD() {
  const { state, dispatch } = useStore();
  const dd = state.dataRoom.dd;
  const docRef = useRef(null);
  if (!dd) return null;
  const finalised = dd.phase === "finalised";
  const onCanvas = dd.phase === "review" || finalised;

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
      {onCanvas && <ReviewLayout docRef={docRef} finalised={finalised} />}
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
        {!finalised && <Toolbar />}
        <div className="dr-doc">
          <div className="dr-doc-headline">
            <div className="dr-doc-h1">{DD_META.title}</div>
            <div className="dr-doc-meta">{DD_META.manager} · {DD_META.product} · {finalised ? "Finalised draft" : "Draft for review"}</div>
          </div>
          {DD_SECTIONS.map(s => <SectionGroup key={s.id} section={s} />)}
        </div>
      </div>
      {!finalised && <AIPanel docRef={docRef} />}
    </div>
  );
}

// ---------------------------------------------------------------
// Formatting toolbar — bold / italic for the focused question canvas
// ---------------------------------------------------------------
function Toolbar() {
  const [active, setActive] = useState({ bold: false, italic: false });
  useEffect(() => {
    const update = () => { try { setActive({ bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic") }); } catch (e) {} };
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);
  const cmd = (c) => (e) => {
    e.preventDefault(); // keep the current selection inside the editor
    document.execCommand(c, false, null);
    try { setActive({ bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic") }); } catch (e2) {}
  };
  return (
    <div className="dr-toolbar">
      <button type="button" className={`dr-tool ${active.bold ? "on" : ""}`} title="Bold (⌘B)" onMouseDown={cmd("bold")}><b>B</b></button>
      <button type="button" className={`dr-tool ${active.italic ? "on" : ""}`} title="Italic (⌘I)" onMouseDown={cmd("italic")}><i>I</i></button>
      <span className="dr-toolbar-hint">Select text in any answer to format · ⌘B / ⌘I also work</span>
    </div>
  );
}

// ---------------------------------------------------------------
// A thematic section — a lightweight group header over its questions
// ---------------------------------------------------------------
function SectionGroup({ section }) {
  const { state } = useStore();
  const dd = state.dataRoom.dd;
  const flaggedCount = section.items.filter(it => it.flagInfo && !itemSatisfied(dd, it)).length;
  return (
    <div className="dr-group" id={`sec-${section.id}`}>
      <div className="dr-group-head">
        <div>
          <div className="dr-group-title">{section.title}</div>
          <div className="dr-group-intro">{section.intro}</div>
        </div>
        {flaggedCount > 0 && <span className="pill attention"><Icon name="warning" size={11} /> {flaggedCount} to review</span>}
      </div>
      {section.items.map(it => <QuestionCanvas key={it.id} item={it} />)}
    </div>
  );
}

// ---------------------------------------------------------------
// One question = its own selectable rich-text canvas
// ---------------------------------------------------------------
function QuestionCanvas({ item }) {
  const { state, dispatch } = useStore();
  const dd = state.dataRoom.dd;
  const selected = dd.selectedItemId === item.id;
  const flagged = !!item.flagInfo;
  const f = flagged ? dd.flags[item.id] : null;
  const resolved = flagged ? itemSatisfied(dd, item) : true;
  const statusLabel = flagged && !resolved
    ? (item.flagInfo.type === "validation" ? "validation required" : item.flagInfo.type === "upload" ? "attachment requested" : "input required")
    : null;
  return (
    <div className={`dr-qcanvas ${selected ? "selected" : ""}`} id={`item-${item.id}`} data-item={item.id}>
      <div className="dr-qcanvas-head" onClick={() => dispatch({ type: "DR_SELECT_ITEM", itemId: selected ? null : item.id })}>
        <div className="dr-qcanvas-q">{item.q}</div>
        <div className="dr-qcanvas-head-right">
          {statusLabel && <span className="pill attention dr-item-status"><Icon name="warning" size={10} /> {statusLabel}</span>}
          {flagged && resolved && <span className="pill ready dr-item-status"><Icon name="check" size={10} /> {f && f.validated ? "validated" : "resolved"}</span>}
          <span className="dr-qcanvas-edit"><Icon name="sparkle" size={11} /> {selected ? "Editing" : "Edit with AI"}</span>
        </div>
      </div>
      <QuestionEditor item={item} />
    </div>
  );
}

// Uncontrolled contentEditable — innerHTML is set imperatively so React
// re-renders never clobber the user's edits. Re-set only when this
// question flips draft → final on resolve/validate.
function QuestionEditor({ item }) {
  const { state } = useStore();
  const dd = state.dataRoom.dd;
  const ref = useRef(null);
  const revision = itemUsesFinal(dd, item) ? "final" : "draft";
  useEffect(() => { if (ref.current) ref.current.innerHTML = itemToHtml(item, dd); }, [revision]);
  return <div className="dr-qedit" ref={ref} contentEditable suppressContentEditableWarning spellCheck={false} />;
}

// ---------------------------------------------------------------
// AI panel — top: outstanding items / section flags · bottom: chat
// ---------------------------------------------------------------
function AIPanel({ docRef }) {
  const { state, dispatch } = useStore();
  const dd = state.dataRoom.dd;
  const selectedItem = dd.selectedItemId ? DD_ALL_ITEMS.find(i => i.id === dd.selectedItemId) : null;
  const [upload, setUpload] = useState(null); // { itemId, kind } | { kind:"chat" }
  const allDone = ddAllDone(dd);

  return (
    <div className="dr-ai-panel">
      <div className="dr-ai-top">
        {selectedItem ? (
          <>
            <div className="dr-ai-secthead">
              <button className="dr-ai-back" onClick={() => dispatch({ type: "DR_SELECT_ITEM", itemId: null })}>
                <Icon name="chevron-left" size={13} /> Whole document
              </button>
            </div>
            <div className="dr-ai-sub" style={{ marginTop: 0 }}>{selectedItem.sectionTitle}</div>
            <div className="dr-ai-title" style={{ marginTop: 2 }}>{selectedItem.q}</div>
            <div className="dr-ai-cards">
              {selectedItem.flagInfo
                ? <FlagCard item={selectedItem} onUpload={() => setUpload({ itemId: selectedItem.id, kind: selectedItem.flagInfo.type })} />
                : <div className="dr-ai-empty">No input required for this question. Edit it directly in the canvas, or ask the assistant below to revise it.</div>}
            </div>
          </>
        ) : (
          <>
            <div className="dr-ai-title">Outstanding items <span className="pill attention" style={{ fontSize: 10 }}>{DD_REVIEW_ITEMS.filter(it => !itemSatisfied(dd, it)).length}</span></div>
            <div className="dr-ai-sub">Questions that still need a decision before you can finalise. Select one to act on it.</div>
            <div className="dr-ai-list">
              {DD_REVIEW_ITEMS.map(it => {
                const ok = itemSatisfied(dd, it);
                return (
                  <div key={it.id} className={`dr-ai-item ${ok ? "ok" : ""}`} onClick={() => { dispatch({ type: "DR_SELECT_ITEM", itemId: it.id }); scrollToItem(docRef, it.id); }}>
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

      <AIChat docRef={docRef} item={selectedItem} onAttach={() => setUpload({ kind: "chat" })} />

      {upload && <FileUploadModal ctx={upload} onClose={() => setUpload(null)} />}
    </div>
  );
}

function scrollToItem(docRef, itemId) {
  const el = docRef?.current?.querySelector(`#item-${itemId}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

// flag / input card (per-question)
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
// Chat — whole-document edits, or edits scoped to one question (scripted)
// ---------------------------------------------------------------
function AIChat({ docRef, item, onAttach }) {
  const { state, toast } = useStore();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef(null);
  const speed = state.speed || 1;
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [msgs, thinking]);
  useEffect(() => { setMsgs([]); }, [item ? item.id : null]); // fresh thread when the focus changes

  const getItemEl = () => (item && docRef?.current) ? docRef.current.querySelector(`[data-item="${item.id}"]`) : null;

  // Replace text across every question canvas, or within one `root`. Skips
  // contenteditable=false embeds (reference tags, figures, tables).
  const replaceAcross = (pairs, root) => {
    let count = 0;
    const scope = root || docRef?.current;
    const nodes = scope ? scope.querySelectorAll(".dr-qedit") : [];
    nodes.forEach(node => {
      const walk = (n) => {
        if (n.nodeType === 3) {
          let txt = n.nodeValue;
          pairs.forEach(([from, to]) => { txt = txt.replace(from, () => { count++; return to; }); });
          if (txt !== n.nodeValue) n.nodeValue = txt;
        } else if (n.nodeType === 1 && !(n.getAttribute && n.getAttribute("contenteditable") === "false")) {
          n.childNodes.forEach(walk);
        }
      };
      node.childNodes.forEach(walk);
    });
    return count;
  };

  const respond = (text) => {
    const lower = text.toLowerCase();

    // ---- per-question mode: edit just this answer ----
    if (item) {
      const pr = parseReplace(text);
      if (pr) {
        const [from, to] = pr;
        const n = replaceAcross([[new RegExp(escapeRegExp(from), "g"), to]], getItemEl());
        return n > 0
          ? `Done — replaced ${n} occurrence${n === 1 ? "" : "s"} of “${from}” with “${to}” in this answer.`
          : `I couldn't find “${from}” in this answer. Check the wording and try again, or edit the text directly.`;
      }
      if (/(shorten|concise|tighten|trim|brief|shorter)/.test(lower)) {
        const prose = getItemEl()?.querySelector(".dr-qprose");
        return prose && shortenProse(prose)
          ? "Tightened this answer to its opening sentence. Keep editing inline, or ask me to adjust it further."
          : "This answer is already concise.";
      }
      if (/(source|where.*from|reference|cite|citation)/.test(lower)) {
        const hasTags = (item.content || []).some(t => typeof t !== "string") || (item.contentFinal || []).some(t => typeof t !== "string");
        return hasTags
          ? "This answer's sources are the reference tags shown inline — click one to open the source document at the cited page."
          : "This answer is drafted from the approved knowledge base for this data room.";
      }
      return "I can edit this answer. Try “replace ‘X’ with ‘Y’”, “make this more concise”, or just edit the text directly in the canvas.";
    }

    // ---- whole-document mode ----
    if (/copia/.test(lower) && /chester/.test(lower) && /(change|replace|rename|swap|update)/.test(lower)) {
      const n = replaceAcross([
        [/Copia Investment Partners Ltd/g, "Chester Asset Management Pty Ltd"],
        [/Copia Investments/g, "Chester Asset Management Pty Ltd"],
        [/\bCopia\b/g, "Chester Asset Management Pty Ltd"],
      ]);
      return `Done. I replaced ${n} reference${n === 1 ? "" : "s"} to Copia with “Chester Asset Management Pty Ltd” across the document. Review the highlighted answers and revert anything you want to keep.`;
    }
    if (/(source|where.*from|reference|cite)/.test(lower)) {
      return "Every answer cites its source. For example, the firm-wide FUM figure comes from the Diversa IM Review, sheet 1.2.6. Click any reference tag to open the source at the cited page.";
    }
    if (/(shorten|concise|tighten|trim)/.test(lower)) {
      return "Select a question first — click it in the document or pick one from the outstanding list — then ask me to make that answer more concise.";
    }
    return 'I can edit the document on instruction. Try "change references to Copia to Chester Asset Management Pty Ltd", select a question to edit it directly, or attach a file with the paperclip.';
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
    else if (/^Done — replaced/.test(reply)) toast("Answer updated", "ready");
    else if (/^Tightened/.test(reply)) toast("Answer shortened", "ready");
  };

  const itemLabel = item ? (item.q.length > 38 ? item.q.slice(0, 36) + "…" : item.q) : null;
  const chips = item
    ? ["Make this more concise", "What's the source here?"]
    : ["Change references to Copia to Chester Asset Management Pty Ltd", "What's the source for the FUM figure?"];

  return (
    <div className="dr-ai-chat">
      <div className="dr-ai-chat-head">
        <Icon name="sparkle" size={13} /> {item ? `Editing: ${itemLabel}` : "Edit the whole document"}
      </div>
      <div className="dr-ai-chat-body" ref={bodyRef}>
        {msgs.length === 0 && <div className="chat-msg-bot">{item ? "Ask me to edit this answer — replace a term, make it more concise, or check its source." : "Instruct me to edit the document, across all questions or one at a time."}</div>}
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
        <input className="chat-input" placeholder={item ? "Edit this answer…" : "Instruct the assistant…"} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(input); }} />
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
