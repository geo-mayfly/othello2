// ============================================================
// Othello — Sidebar
// ============================================================

function Sidebar() {
  const { state, dispatch } = useStore();
  const { module, navCollapsed, clients } = state;

  // count of "needs you" clients
  const needsCount = clients.filter(c => c.status === "needs").length;

  const items = [
    { id: "clients",  icon: "people", label: "Clients", badge: needsCount > 0 ? needsCount : null },
    { id: "overview", icon: "gauge",  label: "Overview" },
    { id: "library",  icon: "docs",   label: "Forms library" },
    { id: "sources",  icon: "plug",   label: "Sources" },
    { id: "settings", icon: "gear",   label: "Settings" },
  ];

  return (
    <div className={`sidebar ${navCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        {!navCollapsed ? (
          <>
            <div className="logo">
              <Icon name="split-disc" size={22} />
              <span>Othello</span>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span className="tenant-chip">
                <span className="tenant-chip-dot"></span>EWM
              </span>
            </div>
          </>
        ) : (
          <Icon name="split-disc" size={22} />
        )}
      </div>

      <div className="sidebar-modules">
        {items.map(it => (
          <button
            key={it.id}
            className={`nav-item ${module === it.id ? "active" : ""} ${it.badge ? "has-badge" : ""}`}
            onClick={() => dispatch({ type: "SET_MODULE", module: it.id })}
            title={navCollapsed ? it.label : undefined}
          >
            <Icon name={it.icon} className="ni-icon" />
            {!navCollapsed && <span className="ni-label">{it.label}</span>}
            {!navCollapsed && it.badge && <span className="ni-badge">{it.badge}</span>}
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        {!navCollapsed && (
          <button className="nav-item">
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #5B8DEF, #B879F5)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>RL</div>
            <div className="ni-label" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>R. Lee</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Operations</span>
            </div>
          </button>
        )}
        <button
          className="nav-item"
          onClick={() => dispatch({ type: "TOGGLE_NAV" })}
          title={navCollapsed ? "Expand" : "Collapse"}
        >
          <Icon name={navCollapsed ? "chevron-right" : "chevron-left"} className="ni-icon" />
          {!navCollapsed && <span className="ni-label">Collapse</span>}
        </button>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
