// ============================================================
// Othello — Sources + Settings
// ============================================================

// ---------------------------------------------------------------
// Brand logos — inline SVG, brand-colour treatment. Each takes
// {size} and renders into a square tile. No external assets so
// the demo stays self-contained.
// ---------------------------------------------------------------
function SourceLogo({ logo, name, size = 36 }) {
  const styles = LOGO_STYLES[logo];
  const fallbackInitials = (name || "?").split(/[\s\/-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  if (!styles) {
    return (
      <div className="src-logo" style={{ width: size, height: size, background: "var(--bg-elevated-2)", color: "var(--text-secondary)" }}>
        {fallbackInitials}
      </div>
    );
  }
  return (
    <div className="src-logo" style={{ width: size, height: size, background: styles.bg, color: styles.fg, padding: 0, border: styles.border || "none" }}>
      <LogoMark logo={logo} />
    </div>
  );
}

const LOGO_STYLES = {
  dynamics:    { bg: "#002050", fg: "#FFFFFF" },
  fin365:      { bg: "#15835c", fg: "#FFFFFF" },
  salesforce:  { bg: "#00A1E0", fg: "#FFFFFF" },
  sharepoint:  { bg: "#036C70", fg: "#FFFFFF" },
  onedrive:    { bg: "#0364B8", fg: "#FFFFFF" },
  googledrive: { bg: "#FFFFFF", fg: "#1f1f1f", border: "1px solid var(--border-default)" },
  dvs:         { bg: "#0a2540", fg: "#E1A93A" },
  frankieone:  { bg: "#FF4F58", fg: "#FFFFFF" },
  refinitiv:   { bg: "#FA5005", fg: "#FFFFFF" },
  abr:         { bg: "#00558B", fg: "#FFFFFF" },
  asic:        { bg: "#0E2A47", fg: "#FFFFFF" },
  ato:         { bg: "#722F37", fg: "#F4D58D" },
  hub24:       { bg: "#08C9B8", fg: "#0a2540" },
  netwealth:   { bg: "#E4002B", fg: "#FFFFFF" },
  macquarie:   { bg: "#000000", fg: "#FFFFFF" },
  praemium:    { bg: "#1F4E8F", fg: "#FFFFFF" },
  docusign:    { bg: "#FFCC22", fg: "#000000" },
  adobesign:   { bg: "#EB1000", fg: "#FFFFFF" },
  m365:        { bg: "#FFFFFF", fg: "#1f1f1f", border: "1px solid var(--border-default)" },
  gworkspace:  { bg: "#FFFFFF", fg: "#1f1f1f", border: "1px solid var(--border-default)" },
  twilio:      { bg: "#F22F46", fg: "#FFFFFF" },
};

function LogoMark({ logo }) {
  // Microsoft 4-square mark (used for Dynamics / M365 / SharePoint / OneDrive variants)
  const msSquares = (
    <svg viewBox="0 0 32 32" width="60%" height="60%" aria-hidden>
      <rect x="2"  y="2"  width="13" height="13" fill="#F25022" />
      <rect x="17" y="2"  width="13" height="13" fill="#7FBA00" />
      <rect x="2"  y="17" width="13" height="13" fill="#00A4EF" />
      <rect x="17" y="17" width="13" height="13" fill="#FFB900" />
    </svg>
  );
  // Google G mark (used for Drive / Workspace variants)
  const gMark = (
    <svg viewBox="0 0 24 24" width="62%" height="62%" aria-hidden>
      <path fill="#4285F4" d="M22.5 12.27c0-.78-.07-1.53-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.22-4.74 3.22-8.32z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.97 6.97 0 0 1 5.47 12c0-.73.13-1.43.37-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.22 1.65l3.16-3.16C17.45 2.16 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );

  switch (logo) {
    case "dynamics":
      return <BrandText text="D" sub="365" />;
    case "fin365":
      return <BrandText text="F" sub="365" />;
    case "salesforce":
      // simplified Salesforce cloud silhouette
      return (
        <svg viewBox="0 0 32 24" width="72%" height="72%" aria-hidden>
          <path fill="#FFFFFF" d="M11 4c2.4 0 4.5 1.4 5.6 3.4A4.9 4.9 0 0 1 24 12a4.9 4.9 0 0 1-4.9 4.9H6.2A5.2 5.2 0 0 1 1 11.6c0-2.9 2.3-5.2 5.2-5.2.6 0 1.1.1 1.6.2A6 6 0 0 1 11 4z"/>
        </svg>
      );
    case "sharepoint":
      return <BrandText text="S" />;
    case "onedrive":
      // simplified cloud
      return (
        <svg viewBox="0 0 32 24" width="78%" height="78%" aria-hidden>
          <path fill="#FFFFFF" d="M9 11a5 5 0 0 1 9.6-2A4 4 0 0 1 24 13a4 4 0 0 1-4 4H7a4 4 0 0 1-1-7.9c.9-.1 2 0 3 .9z"/>
        </svg>
      );
    case "googledrive":
      return gMark;
    case "dvs":
      return (
        <svg viewBox="0 0 32 32" width="74%" height="74%" aria-hidden>
          <path d="M16 3l11 4v8c0 7-4.8 12.4-11 14-6.2-1.6-11-7-11-14V7l11-4z" fill="none" stroke="#E1A93A" strokeWidth="2"/>
          <path d="M11 16l4 4 7-8" fill="none" stroke="#E1A93A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "frankieone":
      return <BrandText text="F1" />;
    case "refinitiv":
      return <BrandText text="R" />;
    case "abr":
      return <BrandText text="ABR" small />;
    case "asic":
      return <BrandText text="ASIC" small />;
    case "ato":
      return <BrandText text="ATO" small />;
    case "hub24":
      return <BrandText text="Hub" sub="24" />;
    case "netwealth":
      return <BrandText text="N" />;
    case "macquarie":
      // simplified Macquarie holey-dollar
      return (
        <svg viewBox="0 0 32 32" width="62%" height="62%" aria-hidden>
          <circle cx="16" cy="16" r="11" fill="none" stroke="#FFFFFF" strokeWidth="2.5"/>
          <circle cx="16" cy="16" r="3.5" fill="none" stroke="#FFFFFF" strokeWidth="2.5"/>
        </svg>
      );
    case "praemium":
      return <BrandText text="P" />;
    case "docusign":
      return <BrandText text="DS" />;
    case "adobesign":
      return <BrandText text="A" />;
    case "m365":
      return msSquares;
    case "gworkspace":
      return gMark;
    case "twilio":
      return <BrandText text="T" />;
    default:
      return null;
  }
}

function BrandText({ text, sub, small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "baseline", gap: 1,
      fontWeight: 800, fontFamily: '"Segoe UI", -apple-system, system-ui, sans-serif',
      fontSize: small ? "11px" : "16px",
      letterSpacing: small ? "0.02em" : "-0.02em",
      lineHeight: 1,
    }}>
      <span>{text}</span>
      {sub && <span style={{ fontSize: "10px", fontWeight: 700, opacity: 0.9 }}>{sub}</span>}
    </span>
  );
}

// Per-category icon for section headers
const CAT_ICONS = {
  "CRM": "people",
  "Document storage": "docs",
  "Identity & AML": "shield-check",
  "Registries": "search",
  "Investment platforms": "gauge",
  "E-signature": "send",
  "Email & notifications": "send",
};

// ---------------------------------------------------------------
// Sources page
// ---------------------------------------------------------------
function Sources() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | connected | available

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SOURCES.filter(s => {
      if (filter === "connected" && s.state !== "connected") return false;
      if (filter === "available" && s.state !== "available") return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.cat.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        (s.provider || "").toLowerCase().includes(q)
      );
    });
  }, [query, filter]);

  const grouped = useMemo(() => {
    const m = {};
    for (const s of filtered) {
      if (!m[s.cat]) m[s.cat] = [];
      m[s.cat].push(s);
    }
    return m;
  }, [filtered]);

  const connectedCount = SOURCES.filter(s => s.state === "connected").length;
  const availableCount = SOURCES.filter(s => s.state === "available").length;
  const totalCount = SOURCES.length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Sources &amp; integrations</div>
          <div className="page-sub">
            Othello reads from the systems your firm already uses. Nothing is emailed
            around; data stays inside your tenant.
          </div>
        </div>
      </div>

      {/* Hero summary tile */}
      <div className="src-hero">
        <div className="src-hero-stats">
          <div className="src-hero-stat">
            <div className="src-hero-num">{connectedCount}</div>
            <div className="src-hero-label">Connected</div>
          </div>
          <div className="src-hero-divider" />
          <div className="src-hero-stat">
            <div className="src-hero-num">{availableCount}</div>
            <div className="src-hero-label">Available</div>
          </div>
          <div className="src-hero-divider" />
          <div className="src-hero-stat">
            <div className="src-hero-num">{totalCount}</div>
            <div className="src-hero-label">Total in marketplace</div>
          </div>
        </div>
        <div className="src-hero-trust">
          <Icon name="shield-check" size={14} style={{ color: "var(--ready)" }} />
          <span>Encrypted in transit, hosted in your tenant.</span>
          <span className="t-muted">·</span>
          <span>SOC 2 Type II</span>
          <span className="t-muted">·</span>
          <span>ISO 27001</span>
          <span className="t-muted">·</span>
          <span>AUSTRAC-aligned</span>
        </div>
      </div>

      {/* Search + filter */}
      <div className="src-toolbar">
        <div className="src-search-wrap">
          <Icon name="search" size={14} />
          <input
            className="src-search"
            placeholder="Search integrations by name, provider, or category…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="seg">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
            All<span className="seg-count">{totalCount}</span>
          </button>
          <button className={filter === "connected" ? "on" : ""} onClick={() => setFilter("connected")}>
            Connected<span className="seg-count">{connectedCount}</span>
          </button>
          <button className={filter === "available" ? "on" : ""} onClick={() => setFilter("available")}>
            Available<span className="seg-count">{availableCount}</span>
          </button>
        </div>
      </div>

      {/* Grouped sections */}
      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state" style={{ padding: "60px 20px" }}>
          <Icon name="search" size={24} />
          <div className="t-secondary">No integrations match "{query}".</div>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="src-cat-section">
            <div className="src-cat-header">
              <Icon name={CAT_ICONS[cat] || "plug"} size={14} style={{ color: "var(--text-muted)" }} />
              <span>{cat}</span>
              <span className="t-muted">·</span>
              <span className="t-muted">{items.length} integration{items.length === 1 ? "" : "s"}</span>
            </div>
            <div className="source-grid">
              {items.map((s, i) => (
                <SourceCard key={i} s={s} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Request integration */}
      <div className="src-request">
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>Don't see what you need?</div>
          <div className="t-secondary" style={{ fontSize: 12.5, marginTop: 2 }}>
            We add integrations weekly — request a new source and we'll prioritise it for your tenant.
          </div>
        </div>
        <button className="btn btn-secondary">Request an integration</button>
      </div>
    </div>
  );
}

