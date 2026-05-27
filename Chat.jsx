// ============================================================
// Othello — Floating chat (scripted chips + LLM fallback)
// ============================================================

function ChatPanel() {
  const { state, dispatch } = useStore();
  const { chatOpen, chatMessages, chatThinking, selectedClientId, clients } = state;
  const client = clients.find(c => c.id === selectedClientId);
  const inputRef = useRef(null);
  const bodyRef = useRef(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [chatMessages, chatThinking]);

  // when chat opens, focus input
  useEffect(() => {
    if (chatOpen && inputRef.current) inputRef.current.focus();
  }, [chatOpen]);

  if (!chatOpen) {
    return (
      <button className="chat-launcher" onClick={() => dispatch({ type: "TOGGLE_CHAT" })} title="Ask about the open client">
        <Icon name="chat" size={20} />
      </button>
    );
  }

  const headerTitle = client ? `Ask about — ${client.name}` : "Ask Othello";
  const headerSub = client ? "Scoped to this client's file and documents" : "Open a client to scope the conversation";

  const send = async (text) => {
    if (!text.trim() || chatThinking) return;
    dispatch({ type: "ADD_CHAT_MSG", msg: { role: "user", text } });
    setInput("");

    // determine if scripted (only for hero client)
    const lower = text.trim().toLowerCase().replace(/[?.,!]+$/g, "");
    const scriptedSet = client?.id === "smith" ? CHAT_SCRIPTED.smith : null;
    const scripted = scriptedSet
      ? Object.entries(scriptedSet).find(([k]) => k.toLowerCase() === lower || lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower))
      : null;

    dispatch({ type: "SET_CHAT_THINKING", thinking: true });

    // Always show the thinking states for verisimilitude
    const stages = ["Searching this client's file…", "Reading 3 documents…", "Composing answer…"];
    for (let i = 0; i < stages.length; i++) {
      dispatch({ type: "SET_CHAT_THINKING", thinking: stages[i] });
      await new Promise(r => setTimeout(r, [600, 1200, 800][i] / (state.speed || 1)));
    }

    if (scripted) {
      dispatch({ type: "ADD_CHAT_MSG", msg: { role: "bot", text: scripted[1].answer, source: scripted[1].source } });
      dispatch({ type: "SET_CHAT_THINKING", thinking: false });
      return;
    }

    // LLM fallback via window.claude.complete
    if (typeof window.claude?.complete === "function") {
      try {
        const ctx = buildClientContextString(client);
        const prompt = `You are Othello, an AI assistant for a wealth-management firm. Answer the operator's question about the open client using ONLY the information below. Keep the answer to 2-4 short sentences. End with a separate "Source:" line citing the document or system in the data below. If the data doesn't contain the answer, say so plainly.

CLIENT DATA:
${ctx}

QUESTION: ${text}

ANSWER:`;
        const reply = await window.claude.complete(prompt);
        const sourceMatch = reply.match(/Source:\s*([^\n]+)/i);
        let answer = reply.replace(/Source:[^\n]*/i, "").trim();
        const source = sourceMatch ? sourceMatch[1].trim() : null;
        dispatch({ type: "ADD_CHAT_MSG", msg: { role: "bot", text: answer, source } });
      } catch (e) {
        dispatch({ type: "ADD_CHAT_MSG", msg: { role: "bot", text: "I couldn't reach my reasoning engine just now. Try a suggested question, or ask again in a moment." } });
      }
    } else {
      dispatch({ type: "ADD_CHAT_MSG", msg: { role: "bot", text: "I'd need access to the client vault to answer that one. The suggested questions below are pre-scripted for this demo." } });
    }
    dispatch({ type: "SET_CHAT_THINKING", thinking: false });
  };

  const suggestions = client?.id === "smith"
    ? Object.keys(CHAT_SCRIPTED.smith).slice(0, 4).map(s => s[0].toUpperCase() + s.slice(1))
    : CHAT_SUGGESTIONS_DEFAULT;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <div className="chat-header-title">{headerTitle}</div>
          <div className="chat-header-sub">{headerSub}</div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={() => dispatch({ type: "TOGGLE_CHAT" })}><Icon name="x" /></button>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {chatMessages.length === 0 && (
          <div className="chat-msg-bot">
            {client
              ? `Hi — I can answer questions about ${client.name} using their file and uploaded documents. Try one of the suggestions below.`
              : "I'm scoped to whichever client you have open. Open a client and I'll ground my answers in their file."}
          </div>
        )}
        {chatMessages.map((m, i) => (
          m.role === "user" ? (
            <div key={i} className="chat-msg-user">{m.text}</div>
          ) : (
            <div key={i} className="chat-msg-bot">
              {m.text}
              {m.source && <div className="source">from {m.source}</div>}
            </div>
          )
        ))}
        {chatThinking && (
          <div className="chat-thinking">
            <span className="dots"><span></span><span></span><span></span></span>
            <span>{typeof chatThinking === "string" ? chatThinking : "Thinking…"}</span>
          </div>
        )}
      </div>

      {chatMessages.length < 2 && (
        <div className="chat-chips">
          {suggestions.map((s, i) => (
            <button key={i} className="chat-chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="chat-input-wrap">
        <input
          ref={inputRef}
          className="chat-input"
          placeholder={client ? "Ask about this client…" : "Ask Othello…"}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send(input); }}
        />
        <div className="chat-disclaimer">AI-generated from this client's records · verify against source documents.</div>
      </div>
    </div>
  );
}

function buildClientContextString(client) {
  if (!client) return "No client open.";
  const lines = [];
  lines.push(`Name: ${client.name}`);
  lines.push(`Entity: ${client.entityType}`);
  if (client.adviser) lines.push(`Adviser: ${client.adviser}`);
  if (client.onboardingTo) {
    const o = client.onboardingTo;
    lines.push(`Onboarding to: ${o.product} (${o.productType}) via ${o.route}, amount ${o.amount}, support: ${o.support}`);
  }
  if (client.members?.length) lines.push(`Members: ${client.members.join("; ")}`);
  if (client.fields && Object.keys(client.fields).length > 0) {
    lines.push("FIELDS:");
    for (const [k, v] of Object.entries(client.fields)) {
      lines.push(`  ${FIELD_DEFS[k]?.label || k}: ${v.value} [${v.status}; source: ${v.source}]`);
    }
  }
  if (client.documents?.length) {
    lines.push("DOCUMENTS:");
    for (const d of client.documents) {
      lines.push(`  ${d.name} (${d.type}) from ${d.source}, ${d.added}${d.expiry ? `, expires ${d.expiry.date} (${d.expiry.daysAway}d)` : ""}`);
    }
  }
  if (client.activity?.length) {
    lines.push("RECENT ACTIVITY:");
    for (const a of client.activity.slice(0, 5)) {
      lines.push(`  [${a.time}] ${a.actor}: ${a.desc}`);
    }
  }
  return lines.join("\n");
}

window.ChatPanel = ChatPanel;
