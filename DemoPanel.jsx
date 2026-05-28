// ============================================================
// Othello — Demo control panel
// ============================================================
//
// Each flow can be driven in three ways:
//   - ▶  Play   — autoplay through remaining steps, pausing at any
//                 step marked `interactive` (waiting for the operator
//                 to take a real action in the UI, e.g. clicking
//                 Approve in the populated-form modal).
//   - →  Step   — run the next available step manually.
//   - Per-step → button — run any single step out of order.
//
// Breakpoints: a step with `interactive: true` does NOT auto-run its
// script during autoplay; instead the panel posts a "Awaiting your
// action" banner inside the flow with a hint, and the autoplay
// resumes the moment the step's done() predicate becomes true (i.e.
// the user has performed the action). A Skip button bypasses by
// running the step's underlying script.

// ---------------------------------------------------------------
// Flow catalogue
// ---------------------------------------------------------------
const FLOWS = [
  {
    id: "smith_onboarding",
    title: "Onboard new client",
    subtitle: "Smith Family Trust → Fortlake Real-Income Fund via Hub24",
    badge: "main spine",
    steps: [
      { id: "new_client_smith",      label: "New client lands from CRM",         desc: "Household appears under Needs you; checklist computed",
        done: (s) => !!s.clients.find(c => c.id === "smith" && c.activity?.length > 2),
        ok:   ()  => true,
      },
      { id: "adviser_instruction",   label: "Adviser brief received",            desc: "Investment amount, product, platform and distribution captured",
        done: (s) => {
          const c = s.clients.find(c => c.id === "smith");
          return c?.fields["investment.product"]?.status === "verified";
        },
        ok:   (s) => stepDone(s, "new_client_smith"),
      },
      { id: "system_identifies_forms", label: "System identifies required forms", desc: "Matches entity + brief against the form library; proposes forms for review",
        done: (s) => !!s.clients.find(c => c.id === "smith")?.forms?.some(f => f.formId === "fortlake_application"),
        ok:   (s) => stepDone(s, "adviser_instruction"),
      },
      { id: "confirm_forms",         label: "Operator confirms required forms",   desc: "Proposed → Awaiting data; checklist now in scope",
        interactive: true,
        interactiveHint: "Review the proposed forms in the Forms tab below and click Confirm on each.",
        done: (s) => {
          const c = s.clients.find(c => c.id === "smith");
          if (!c) return false;
          const forms = c.forms || [];
          return forms.some(f => f.formId === "fortlake_application" && f.status !== "proposed");
        },
        ok:   (s) => stepDone(s, "system_identifies_forms"),
      },
      { id: "upload_photo_id",       label: "Photo ID uploaded",                 desc: "OCR + AI extracts 9 fields; AML rules validated",
        done: (s) => !!s.clients.find(c => c.id === "smith")?.documents?.some(d => d.id === "photo_id"),
        ok:   (s) => stepDone(s, "confirm_forms"),
      },
      { id: "dvs_returned",          label: "Verification returned (DVS)",       desc: "AI-extracted identity fields flip to Verified",
        done: (s) => s.clients.find(c => c.id === "smith")?.fields["investor.dvs_verified"]?.status === "verified",
        ok:   (s) => stepDone(s, "upload_photo_id"),
      },
      { id: "client_reply_tax",      label: "Client replies — tax residency",    desc: "Email reply clears a red field",
        done: (s) => s.clients.find(c => c.id === "smith")?.fields["investor.foreign_tax_resident"]?.status === "verified",
        ok:   (s) => stepDone(s, "confirm_forms"),
      },
      { id: "adviser_occupation",    label: "Source sync — adviser → Dynamics",  desc: "Occupation flows in from the CRM",
        done: (s) => s.clients.find(c => c.id === "smith")?.fields["investor.occupation"]?.status === "verified",
        ok:   (s) => stepDone(s, "confirm_forms"),
      },
      { id: "upload_bank_statement", label: "Bank statement → SharePoint",       desc: "Triggers low-confidence, TFN checksum fail, address conflict",
        done: (s) => !!s.clients.find(c => c.id === "smith")?.documents?.some(d => d.id === "bank_stmt"),
        ok:   (s) => stepDone(s, "confirm_forms"),
      },
      { id: "resolve_exceptions",    label: "Resolve flagged items",             desc: "Operator confirms account no., corrects TFN, picks address",
        done: (s) => {
          const c = s.clients.find(c => c.id === "smith");
          return c?.fields["investor.tfn"]?.status === "verified" && c?.fields["investment.risk_ack"]?.status === "verified";
        },
        ok:   (s) => stepDone(s, "upload_bank_statement"),
      },
      { id: "open_fortlake_review",  label: "Open Fortlake for review",          desc: "Populated form preview opens",
        done: (s) => {
          const c = s.clients.find(c => c.id === "smith");
          if (!c) return false;
          if (s.previewForm?.formId === "fortlake_application") return true;
          const raw = c.forms.find(f => f.formId === "fortlake_application")?.status;
          return ["dispatched","confirmed"].includes(raw);
        },
        ok:   (s) => {
          const c = s.clients.find(c => c.id === "smith");
          return c && deriveFormStatus(c, "fortlake_application") === "ready";
        },
      },
      { id: "approve_dispatch",      label: "Approve & dispatch Fortlake + Hub24",  desc: "Both forms packaged → designation → confirmation filed",
        scriptId: "dispatch_spine_forms",
        interactive: true,
        interactiveHint: "Inspect the populated Fortlake form, then click Approve & dispatch — Hub24 dispatches automatically after.",
        done: (s) => {
          const c = s.clients.find(c => c.id === "smith");
          if (!c) return false;
          const fortlake = c.forms.find(f => f.formId === "fortlake_application")?.status;
          const hub24    = c.forms.find(f => f.formId === "hub24_application")?.status;
          return fortlake === "confirmed" && hub24 === "confirmed";
        },
        ok:   (s) => {
          const c = s.clients.find(c => c.id === "smith");
          return c && deriveFormStatus(c, "fortlake_application") === "ready" && deriveFormStatus(c, "hub24_application") === "ready";
        },
      },
    ],
  },
  {
    id: "okafor_reverse_beat",
    title: "Compliance reverse beat",
    subtitle: "Okafor — wholesale certificate expires today; without auto-chase, advice silently halts. Othello drafts the renewal, sends, and clears the flag.",
    badge: "liability story",
    steps: [
      { id: "expire_okafor",            label: "Wholesale certificate expires",  desc: "Dependent form un-completes; client back to Needs you",
        done: (s) => s.compliance.find(c => c.clientId === "okafor")?.daysText?.includes("today"),
        ok:   ()  => true,
      },
      { id: "auto_chase_okafor",        label: "Auto-chase renewal sent",        desc: "System drafts and sends via Microsoft 365",
        done: (s) => !!s.clients.find(c => c.id === "okafor")?.activity?.some(a => a.desc?.includes("Renewal request emailed")),
        ok:   (s) => stepDone(s, "expire_okafor"),
      },
      { id: "renewal_received_okafor",  label: "Renewal received from client",   desc: "New certificate filed; compliance panel clears",
        done: (s) => !!s.clients.find(c => c.id === "okafor")?.documents?.some(d => d.id === "wholesale_cert_new"),
        ok:   (s) => stepDone(s, "auto_chase_okafor"),
      },
    ],
  },
  {
    id: "smith_additional_products",
    title: "Expand engagement — additional products",
    subtitle: "Smith — add FATCA / Wholesale / Direct Debit, system detects incoming documents",
    badge: "follow-on",
    steps: [
      { id: "add_fatca_form",     label: "Add FATCA / CRS form",                    desc: "Operator adds form · checklist gains 2 new outstanding fields",
        done: (s) => !!s.clients.find(c => c.id === "smith")?.forms.some(f => f.formId === "fatca_crs"),
        ok:   (s) => stepDone(s, "approve_dispatch"),
      },
      { id: "detect_fatca_reply", label: "Microsoft 365 detects FATCA reply",       desc: "Client returns the self-certification by email — 3 tax fields resolved",
        done: (s) => s.clients.find(c => c.id === "smith")?.fields["investor.foreign_tin"]?.status === "verified",
        ok:   (s) => stepDone(s, "add_fatca_form"),
      },
      { id: "dispatch_fatca",     label: "Approve & dispatch FATCA",                desc: "Form moves Ready → Dispatched → Confirmed",
        scriptId: "dispatch_fatca",
        interactive: true,
        interactiveHint: "Open the FATCA / CRS form card and click Approve & dispatch.",
        done: (s) => s.clients.find(c => c.id === "smith")?.forms.find(f => f.formId === "fatca_crs")?.status === "confirmed",
        ok:   (s) => {
          const c = s.clients.find(c => c.id === "smith");
          return c && deriveFormStatus(c, "fatca_crs") === "ready";
        },
      },
      { id: "add_wholesale_form",     label: "Add Wholesale Certificate form",      desc: "Operator adds form · 2 new outstanding fields",
        done: (s) => !!s.clients.find(c => c.id === "smith")?.forms.some(f => f.formId === "wholesale_cert"),
        ok:   (s) => stepDone(s, "dispatch_fatca"),
      },
      { id: "detect_wholesale_cert",  label: "SharePoint detects accountant certificate", desc: "Document lands · ASIC-verified · 2 fields resolved",
        done: (s) => s.clients.find(c => c.id === "smith")?.fields["wholesale.cert_expiry"]?.status === "verified",
        ok:   (s) => stepDone(s, "add_wholesale_form"),
      },
      { id: "dispatch_wholesale",     label: "Approve & dispatch Wholesale",        desc: "Form moves Ready → Dispatched → Confirmed",
        scriptId: "dispatch_wholesale",
        interactive: true,
        interactiveHint: "Open the Wholesale Certificate card and click Approve & dispatch.",
        done: (s) => s.clients.find(c => c.id === "smith")?.forms.find(f => f.formId === "wholesale_cert")?.status === "confirmed",
        ok:   (s) => {
          const c = s.clients.find(c => c.id === "smith");
          return c && deriveFormStatus(c, "wholesale_cert") === "ready";
        },
      },
      { id: "add_dd_form",     label: "Add Direct Debit Request form",              desc: "Operator adds form · 1 new outstanding field",
        done: (s) => !!s.clients.find(c => c.id === "smith")?.forms.some(f => f.formId === "ewm_direct_debit"),
        ok:   (s) => stepDone(s, "dispatch_wholesale"),
      },
      { id: "detect_dd_signed",     label: "E-signature returns signed authority", desc: "Direct debit authority captured · 1 field resolved",
        done: (s) => s.clients.find(c => c.id === "smith")?.fields["bank.debit_authority"]?.status === "verified",
        ok:   (s) => stepDone(s, "add_dd_form"),
      },
      { id: "dispatch_dd",     label: "Approve & dispatch Direct Debit",            desc: "Final additional form lodged",
        scriptId: "dispatch_dd",
        interactive: true,
        interactiveHint: "Open the Direct Debit card and click Approve & dispatch.",
        done: (s) => s.clients.find(c => c.id === "smith")?.forms.find(f => f.formId === "ewm_direct_debit")?.status === "confirmed",
        ok:   (s) => {
          const c = s.clients.find(c => c.id === "smith");
          return c && deriveFormStatus(c, "ewm_direct_debit") === "ready";
        },
      },
    ],
  },
];

