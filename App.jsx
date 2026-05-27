// ============================================================
// Othello — App shell + module router + toast stack
// ============================================================

function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}

function AppShell() {
  const { state } = useStore();
  const { module, previewForm, fieldMapSlideoverId } = state;

  // Layout: Clients module shows the 3-pane layout (sidebar + list + file).
  // Other modules: sidebar + full content area.
  const showClientList = module === "clients";

  return (
    <div className={`shell ${showClientList ? "" : "no-list"}`}>
      <Sidebar />
      {showClientList && <ClientList />}
      <div className="content">
        {module === "overview" && <Overview />}
        {module === "clients" && <ClientFile />}
        {module === "library" && <FormsLibrary />}
        {module === "sources" && <Sources />}
        {module === "settings" && <Settings />}
      </div>

      {/* overlays */}
      {previewForm && <FortlakePreview />}
      {fieldMapSlideoverId && <FieldMapSlideover />}

      {/* fixed-position bits */}
      <DemoPanel />
      <ChatPanel />
      <ToastStack />
    </div>
  );
}

// ---------------------------------------------------------------
// Toast stack (bottom-left)
// ---------------------------------------------------------------
function ToastStack() {
  const { state } = useStore();
  const { toasts } = state;
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span className={`dot ${t.kind === "ready" ? "ready" : t.kind === "missing" ? "missing" : t.kind === "attention" ? "attention" : "muted"}`}></span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

window.App = App;

// boot
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
