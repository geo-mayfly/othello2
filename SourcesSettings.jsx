// ============================================================
// Othello — Sources + Settings
// ============================================================

function Sources() {
  const grouped = useMemo(() => {
    const m = {};
    for (const s of SOURCES) {
      if (!m[s.cat]) m[s.cat] = [];
      m[s.cat].push(s);
    }
    return m;
  }, []);
  const connected = SOURCES.filter(s => s.state === "connected").length;
  const available = SOURCES.filter(s => s.state === "available").length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Sources</div>
          <div className="page-sub">Othello reads from where your data already lives — nothing is emailed around.</div>
        </div>
        <div className="row-flex">
          <span className="pill ready"><span className="dot ready"></span>{connected} connected</span>
          <span className="pill">{available} available</span>
        </div>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 22 }}>
          <div className="t-label" style={{ marginBottom: 10 }}>{cat}</div>
          <div className="source-grid">
            {items.map((s, i) => (
              <SourceCard key={i} s={s} />
            ))}
          </div>
        </div>
      ))}

      <div className="src-trust-banner">
        <Icon name="shield" size={16} style={{ color: "var(--ready)", flexShrink: 0 }} />
        Data is encrypted in transit and held in the firm-controlled secure environment. GS007 audit-aligned · ASIC-compliant framing.
      </div>
    </div>
  );
}

function SourceCard({ s }) {
  // monogram from name
  const initials = s.name.split(/[\s\/-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className="src-card">
      <div className="src-card-top">
        <div className="src-logo">{initials}</div>
        {s.state === "connected"
          ? <span className="pill ready"><span className="dot ready"></span>Connected</span>
          : <span className="pill">Available</span>}
      </div>
      <div>
        <div className="src-name">{s.name}</div>
        <div className="src-cat">{s.cat}</div>
      </div>
      {s.state === "connected" && (
        <>
          <div className="src-meta"><Icon name="sync" size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />Synced {s.lastSync}</div>
          <div className="src-meta" style={{ color: "var(--text-muted)", fontSize: 11.5 }}>Reads: {s.scope}</div>
        </>
      )}
      <div>
        {s.state === "connected"
          ? <button className="btn btn-secondary" style={{ width: "100%" }}>Manage</button>
          : <button className="btn btn-secondary" style={{ width: "100%" }}>Connect</button>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Settings (static)
// ---------------------------------------------------------------
function Settings() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Workspace configuration. Demo screen — not interactive.</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="t-section" style={{ marginBottom: 10 }}>Workspace</div>
        <div className="settings-row">
          <div className="sr-label">Workspace name</div>
          <div>EWM <span className="t-muted" style={{ fontSize: 12 }}>(Example Wealth Management)</span></div>
        </div>
        <div className="settings-row">
          <div className="sr-label">Default tenant</div>
          <div>Production · Sydney</div>
        </div>
        <div className="settings-row">
          <div className="sr-label">Data residency</div>
          <div>Australia (Sydney) · ISO 27001-aligned facility</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="t-section" style={{ marginBottom: 10 }}>Team &amp; roles</div>
        {[
          { name: "Rachel Lee", role: "Operations · Admin", email: "rachel.lee@ewm.example" },
          { name: "Catherine Halford", role: "Adviser · Senior", email: "catherine.halford@ewm.example" },
          { name: "Sanjay Patel", role: "Adviser", email: "sanjay.patel@ewm.example" },
          { name: "Peter Mathieson", role: "Principal", email: "peter.mathieson@ewm.example" },
        ].map((m, i) => (
          <div key={i} className="settings-row">
            <div className="sr-label">{m.name}<div className="sr-help">{m.email}</div></div>
            <div>{m.role}</div>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <div className="t-section" style={{ marginBottom: 10 }}>Notifications</div>
        <div className="settings-row">
          <div className="sr-label">Daily digest <div className="sr-help">9:00am Sydney time</div></div>
          <div><span className="pill ready">On</span></div>
        </div>
        <div className="settings-row">
          <div className="sr-label">New "needs you" client <div className="sr-help">Real-time email + in-app</div></div>
          <div><span className="pill ready">On</span></div>
        </div>
        <div className="settings-row">
          <div className="sr-label">Expiry approaching <div className="sr-help">60 / 30 / 14 day reminders</div></div>
          <div><span className="pill ready">On</span></div>
        </div>
      </div>
    </div>
  );
}

window.Sources = Sources;
window.Settings = Settings;
