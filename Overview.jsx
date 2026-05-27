// ============================================================
// Othello — Overview (default content when no client selected)
// ============================================================

function Overview() {
  const { state, dispatch } = useStore();
  const { clients, overviewMetrics, compliance } = state;

  const [period, setPeriod] = useState("30d");

  const counts = {
    in_progress: clients.filter(c => c.status === "in_progress").length,
    needs:       clients.filter(c => c.status === "needs").length,
    done:        clients.filter(c => c.status === "done").length,
  };

  const recentActivity = clients
    .flatMap(c => (c.activity || []).map(a => ({ ...a, client: c.name, clientId: c.id })))
    .slice(0, 8);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Overview</div>
          <div className="page-sub">Forms moving through the firm — across the whole book.</div>
        </div>
        <div className="seg">
          <button className={period === "7d" ? "on" : ""} onClick={() => setPeriod("7d")}>Last 7 days</button>
          <button className={period === "30d" ? "on" : ""} onClick={() => setPeriod("30d")}>30 days</button>
          <button className={period === "qtr" ? "on" : ""} onClick={() => setPeriod("qtr")}>Quarter</button>
        </div>
      </div>

      <div className="metric-grid">
        <MetricTile label="Forms processed" value={overviewMetrics.formsProcessed.value} unit={overviewMetrics.formsProcessed.unit} delta={overviewMetrics.formsProcessed.delta} sparkline={overviewMetrics.formsProcessed.sparkline} />
        <MetricTile label="Admin hours saved" value={`~${overviewMetrics.hoursSaved.value}`} unit={overviewMetrics.hoursSaved.unit} delta={overviewMetrics.hoursSaved.delta} sparkline={overviewMetrics.hoursSaved.sparkline} />
        <MetricTile label="Headcount displaced" value={`≈${overviewMetrics.fteDisplaced.value}`} unit={overviewMetrics.fteDisplaced.unit} delta={overviewMetrics.fteDisplaced.delta} sparkline={overviewMetrics.fteDisplaced.sparkline} />
        <MetricTile label="Avg time-to-complete" value={overviewMetrics.cycleTime.value} unit={overviewMetrics.cycleTime.unit} delta={overviewMetrics.cycleTime.delta} sparkline={overviewMetrics.cycleTime.sparkline} down />
      </div>

      <div className="pipeline">
        <PipelineTile filter="in_progress" label="In progress" value={counts.in_progress} kind="attention" />
        <PipelineTile filter="needs" label="Needs you" value={counts.needs} kind="missing" />
        <PipelineTile filter="done" label="Done" value={counts.done} kind="ready" />
      </div>

      <div className="compliance-panel">
        <div className="compliance-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="shield" size={16} style={{ color: "var(--missing)" }} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>Cannot currently advise — {compliance.filter(c => c.severity === "missing").length} clients</span>
            </div>
            <div className="t-secondary" style={{ marginTop: 4, fontSize: 12.5 }}>
              Documents that block ongoing or pending advice. Sorted worst-first.
            </div>
          </div>
          <span className="pill missing">{compliance.length} flagged</span>
        </div>
        {compliance.length === 0 && (
          <div style={{ padding: 20, color: "var(--text-secondary)", textAlign: "center" }}>
            Nothing currently blocking advice. Renewal reminders are firing on schedule.
          </div>
        )}
        {compliance.map((row, i) => (
          <div key={i} className="compliance-row" onClick={() => dispatch({ type: "SELECT_CLIENT", id: row.clientId })}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`dot ${row.severity}`}></span>
              <strong>{row.client}</strong>
            </div>
            <span style={{ color: "var(--text-secondary)" }}>{row.document}</span>
            <span className={`pill ${row.severity}`}>{row.state}</span>
            <span className="t-muted" style={{ fontSize: 12 }}>{row.daysText}</span>
          </div>
        ))}
      </div>

      <div className="cf-section">
        <div className="cf-section-title">Recent activity</div>
        <div className="bordered" style={{ background: "var(--bg-surface)" }}>
          {recentActivity.map((a, i) => (
            <div key={i} className="activity-row" style={{ gridTemplateColumns: "120px 180px 1fr" }}>
              <span className="at-time">{a.time}</span>
              <span style={{ color: "var(--accent)", fontSize: 13, cursor: "pointer" }} onClick={() => dispatch({ type: "SELECT_CLIENT", id: a.clientId })}>{a.client}</span>
              <span className="at-desc"><span style={{ color: "var(--text-muted)", marginRight: 8 }}>{a.actor}</span>{a.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, unit, delta, sparkline, down }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}<span className="unit">{unit}</span></div>
      <div className={`metric-delta ${down ? "" : ""}`} style={down ? { color: "var(--ready)" } : {}}>
        <Icon name={down ? "trend-down" : "trend-up"} size={12} />
        {delta} vs previous
      </div>
      <Spark data={sparkline} />
    </div>
  );
}

function Spark({ data }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 200, H = 28;
  const stepX = W / (data.length - 1);
  const points = data.map((v, i) => `${(i * stepX).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`).join(" ");
  return (
    <svg className="metric-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="28">
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      <polyline points={`0,${H} ${points} ${W},${H}`} fill="var(--accent-soft)" stroke="none" />
    </svg>
  );
}

function PipelineTile({ filter, label, value, kind }) {
  const { dispatch } = useStore();
  return (
    <div className="pipeline-tile" onClick={() => { dispatch({ type: "SET_MODULE", module: "clients" }); dispatch({ type: "SET_FILTER", filter }); }}>
      <div className="pt-label">
        <span className={`dot ${kind}`}></span>{label}
      </div>
      <div className="pt-value">{value}</div>
    </div>
  );
}

window.Overview = Overview;
