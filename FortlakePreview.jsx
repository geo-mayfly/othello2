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
// Fortlake paper — mirrors the real "Fortlake Funds — Application
// Form" (16 December 2024) issued via Colonial First State. Section
// numbering, black/grey section bars, digit-by-digit input boxes,
// two-column joint investor layout, risk table and fund allocation
// table all match the source PDF.
// ---------------------------------------------------------------
function FortlakePaper({ client, highlightKey }) {
  const f = client.fields;
  const F = (key) => f[key]?.value ?? "";
  const isReview = (key) => f[key]?.status === "review" || f[key]?.status === "stale";
  const isFailed = (key) => f[key]?.status === "failed" || f[key]?.status === "conflict";
  const boxCls = (key) => `fp-box ${isReview(key) ? "flagged" : ""} ${isFailed(key) ? "failed" : ""} ${highlightKey === key ? "target" : ""}`;
  const dk = (key) => ({ "data-pf-key": key });

  // Joint trustee — Margaret's details are hardcoded for the demo
  // (only one set of investor.* fields is tracked in state).
  const margaret = {
    title: "Mrs",
    given: "Margaret Louise",
    surname: "Smith",
    dob: "22/09/1974",
    occupation: "Company secretary",
    tfn: "419 ••• 207",
    foreignTax: "No",
    address: F("investor.residential_address") || "42 Linden St, Carlton VIC 3053",
    email: "m.smith@familytrust.example",
  };

  // Helpers: char-box render. Pads to N chars, fills extras with blanks.
  const digits = (val, n) => {
    const clean = (val || "").replace(/\s/g, "").slice(0, n).padEnd(n, " ");
    return clean.split("");
  };

  // ===========================================================
  // PAGE 1 — Front matter + Section 1 (Account details) +
  //          Section 2 (Non-individual investor / Trust)
  // ===========================================================
  const page1 = (
    <div className="fp-page">
      <div className="fp-paper-head">
        <div>
          <div className="fp-title">Fortlake Funds &ndash; Application Form</div>
          <div className="fp-subtitle">16 December 2024</div>
        </div>
        <div className="fp-paper-ref">B8BSKX</div>
      </div>

      <p className="fp-intro">
        Units in the fund will only be issued on receipt of this application form and any documents required to be attached, issued together with
        the PDS for this fund dated 16 December 2024. Please phone Colonial First State Investor Services on 13 13 36 with any enquiries.
      </p>
      <p className="fp-intro">
        Please complete this form using <strong>BLACK INK</strong> and print well within the boxes in <strong>CAPITAL LETTERS</strong>. Mark appropriate answer boxes with a cross <span className="fp-x-inline">X</span>.
        Fields marked with an asterisk (*) must be completed for the purposes of anti-money laundering laws.
      </p>

      <Bar n="1">ACCOUNT DETAILS</Bar>
      <div className="fp-label-tight">Type of investment</div>
      <div className="fp-row" style={{ marginTop: 4 }}>
        <Tick on>New</Tick>
        <span className="fp-help">Go to Section 2 (non-individual investors including all Trusts) and complete sections required</span>
      </div>
      <div className="fp-row" style={{ marginTop: 4 }}>
        <Tick>Additional</Tick>
        <span className="fp-help">Please provide account details below and go to Section 6</span>
      </div>
      <div className="fp-label-tight" style={{ marginTop: 8 }}>Existing account name</div>
      <div className="fp-box empty" />
      <div className="fp-label-tight" style={{ marginTop: 6 }}>Existing account number</div>
      <div className="fp-digit-row">
        <span className="fp-digit on">1</span><span className="fp-digit on">2</span><span className="fp-digit on">0</span>
        {Array.from({ length: 9 }).map((_, i) => <span key={i} className="fp-digit" />)}
      </div>

      <Bar n="2">NON-INDIVIDUAL INVESTORS DETAILS &ndash; COMPANY/TRUSTS/PARTNERSHIP/SUPERANNUATION FUND OR OTHER ENTITY</Bar>
      <div className="fp-help" style={{ marginBottom: 6 }}>Cross (X) the appropriate box to indicate the type of investor you are:</div>
      <div className="fp-row" style={{ marginBottom: 8 }}>
        <Tick>Self Managed Super Fund</Tick>
        <Tick on>Trust</Tick>
        <Tick>Company</Tick>
        <Tick>Partnership</Tick>
      </div>
      <div className="fp-label-tight">Other, please specify</div>
      <div className="fp-box empty" />

      <div className="fp-label-tight" style={{ marginTop: 6 }}>Full name of company/partnership/trustee/other entity*</div>
      <div className="fp-box empty" />

      <div className="fp-label-tight" style={{ marginTop: 6 }}>Full name of superannuation fund/trust*</div>
      <div className={boxCls("entity.name")} {...dk("entity.name")}>{F("entity.name")}</div>

      <div className="fp-two-col">
        <div>
          <div className="fp-label-tight">Primary business/trust activity*</div>
          <div className="fp-box">Family investment trust</div>
        </div>
        <div>
          <div className="fp-label-tight">Are you a charity?*</div>
          <div className="fp-row" style={{ marginTop: 4 }}>
            <Tick>Yes</Tick>
            <Tick on>No</Tick>
          </div>
        </div>
      </div>

      <div className="fp-label-tight" style={{ marginTop: 8 }}>
        Is your entity&rsquo;s primary business activity investing? Select &lsquo;Yes&rsquo; if more than 50% of income is from investment activities, or more than 50% of assets produce investment income.
      </div>
      <div className="fp-row" style={{ marginTop: 4 }}>
        <Tick on>Yes</Tick>
        <Tick>No</Tick>
      </div>

      <div className="fp-label-tight" style={{ marginTop: 8 }}>Country established, if not Australia*</div>
      <div className="fp-box empty" />

      <div className="fp-two-col" style={{ marginTop: 6 }}>
        <div>
          <div className="fp-label-tight">ABN/ARBN/ARSN (if any)</div>
          <DigitBoxes value={F("entity.abn")} n={11} highlight={highlightKey === "entity.abn"} dataKey="entity.abn" />
        </div>
        <div>
          <div className="fp-label-tight">Tax File Number (trust &ndash; if applicable)</div>
          <DigitBoxes value="" n={9} groups={[3, 3, 3]} />
        </div>
      </div>

      <PageFoot left="Fortlake Funds &ndash; application forms" right="A3" />
    </div>
  );

  // ===========================================================
  // PAGE 2 — Section 2 continued (Trust info), Section 3 (joint investors)
  // ===========================================================
  const page2 = (
    <div className="fp-page">
      <BarCont n="2">NON-INDIVIDUAL INVESTORS DETAILS &ndash; COMPANY/TRUSTS/PARTNERSHIP/SUPERANNUATION FUND OR OTHER ENTITY (CONTINUED)</BarCont>

      <SubBar>TRUSTS</SubBar>
      <div className="fp-help" style={{ marginBottom: 6 }}>Complete this additional section only if you are a Trust.</div>

      <SubBarSmall>GENERAL INFORMATION</SubBarSmall>
      <div className="fp-label-tight">Full name of superannuation fund/trust*</div>
      <div className={boxCls("entity.name")} {...dk("entity.name")}>{F("entity.name")}</div>

      <div className="fp-label-tight" style={{ marginTop: 6 }}>Full business name (if any)</div>
      <div className="fp-box empty" />

      <div className="fp-label-tight" style={{ marginTop: 6 }}>Country where trust established*</div>
      <div className="fp-box">Australia</div>

      <div className="fp-label-tight" style={{ marginTop: 10, fontWeight: 600 }}>
        Type of Trust (select X only one of the following trust types and provide the information requested)
      </div>

      <div style={{ marginTop: 6 }}>
        <Tick>Registered managed investment scheme</Tick>
        <div className="fp-indented"><div className="fp-label-tight">Provide Australian Registered Scheme Number (ARSN)</div><div className="fp-box empty" /></div>

        <Tick>Regulated trust (e.g. an SMSF)</Tick>
        <div className="fp-indented">
          <div className="fp-label-tight">Provide name of the regulator (e.g. ASIC, APRA, ATO)</div><div className="fp-box empty" />
          <div className="fp-label-tight">Provide the trust&rsquo;s ABN or registration/licensing details</div><div className="fp-box empty" />
        </div>

        <Tick>Government superannuation fund</Tick>
        <div className="fp-indented"><div className="fp-label-tight">Provide name of the legislation establishing the fund</div><div className="fp-box empty" /></div>

        <Tick on>Other trust type</Tick>
        <div className="fp-indented">
          <div className="fp-label-tight">Trust description (e.g. family, unit, charitable, estate)</div>
          <div className={boxCls("entity.trustee")}>Family discretionary trust</div>
        </div>
      </div>

      <div className="fp-help" style={{ marginTop: 8 }}>
        Trust established <strong {...dk("entity.trust_date")}>{F("entity.trust_date")}</strong>. Trustees acting jointly: <strong {...dk("entity.trustee")}>{F("entity.trustee")}</strong>.
      </div>

      <PageFoot left="A4" right="Fortlake Funds &ndash; application forms" />
    </div>
  );

  // ===========================================================
  // PAGE 3 — Section 3 (Individual Investor Details — joint)
  // ===========================================================
  const page3 = (
    <div className="fp-page">
      <Bar n="3">INDIVIDUAL INVESTOR DETAILS</Bar>
      <div className="fp-help" style={{ marginBottom: 10 }}>
        If you are an investor that is an individual (including a sole trader) or an individual Trustee, please complete this section.
      </div>
      <div className="fp-two-col fp-investors">
        {/* INVESTOR 1 — John (driven by client.fields) */}
        <div>
          <div className="fp-invlabel">INVESTOR 1 (individual accounts)</div>
          <div className="fp-row" style={{ marginTop: 4 }}>
            <Tick on small>Mr</Tick><Tick small>Mrs</Tick><Tick small>Miss</Tick><Tick small>Ms</Tick><Tick small>Other</Tick>
          </div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Full given name(s)*</div>
          <div className={boxCls("investor.given_names")} {...dk("investor.given_names")}>{F("investor.given_names")}</div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Surname*</div>
          <div className={boxCls("investor.surname")} {...dk("investor.surname")}>{F("investor.surname")}</div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Date of birth* &nbsp;<span className="fp-help">(dd/mm/yyyy)</span></div>
          <div className="fp-row" style={{ gap: 12 }}>
            <div className={boxCls("investor.dob")} style={{ flex: "0 0 140px" }} {...dk("investor.dob")}>{F("investor.dob")}</div>
            <div className="fp-label-tight" style={{ marginTop: 0 }}>Gender</div>
            <Tick on small>Male</Tick><Tick small>Female</Tick>
          </div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Occupation*</div>
          <div className={boxCls("investor.occupation")} {...dk("investor.occupation")}>{F("investor.occupation")}</div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Your main country of residence, if not Australia*</div>
          <div className="fp-box empty" />

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Tax File Number*</div>
          <DigitBoxes value={F("investor.tfn")} n={9} groups={[3, 3, 3]} highlight={highlightKey === "investor.tfn"} dataKey="investor.tfn" status={f["investor.tfn"]?.status} />

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Are you a tax resident of another country?*</div>
          <div className="fp-row" style={{ marginTop: 4 }} {...dk("investor.foreign_tax_resident")}>
            <Tick small>Yes</Tick>
            <Tick on small>No</Tick>
          </div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Australian residential address (PO Box NOT acceptable)*</div>
          <div className={boxCls("investor.residential_address")} {...dk("investor.residential_address")}>{F("investor.residential_address")}</div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Email address for investor 1</div>
          <div className={boxCls("investor.email")} {...dk("investor.email")}>{F("investor.email")}</div>
        </div>

        {/* INVESTOR 2 — Margaret (hardcoded for demo) */}
        <div>
          <div className="fp-invlabel">INVESTOR 2 (joint accounts)</div>
          <div className="fp-row" style={{ marginTop: 4 }}>
            <Tick small>Mr</Tick><Tick on small>Mrs</Tick><Tick small>Miss</Tick><Tick small>Ms</Tick><Tick small>Other</Tick>
          </div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Full given name(s)*</div>
          <div className="fp-box">{margaret.given}</div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Surname*</div>
          <div className="fp-box">{margaret.surname}</div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Date of birth* &nbsp;<span className="fp-help">(dd/mm/yyyy)</span></div>
          <div className="fp-row" style={{ gap: 12 }}>
            <div className="fp-box" style={{ flex: "0 0 140px" }}>{margaret.dob}</div>
            <div className="fp-label-tight" style={{ marginTop: 0 }}>Gender</div>
            <Tick small>Male</Tick><Tick on small>Female</Tick>
          </div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Occupation*</div>
          <div className="fp-box">{margaret.occupation}</div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Your main country of residence, if not Australia*</div>
          <div className="fp-box empty" />

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Tax File Number*</div>
          <DigitBoxes value={margaret.tfn} n={9} groups={[3, 3, 3]} />

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Are you a tax resident of another country?*</div>
          <div className="fp-row" style={{ marginTop: 4 }}>
            <Tick small>Yes</Tick>
            <Tick on small>No</Tick>
          </div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Australian residential address (PO Box NOT acceptable)*</div>
          <div className="fp-box">{margaret.address}</div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Email address for investor 2</div>
          <div className="fp-box">{margaret.email}</div>
        </div>
      </div>

      <PageFoot left="Fortlake Funds &ndash; application forms" right="A5" />
    </div>
  );

  // ===========================================================
  // PAGE 4 — Sections 6, 7, 8, 9
  // ===========================================================
  const page4 = (
    <div className="fp-page">
      <Bar n="6">ONLINE SERVICES</Bar>
      <div className="fp-help" style={{ marginBottom: 8 }}>
        <strong>Please note</strong> that you will be automatically granted access to manage your investment online via FirstNet.
      </div>
      <Tick>Cross (X) this box if you do <strong>not</strong> wish to have online access to your investment.</Tick>

      <Bar n="7">BANK ACCOUNT DETAILS</Bar>
      <div className="fp-help" style={{ marginBottom: 8 }}>
        You can only nominate a bank account that is held in your name(s). By providing your bank account details below, you authorise CFSIL to use these details for all future transaction requests.
      </div>
      <div className="fp-two-col">
        <div>
          <SubBarSmall>BANK ACCOUNT 1</SubBarSmall>
          <div className="fp-label-tight">Name of Australian financial institution</div>
          <div className={boxCls("bank.institution")} {...dk("bank.institution")}>{F("bank.institution")}</div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Branch name</div>
          <div className="fp-box">Carlton VIC</div>

          <div className="fp-two-col" style={{ gap: 14, marginTop: 6 }}>
            <div>
              <div className="fp-label-tight">Branch number (BSB)</div>
              <DigitBoxes value={F("bank.bsb")} n={6} groups={[3, 3]} separator="–" highlight={highlightKey === "bank.bsb"} dataKey="bank.bsb" status={f["bank.bsb"]?.status} />
            </div>
            <div>
              <div className="fp-label-tight">Account number</div>
              <DigitBoxes value={(F("bank.account_no") || "").replace(/\D/g, "")} n={9} highlight={highlightKey === "bank.account_no"} dataKey="bank.account_no" status={f["bank.account_no"]?.status} />
            </div>
          </div>

          <div className="fp-label-tight" style={{ marginTop: 6 }}>Name of account holder</div>
          <div className={boxCls("bank.account_name")} {...dk("bank.account_name")}>{F("bank.account_name")}</div>
        </div>

        <div>
          <SubBarSmall>BANK ACCOUNT 2</SubBarSmall>
          <div className="fp-help">Only complete if you would like your regular investment plan debited from a different bank account.</div>
          <div className="fp-label-tight" style={{ marginTop: 6 }}>Name of Australian financial institution</div>
          <div className="fp-box empty" />
          <div className="fp-label-tight" style={{ marginTop: 6 }}>Branch name</div>
          <div className="fp-box empty" />
          <div className="fp-two-col" style={{ gap: 14, marginTop: 6 }}>
            <div><div className="fp-label-tight">Branch number (BSB)</div><DigitBoxes value="" n={6} groups={[3, 3]} separator="–" /></div>
            <div><div className="fp-label-tight">Account number</div><DigitBoxes value="" n={9} /></div>
          </div>
        </div>
      </div>

      <Bar n="8">INCOME DISTRIBUTIONS</Bar>
      <div className="fp-help" style={{ marginBottom: 6 }}>
        A nomination in this section overrides any previous nominations. Distributions will be reinvested unless otherwise stated. Cross (X) one box only.
      </div>
      <div className="fp-label-tight">How would you like your income distributions to be paid?</div>
      <div className="fp-row" style={{ marginTop: 4 }} {...dk("investment.distribution_pref")}>
        <Tick on={F("investment.distribution_pref") === "Reinvest"}>Reinvested in the fund</Tick>
        <Tick on={F("investment.distribution_pref") === "Pay"}>Credit to my/our bank account</Tick>
      </div>

      <Bar n="9">PAYMENT DETAILS</Bar>
      <div className="fp-help" style={{ marginBottom: 6 }}>
        How will this investment be made? Note: Cash is not accepted. A minimum total investment of $25,000 is required to establish an account.
      </div>
      <div className="fp-label-tight">Total amount to be invested</div>
      <div className="fp-row" style={{ gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>$</span>
        <div className={boxCls("investment.amount")} style={{ maxWidth: 240, fontWeight: 600 }} {...dk("investment.amount")}>{F("investment.amount")}</div>
        <span className="fp-help">including any internal transfers shown below.</span>
      </div>
      <div className="fp-row" style={{ marginTop: 8 }}>
        <Tick on>Direct debit</Tick>
        <span className="fp-help">Make sure you also complete your bank account details in section 7.</span>
      </div>
      <div className="fp-row" style={{ marginTop: 4 }}>
        <Tick>Internal transfer</Tick>
        <span className="fp-help">Funds coming from a Colonial First State account.</span>
      </div>

      <PageFoot left="Fortlake Funds &ndash; application forms" right="A9" />
    </div>
  );

  // ===========================================================
  // PAGE 5 — Section 10 (Investment allocation), 11, 12 (Decl)
  // ===========================================================
  const page5 = (
    <div className="fp-page">
      <Bar n="10">INVESTMENT ALLOCATION</Bar>
      <div className="fp-help" style={{ marginBottom: 6 }}>The minimum initial investment is $25,000.</div>

      <div className="fp-label-tight" style={{ fontWeight: 600, marginTop: 6 }}>Risk measure categories</div>
      <table className="fp-risk-table">
        <thead><tr><th>Risk band</th><th>Risk label</th><th>Estimated number of negative annual returns over any 20-year period</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>Very low</td><td>Less than 0.5</td></tr>
          <tr><td>2</td><td>Low</td><td>0.5 to less than 1</td></tr>
          <tr><td>3</td><td>Low to medium</td><td>1 to less than 2</td></tr>
          <tr><td>4</td><td>Medium</td><td>2 to less than 3</td></tr>
          <tr className="fp-row-highlight"><td>5</td><td>Medium to high</td><td>3 to less than 4</td></tr>
          <tr><td>6</td><td>High</td><td>4 to less than 6</td></tr>
          <tr><td>7</td><td>Very high</td><td>6 or greater</td></tr>
        </tbody>
      </table>

      <table className="fp-fund-table">
        <thead>
          <tr>
            <th>Fund name</th><th>Fund code</th><th>Min. timeframe</th><th>Risk band</th>
            <th>Initial or additional investments</th><th>Regular plan ($500 min/month)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={highlightKey === "investment.product" ? "fp-cell-target" : ""} {...dk("investment.product")}>{F("investment.product")}</td>
            <td>120/97</td>
            <td>At least 3 years</td>
            <td>5</td>
            <td className={highlightKey === "investment.amount" ? "fp-cell-target" : ""} {...dk("investment.amount")}>{F("investment.amount")}</td>
            <td>$ &mdash;</td>
          </tr>
          <tr>
            <td>Fortlake Real-Higher Income Fund</td>
            <td>120/98</td><td>At least 3 years</td><td>5</td>
            <td>$ &mdash;</td><td>$ &mdash;</td>
          </tr>
        </tbody>
      </table>
      <div className="fp-row" style={{ marginTop: 6 }}>
        <Tick>Cross (X) this box if you would like to increase your regular investment plan in line with inflation (CPI), up to a maximum of 3% each year.</Tick>
      </div>

      <Bar n="11">ADVISER SERVICE FEE</Bar>
      <div className="fp-label-tight">Would you like to nominate an adviser service fee?</div>
      <div className="fp-row" style={{ marginTop: 4 }}>
        <Tick>Yes</Tick>
        <Tick on>No</Tick>
      </div>

      <Bar n="12">DECLARATION AND SIGNATURE</Bar>
      <div className="fp-help" style={{ marginBottom: 6 }}>
        By applying for Fortlake Funds, you confirm that you have received and read the Fortlake Funds Product Disclosure Statement, declare that answers to all questions are true and correct, and acknowledge the risk characteristics of your selected investment allocations.
      </div>

      <div className="fp-row" style={{ marginTop: 8 }}>
        <Tick on={F("investment.risk_ack") === "Acknowledged"} small>
          I understand and accept the stated minimum investment timeframe and risk characteristics of my selected investment allocations.
        </Tick>
      </div>

      <div className="fp-sig-row">
        <div>
          <div className="fp-label-tight">Original signature of investor 1 or company officer</div>
          <div className="fp-sig-line" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>John A. Smith</div>
          <div className="fp-two-col" style={{ marginTop: 4, gap: 12 }}>
            <div><div className="fp-label-tight">Print name</div><div className="fp-box">JOHN ANTHONY SMITH</div></div>
            <div><div className="fp-label-tight">Date</div><div className="fp-box">28/05/2026</div></div>
          </div>
        </div>
        <div>
          <div className="fp-label-tight">Original signature of investor 2 or company officer</div>
          <div className="fp-sig-line" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>Margaret L. Smith</div>
          <div className="fp-two-col" style={{ marginTop: 4, gap: 12 }}>
            <div><div className="fp-label-tight">Print name</div><div className="fp-box">MARGARET LOUISE SMITH</div></div>
            <div><div className="fp-label-tight">Date</div><div className="fp-box">28/05/2026</div></div>
          </div>
        </div>
      </div>

      <div className="fp-mail-strip">
        Send the completed form to: <strong>Colonial First State Reply Paid 27, Sydney NSW 2001</strong>
      </div>

      <PageFoot left="Fortlake Funds &ndash; application forms" right="A11" />
    </div>
  );

  return (
    <>
      {page1}
      {page2}
      {page3}
      {page4}
      {page5}
    </>
  );
}

// ---------- Fortlake paper sub-components ----------
function Bar({ n, children }) {
  return (
    <div className="fp-bar">
      {n && <span className="fp-bar-num">{n}</span>}
      <span>{children}</span>
    </div>
  );
}
function BarCont({ n, children }) {
  return <Bar n={n}>{children}</Bar>;
}
function SubBar({ children }) {
  return <div className="fp-subbar">{children}</div>;
}
function SubBarSmall({ children }) {
  return <div className="fp-subbar small">{children}</div>;
}
function Tick({ on, small, children }) {
  return (
    <span className={`fp-tick ${on ? "on" : ""} ${small ? "small" : ""}`}>
      <span className="fp-tick-box">{on ? "X" : ""}</span>
      <span>{children}</span>
    </span>
  );
}
function DigitBoxes({ value, n, groups, separator, highlight, dataKey, status }) {
  const cleaned = (value || "").replace(/[\s\-•]/g, "").split("");
  const cells = [];
  for (let i = 0; i < n; i++) {
    cells.push(cleaned[i] || "");
  }
  const flagged = status === "review" || status === "stale";
  const failed = status === "failed" || status === "conflict";
  const cls = `fp-digit-row ${highlight ? "target" : ""} ${flagged ? "flagged" : ""} ${failed ? "failed" : ""}`;
  if (!groups) {
    return (
      <div className={cls} data-pf-key={dataKey || undefined}>
        {cells.map((c, i) => <span key={i} className={`fp-digit ${c ? "on" : ""}`}>{c}</span>)}
      </div>
    );
  }
  // Render with separator between groups
  const out = [];
  let idx = 0;
  groups.forEach((g, gi) => {
    if (gi > 0 && separator) out.push(<span key={`s${gi}`} className="fp-digit-sep">{separator}</span>);
    for (let j = 0; j < g; j++) {
      const c = cells[idx++];
      out.push(<span key={`d${gi}-${j}`} className={`fp-digit ${c ? "on" : ""}`}>{c}</span>);
    }
  });
  return (
    <div className={cls} data-pf-key={dataKey || undefined}>
      {out}
    </div>
  );
}
function PageFoot({ left, right }) {
  return (
    <div className="fp-page-foot">
      <span>{left}</span>
      <span>{right}</span>
    </div>
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
