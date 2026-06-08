// ============================================================
// Othello — store: state + scripted event engine
// ============================================================
//
// One reducer drives everything. The demo control panel dispatches
// scripted EVENTS — each event is a sequence of phases that emit
// processing-state messages, then mutate fields/forms/activity.
//
// `enqueueEvent(eventKey, opts)` runs the script asynchronously.
// Components subscribe via the `useStore()` hook.
//
// All state lives in `state.world` (mutable copy of seed clients +
// derived bits).

const { useState, useEffect, useReducer, useRef, useCallback, useMemo, createContext, useContext } = React;

// ---------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------
function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

// Data Room module — standalone slice. Pre-baked, self-contained.
function initialDataRoom() {
  return {
    kbDocs: deepClone(KB_DOCS),
    kbFreeform: deepClone(KB_FREEFORM),
    dataRooms: deepClone(DATAROOMS_SEED),
    activeDdId: null,    // id of the open DD container (null = list view)
    creating: false,     // inline "New due diligence" form open
    chubbSynced: false,  // flag-A remediation synced the Chubb cert to the KB
    dd: null,            // working state for the open DD container
    docViewer: null,     // { docId, page?, sheet? } reference quick-view
  };
}

// Build a DD working-state object. `complete` seeds a finished read-only DD.
// Per-item review state lives in `flags` (keyed by item id) for the items
// that carry a flag / input request.
function makeDdState({ id, name, requester, complete = false }) {
  const flags = {};
  for (const it of DD_REVIEW_ITEMS) {
    flags[it.id] = {
      resolved: complete,
      validated: complete,
      auditNote: complete && it.flagInfo.suggestedNote ? it.flagInfo.suggestedNote : "",
    };
  }
  return {
    id, name, requester,
    phase: complete ? "finalised" : "extracting",  // extracting | requirements | generating | review | finalised
    selectedItemId: null,
    flags,
  };
}

const initialState = () => ({
  module: "overview",          // "overview" | "clients" | "library" | "sources" | "settings" | "knowledge_base" | "datarooms"
  selectedClientId: null,
  clientListFilter: "needs",   // "in_progress" | "needs" | "done"
  clientListQuery: "",
  navCollapsed: false,
  chatOpen: false,
  chatMessages: [],            // { role: "user"|"bot", text, source? }
  chatThinking: false,
  toasts: [],                  // { id, text, kind?: "info"|"ready"|"missing"|"attention" }
  proc: null,                  // { clientId, message, steps: [{label, state}], queued: number }
  procQueue: [],               // queued events to run after current finishes
  speed: 1.0,                  // multiplier (1.0 = as written, 2.0 = fast)
  clients: deepClone(SEED_CLIENTS),
  compliance: deepClone(COMPLIANCE_SEED),
  overviewMetrics: deepClone(OVERVIEW_METRICS),
  formsLibrary: deepClone(FORMS),
  previewForm: null,           // { clientId, formId } when populated-form preview open
  resolveOpen: null,           // { clientId } when resolve-flagged-items slideover open
  fieldMapSlideoverId: null,   // forms-library slide-over
  fieldsFlash: {},             // {clientId: {fieldKey: timestamp}} for cross-fade animation
  formsFlash: {},              // {clientId: {formId: timestamp}}
  storyStep: 0,                // index in autoplay
  autoplay: false,
  dataRoom: initialDataRoom(),
});

