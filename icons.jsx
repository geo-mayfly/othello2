// ============================================================
// Othello — icons (small inline SVGs)
// ============================================================

const Icon = ({ name, size = 16, className = "", style = {} }) => {
  const s = size;
  const props = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", className, style };
  switch (name) {
    case "people":   return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "gauge":    return <svg {...props}><path d="M12 14l3-3"/><path d="M3.05 11a9 9 0 1 1 17.9 0"/><circle cx="12" cy="14" r="1"/></svg>;
    case "docs":     return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h6"/><path d="M8 17h8"/></svg>;
    case "plug":     return <svg {...props}><path d="M9 2v6"/><path d="M15 2v6"/><path d="M5 8h14v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z"/><path d="M12 16v6"/></svg>;
    case "gear":     return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case "search":   return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
    case "check":    return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>;
    case "x":        return <svg {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "arrow-right": return <svg {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    case "chevron-right": return <svg {...props}><polyline points="9 18 15 12 9 6"/></svg>;
    case "chevron-down":  return <svg {...props}><polyline points="6 9 12 15 18 9"/></svg>;
    case "chevron-left":  return <svg {...props}><polyline points="15 18 9 12 15 6"/></svg>;
    case "alert":    return <svg {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    case "clock":    return <svg {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "shield":   return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case "shield-check":   return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 11 13 16 8"/></svg>;
    case "mail":     return <svg {...props}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 5 12 13 2 5"/></svg>;
    case "send":     return <svg {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case "play":     return <svg {...props}><polygon points="6 4 20 12 6 20 6 4"/></svg>;
    case "pause":    return <svg {...props}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
    case "reset":    return <svg {...props}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15A9 9 0 1 0 6 5.3L1 10"/></svg>;
    case "sparkle":  return <svg {...props}><path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7z"/><path d="M19 16l.7 2 2 .7-2 .7L19 22l-.7-2-2-.7 2-.7z"/></svg>;
    case "menu":     return <svg {...props}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
    case "chat":     return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "doc":      return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>;
    case "id-card":  return <svg {...props}><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M14 9h5"/><path d="M14 13h5"/><path d="M5 17h10"/></svg>;
    case "bank":     return <svg {...props}><polygon points="3 10 12 4 21 10 3 10"/><line x1="3" y1="10" x2="3" y2="20"/><line x1="21" y1="10" x2="21" y2="20"/><line x1="7" y1="11" x2="7" y2="19"/><line x1="12" y1="11" x2="12" y2="19"/><line x1="17" y1="11" x2="17" y2="19"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
    case "money":    return <svg {...props}><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case "verified": return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>;
    case "warning":  return <svg {...props}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "missing":  return <svg {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    case "external": return <svg {...props}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
    case "more":     return <svg {...props}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
    case "filter":   return <svg {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
    case "plus":     return <svg {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "upload":   return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
    case "download": return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
    case "trend-up": return <svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    case "trend-down": return <svg {...props}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>;
    case "minimise":  return <svg {...props}><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "sync":     return <svg {...props}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
    case "split-disc":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
          <defs>
            <clipPath id={`sd-clip-${size}`}>
              <circle cx="12" cy="12" r="10"/>
            </clipPath>
          </defs>
          <circle cx="12" cy="12" r="10" fill="#1A1A1E" stroke="#2A2A30" strokeWidth="1"/>
          <rect x="2" y="2" width="10" height="20" fill="#ECECEE" clipPath={`url(#sd-clip-${size})`}/>
        </svg>
      );
    default: return null;
  }
};

// status icons in pills
const StatusGlyph = ({ status, size = 12 }) => {
  if (status === "verified")     return <Icon name="check" size={size} />;
  if (status === "review")       return <Icon name="sparkle" size={size} />;
  if (status === "stale")        return <Icon name="clock" size={size} />;
  if (status === "missing")      return <Icon name="missing" size={size} />;
  if (status === "conflict")     return <Icon name="warning" size={size} />;
  if (status === "failed")       return <Icon name="alert" size={size} />;
  return null;
};

// map status -> palette token
const statusKind = (status) => {
  if (status === "verified") return "ready";
  if (status === "review" || status === "stale") return "attention";
  if (status === "missing" || status === "conflict" || status === "failed") return "missing";
  return "muted";
};

const statusLabel = (status) => ({
  verified: "Verified",
  review: "AI-extracted · review",
  stale: "Expiring",
  missing: "Missing",
  conflict: "Conflict",
  failed: "Validation failed",
}[status] || status);

window.Icon = Icon;
window.StatusGlyph = StatusGlyph;
window.statusKind = statusKind;
window.statusLabel = statusLabel;