function SourceCard({ s }) {
  const connected = s.state === "connected";
  return (
    <div className={`src-card ${connected ? "connected" : ""}`}>
      <div className="src-card-top">
        <SourceLogo logo={s.logo} name={s.name} size={40} />
        <div className="src-card-status">
          {connected
            ? <span className="pill ready"><span className="dot ready"></span>Connected</span>
            : <span className="pill">Available</span>}
        </div>
      </div>
      <div className="src-card-mid">
        <div className="src-name-row">
          <div className="src-name">{s.name}</div>
          {s.verified && (
            <span className="src-verified" title="Verified by Othello">
              <Icon name="check" size={9} />
            </span>
          )}
        </div>
        {s.provider && <div className="src-provider">{s.provider}</div>}
        {s.description && <div className="src-desc">{s.description}</div>}
      </div>
      {connected && (
        <div className="src-card-meta">
          <span className="src-meta-line">
            <Icon name="sync" size={11} />
            Synced {s.lastSync}
          </span>
          {s.scope && <span className="src-meta-line t-muted">Reads: {s.scope}</span>}
        </div>
      )}
      <div className="src-card-actions">
        {connected
          ? <button className="btn btn-secondary src-action">Manage</button>
          : <button className="btn btn-secondary src-action">Connect</button>}
        <button className="btn btn-ghost btn-icon" title="More options"><Icon name="more" /></button>
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
