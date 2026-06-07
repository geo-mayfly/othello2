// ============================================================
// Othello — Data Room: Data Rooms landing + create flow
// ============================================================
//
// Lists past/current DD containers and hosts "New due diligence".
// When a container is open (activeDdId set) it hands off to DataRoomDD.

function DataRooms() {
  const { state } = useStore();
  const { activeDdId } = state.dataRoom;
  if (activeDdId) return <DataRoomDD />;
  return <DataRoomsList />;
}

function DataRoomsList() {
  const { state, dispatch } = useStore();
  const { dataRooms, creating } = state.dataRoom;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Data Rooms</div>
          <div className="page-sub">Every due-diligence request runs in its own container. Drop in the questionnaire and Othello populates it from the knowledge base.</div>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch({ type: "DR_SET_CREATING", creating: !creating })}>
          <Icon name="plus" size={14} /> New due diligence
        </button>
      </div>

      {creating && <CreateDd />}

      <div className="dr-list">
        <div className="dr-row dr-row-head">
          <span>Due diligence</span><span>Requester</span><span>Status</span><span>Due</span><span>Progress</span>
        </div>
        {dataRooms.map(d => {
          const sev = d.status === "complete" ? "ready" : d.status === "in_progress" ? "attention" : "muted";
          const pct = d.items ? Math.round((d.done / d.items) * 100) : 0;
          return (
            <div key={d.id} className="dr-row" onClick={() => dispatch({ type: "DR_OPEN_DD", id: d.id })}>
              <span className="dr-name-cell">
                <Icon name="folders" size={16} className="dr-row-icon" />
                <span>
                  <span className="dr-name">{d.name}</span>
                  {d.hero && <span className="pill accent kb-active-pill">KB evidence</span>}
                </span>
              </span>
              <span className="t-secondary">{d.requester}</span>
              <span><span className={`pill ${sev}`}>{d.status === "complete" ? "Complete" : d.status === "in_progress" ? "In progress" : "New"}</span></span>
              <span className="t-muted">{d.due}</span>
              <span className="dr-progress-cell">
                <span className="dr-bar"><span className="dr-bar-fill" style={{ width: `${pct}%` }} /></span>
                <span className="t-muted" style={{ fontSize: 12 }}>{d.done}/{d.items}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Create flow — accepts the blank questionnaire (any upload triggers
// the same pre-baked extraction).
// ---------------------------------------------------------------
function CreateDd() {
  const { dispatch, toast } = useStore();
  const [name, setName] = useState("Chester High Conviction Fund — IM DDQ");
  const [requester, setRequester] = useState("");
  const fileRef = useRef(null);

  const create = (fileName) => {
    const listEntry = {
      id: "chcf_new",
      name: name.trim() || "Untitled due diligence",
      requester: requester.trim() || "Unbranded inbound request",
      status: "in_progress",
      due: "24 Jun 2026",
      items: DD_ITEM_COUNT,
      done: 0,
      created: "today",
      uploaded: fileName,
    };
    toast(`Questionnaire received — ${fileName}`, "info");
    dispatch({ type: "DR_CREATE_DD", listEntry });
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    create(f ? f.name : "Sample DD Questionnaire.docx");
    e.target.value = "";
  };

  return (
    <div className="dr-create bordered">
      <input type="file" ref={fileRef} style={{ display: "none" }} onChange={onFile} />
      <div className="dr-create-head">
        <span className="t-card-title">New due diligence</span>
        <button className="btn btn-ghost btn-icon" onClick={() => dispatch({ type: "DR_SET_CREATING", creating: false })}><Icon name="x" size={14} /></button>
      </div>
      <div className="dr-create-grid">
        <label className="dr-field">
          <span className="t-label">Project name</span>
          <input className="dr-input" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label className="dr-field">
          <span className="t-label">Requester (optional)</span>
          <input className="dr-input" placeholder="e.g. Fiducian, Diversa…" value={requester} onChange={e => setRequester(e.target.value)} />
        </label>
      </div>
      <div className="dr-drop" onClick={() => fileRef.current?.click()}>
        <Icon name="upload" size={20} />
        <div style={{ fontWeight: 500, marginTop: 8 }}>Drop the questionnaire to be completed</div>
        <div className="t-muted" style={{ fontSize: 12, marginTop: 2 }}>Excel platform review, Word checklist or PDF — any format in, same requirements list out</div>
        <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>Choose file…</button>
        <button className="btn btn-ghost" style={{ marginTop: 6 }} onClick={(e) => { e.stopPropagation(); create("Sample DD Questionnaire - Blank.docx"); }}>Use the sample blank questionnaire</button>
      </div>
    </div>
  );
}

window.DataRooms = DataRooms;
window.CreateDd = CreateDd;
