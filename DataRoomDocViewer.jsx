// ============================================================
// Othello — Data Room: reference quick-view overlay
// ============================================================
//
// Opens a cited reference at its page/section:
//   - pdf   → rendered with pdf.js (CDN) at the cited page
//   - sheet → the cited Diversa sheet rendered as a table
//   - doc   → a simple document rendering (e.g. the bios .docx)
// Missing PDFs degrade to a clean placeholder so the build works
// before Copia's source files are dropped into dataroom/docs/.

function DataRoomDocViewer() {
  const { state, dispatch } = useStore();
  const dv = state.dataRoom.docViewer;
  if (!dv) return null;
  const doc = state.dataRoom.kbDocs.find(d => d.id === dv.docId)
    || (dv.docId === "chubb_combined" ? CHUBB_KB_DOC : null);

  const close = () => dispatch({ type: "DR_CLOSE_DOC" });

  let title = doc?.title || "Reference";
  let sub = doc ? `${doc.type} · ${doc.source}` : "";

  // pick the rendering
  let content;
  if (dv.sheet || (doc && doc.kind === "sheet")) {
    const sheetId = dv.sheet || Object.keys(SHEET_SNIPPETS)[0];
    content = <SheetView sheetId={sheetId} />;
    const snip = SHEET_SNIPPETS[sheetId];
    if (snip) { title = doc?.title || "Diversa IM Review"; sub = snip.title; }
  } else if (doc && doc.kind === "pdf") {
    content = <PdfView file={doc.file} initialPage={dv.page || 1} numPages={doc.pages || 1} title={doc.title} />;
  } else if (doc && doc.kind === "doc" && DOC_SNIPPETS[doc.id]) {
    content = <DocView snippet={DOC_SNIPPETS[doc.id]} />;
  } else {
    content = <ViewerPlaceholder title={title} note="Preview not available for this file type in the demo." />;
  }

  return (
    <div className="preview-backdrop" onClick={close}>
      <div className="dr-viewer" onClick={e => e.stopPropagation()}>
        <div className="dr-viewer-head">
          <Icon name={docIcon(doc?.kind)} size={16} style={{ color: "var(--text-muted)" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="dr-viewer-title">{title}</div>
            <div className="t-muted" style={{ fontSize: 11.5 }}>{sub}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={close}><Icon name="x" /></button>
        </div>
        <div className="dr-viewer-body">{content}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// pdf.js renderer
// ---------------------------------------------------------------
function PdfView({ file, initialPage, numPages, title }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const pdfRef = useRef(null);
  const [page, setPage] = useState(initialPage || 1);
  const [pages, setPages] = useState(numPages || 1);
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);

  const render = (p) => {
    const pdf = pdfRef.current;
    if (!pdf) return;
    pdf.getPage(p).then(pg => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const avail = (wrapRef.current?.clientWidth || 700) - 8;
      const base = pg.getViewport({ scale: 1 });
      const scale = Math.min(2.2, Math.max(0.5, avail / base.width));
      const vp = pg.getViewport({ scale });
      canvas.width = vp.width;
      canvas.height = vp.height;
      pg.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise.then(() => setLoading(false));
    }).catch(() => { setErr(true); setLoading(false); });
  };

  useEffect(() => {
    let cancelled = false;
    setErr(false); setLoading(true);
    const lib = window.pdfjsLib;
    if (!lib || !file) { setErr(true); setLoading(false); return; }
    try {
      if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = window.PDFJS_WORKER_SRC || "";
      }
      lib.getDocument(file).promise.then(pdf => {
        if (cancelled) return;
        pdfRef.current = pdf;
        setPages(pdf.numPages);
        render(Math.min(page, pdf.numPages));
      }).catch(() => { if (!cancelled) { setErr(true); setLoading(false); } });
    } catch (e) { setErr(true); setLoading(false); }
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => { if (pdfRef.current && !err) render(page); }, [page]);

  if (err) {
    return <ViewerPlaceholder title={title} note={`Add “${(file || "").split("/").pop()}” to dataroom/docs/ to enable this quick-view.`} />;
  }
  return (
    <div className="dr-pdf" ref={wrapRef}>
      <div className="dr-pdf-bar">
        <button className="btn btn-ghost btn-icon" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><Icon name="chevron-left" size={14} /></button>
        <span className="t-muted" style={{ fontSize: 12 }}>Page {page} / {pages}</span>
        <button className="btn btn-ghost btn-icon" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}><Icon name="chevron-right" size={14} /></button>
      </div>
      <div className="dr-pdf-canvas-wrap">
        {loading && <div className="dr-pdf-loading">Loading page…</div>}
        <canvas ref={canvasRef} className="dr-pdf-canvas" />
      </div>
    </div>
  );
}

function SheetView({ sheetId }) {
  const s = SHEET_SNIPPETS[sheetId];
  if (!s) return <ViewerPlaceholder title="Sheet" note="Sheet not found." />;
  return (
    <div className="dr-sheet">
      <div className="dr-sheet-title">{s.title}</div>
      <table className="dr-table">
        <thead><tr>{s.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{s.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
      {s.foot && <div className="dr-sheet-foot">{s.foot}</div>}
    </div>
  );
}

function DocView({ snippet }) {
  return (
    <div className="dr-docpaper">
      <div className="dr-docpaper-title">{snippet.title}</div>
      <div className="dr-docpaper-sub">{snippet.sub}</div>
      {snippet.blocks.map((b, i) => (
        <div key={i} className="dr-docpaper-block">
          <div className="dr-docpaper-h">{b.h}</div>
          <div className="dr-docpaper-p">{b.p}</div>
        </div>
      ))}
    </div>
  );
}

function ViewerPlaceholder({ title, note }) {
  return (
    <div className="dr-viewer-placeholder">
      <Icon name="doc" size={32} />
      <div style={{ fontWeight: 600, marginTop: 10 }}>{title}</div>
      <div className="t-muted" style={{ fontSize: 12.5, marginTop: 6, maxWidth: 360, textAlign: "center" }}>{note}</div>
    </div>
  );
}

window.DataRoomDocViewer = DataRoomDocViewer;