// ---------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------
function reducer(state, action) {
  switch (action.type) {
    case "SET_MODULE":
      return { ...state, module: action.module };
    case "SELECT_CLIENT":
      return { ...state, module: "clients", selectedClientId: action.id, clientListFilter: state.clientListFilter };
    case "SET_FILTER":
      return { ...state, clientListFilter: action.filter };
    case "ADD_CLIENT": {
      // Idempotent — refuses to duplicate
      if (state.clients.some(c => c.id === action.client.id)) return state;
      return { ...state, clients: [action.client, ...state.clients] };
    }
    case "SET_QUERY":
      return { ...state, clientListQuery: action.query };
    case "TOGGLE_NAV":
      return { ...state, navCollapsed: !state.navCollapsed };
    case "TOGGLE_CHAT":
      return { ...state, chatOpen: !state.chatOpen };
    case "SET_CHAT_OPEN":
      return { ...state, chatOpen: action.open };
    case "ADD_CHAT_MSG":
      return { ...state, chatMessages: [...state.chatMessages, action.msg] };
    case "CLEAR_CHAT":
      return { ...state, chatMessages: [] };
    case "SET_CHAT_THINKING":
      return { ...state, chatThinking: action.thinking };

    case "ADD_TOAST": {
      const id = action.id || Math.random().toString(36).slice(2);
      const toast = { id, text: action.text, kind: action.kind || "info" };
      return { ...state, toasts: [...state.toasts, toast] };
    }
    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };

    case "SET_PROC":
      return { ...state, proc: action.proc };
    case "ENQUEUE_PROC":
      return { ...state, procQueue: [...state.procQueue, action.event] };
    case "POP_PROC_QUEUE":
      return { ...state, procQueue: state.procQueue.slice(1) };
    case "SET_PROC_STEP":
      if (!state.proc) return state;
      return { ...state, proc: { ...state.proc, message: action.message, steps: action.steps || state.proc.steps } };

    case "SET_SPEED":
      return { ...state, speed: action.speed };

    case "UPDATE_CLIENT_FIELDS": {
      const { clientId, updates } = action;
      const clients = state.clients.map(c => {
        if (c.id !== clientId) return c;
        const fields = { ...c.fields };
        for (const k of Object.keys(updates)) {
          fields[k] = { ...fields[k], ...updates[k] };
        }
        return { ...c, fields };
      });
      // flash these fields
      const flash = { ...(state.fieldsFlash[clientId] || {}) };
      const now = Date.now();
      for (const k of Object.keys(updates)) flash[k] = now;
      return { ...state, clients, fieldsFlash: { ...state.fieldsFlash, [clientId]: flash } };
    }

    case "UPDATE_FORM_STATUS": {
      const { clientId, formId, status, note } = action;
      const clients = state.clients.map(c => {
        if (c.id !== clientId) return c;
        const forms = c.forms.map(f => f.formId === formId ? { ...f, status, note: note ?? f.note } : f);
        return { ...c, forms };
      });
      const flash = { ...(state.formsFlash[clientId] || {}) };
      flash[formId] = Date.now();
      return { ...state, clients, formsFlash: { ...state.formsFlash, [clientId]: flash } };
    }

    case "ADD_FORM_TO_CLIENT": {
      const { clientId, formId, status: addStatus } = action;
      const formDef = FORMS[formId];
      const clients = state.clients.map(c => {
        if (c.id !== clientId) return c;
        if (c.forms.some(f => f.formId === formId)) return c;

        // Auto-initialize any required fields the client doesn't yet have, so
        // adding a form with new requirements actually updates the checklist.
        const required = formDef ? Array.from(new Set(formDef.sections.flatMap(s => s.fields))) : [];
        const fields = { ...c.fields };
        for (const k of required) {
          if (!fields[k]) fields[k] = { value: "—", status: "missing", source: "—" };
        }

        return { ...c, fields, forms: [...c.forms, { formId, status: addStatus || "awaiting" }] };
      });
      return { ...state, clients };
    }

    case "REMOVE_FORM_FROM_CLIENT": {
      const { clientId, formId } = action;
      const clients = state.clients.map(c => {
        if (c.id !== clientId) return c;
        return { ...c, forms: c.forms.filter(f => f.formId !== formId) };
      });
      return { ...state, clients };
    }

    case "ADD_DOCUMENT": {
      const { clientId, doc } = action;
      const clients = state.clients.map(c => {
        if (c.id !== clientId) return c;
        return { ...c, documents: [doc, ...c.documents] };
      });
      return { ...state, clients };
    }

    case "ADD_ACTIVITY": {
      const { clientId, entry } = action;
      const clients = state.clients.map(c => {
        if (c.id !== clientId) return c;
        return { ...c, activity: [{ ...entry, time: entry.time || "just now" }, ...c.activity] };
      });
      return { ...state, clients };
    }

    case "SET_CLIENT_STATUS": {
      const { clientId, status, lastActivity } = action;
      const clients = state.clients.map(c => c.id === clientId
        ? { ...c, status: status ?? c.status, lastActivity: lastActivity ?? c.lastActivity }
        : c);
      return { ...state, clients };
    }

    case "SET_CLIENT_ONBOARDING_TO": {
      const { clientId, onboardingTo } = action;
      const clients = state.clients.map(c => c.id === clientId ? { ...c, onboardingTo: { ...(c.onboardingTo || {}), ...onboardingTo } } : c);
      return { ...state, clients };
    }

    case "OPEN_RESOLVE":
      return { ...state, resolveOpen: { clientId: action.clientId } };
    case "CLOSE_RESOLVE":
      return { ...state, resolveOpen: null };

    case "OPEN_PREVIEW":
      return { ...state, previewForm: { clientId: action.clientId, formId: action.formId } };
    case "CLOSE_PREVIEW":
      return { ...state, previewForm: null };

    case "OPEN_FIELD_MAP":
      return { ...state, fieldMapSlideoverId: action.formId };
    case "CLOSE_FIELD_MAP":
      return { ...state, fieldMapSlideoverId: null };
    case "CONFIRM_LIBRARY_FIELD": {
      const formsLibrary = { ...state.formsLibrary };
      // bump confirmed count; if reached total, flip to live
      const f = { ...formsLibrary[action.formId] };
      f.confirmedCount = Math.min((f.confirmedCount || 0) + 1, f.totalCount || 9);
      if (f.confirmedCount >= (f.totalCount || 0)) {
        f.status = "live";
      }
      formsLibrary[action.formId] = f;
      return { ...state, formsLibrary };
    }

    case "REMOVE_COMPLIANCE": {
      return { ...state, compliance: state.compliance.filter(c => c.clientId !== action.clientId) };
    }
    case "ADD_COMPLIANCE": {
      return { ...state, compliance: [...state.compliance.filter(c => c.clientId !== action.row.clientId), action.row] };
    }

    // ---------------- Data Room module ----------------
    case "DR_SET_CREATING":
      return { ...state, dataRoom: { ...state.dataRoom, creating: action.creating } };

    case "DR_CREATE_DD": {
      const { listEntry } = action;
      const dataRooms = [listEntry, ...state.dataRoom.dataRooms.filter(d => d.id !== listEntry.id)];
      const dd = makeDdState({ id: listEntry.id, name: listEntry.name, requester: listEntry.requester });
      return { ...state, dataRoom: { ...state.dataRoom, dataRooms, activeDdId: listEntry.id, creating: false, dd } };
    }

    case "DR_OPEN_DD": {
      const entry = state.dataRoom.dataRooms.find(d => d.id === action.id);
      // Re-opening the live DD keeps its working state; a seeded complete
      // entry opens read-only fully finished.
      let dd = state.dataRoom.dd;
      if (!dd || dd.id !== action.id) {
        dd = makeDdState({ id: action.id, name: entry?.name, requester: entry?.requester, complete: entry?.status === "complete" });
      }
      return { ...state, dataRoom: { ...state.dataRoom, activeDdId: action.id, dd } };
    }

    case "DR_CLOSE_DD":
      return { ...state, dataRoom: { ...state.dataRoom, activeDdId: null } };

    case "DR_SET_PHASE":
      return { ...state, dataRoom: { ...state.dataRoom, dd: { ...state.dataRoom.dd, phase: action.phase } } };

    case "DR_SELECT_ITEM":
      return { ...state, dataRoom: { ...state.dataRoom, dd: { ...state.dataRoom.dd, selectedItemId: action.itemId } } };

    case "DR_RESOLVE_INFO": {
      const dd = state.dataRoom.dd;
      const cur = dd.flags[action.itemId] || {};
      const flags = { ...dd.flags, [action.itemId]: { ...cur, resolved: true } };
      let kbDocs = state.dataRoom.kbDocs;
      let chubbSynced = state.dataRoom.chubbSynced;
      if (action.sync && action.kbDoc) {
        if (!kbDocs.some(d => d.id === action.kbDoc.id)) kbDocs = [deepClone(action.kbDoc), ...kbDocs];
        if (action.kbDoc.id === "chubb_combined") chubbSynced = true;
      }
      return { ...state, dataRoom: { ...state.dataRoom, kbDocs, chubbSynced, dd: { ...dd, flags } } };
    }

    case "DR_VALIDATE": {
      const dd = state.dataRoom.dd;
      const cur = dd.flags[action.itemId] || {};
      const flags = { ...dd.flags, [action.itemId]: { ...cur, validated: true, auditNote: action.auditNote } };
      return { ...state, dataRoom: { ...state.dataRoom, dd: { ...dd, flags } } };
    }

    case "DR_FINALISE": {
      const dd = state.dataRoom.dd;
      const dataRooms = state.dataRoom.dataRooms.map(d =>
        d.id === dd.id ? { ...d, status: "complete", done: DD_ITEM_COUNT, items: DD_ITEM_COUNT } : d);
      return { ...state, dataRoom: { ...state.dataRoom, dataRooms, dd: { ...dd, phase: "finalised", selectedItemId: null } } };
    }

    case "DR_KB_ADD": {
      let kbDocs = state.dataRoom.kbDocs;
      if (!kbDocs.some(d => d.id === action.doc.id)) kbDocs = [deepClone(action.doc), ...kbDocs];
      return { ...state, dataRoom: { ...state.dataRoom, kbDocs } };
    }

    case "DR_OPEN_DOC":
      return { ...state, dataRoom: { ...state.dataRoom, docViewer: { docId: action.docId, page: action.page, sheet: action.sheet } } };
    case "DR_CLOSE_DOC":
      return { ...state, dataRoom: { ...state.dataRoom, docViewer: null } };

    case "RESET": return initialState();

    default: return state;
  }
}

