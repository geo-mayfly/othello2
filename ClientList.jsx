// ============================================================
// Othello — Client list (middle panel)
// ============================================================

function ClientList() {
  const { state, dispatch } = useStore();
  const { clients, clientListFilter, clientListQuery, selectedClientId, proc } = state;

  const counts = {
    in_progress: clients.filter(c => c.status === "in_progress").length,
    needs:       clients.filter(c => c.status === "needs").length,
    done:        clients.filter(c => c.status === "done").length,
  };

  let rows = clients.filter(c => c.status === clientListFilter);
  if (clientListQuery.trim()) {
    const q = clientListQuery.toLowerCase();
    rows = rows.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.onboardingTo?.product?.toLowerCase().includes(q) ||
      c.adviser?.toLowerCase().includes(q)
    );
  }

  // sort: smith always first if in current filter (the hero)
  rows.sort((a, b) => (a.id === "smith" ? -1 : b.id === "smith" ? 1 : 0));

  return (
    <div className="client-list">
      <div className="cl-header">
        <div className="cl-title">
          <span>Clients</span>
          <button className="btn btn-ghost btn-icon" title="More"><Icon name="more" /></button>
        </div>
        <div className="cl-search-wrap">
          <Icon name="search" size={14} />
          <input
            className="cl-search"
            placeholder="Search client, product, adviser…"
            value={clientListQuery}
            onChange={e => dispatch({ type: "SET_QUERY", query: e.target.value })}
          />
        </div>
        <div className="seg" role="tablist">
          {[
            { id: "in_progress", label: "In progress", count: counts.in_progress },
            { id: "needs",       label: "Needs you",   count: counts.needs },
            { id: "done",        label: "Done",        count: counts.done },
          ].map(s => (
            <button
              key={s.id}
              className={clientListFilter === s.id ? "on" : ""}
              onClick={() => dispatch({ type: "SET_FILTER", filter: s.id })}
            >
              {s.label}<span className="seg-count">{s.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cl-rows">
        {rows.length === 0 ? (
          <div className="empty-state" style={{ margin: 16 }}>
            <Icon name="check" size={28} />
            <div className="t-secondary">Nothing {clientListFilter === "needs" ? "needs you" : clientListFilter === "in_progress" ? "in progress" : "here"} right now</div>
          </div>
        ) : rows.map(c => {
          const isProc = proc?.clientId === c.id;
          const sev = c.status === "needs" ? "missing" : c.status === "in_progress" ? "attention" : "ready";
          const readinessText = c.id === "smith"
            ? (() => {
                const { ready, total } = countReadiness(c);
                if (total === 0) return "Awaiting forms";
                if (ready === total) return "Ready to lodge";
                return `${total - ready} of ${total} outstanding`;
              })()
            : c.readinessSummary || "";
          return (
            <div
              key={c.id}
              className={`cl-row ${selectedClientId === c.id ? "active" : ""} ${isProc ? "processing" : ""} ${c.id === "smith" && c.activity?.length <= 2 ? "new-pulse" : ""}`}
              onClick={() => dispatch({ type: "SELECT_CLIENT", id: c.id })}
            >
              <span className={`dot ${sev}`} style={{ marginTop: 6 }}></span>
              <div className="cl-row-body">
                <div className="cl-row-name">{c.name}</div>
                <div className="cl-row-sub">{c.onboardingTo?.product} · {c.onboardingTo?.productType?.split(" ")[0]}</div>
              </div>
              <div className="cl-row-meta">
                <span className={`pill ${sev}`} style={{ fontSize: 11, padding: "2px 8px" }}>{readinessText}</span>
                <span style={{ fontSize: 11 }}>{c.lastActivity}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.ClientList = ClientList;
