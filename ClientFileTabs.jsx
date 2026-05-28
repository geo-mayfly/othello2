// ============================================================
// Othello — Client file tabs (Checklist, Forms, Documents, Activity)
// ============================================================

function ClientFileTabs({ client, fieldsFlash, formsFlash }) {
  const [tab, setTab] = useState("checklist");
  const [checklistMode, setChecklistMode] = useState("perform");

  const fieldsCount = Object.keys(client.fields || {}).length;
  const docsCount = client.documents?.length || 0;
  const formsCount = client.forms?.length || 0;
  const activityCount = client.activity?.length || 0;

  return (
    <div className="cf-section">
      <div className="tabs">
        <button className={`tab ${tab === "checklist" ? "active" : ""}`} onClick={() => setTab("checklist")}>
          Checklist {fieldsCount > 0 && <span className="tab-count">{fieldsCount}</span>}
        </button>
        <button className={`tab ${tab === "forms" ? "active" : ""}`} onClick={() => setTab("forms")}>
          Forms <span className="tab-count">{formsCount}</span>
        </button>
        <button className={`tab ${tab === "docs" ? "active" : ""}`} onClick={() => setTab("docs")}>
          Documents <span className="tab-count">{docsCount}</span>
        </button>
        <button className={`tab ${tab === "activity" ? "active" : ""}`} onClick={() => setTab("activity")}>
          Activity <span className="tab-count">{activityCount}</span>
        </button>
        <div style={{ flex: 1 }} />
        {tab === "checklist" && fieldsCount > 0 && (
          <div className="seg" style={{ marginBottom: 4 }}>
            <button className={checklistMode === "perform" ? "on" : ""} onClick={() => setChecklistMode("perform")}>Per form</button>
            <button className={checklistMode === "perclient" ? "on" : ""} onClick={() => setChecklistMode("perclient")}>Per client</button>
          </div>
        )}
      </div>

      {tab === "checklist" && <Checklist client={client} mode={checklistMode} flash={fieldsFlash} />}
      {tab === "forms" && <FormsList client={client} flash={formsFlash} />}
      {tab === "docs" && <DocumentsList client={client} />}
      {tab === "activity" && <ActivityList client={client} />}
    </div>
  );
}

