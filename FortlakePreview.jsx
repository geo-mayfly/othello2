// ============================================================
// Othello — Fortlake populated form preview (PDF look)
// ============================================================

function FortlakePreview() {
  const { state, dispatch, runEvent } = useStore();
  const { previewForm } = state;
  if (!previewForm) return null;
  const client = state.clients.find(c => c.id === previewForm.clientId);
  if (!client) return null;
  const formId = previewForm.formId;
  const form = FORMS[formId];

  const isFortlake = formId === "fortlake_application";
  const allGreen = form.sections.flatMap(s => s.fields).every(k => {
    const s = client.fields[k]?.status;
    return s === "verified" || s === "stale"; // stale = expiring-soon, still valid
  });

  const sideRailRef = useRef(null);
  const [highlightKey, setHighlightKey] = useState(null);

  const jumpTo = (key) => {
    setHighlightKey(key);
    const el = document.querySelector(`[data-pf-key="${key}"]`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    setTimeout(() => setHighlightKey(null), 1500);
  };

  return (
    <div className="preview-backdrop" onClick={() => dispatch({ type: "CLOSE_PREVIEW" })}>
      <div className="preview-shell" onClick={(e) => e.stopPropagation()}>
        <div className="preview-doc-scroll">
          {isFortlake ? <FortlakePaper client={client} highlightKey={highlightKey} /> : <GenericPaper client={client} form={form} highlightKey={highlightKey} />}
        </div>
        <div className="preview-side">
          <div className="preview-side-header">
            <div>
              <div className="t-card-title">{form.short}</div>
              <div className="t-muted" style={{ fontSize: 11.5 }}>Populated · provenance shown per field</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={() => dispatch({ type: "CLOSE_PREVIEW" })}><Icon name="x" /></button>
          </div>
          <div className="preview-side-body">
            {form.sections.map((sec, si) => (
              <div key={si}>
                <div className="t-label" style={{ padding: "12px 16px 4px" }}>{sec.title}</div>
                {dedupe(sec.fields).map(key => {
                  const f = client.fields[key];
                  if (!f) return null;
                  const def = FIELD_DEFS[key];
                  const needsAttn = f.status !== "verified";
                  return (
                    <div
                      key={key}
                      className={`preview-side-row ${needsAttn ? "highlight" : ""}`}
                      onClick={() => jumpTo(key)}
                    >
                      <div className="ps-label">{def.label}{def.aml && <span className="pill" style={{ fontSize: 9, padding: "0 5px", marginLeft: 6 }}>AML</span>}</div>
                      <div className="ps-value">{f.value}</div>
                      <div className="ps-meta">
                        <span className={`pill ${statusKind(f.status)}`} style={{ fontSize: 10, padding: "1px 6px" }}>
                          <StatusGlyph status={f.status} size={10} /> {statusLabel(f.status)}
                        </span>
                        <span style={{ fontSize: 10.5 }}>{f.source}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className={`preview-validation ${allGreen ? "" : ""}`} style={!allGreen ? { background: "var(--missing-soft)", color: "var(--missing)"} : {}}>
            {allGreen ? <><Icon name="shield-check" size={14} /> All AML-required fields present and verified</> : <><Icon name="warning" size={14} /> Some fields still need attention</>}
          </div>
          <div className="preview-side-footer">
            <button className="btn btn-secondary" onClick={() => dispatch({ type: "CLOSE_PREVIEW" })}>Send back</button>
            <div style={{ flex: 1 }} />
            <button
              className="btn btn-primary"
              disabled={!allGreen}
              onClick={() => runEvent("dispatch_form", { clientId: previewForm.clientId, formId: previewForm.formId })}
            >
              Approve &amp; dispatch <Icon name="send" size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Fortlake paper (mock real PDF)
// ---------------------------------------------------------------
function FortlakePaper({ client, highlightKey }) {
  const f = client.fields;
  const F = (key) => f[key]?.value ?? "—";
  const isReview = (key) => f[key]?.status === "review" || f[key]?.status === "stale";
  const cls = (key) => `pf-value ${isReview(key) ? "flagged" : ""} ${highlightKey === key ? "target" : ""}`;
  const dataKey = (key) => ({ "data-pf-key": key });

  return (
    <>
    <div className="paper">
      <div className="paper-head">
        <div className="paper-brand">
          <div className="pbmark">F</div>
          <div>
            <div className="pbname">FORTLAKE</div>
            <div className="pbsub">Asset Management</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>Application form</div>
          <div style={{ fontSize: 9, color: "#555" }}>Real-Income Fund · APIR FRT0028AU · Version 4.2 · April 2026</div>
        </div>
      </div>

      <h1>Fortlake Real-Income Fund — Application</h1>
      <div style={{ fontSize: 10.5, color: "#555", marginBottom: 24 }}>
        Wholesale managed investment scheme. This application form must be read together with the Information Memorandum dated 1 April 2026.
        All sections marked with <strong>★</strong> are mandatory.
      </div>

      <h2>Section 1 — Application type</h2>
      <div className="pf-row">
        <div className="pf-check on"><span className="box"></span> New investor</div>
        <div className="pf-check"><span className="box"></span> Additional investment</div>
        <div className="pf-check"><span className="box"></span> Reinvestment</div>
      </div>

      <h2>Section 2 — Investor type ★</h2>
      <div className="pf-row">
        <div className="pf-check"><span className="box"></span> Individual</div>
        <div className="pf-check"><span className="box"></span> Joint</div>
        <div className="pf-check on"><span className="box"></span> Trust</div>
        <div className="pf-check"><span className="box"></span> Company</div>
        <div className="pf-check"><span className="box"></span> SMSF</div>
      </div>
      <div className="pf-grid">
        <div className="pf-label">Trust / entity name</div><div className="pf-value" {...dataKey("entity.name")}>{F("entity.name")}</div>
        <div className="pf-label">ABN</div><div className="pf-value" {...dataKey("entity.abn")}>{F("entity.abn")}</div>
        <div className="pf-label">Trustee(s)</div><div className="pf-value" {...dataKey("entity.trustee")}>{F("entity.trustee")}</div>
        <div className="pf-label">Date trust established</div><div className="pf-value" {...dataKey("entity.trust_date")}>{F("entity.trust_date")}</div>
      </div>

      <h2>Section 3 — Individual investor details ★</h2>
      <div className="pf-note">Complete for the natural person investing, or for each trustee/director.</div>
      <div className="pf-grid">
        <div className="pf-label">Full given name(s)</div><div className={cls("investor.given_names")} {...dataKey("investor.given_names")}>{F("investor.given_names")}</div>
        <div className="pf-label">Surname</div><div className={cls("investor.surname")} {...dataKey("investor.surname")}>{F("investor.surname")}</div>
        <div className="pf-label">Date of birth</div><div className={cls("investor.dob")} {...dataKey("investor.dob")}>{F("investor.dob")}</div>
        <div className="pf-label">Occupation</div><div className={cls("investor.occupation")} {...dataKey("investor.occupation")}>{F("investor.occupation")}</div>
        <div className="pf-label">Tax File Number (TFN)</div><div className={cls("investor.tfn")} {...dataKey("investor.tfn")}>{F("investor.tfn")}</div>
        <div className="pf-label">Foreign tax resident?</div><div className={cls("investor.foreign_tax_resident")} {...dataKey("investor.foreign_tax_resident")}>{F("investor.foreign_tax_resident")}</div>
        <div className="pf-label">Residential address</div><div className={cls("investor.residential_address")} {...dataKey("investor.residential_address")}>{F("investor.residential_address")}</div>
        <div className="pf-label">Email</div><div className={cls("investor.email")} {...dataKey("investor.email")}>{F("investor.email")}</div>
        <div className="pf-label">Phone</div><div className={cls("investor.phone")} {...dataKey("investor.phone")}>{F("investor.phone")}</div>
      </div>

      <h2>Section 4 — Identification ★</h2>
      <div className="pf-grid-2">
        <div className="pf-label">ID type</div><div className={cls("investor.id_type")} {...dataKey("investor.id_type")}>{F("investor.id_type")}</div>
        <div className="pf-label">ID number</div><div className={cls("investor.id_number")} {...dataKey("investor.id_number")}>{F("investor.id_number")}</div>
        <div className="pf-label">Expiry</div><div className={cls("investor.id_expiry")} {...dataKey("investor.id_expiry")}>{F("investor.id_expiry")}</div>
        <div className="pf-label">DVS verified</div><div className={cls("investor.dvs_verified")} {...dataKey("investor.dvs_verified")}>{F("investor.dvs_verified")}</div>
      </div>
    </div>

    <div className="paper">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 9, color: "#777" }}>
        <span>Fortlake Real-Income Fund — Application · Page 2 of 3</span>
        <span>Version 4.2 · April 2026</span>
      </div>

      <h2>Section 7 — Bank account details</h2>
      <div className="pf-note">Distribution and direct-debit account. Account must be in the name of the investor.</div>
      <div className="pf-grid">
        <div className="pf-label">Financial institution</div><div className={cls("bank.institution")} {...dataKey("bank.institution")}>{F("bank.institution")}</div>
        <div className="pf-label">BSB</div><div className={cls("bank.bsb")} {...dataKey("bank.bsb")}>{F("bank.bsb")}</div>
        <div className="pf-label">Account number</div><div className={cls("bank.account_no")} {...dataKey("bank.account_no")}>{F("bank.account_no")}</div>
        <div className="pf-label">Account name</div><div className={cls("bank.account_name")} {...dataKey("bank.account_name")}>{F("bank.account_name")}</div>
      </div>

      <h2>Section 8 — Distribution instructions</h2>
      <div className="pf-row">
        <div className={`pf-check ${F("investment.distribution_pref") === "Reinvest" ? "on" : ""}`}><span className="box"></span> Reinvest distributions</div>
        <div className={`pf-check ${F("investment.distribution_pref") === "Pay" ? "on" : ""}`}><span className="box"></span> Pay to nominated account</div>
      </div>

      <h2>Section 10 — Investment allocation ★</h2>
      <table className="paper-table">
        <thead><tr><th>Fund</th><th>APIR</th><th>Amount (AUD)</th><th>Minimum</th></tr></thead>
        <tbody>
          <tr>
            <td>{F("investment.product")}</td>
            <td>FRT0028AU</td>
            <td className={cls("investment.amount")} {...dataKey("investment.amount")}>{F("investment.amount")}</td>
            <td>$25,000</td>
          </tr>
        </tbody>
      </table>

      <h2>Section 11 — Risk acknowledgement ★</h2>
      <div className="pf-row">
        <div className={`pf-check ${F("investment.risk_ack") === "Acknowledged" ? "on" : ""}`}><span className="box"></span> I acknowledge that I have read the Information Memorandum and understand the risks of investing in the Fund.</div>
      </div>

      <h2>Section 12 — Adviser details</h2>
      <div className="pf-grid-2">
        <div className="pf-label">Adviser</div><div className={cls("adviser.name")} {...dataKey("adviser.name")}>{F("adviser.name")}</div>
        <div className="pf-label">AFSL</div><div className={cls("adviser.afsl")} {...dataKey("adviser.afsl")}>{F("adviser.afsl")}</div>
      </div>

      <h2>Signatures</h2>
      <div className="paper-sig">
        <div>
          <div className="sig-line" style={{ fontStyle: "italic", fontFamily: "Georgia, serif", color: "#1A1A1A", lineHeight: "28px", paddingLeft: 4 }}>John A. Smith</div>
          <div className="sig-caption">Signature of investor / trustee</div>
        </div>
        <div>
          <div className="sig-line" style={{ fontStyle: "italic", fontFamily: "Georgia, serif", color: "#1A1A1A", lineHeight: "28px", paddingLeft: 4 }}>Margaret L. Smith</div>
          <div className="sig-caption">Signature of investor / trustee</div>
        </div>
      </div>
      <div className="paper-footer">
        <span>Fortlake Asset Management Pty Ltd · AFSL 412 778</span>
        <span>www.fortlake.example · investors@fortlake.example</span>
      </div>
    </div>
    </>
  );
}

// fallback generic
function GenericPaper({ client, form, highlightKey }) {
  const f = client.fields || {};
  return (
    <div className="paper">
      <h1>{form.title}</h1>
      {form.sections.map((sec, i) => (
        <div key={i}>
          <h2>{sec.title}</h2>
          <div className="pf-grid">
            {dedupe(sec.fields).map(k => (
              <React.Fragment key={k}>
                <div className="pf-label">{FIELD_DEFS[k]?.label}</div>
                <div className={`pf-value ${highlightKey === k ? "target" : ""}`} data-pf-key={k}>{f[k]?.value || "—"}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

window.FortlakePreview = FortlakePreview;
