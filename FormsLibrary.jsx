// ============================================================
// Othello — Forms library + field-map slide-over (incl. mapping-in-review)
// ============================================================

function FormsLibrary() {
  const { state, dispatch } = useStore();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  const categories = ["All", "Fund applications", "Identity & AML", "Platform", "Banking"];
  const forms = Object.values(state.formsLibrary);
  const visible = forms.filter(f => {
    if (cat !== "All" && f.category !== cat) return false;
    if (query.trim() && !`${f.title} ${f.description}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Forms library</div>
          <div className="page-sub">Map each form once. Once a human approves the map, it's frozen and reused on every client — never re-derived per fill.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="cl-search-wrap" style={{ marginBottom: 0, minWidth: 220 }}>
            <Icon name="search" size={14} />
            <input className="cl-search" placeholder="Search forms…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button className="btn btn-secondary"><Icon name="plus" size={14} /> Add form</button>
        </div>
      </div>

      <div className="seg" style={{ marginBottom: 18 }}>
        {categories.map(c => (
          <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="library-grid">
        {visible.map(f => (
          <div key={f.id} className="lib-card" onClick={() => dispatch({ type: "OPEN_FIELD_MAP", formId: f.id })}>
            <div className="lib-thumb">
              <div className="lib-thumb-doc">
                <div className="tt">{f.short.toUpperCase()}</div>
                <div className="tl med"></div>
                <div className="tl short"></div>
                <div className="tb"><div></div><div></div><div></div><div></div></div>
                <div className="tl short"></div>
                <div className="tl med"></div>
                <div className="tb"><div></div><div></div></div>
                <div className="tl"></div>
                <div className="tl med"></div>
              </div>
            </div>
            <div>
              <div className="t-card-title">{f.title}</div>
              <div className="t-secondary" style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.45 }}>{f.description}</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
              {f.status === "live" ? (
                <span className="pill ready"><StatusGlyph status="verified" /> Mapped &amp; live</span>
              ) : (
                <span className="pill attention"><StatusGlyph status="review" /> Mapping in review · {f.confirmedCount}/{f.totalCount}</span>
              )}
              <span className="pill">{dedupe(f.sections.flatMap(s => s.fields)).length} fields</span>
              <span className="pill">{dedupe(f.sections.flatMap(s => s.fields)).filter(k => FIELD_DEFS[k]?.aml).length} AML</span>
            </div>
            <div className="t-muted" style={{ fontSize: 11.5, display: "flex", justifyContent: "space-between" }}>
              <span>{f.sourcePlatform}</span>
              <span>Updated {f.lastUpdated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Field-map slide-over
// ---------------------------------------------------------------
function FieldMapSlideover() {
  const { state, dispatch } = useStore();
  const id = state.fieldMapSlideoverId;
  if (!id) return null;
  const form = state.formsLibrary[id];
  const [amlOnly, setAmlOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({});
  const [collapsedSec, setCollapsedSec] = useState({});
  const isReview = form.status === "review";

  // Smith client (used to read populated values for preview only — optional)
  // Confidence levels for review mode (illustrative)
  const REVIEW_CONFIDENCE = {
    "investor.given_names": 0.96,
    "investor.surname": 0.97,
    "investor.residential_address": 0.92,
    "bank.institution": 0.95,
    "bank.bsb": 0.99,
    "bank.account_no": 0.98,
    "bank.account_name": 0.94,
    "investment.amount": 0.91,
  };

  const fieldKeys = dedupe(form.sections.flatMap(s => s.fields));
  const filtered = (keys) => keys.filter(k => {
    const def = FIELD_DEFS[k];
    if (!def) return false;
    if (amlOnly && !def.aml) return false;
    if (query.trim() && !`${def.label} ${k}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const amlCount = fieldKeys.filter(k => FIELD_DEFS[k]?.aml).length;

  // for in-review form: track confirmed
  const [confirmedKeys, setConfirmedKeys] = useState(() => {
    if (!isReview) return new Set();
    // start with all but one confirmed
    const set = new Set(fieldKeys);
    set.delete(fieldKeys[fieldKeys.length - 1]);
    return set;
  });

  const totalToConfirm = fieldKeys.length;
  const confirmedNow = confirmedKeys.size;
  const allConfirmed = isReview && confirmedNow === totalToConfirm;

  const onConfirm = (k) => {
    setConfirmedKeys(prev => {
      const next = new Set(prev);
      next.add(k);
      return next;
    });
    dispatch({ type: "CONFIRM_LIBRARY_FIELD", formId: form.id });
  };

  return (
    <>
      <div className="slideover-backdrop" onClick={() => dispatch({ type: "CLOSE_FIELD_MAP" })}></div>
      <div className="slideover">
        <div className="so-header">
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1 }}>
            <div style={{ width: 56, height: 72, background: "white", borderRadius: 4, padding: 5, fontSize: 4, color: "#222", lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700, fontSize: 6 }}>{form.short.toUpperCase()}</div>
              <div style={{ height: 1, background: "#ddd", marginTop: 3 }} />
              <div style={{ height: 1, background: "#ddd", marginTop: 2 }} />
              <div style={{ height: 1, background: "#ddd", marginTop: 2, width: "60%" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 3 }}>
                <div style={{ height: 2, background: "#eee" }}></div>
                <div style={{ height: 2, background: "#eee" }}></div>
                <div style={{ height: 2, background: "#eee" }}></div>
                <div style={{ height: 2, background: "#eee" }}></div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t-card-title" style={{ fontSize: 15 }}>{form.title}</div>
              <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {isReview
                  ? <span className="pill attention"><StatusGlyph status="review" /> Mapping in review · {confirmedNow}/{totalToConfirm} confirmed</span>
                  : <span className="pill ready"><StatusGlyph status="verified" /> Mapped &amp; live</span>}
                <span className="pill">{fieldKeys.length} fields</span>
                <span className="pill">{amlCount} AML-required</span>
              </div>
              <div className="t-muted" style={{ marginTop: 8, fontSize: 12 }}>{form.source}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => dispatch({ type: "CLOSE_FIELD_MAP" })}><Icon name="x" /></button>
        </div>

        <div className="so-toolbar">
          <div className="cl-search-wrap" style={{ flex: 1, marginBottom: 0 }}>
            <Icon name="search" size={14} />
            <input className="cl-search" placeholder="Search fields…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={amlOnly} onChange={e => setAmlOnly(e.target.checked)} />
            AML-required only
          </label>
        </div>

        <div className="so-body">
          {form.sections.map((sec, si) => {
            const keys = filtered(dedupe(sec.fields));
            if (keys.length === 0) return null;
            const isCollapsed = collapsedSec[si];
            const sectionConfirmed = isReview ? keys.every(k => confirmedKeys.has(k)) : true;
            return (
              <div key={si} className="so-section">
                <div className="so-section-header" onClick={() => setCollapsedSec(s => ({ ...s, [si]: !s[si] }))}>
                  <div className="row-flex">
                    <Icon name={isCollapsed ? "chevron-right" : "chevron-down"} size={12} style={{ color: "var(--text-muted)" }} />
                    <span className="so-section-title">{sec.title}</span>
                    {sectionConfirmed ? <span className="pill ready" style={{ fontSize: 10, padding: "1px 6px" }}><StatusGlyph status="verified" size={10} /></span> : <span className="pill attention" style={{ fontSize: 10, padding: "1px 6px" }}>review</span>}
                  </div>
                  <span className="t-muted">{keys.length}</span>
                </div>
                {!isCollapsed && keys.map(k => {
                  const def = FIELD_DEFS[k];
                  const open = expanded[k];
                  const confirmed = isReview ? confirmedKeys.has(k) : true;
                  const conf = REVIEW_CONFIDENCE[k] ?? 0.93;
                  return (
                    <div key={k} className="fm-row" onClick={() => setExpanded(s => ({ ...s, [k]: !s[k] }))}>
                      <div className="fm-row-top">
                        <div>
                          <div style={{ fontWeight: 500 }}>{def.label}{def.aml && <span className="pill" style={{ fontSize: 9, padding: "0 5px", marginLeft: 6 }}>AML</span>}</div>
                          <div className="fm-key" style={{ marginTop: 2 }}>{k}</div>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{def.source}</div>
                        <span className="pill" style={{ fontSize: 10.5 }}>{def.type.split(";")[0]}</span>
                        {isReview ? (
                          confirmed ? (
                            <span className="pill ready" style={{ fontSize: 10.5 }}><StatusGlyph status="verified" /> Confirmed</span>
                          ) : (
                            <span className="pill attention" style={{ fontSize: 10.5 }}><StatusGlyph status="review" /> {Math.round(conf * 100)}%</span>
                          )
                        ) : (
                          <span className="pill ready" style={{ fontSize: 10.5 }}><StatusGlyph status="verified" /> Mapped</span>
                        )}
                        <Icon name={open ? "chevron-down" : "chevron-right"} size={12} style={{ color: "var(--text-muted)" }} />
                      </div>
                      {open && (
                        <div className="fm-detail" onClick={e => e.stopPropagation()}>
                          <dl>
                            <dt>Type / validation</dt><dd>{def.type}</dd>
                            <dt>Required</dt><dd>{def.aml ? "Yes — AML-critical" : "Yes"}</dd>
                            <dt>Source</dt><dd>{def.source}</dd>
                            <dt>Canonical key</dt><dd className="t-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{k}</dd>
                          </dl>
                          <div className="note">
                            <strong style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>LLM content note</strong>
                            <div style={{ marginTop: 4 }}>{def.note}</div>
                          </div>
                          {isReview && !confirmed && (
                            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                              <button className="btn btn-primary" onClick={() => onConfirm(k)}>Confirm</button>
                              <button className="btn btn-secondary">Edit mapping</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="so-footer">
          {isReview ? (
            allConfirmed
              ? <span style={{ color: "var(--ready)", display: "inline-flex", alignItems: "center", gap: 6 }}><StatusGlyph status="verified" /> All fields confirmed — form is now Mapped &amp; live and frozen.</span>
              : <span>{totalToConfirm - confirmedNow} field{totalToConfirm - confirmedNow === 1 ? "" : "s"} left to confirm — review to publish.</span>
          ) : (
            <span>Mappings are frozen after first human approval and reused on every client — not re-derived per fill.</span>
          )}
        </div>
      </div>
    </>
  );
}

window.FormsLibrary = FormsLibrary;
window.FieldMapSlideover = FieldMapSlideover;