// ---------------------------------------------------------------
// Checklist (per form / per client)
// ---------------------------------------------------------------
function Checklist({ client, mode, flash }) {
  const groups = mode === "perform" ? buildPerFormGroups(client) : buildPerClientGroups(client);
  const [expanded, setExpanded] = useState({});
  const toggle = (k) => setExpanded(s => ({ ...s, [k]: !s[k] }));

  return (
    <div>
      {groups.map(g => {
        const total = g.fields.length;
        const ready = g.fields.filter(k => client.fields[k]?.status === "verified").length;
        const isOpen = g.openByDefault ? expanded[g.key] !== false : expanded[g.key] !== false; // open by default
        return (
          <div className="checklist-group" key={g.key}>
            <div className="checklist-group-header" onClick={() => toggle(g.key)}>
              <div className="row-flex" style={{ flex: 1 }}>
                <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={14} style={{ color: "var(--text-muted)" }} />
                <span className="checklist-group-title">{g.title}</span>
                <span className="t-muted">{ready}/{total} ready</span>
              </div>
              <div className="ready-bar">
                <div className="ready-bar-fill" style={{ width: `${(ready / total) * 100}%` }} />
              </div>
            </div>
            {isOpen && g.fields.map(key => (
              <FieldRow
                key={key} fieldKey={key}
                field={client.fields[key]}
                expanded={expanded[`field:${key}`]}
                onToggle={() => toggle(`field:${key}`)}
                flashed={flash[key]}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function buildPerFormGroups(client) {
  const formIds = client.forms.map(f => f.formId);
  // hero needs fatca added optionally; for v1 we group by the present forms
  return formIds.map(fid => {
    const form = FORMS[fid];
    return {
      key: `form:${fid}`,
      title: `${form.short} — required fields`,
      fields: dedupe(form.sections.flatMap(s => s.fields)).filter(k => client.fields[k]),
      openByDefault: true,
    };
  });
}

function buildPerClientGroups(client) {
  const cats = ["Identity", "Tax", "Banking", "Investment", "Entity", "Adviser"];
  const byCat = Object.fromEntries(cats.map(c => [c, []]));
  for (const key of Object.keys(client.fields)) {
    const def = FIELD_DEFS[key];
    if (!def) continue;
    const cat = def.category;
    if (byCat[cat]) byCat[cat].push(key);
  }
  return cats
    .filter(c => byCat[c].length > 0)
    .map(c => ({ key: `cat:${c}`, title: c, fields: byCat[c], openByDefault: true }));
}

function dedupe(arr) { return Array.from(new Set(arr)); }

// ---------------------------------------------------------------
// FieldRow
// ---------------------------------------------------------------
function FieldRow({ fieldKey, field, expanded, onToggle, flashed }) {
  const def = FIELD_DEFS[fieldKey];
  if (!def || !field) return null;
  const sk = statusKind(field.status);
  const flashedRecent = flashed && (Date.now() - flashed < 600);
  return (
    <>
      <div
        className={`field-row ${expanded ? "expanded" : ""} ${flashedRecent ? "cross-fade-update" : ""}`}
        data-status={field.status}
        onClick={onToggle}
      >
        <div className="fr-label">
          <Icon name="chevron-right" size={11} className="caret" />
          {def.label}
          {def.aml && <span className="pill" style={{ fontSize: 10, padding: "1px 6px" }}>AML</span>}
        </div>
        <span className={`fr-status pill ${sk}`}>
          <StatusGlyph status={field.status} />
          {statusLabel(field.status)}
        </span>
        <span className="fr-value">{field.value}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{def.source || "—"}</span>
      </div>
      {expanded && (
        <div className="field-detail">
          <dl className="field-detail-grid">
            <dt>Canonical key</dt><dd className="t-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fieldKey}</dd>
            <dt>Type / validation</dt><dd>{def.type}</dd>
            <dt>Required / AML</dt><dd>{def.aml ? "Required, AML-critical" : "Required"}</dd>
            <dt>Provenance</dt><dd>{field.source}</dd>
            <dt>LLM content note</dt><dd style={{ color: "var(--text-secondary)" }}>{def.note}</dd>
            {field.conflict && (
              <>
                <dt>Conflict</dt>
                <dd>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Dynamics:</span><span className="t-mono" style={{ fontSize: 12 }}>{field.conflict.dynamics}</span>
                    <span style={{ color: "var(--text-muted)" }}>Photo ID:</span><span className="t-mono" style={{ fontSize: 12 }}>{field.conflict.id}</span>
                  </div>
                </dd>
              </>
            )}
            {field.error && <><dt>Error</dt><dd style={{ color: "var(--missing)" }}>{field.error}</dd></>}
            {field.confidence && <><dt>Confidence</dt><dd>{field.confidence}</dd></>}
          </dl>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------
// Forms list
// ---------------------------------------------------------------
function FormsList({ client, flash }) {
  const { dispatch, runEvent } = useStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  const inScope = new Set((client.forms || []).map(f => f.formId));
  const addable = Object.values(FORMS).filter(f => !inScope.has(f.id));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="t-muted" style={{ fontSize: 12 }}>
          Forms identified for this client. Add additional forms as the engagement evolves.
        </span>
        <div style={{ position: "relative" }}>
          <button className="btn btn-secondary" onClick={() => setPickerOpen(p => !p)} disabled={addable.length === 0}>
            <Icon name="plus" size={13} /> Add form
          </button>
          {pickerOpen && addable.length > 0 && (
            <div className="form-picker">
              <div className="form-picker-header">
                <span style={{ fontSize: 12, fontWeight: 600 }}>Add from library</span>
                <button className="btn btn-ghost btn-icon" onClick={() => setPickerOpen(false)}><Icon name="x" size={12} /></button>
              </div>
              {addable.map(f => (
                <button
                  key={f.id}
                  className="form-picker-item"
                  onClick={() => {
                    dispatch({ type: "ADD_FORM_TO_CLIENT", clientId: client.id, formId: f.id });
                    dispatch({ type: "ADD_ACTIVITY", clientId: client.id, entry: { actor: "Rachel Lee", desc: `Added ${f.short} to this client's required forms` } });
                    setPickerOpen(false);
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{f.title}</div>
                    <div className="t-muted" style={{ fontSize: 11, marginTop: 2 }}>{f.category} · {dedupe(f.sections.flatMap(s => s.fields)).length} fields</div>
                  </div>
                  <Icon name="plus" size={13} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {client.forms.length === 0 ? (
        <div className="empty-state">
          <Icon name="docs" size={24} />
          <div className="t-secondary">No forms in scope yet — the system will propose forms once the adviser brief is read.</div>
        </div>
      ) : client.forms.map(f => {
        const def = FORMS[f.formId];
        const flashRecent = flash[f.formId] && Date.now() - flash[f.formId] < 600;
        const effective = deriveFormStatus(client, f.formId);
        return (
          <div key={f.formId} className={`form-card ${flashRecent ? "cross-fade-update" : ""}`}>
            <div className="form-card-body">
              <div className="form-card-title">
                <Icon name="doc" size={14} style={{ color: "var(--text-muted)" }} />
                {def.title}
              </div>
              <div className="form-card-meta">{def.sections.length} sections · {dedupe(def.sections.flatMap(s => s.fields)).length} mapped fields</div>
            </div>
            <FormStatusPill status={effective} note={f.note} />
            <FormCardAction client={client} form={{ ...f, status: effective }} dispatch={dispatch} runEvent={runEvent} />
          </div>
        );
      })}
    </div>
  );
}

function FormStatusPill({ status, note }) {
  if (status === "proposed")   return <span className="pill demo"><Icon name="sparkle" size={11} /> Proposed · review</span>;
  if (status === "awaiting")   return <span className="pill"><Icon name="clock" size={11} /> Awaiting data</span>;
  if (status === "ready")      return <span className="pill ready"><StatusGlyph status="verified" /> Ready for review</span>;
  if (status === "dispatched") return <span className="pill accent"><Icon name="send" size={11} /> Dispatched</span>;
  if (status === "confirmed")  return <span className="pill ready"><StatusGlyph status="verified" /> Confirmed{note ? ` · ${note}` : ""}</span>;
  if (status === "blocked")    return <span className="pill missing"><Icon name="alert" size={11} /> Blocked{note ? ` · ${note}` : ""}</span>;
  return null;
}

function FormCardAction({ client, form, dispatch, runEvent }) {
  if (form.status === "proposed")
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-ghost" onClick={() => {
          dispatch({ type: "REMOVE_FORM_FROM_CLIENT", clientId: client.id, formId: form.formId });
          dispatch({ type: "ADD_ACTIVITY", clientId: client.id, entry: { actor: "Rachel Lee", desc: `Dismissed ${FORMS[form.formId].short} — not required` } });
        }}>Dismiss</button>
        <button className="btn btn-primary" onClick={() => {
          dispatch({ type: "UPDATE_FORM_STATUS", clientId: client.id, formId: form.formId, status: "awaiting" });
          dispatch({ type: "ADD_ACTIVITY", clientId: client.id, entry: { actor: "Rachel Lee", desc: `Confirmed ${FORMS[form.formId].short} is required for this client` } });
        }}>Confirm</button>
      </div>
    );
  if (form.status === "ready")
    return <button className="btn btn-primary" onClick={() => dispatch({ type: "OPEN_PREVIEW", clientId: client.id, formId: form.formId })}>Review &amp; approve</button>;
  if (form.status === "confirmed" || form.status === "dispatched")
    return <button className="btn btn-secondary" onClick={() => dispatch({ type: "OPEN_PREVIEW", clientId: client.id, formId: form.formId })}>View</button>;
  if (form.status === "blocked")
    return <button className="btn btn-secondary" onClick={() => runEvent("auto_chase_okafor")}>Request renewal</button>;
  return <button className="btn btn-secondary" disabled>Review &amp; approve</button>;
}

// ---------------------------------------------------------------
// Documents
// ---------------------------------------------------------------
// Document types the operator (or a connected system) can introduce.
// Each entry runs a scripted intake — the system processes the doc,
// maps fields, and updates outstanding items automatically.
const DOC_TYPES = [
  { id: "photo_id",         label: "Photo ID",                  source: "SharePoint / Upload",   desc: "Driver's licence or passport — extracts 7 identity fields", scriptId: "upload_photo_id",        docKey: "photo_id" },
  { id: "bank_stmt",        label: "Bank statement",            source: "SharePoint",            desc: "Recent statement — extracts BSB, account name & number",   scriptId: "upload_bank_statement",  docKey: "bank_stmt" },
  { id: "fatca",            label: "FATCA / CRS self-certification", source: "Email reply",       desc: "Foreign tax residency declaration — fills 3 tax fields",    scriptId: "resolve_fatca_fields",   testFn: (c) => c?.fields?.["investor.foreign_tin"]?.status === "verified" },
  { id: "wholesale_cert",   label: "Wholesale certificate",     source: "Upload",                desc: "Accountant certificate — ASIC-verified, 24-month validity", scriptId: "resolve_wholesale_fields", testFn: (c) => c?.fields?.["wholesale.cert_expiry"]?.status === "verified" },
  { id: "dd_auth",          label: "Direct-debit authority",    source: "E-signature",           desc: "Signed authority for the nominated account",                 scriptId: "resolve_dd_auth",        testFn: (c) => c?.fields?.["bank.debit_authority"]?.status === "verified" },
];

function DocumentsList({ client }) {
  const { runEvent } = useStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  const isAlreadyAdded = (docType) => {
    if (docType.docKey) return client.documents?.some(d => d.id === docType.docKey);
    if (docType.testFn) return docType.testFn(client);
    return false;
  };
  const addable = DOC_TYPES.filter(t => !isAlreadyAdded(t));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="t-muted" style={{ fontSize: 12 }}>
          Documents from SharePoint, uploads, e-signature returns and client replies. The system processes each one as it lands.
        </span>
        <div style={{ position: "relative" }}>
          <button className="btn btn-secondary" onClick={() => setPickerOpen(p => !p)} disabled={addable.length === 0}>
            <Icon name="upload" size={13} /> Upload document
          </button>
          {pickerOpen && addable.length > 0 && (
            <div className="form-picker" style={{ width: 360 }}>
              <div className="form-picker-header">
                <span style={{ fontSize: 12, fontWeight: 600 }}>Simulate a document landing</span>
                <button className="btn btn-ghost btn-icon" onClick={() => setPickerOpen(false)}><Icon name="x" size={12} /></button>
              </div>
              {addable.map(t => (
                <button
                  key={t.id}
                  className="form-picker-item"
                  onClick={() => { setPickerOpen(false); runEvent(t.scriptId); }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</div>
                    <div className="t-muted" style={{ fontSize: 11, marginTop: 2 }}>via {t.source}</div>
                    <div className="t-muted" style={{ fontSize: 11, marginTop: 2, color: "var(--text-secondary)" }}>{t.desc}</div>
                  </div>
                  <Icon name="arrow-right" size={13} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {(!client.documents || client.documents.length === 0) ? (
        <div className="empty-state">
          <Icon name="docs" size={24} />
          <div className="t-secondary">No documents yet. Documents are pulled from SharePoint, uploaded, or received via client reply / e-signature.</div>
        </div>
      ) : (
        <div className="bordered" style={{ background: "var(--bg-surface)" }}>
          {client.documents.map(d => (
            <div key={d.id} className="doc-row">
              <Icon name="doc" size={16} className="doc-icon" />
              <div>
                <div style={{ fontWeight: 500 }}>{d.name}</div>
                <div className="t-muted" style={{ fontSize: 12 }}>{d.type}</div>
              </div>
              <span className="t-muted">{d.source}</span>
              <span className="t-muted">{d.added}</span>
              {d.expiry ? (
                <span className={`pill ${d.expiry.status === "expired" ? "missing" : d.expiry.status === "attention" ? "attention" : "ready"}`}>
                  <Icon name="clock" size={11} /> {d.expiry.status === "expired" ? `Expired ${Math.abs(d.expiry.daysAway)}d ago` : `${d.expiry.daysAway}d`}
                </span>
              ) : <span></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Activity
// ---------------------------------------------------------------
function ActivityList({ client }) {
  if (!client.activity || client.activity.length === 0) {
    return <div className="empty-state"><div className="t-secondary">No activity yet.</div></div>;
  }
  return (
    <div className="bordered" style={{ background: "var(--bg-surface)" }}>
      {client.activity.map((a, i) => (
        <div key={i} className="activity-row">
          <span className="at-time">{a.time}</span>
          <span className="at-actor">{a.actor}</span>
          <span className="at-desc">{a.desc}</span>
        </div>
      ))}
    </div>
  );
}

window.ClientFileTabs = ClientFileTabs;