// ---------------------------------------------------------------
// Store hook (context + dispatch + scripted events)
// ---------------------------------------------------------------
const StoreCtx = createContext(null);

function StoreProvider({ children }) {
  const [state, dispatchRaw] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatch = useCallback((a) => dispatchRaw(a), []);

  const toast = useCallback((text, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: "ADD_TOAST", id, text, kind });
    setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), 5000);
  }, [dispatch]);

  const wait = useCallback((ms) => new Promise(r => setTimeout(r, ms / (stateRef.current.speed || 1))), []);

  // ------------ scripted events ------------
  const running = useRef(false);

  const setProc = useCallback((clientId, message, steps) => {
    dispatch({ type: "SET_PROC", proc: { clientId, message, steps: steps || [] } });
  }, [dispatch]);

  const runEvent = useCallback(async (eventKey, opts = {}) => {
    if (running.current) {
      // queue it
      dispatch({ type: "ENQUEUE_PROC", event: { eventKey, opts } });
      toast(`Queued: ${eventKey}`, "info");
      return;
    }
    running.current = true;
    try {
      const handler = SCRIPTS[eventKey];
      if (!handler) {
        toast(`Unknown event: ${eventKey}`, "missing");
      } else {
        await handler({ dispatch, toast, wait, state: () => stateRef.current, setProc }, opts);
      }
    } finally {
      dispatch({ type: "SET_PROC", proc: null });
      running.current = false;
      // pop next from queue
      const q = stateRef.current.procQueue;
      if (q.length > 0) {
        const next = q[0];
        dispatch({ type: "POP_PROC_QUEUE" });
        setTimeout(() => runEvent(next.eventKey, next.opts), 200);
      }
    }
  }, [dispatch, toast, wait, setProc]);

  const ctxValue = useMemo(() => ({ state, dispatch, toast, runEvent }), [state, dispatch, toast, runEvent]);
  return <StoreCtx.Provider value={ctxValue}>{children}</StoreCtx.Provider>;
}

