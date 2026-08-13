// ============================================================
// Othello — password gate (client-side access screen)
// ============================================================

const OTHELLO_PASSWORD = "Jupiter";
const OTHELLO_AUTH_KEY = "othello_authed";

function PasswordGate({ children }) {
  const [authed, setAuthed] = React.useState(
    () => sessionStorage.getItem(OTHELLO_AUTH_KEY) === "1"
  );
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState(false);

  if (authed) return children;

  function handleSubmit(e) {
    e.preventDefault();
    if (value === OTHELLO_PASSWORD) {
      sessionStorage.setItem(OTHELLO_AUTH_KEY, "1");
      setAuthed(true);
    } else {
      setError(true);
      setValue("");
    }
  }

  return (
    <div className="pw-gate">
      <form className="pw-gate-card" onSubmit={handleSubmit}>
        <div className="pw-gate-title">Othello</div>
        <div className="pw-gate-sub">Enter the password to continue</div>
        <input
          className={`pw-gate-input ${error ? "pw-gate-input-error" : ""}`}
          type="password"
          autoFocus
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          placeholder="Password"
        />
        {error && <div className="pw-gate-error">Incorrect password</div>}
        <button className="pw-gate-btn" type="submit">Enter</button>
      </form>
    </div>
  );
}

window.PasswordGate = PasswordGate;
