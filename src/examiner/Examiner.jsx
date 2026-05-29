import { useState, useEffect } from "react";
import { useAuth } from "../App.jsx";
import { SMAP as SMAP_DEFAULT } from "./constants/config.js";
import { loadStationsFromSheet, loadAllData } from "./utils/sheets.js";
import SectionBuilder from "./components/SectionBuilder.jsx";
import NumPad2 from "./components/NumPad2.jsx";
import DateNumPad from "./components/DateNumPad.jsx";
import FIRNumPad from "./components/FIRNumPad.jsx";
import EntryTab from "./tabs/EntryTab.jsx";
import ViewerTab from "./tabs/ViewerTab.jsx";
import FTCTab from "./tabs/FTCTab.jsx";
import AbstractTab from "./tabs/AbstractTab.jsx";

/* ═══════════════════════════════════════════════════════════
   TAB CONFIG  — Android Material You bottom nav
═══════════════════════════════════════════════════════════ */
const TABS = [
  {
    id: "entry",
    label: "FIR Entry",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    ),
  },
  {
    id: "viewer",
    label: "Viewer",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: "ftc",
    label: "FIR→Case",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "abstract",
    label: "Abstract",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

/* ═══════════════════════════════════════════════════════════
   EXAMINER
   — Token comes from AuthContext (App-level).
   — No internal theme; CSS variables from index.css.
   — No THEMES array, no getCSS injection.
═══════════════════════════════════════════════════════════ */
export default function Examiner() {
  const { tok } = useAuth();

  const [db, setDb]           = useState(null);
  const [smap, setSmap]       = useState(SMAP_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("entry");

  /* snackbar: { msg, type: "success"|"error"|"info" } */
  const [snack, setSnack] = useState(null);

  /* ── Snackbar helper ─────────────────────────────────── */
  function showSnack(msg, type = "info") {
    setSnack({ msg, type });
    setTimeout(() => setSnack(null), 3500);
  }

  /* ── Load data whenever token arrives ────────────────── */
  useEffect(() => {
    if (tok && !db && !loading) fetchAll(tok);
  }, [tok]);

  async function fetchAll(token) {
    setLoading(true);
    try {
      const loadedSmap = await loadStationsFromSheet(token);
      const finalSmap  = loadedSmap?.length ? loadedSmap : SMAP_DEFAULT;
      setSmap(finalSmap);

      const data = await loadAllData(token, finalSmap);
      setDb(data);
    } catch (e) {
      console.error("Load error:", e);
      showSnack("Failed to load data — check network or permissions.", "error");
    }
    setLoading(false);
  }

  /* ── Reload handler (retry after error) ─────────────── */
  function handleReload() {
    if (!tok) return;
    setDb(null);
    fetchAll(tok);
  }

  /* ── Loading state ───────────────────────────────────── */
  if (loading || (!db && !snack)) {
    return (
      <div className="ex-loading">
        <div className="ex-spinner" />
        <span className="ex-loading-txt">Loading data from Google Sheets…</span>
      </div>
    );
  }

  /* ── Error / empty db (snack shown, db still null) ───── */
  if (!db) {
    return (
      <>
        <div className="ex-error-state">
          <div className="ex-error-icon">⚠️</div>
          <p className="ex-error-msg">Could not load sheet data.</p>
          <button className="ex-retry-btn" onClick={handleReload}>Retry</button>
        </div>
        {snack && <Snackbar msg={snack.msg} type={snack.type} />}
      </>
    );
  }

  /* ── Main UI ─────────────────────────────────────────── */
  return (
    <div className="ex-root">

      {/* ── TAB PANE ── */}
      <div className="ex-pane">
        {activeTab === "entry"    && <EntryTab    db={db} setDb={setDb} tok={tok} smap={smap} />}
        {activeTab === "viewer"   && <ViewerTab   db={db} smap={smap} />}
        {activeTab === "ftc"      && <FTCTab      db={db} setDb={setDb} tok={tok} smap={smap} />}
        {activeTab === "abstract" && <AbstractTab db={db} tok={tok} smap={smap} />}
      </div>

      {/* ── ANDROID MATERIAL YOU BOTTOM NAV ── */}
      <nav className="ex-bottom-nav" aria-label="Examiner tabs">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`ex-nav-item${active ? " ex-nav-item--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? "page" : undefined}
            >
              <span className="ex-nav-indicator" aria-hidden="true" />
              <span className="ex-nav-icon">{tab.icon}</span>
              <span className="ex-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── SNACKBAR ── */}
      {snack && <Snackbar msg={snack.msg} type={snack.type} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SNACKBAR
═══════════════════════════════════════════════════════════ */
function Snackbar({ msg, type }) {
  return (
    <div className={`ex-snack ex-snack--${type}`} role="status" aria-live="polite">
      <span className="ex-snack-dot" aria-hidden="true" />
      {msg}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXAMINER SCOPED STYLES
   All --et-*, --vt-*, --gold, --c-* vars already live in
   index.css (both dark and light). No injection needed.
═══════════════════════════════════════════════════════════ */
const EXAMINER_CSS = `
  /* ── Root layout ── */
  .ex-root {
    display: flex;
    flex-direction: column;
    min-height: calc(100dvh - 60px);   /* subtract App navbar */
    background: var(--bg);
    padding-bottom: 72px;              /* space for bottom nav */
    position: relative;
  }

  .ex-pane {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* ── Loading ── */
  .ex-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    min-height: 280px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .ex-spinner {
    width: 36px; height: 36px;
    border: 3px solid var(--bdr);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: ex-spin 0.75s linear infinite;
  }

  @keyframes ex-spin { to { transform: rotate(360deg); } }

  .ex-loading-txt { color: var(--txt3); font-size: 13px; }

  /* ── Error state ── */
  .ex-error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 280px;
    text-align: center;
    padding: 32px 24px;
  }

  .ex-error-icon { font-size: 40px; }

  .ex-error-msg {
    color: var(--txt2);
    font-size: 14px;
    max-width: 280px;
    line-height: 1.5;
  }

  .ex-retry-btn {
    background: var(--gold-dim);
    border: 1px solid var(--gold-border);
    color: var(--gold);
    font-size: 13px;
    font-weight: 600;
    padding: 8px 24px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .ex-retry-btn:hover {
    background: var(--gold);
    color: #000;
  }

  /* ─────────────────────────────────────────────────────────
     ANDROID MATERIAL YOU BOTTOM NAV
     Android 12+ style: pill indicator, icon centred inside it,
     label below, active = filled pill at icon width.
  ───────────────────────────────────────────────────────── */
  .ex-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 900;
    height: 72px;
    background: var(--navbar);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 8px;
    /* keep nav below App's navbar (z=1000) */
  }

  .ex-nav-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex: 1;
    height: 100%;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
    outline: none;
    color: var(--txt3);
    transition: color 0.2s ease;
  }

  /* pill behind icon */
  .ex-nav-indicator {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 32px;
    border-radius: 16px;
    background: transparent;
    transition: width 0.25s cubic-bezier(0.4,0,0.2,1),
                background 0.25s ease;
    z-index: 0;
  }

  .ex-nav-item--active .ex-nav-indicator {
    width: 64px;
    background: var(--accent-bg);
  }

  .ex-nav-icon {
    position: relative;
    z-index: 1;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  .ex-nav-icon svg {
    width: 22px;
    height: 22px;
  }

  .ex-nav-item--active {
    color: var(--accent);
  }

  .ex-nav-item--active .ex-nav-icon {
    transform: translateY(-1px);
  }

  .ex-nav-label {
    position: relative;
    z-index: 1;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.01em;
    line-height: 1;
    white-space: nowrap;
    transition: font-weight 0.15s ease;
  }

  .ex-nav-item--active .ex-nav-label {
    font-weight: 700;
  }

  /* ─────────────────────────────────────────────────────────
     SNACKBAR
  ───────────────────────────────────────────────────────── */
  .ex-snack {
    position: fixed;
    bottom: 84px;        /* above bottom nav */
    left: 50%;
    transform: translateX(-50%);
    z-index: 9000;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    max-width: calc(100vw - 32px);
    pointer-events: none;
    animation: ex-snack-in 0.28s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 4px 20px var(--shadow);
  }

  @keyframes ex-snack-in {
    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  .ex-snack--success {
    background: var(--c-green-dim);
    border: 1px solid var(--c-green);
    color: var(--c-green);
  }

  .ex-snack--error {
    background: var(--c-red-dim);
    border: 1px solid var(--c-red);
    color: var(--c-red);
  }

  .ex-snack--info {
    background: var(--c-blue-dim);
    border: 1px solid var(--c-blue);
    color: var(--c-blue);
  }

  .ex-snack-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
`;

/* Inject scoped styles once at module load */
if (typeof document !== "undefined" && !document.getElementById("examiner-css")) {
  const s = document.createElement("style");
  s.id = "examiner-css";
  s.textContent = EXAMINER_CSS;
  document.head.appendChild(s);
}

/* Named re-exports so other files that import these from Examiner still work */
export { SectionBuilder, NumPad2, DateNumPad, FIRNumPad };