function useStore() { return useContext(StoreCtx); }

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function getClient(state, id) { return state.clients.find(c => c.id === id); }

// Field statuses that count as "the form has this field" (passes derivation).
// "verified" = clean. "stale" = expiring-soon but still valid; surfaces an
// attention action but does not un-complete the form (only "expired" does).
const READY_STATUSES = new Set(["verified", "stale"]);

// The union of required field keys across a client's confirmed (non-proposed) forms.
// This is THE source of truth for what data this client owes.
function clientRequiredFields(client) {
  return Array.from(new Set(
    (client?.forms || [])
      .filter(cf => cf.status !== "proposed")
      .flatMap(cf => requiredFieldsFor(cf.formId))
  ));
}

function countReadiness(client) {
  const req = clientRequiredFields(client);
  let ready = 0;
  for (const k of req) {
    const f = client?.fields?.[k];
    if (f && READY_STATUSES.has(f.status)) ready++;
  }
  return { ready, total: req.length };
}

// ---------------------------------------------------------------
// Selectors — single source of truth for derived state
// ---------------------------------------------------------------

// Required fields for a specific form
function requiredFieldsFor(formId) {
  const form = FORMS[formId];
  if (!form) return [];
  return Array.from(new Set(form.sections.flatMap(s => s.fields)));
}

// Effective status of a client's form.
//   Terminal states (dispatched / confirmed / blocked) are preserved verbatim.
//   Otherwise it's DERIVED from field state:
//     - "ready"    iff every required field is verified
//     - "awaiting" otherwise
function deriveFormStatus(client, formId) {
  const cf = client.forms?.find(f => f.formId === formId);
  if (!cf) return null;
  if (["dispatched", "confirmed", "blocked", "proposed"].includes(cf.status)) return cf.status;
  const required = requiredFieldsFor(formId);
  const allReady = required.every(k => READY_STATUSES.has(client.fields?.[k]?.status));
  return allReady ? "ready" : "awaiting";
}

// Missing/problem fields for a given client across the forms they hold.
// Proposed forms don't yet contribute — the operator hasn't accepted them.
function getProblemFields(client) {
  const required = Array.from(new Set(
    (client.forms || [])
      .filter(cf => cf.status !== "proposed")
      .flatMap(cf => requiredFieldsFor(cf.formId))
  ));
  return required
    .map(k => ({ key: k, def: FIELD_DEFS[k], field: client.fields?.[k] }))
    .filter(({ field }) => field && !READY_STATUSES.has(field.status));
}

window.useStore = useStore;
window.StoreProvider = StoreProvider;
window.getClient = getClient;
window.countReadiness = countReadiness;
window.clientRequiredFields = clientRequiredFields;
window.deriveFormStatus = deriveFormStatus;
window.requiredFieldsFor = requiredFieldsFor;
window.getProblemFields = getProblemFields;