// helper used inside the `done` predicates above
function stepDone(state, stepId) {
  for (const flow of FLOWS) {
    const step = flow.steps.find(s => s.id === stepId);
    if (step) return step.done(state);
  }
  return false;
}

// ---------------------------------------------------------------
// Panel
// ---------------------------------------------------------------
function DemoPanel() {
  const { state, dispatch, runEvent } = useStore();
  const stateRef = useRef(state);
  stateRef.current = state;

  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [runningFlowId, setRunningFlowId] = useState(null);
  const [awaiting, setAwaiting] = useState(null);
  const cancelRef = useRef(false);

  const isStepRunning = !!state.proc;
  const isAutoplaying = runningFlowId !== null;

  if (!open) {
    return (
      <button className="demo-tab" onClick={() => setOpen(true)}>
        <span className="demo-badge">DEMO</span>
        Controls
        <Icon name="chevron-right" size={14} />
      </button>
    );
  }

  // ---- helpers ----
  const runOne = async (step) => {
    const eventId = step.scriptId || step.id;
    if (!eventId) return;
    await runEvent(eventId);
  };

  const waitFor = (predicate, intervalMs = 250) => new Promise((resolve) => {
    const tick = () => {
      if (cancelRef.current) { resolve("cancelled"); return; }
      if (predicate()) { resolve("done"); return; }
      setTimeout(tick, intervalMs);
    };
    tick();
  });

  const playFlow = async (flow) => {
    cancelRef.current = false;
    setRunningFlowId(flow.id);
    try {
      for (const step of flow.steps) {
        if (cancelRef.current) break;
        if (step.done(stateRef.current)) continue;

        if (step.interactive) {
          // breakpoint: pause and let the operator perform the real action.
          setAwaiting({ flowId: flow.id, stepId: step.id, hint: step.interactiveHint });
          const reason = await waitFor(() => step.done(stateRef.current));
          setAwaiting(null);
          if (reason === "cancelled" || cancelRef.current) break;
        } else {
          await runOne(step);
          if (cancelRef.current) break;
        }
        // small pause between steps so animations land
        await new Promise(r => setTimeout(r, 500 / (state.speed || 1)));
      }
    } finally {
      setAwaiting(null);
      setRunningFlowId(null);
      cancelRef.current = false;
    }
  };

  const pause = () => { cancelRef.current = true; };

  const stepForward = async (flow) => {
    const next = flow.steps.find(s => !s.done(stateRef.current));
    if (!next) return;
    if (!next.ok(stateRef.current)) return;
    await runOne(next);
  };

  return (
    <div className="demo-panel">
      <div className="demo-header">
        <div className="demo-header-title">
          <span className="demo-badge">DEMO</span>
          Demo controls
        </div>
        <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}><Icon name="minimise" /></button>
      </div>

      <div className="demo-body">
        {FLOWS.map(flow => {
          const isCollapsed = !!collapsed[flow.id];
          const completedCount = flow.steps.filter(s => s.done(state)).length;
          const totalCount = flow.steps.length;
          const allDone = completedCount === totalCount;
          const isThisRunning = runningFlowId === flow.id;
          const nextStep = flow.steps.find(s => !s.done(state));
          const canStep = nextStep && nextStep.ok(state) && !isStepRunning && !isAutoplaying;
          const isAwaiting = awaiting?.flowId === flow.id;

          return (
            <div key={flow.id} className="demo-flow">
              <div className="demo-flow-header">
                <button className="demo-flow-toggle" onClick={() => setCollapsed(c => ({ ...c, [flow.id]: !c[flow.id] }))}>
                  <Icon name={isCollapsed ? "chevron-right" : "chevron-down"} size={12} />
                  <div className="demo-flow-title">
                    <div className="demo-flow-name">{flow.title}</div>
                    <div className="demo-flow-sub">{flow.subtitle}</div>
                  </div>
                  <span className={`pill ${allDone ? "ready" : "demo"}`} style={{ fontSize: 10, padding: "1px 7px" }}>
                    {completedCount}/{totalCount}
                  </span>
                </button>
                <div className="demo-flow-controls">
                  {isThisRunning ? (
                    <button className="btn btn-secondary demo-run-all" onClick={pause} title="Pause autoplay">
                      <Icon name="pause" size={11} /> Pause
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary demo-run-all"
                      onClick={() => playFlow(flow)}
                      disabled={allDone || isAutoplaying || isStepRunning}
                      title={allDone ? "Flow already complete" : "Play remaining steps end-to-end"}
                    >
                      <Icon name="play" size={11} /> {allDone ? "Done" : "Play"}
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => stepForward(flow)}
                    disabled={!canStep}
                    title={!nextStep ? "Flow complete" : !canStep ? "Prerequisites not met" : `Step → ${nextStep.label}`}
                  >
                    <Icon name="arrow-right" size={13} />
                  </button>
                </div>
              </div>

              {isAwaiting && (
                <div className="demo-pause">
                  <Icon name="pause" size={13} />
                  <div className="demo-pause-body">
                    <div className="demo-pause-title">Awaiting your action</div>
                    <div className="demo-pause-hint">{awaiting.hint}</div>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 11.5, padding: "4px 8px" }}
                    onClick={() => {
                      // skip = run the underlying script anyway
                      const step = flow.steps.find(s => s.id === awaiting.stepId);
                      if (step) runOne(step);
                    }}
                  >
                    Skip
                  </button>
                </div>
              )}

              {!isCollapsed && (
                <div className="demo-flow-steps">
                  {flow.steps.map((step, idx) => {
                    const done = step.done(state);
                    const canRun = step.ok(state) && !done && !isStepRunning && !isAutoplaying;
                    const isCurrent = isThisRunning && nextStep?.id === step.id;
                    return (
                      <div key={step.id} className={`demo-step ${done ? "done" : ""} ${canRun ? "available" : ""} ${isCurrent ? "current" : ""}`}>
                        <span className={`demo-step-num ${done ? "done" : ""}`}>
                          {done ? <Icon name="check" size={10} /> : isCurrent ? <span className="demo-step-pulse"></span> : idx + 1}
                        </span>
                        <div className="demo-step-body">
                          <div className="demo-step-label">
                            {step.label}
                            {step.interactive && !done && <span className="pill" style={{ marginLeft: 6, fontSize: 9, padding: "0 5px", background: "var(--attention-soft)", color: "var(--attention)", border: 0 }}>Manual</span>}
                          </div>
                          <div className="demo-step-desc">{step.desc}</div>
                        </div>
                        <button
                          className="btn btn-ghost btn-icon demo-step-run"
                          onClick={() => runOne(step)}
                          disabled={!canRun}
                          title={done ? "Already done" : !step.ok(state) ? "Prerequisites not met" : "Run this step"}
                        >
                          <Icon name={done ? "check" : "arrow-right"} size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="demo-footer">
        <button className="btn btn-ghost" onClick={() => { cancelRef.current = true; dispatch({ type: "RESET" }); }}><Icon name="reset" size={13} /> Reset</button>
        <div style={{ flex: 1 }} />
        <span className="t-muted" style={{ fontSize: 11 }}>Speed</span>
        <div className="seg">
          <button className={state.speed === 1.0 ? "on" : ""} onClick={() => dispatch({ type: "SET_SPEED", speed: 1.0 })}>1×</button>
          <button className={state.speed === 2.0 ? "on" : ""} onClick={() => dispatch({ type: "SET_SPEED", speed: 2.0 })}>2×</button>
        </div>
      </div>
    </div>
  );
}

window.DemoPanel = DemoPanel;
