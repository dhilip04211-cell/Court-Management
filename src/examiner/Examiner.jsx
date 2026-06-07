import { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext.jsx";
import { SMAP as SMAP_DEFAULT } from "./constants/config.js";
import { loadStationsFromSheet, loadAllData } from "./utils/sheets.js";
import SectionBuilder from "./components/SectionBuilder.jsx";
import EntryTab from "./tabs/EntryTab.jsx";
import ViewerTab from "./tabs/ViewerTab.jsx";
import FTCTab from "./tabs/FTCTab.jsx";
import AbstractTab from "./tabs/AbstractTab.jsx";

/* ═══════════════════════════════════════════════════════════
   LOAD STEPS — drives the progress bar
   Each step has a label shown during loading and a weight
   (out of 100) representing how much of the bar it fills.
═══════════════════════════════════════════════════════════ */
const LOAD_STEPS = [
  { label: "Connecting to Google Sheets…", weight: 15 },
  { label: "Loading station list…", weight: 25 },
  { label: "Fetching FIR records…", weight: 25 },
  { label: "Fetching case data…", weight: 20 },
  { label: "Building local index…", weight: 15 },
];

/* ═══════════════════════════════════════════════════════════
   TABS — Android Material You bottom nav
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
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

/* ═══════════════════════════════════════════════════════════
   EXAMINER
═══════════════════════════════════════════════════════════ */
export default function Examiner() {
  const { tok, requestSheetsToken } = useAuth();

  const [db, setDb] = useState(null);
  const [smap, setSmap] = useState(SMAP_DEFAULT);
  const [activeTab, setActiveTab] = useState("entry");

  /* progress: 0-100, stepLabel: current step text */
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [loadPhase, setLoadPhase] = useState("idle"); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState("");

  /* snackbar */
  const [snack, setSnack] = useState(null);
  const snackTimer = useRef(null);

  /* Safety timeout to prevent infinite loading */
  const loadTimeoutRef = useRef(null);

  /* Cleanup timeout when loading completes or on unmount */
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (snackTimer.current) {
        clearTimeout(snackTimer.current);
      }
    };
  }, []);

  /* Clear timeout when data loading completes */
  useEffect(() => {
    if (loadPhase === "done" && loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, [loadPhase]);

  function showSnack(msg, type = "info") {
    if (snackTimer.current) clearTimeout(snackTimer.current);
    setSnack({ msg, type });
    snackTimer.current = setTimeout(() => setSnack(null), 3500);
  }

  /* ── Animated progress helpers ─────────────────────────── */
  /* Smoothly advance the bar to a target value */
  const progRef = useRef(0);
  const animRef = useRef(null);

  function animateTo(target, onDone) {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const step = () => {
      progRef.current = Math.min(progRef.current + 0.8, target);
      setProgress(Math.round(progRef.current));
      if (progRef.current < target) {
        animRef.current = requestAnimationFrame(step);
      } else {
        if (onDone) onDone();
      }
    };
    animRef.current = requestAnimationFrame(step);
  }

  /* ── Load data ──────────────────────────────────────────── */
  useEffect(() => {
    if (loadPhase !== "idle") return;
    
    /* Clear any existing timeout */
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    
    if (tok) {
      // Token already available — fetch directly
      console.log("Token available, loading data...");
      setLoadPhase("loading");
      fetchAll(tok);
      
      /* Safety timeout: if loading takes too long, show error */
      loadTimeoutRef.current = setTimeout(() => {
        if (loadPhase === "loading") {
          setErrorMsg("Data loading timeout. Please check your network and try again.");
          setLoadPhase("error");
        }
      }, 45000); // 45 second timeout
    } else {
      // Token missing — request it with proper fallbacks
      console.log("No token available, requesting...");
      setProgress(0);
      setStepLabel("Requesting Google Sheets access…");
      setLoadPhase("loading");
      
      requestSheetsToken().then((freshTok) => {
        /* Clear timeout if token was obtained */
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        
        if (freshTok) {
          console.log("Token received, loading data...");
          setStepLabel("Loading data…");
          fetchAll(freshTok);
          
          /* Set timeout for data fetch */
          loadTimeoutRef.current = setTimeout(() => {
            if (loadPhase === "loading") {
              setErrorMsg("Data loading timeout. Please check your network and try again.");
              setLoadPhase("error");
            }
          }, 45000);
        } else {
          // Token request failed or returned null
          console.warn("Token request returned null");
          setErrorMsg(
            "Could not obtain Google Sheets access.\n\n" +
            "This may be because:\n" +
            "• You denied the permission request\n" +
            "• Your internet connection is down\n" +
            "• The Google service is temporarily unavailable\n\n" +
            "Please click 'Retry' to try again, or sign out and sign back in."
          );
          setLoadPhase("error");
        }
      }).catch((err) => {
        /* Clear timeout on error */
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        console.error("Token request error:", err);
        setErrorMsg(
          "Authentication error: " + (err?.message || "Could not obtain Google Sheets access") +
          "\n\nPlease refresh the page and try again."
        );
        setLoadPhase("error");
      });
    }
    
    /* Cleanup timeout on unmount or phase change */
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [tok, loadPhase]);

  async function fetchAll(token) {
    progRef.current = 0;
    setProgress(0);
    setLoadPhase("loading");

    let cumulative = 0;

    async function advance(stepIdx) {
      const s = LOAD_STEPS[stepIdx];
      setStepLabel(s.label);
      cumulative += s.weight;
      await new Promise(res => animateTo(cumulative, res));
      /* small pause so user can read the label */
      await new Promise(res => setTimeout(res, 120));
    }

    try {
      await advance(0); // Connecting…
      const loadedSmap = await (async () => {
        await advance(1); // Loading stations…
        return loadStationsFromSheet(token);
      })();
      const finalSmap = loadedSmap?.length ? loadedSmap : SMAP_DEFAULT;
      setSmap(finalSmap);

      await advance(2); // Fetching FIR records…
      await advance(3); // Fetching case data…
      const data = await loadAllData(token, finalSmap);

      await advance(4); // Building index…

      /* finish bar to 100 */
      await new Promise(res => animateTo(100, res));
      await new Promise(res => setTimeout(res, 300));

      setDb(data);
      setLoadPhase("done");
    } catch (e) {
      console.error("Load error:", e);
      setErrorMsg(
        e?.message
          ? `Failed to load data: ${e.message}`
          : "Failed to load data — check network or permissions."
      );
      setLoadPhase("error");
    }
  }

  function handleRetry() {
    /* Clear any pending timeouts */
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    
    setDb(null);
    setErrorMsg("");
    setProgress(0);
    setStepLabel("");
    
    /* Reset to "idle" last — this is what re-triggers the useEffect */
    setLoadPhase("idle");
  }

  /* ── LOADING SCREEN ─────────────────────────────────────── */
  if (loadPhase === "loading" || loadPhase === "idle") {
    return <LoadingScreen progress={progress} stepLabel={stepLabel} />;
  }

  /* ── ERROR SCREEN ───────────────────────────────────────── */
  if (loadPhase === "error" || !db) {
    return <ErrorScreen msg={errorMsg} onRetry={handleRetry} />;
  }

  /* ── MAIN UI ────────────────────────────────────────────── */
  return (
    <div className="ex-root">
      <div className="ex-pane">
        {activeTab === "entry" && <EntryTab db={db} setDb={setDb} tok={tok} smap={smap} />}
        {activeTab === "viewer" && <ViewerTab db={db} smap={smap} />}
        {activeTab === "ftc" && <FTCTab db={db} setDb={setDb} tok={tok} smap={smap} />}
        {activeTab === "abstract" && <AbstractTab db={db} tok={tok} smap={smap} />}
      </div>

      {/* Android Material You bottom nav */}
      <nav className="ex-bottom-nav" aria-label="Examiner tabs">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`ex-nav-item${active ? " ex-nav-item--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? "page" : undefined}
            >
              <span className="ex-nav-pill" aria-hidden="true" />
              <span className="ex-nav-icon">{tab.icon}</span>
              <span className="ex-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {snack && <Snackbar msg={snack.msg} type={snack.type} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOADING SCREEN — Material You card with animated progress
═══════════════════════════════════════════════════════════ */
function LoadingScreen({ progress, stepLabel }) {
  return (
    <div className="ex-load-screen">
      <div className="ex-load-card">

        {/* Icon */}
        <div className="ex-load-icon-wrap">
          <div className="ex-load-icon-ring" />
          <span className="ex-load-icon-emoji">📋</span>
        </div>

        <div className="ex-load-title">Examiner</div>
        <div className="ex-load-sub">Court Management System</div>

        {/* Progress bar */}
        <div className="ex-prog-wrap">
          <div className="ex-prog-track">
            <div
              className="ex-prog-fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="ex-prog-glow"
              style={{ left: `${Math.max(progress - 6, 0)}%` }}
            />
          </div>
          <div className="ex-prog-pct">{progress}%</div>
        </div>

        {/* Step label */}
        <div className="ex-load-step-label">
          {stepLabel || "Initialising…"}
        </div>

        {/* Step dots */}
        <div className="ex-load-dots">
          {[0, 1, 2, 3, 4].map(i => {
            const cumWeights = [0, 15, 40, 65, 85, 100];
            const active = progress >= cumWeights[i] && progress < cumWeights[i + 1];
            const done = progress >= cumWeights[i + 1];
            return (
              <div
                key={i}
                className={`ex-load-dot${done ? " ex-load-dot--done" : active ? " ex-load-dot--active" : ""}`}
              />
            );
          })}
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ERROR SCREEN
═══════════════════════════════════════════════════════════ */
function ErrorScreen({ msg, onRetry }) {
  const lines = msg?.split('\n') || [];
  return (
    <div className="ex-load-screen">
      <div className="ex-load-card ex-load-card--error">
        <div className="ex-err-icon">⚠️</div>
        <div className="ex-load-title">Load Failed</div>
        <div className="ex-load-sub" style={{ color: "var(--c-red)", marginTop: 4, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {lines.map((line, i) => (
            <div key={i}>{line || ' '}</div>
          ))}
        </div>
        <button className="ex-retry-btn" onClick={onRetry}>↺ Retry</button>
      </div>
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
   SCOPED STYLES — injected once, uses CSS vars from index.css
═══════════════════════════════════════════════════════════ */
const EXAMINER_CSS = `
  /* ── Root ── */
  .ex-root {
    display: flex;
    flex-direction: column;
    min-height: calc(100dvh - 60px);
    background: var(--bg);
    padding-bottom: 72px;
    position: relative;
  }
  .ex-pane {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* ══════════════════════════════════════════════════════
     LOADING SCREEN
  ══════════════════════════════════════════════════════ */
  .ex-load-screen {
    position: fixed;
    inset: 0;
    z-index: 800;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: ex-fade-in 0.3s ease;
  }
  @keyframes ex-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .ex-load-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 28px;
    padding: 40px 36px 36px;
    max-width: 360px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    box-shadow: 0 8px 40px var(--shadow);
    animation: ex-card-in 0.38s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes ex-card-in {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ex-load-card--error {
    border-color: var(--c-red);
  }

  /* Icon */
  .ex-load-icon-wrap {
    position: relative;
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }
  .ex-load-icon-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: var(--accent);
    border-right-color: var(--accent);
    animation: ex-ring-spin 1.2s linear infinite;
    opacity: 0.7;
  }
  @keyframes ex-ring-spin {
    to { transform: rotate(360deg); }
  }
  .ex-load-icon-emoji {
    font-size: 32px;
    line-height: 1;
    z-index: 1;
  }

  .ex-load-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--text-strong);
    letter-spacing: -0.03em;
    margin-top: -4px;
  }
  .ex-load-sub {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: -8px;
    text-align: center;
  }

  /* Progress bar */
  .ex-prog-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
  }
  .ex-prog-track {
    position: relative;
    width: 100%;
    height: 8px;
    background: var(--bg3, var(--btn-bg));
    border-radius: 99px;
    overflow: hidden;
  }
  .ex-prog-fill {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    background: linear-gradient(90deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, #fff 30%) 100%);
    border-radius: 99px;
    transition: width 0.08s linear;
    min-width: 8px;
  }
  .ex-prog-glow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0.35;
    filter: blur(8px);
    transition: left 0.08s linear;
    pointer-events: none;
  }
  .ex-prog-pct {
    align-self: flex-end;
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--accent);
    letter-spacing: 0.02em;
  }

  /* Step label */
  .ex-load-step-label {
    font-size: 12px;
    color: var(--text-muted);
    text-align: center;
    min-height: 18px;
    transition: opacity 0.2s;
    letter-spacing: 0.01em;
  }

  /* Step dots */
  .ex-load-dots {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-top: 2px;
  }
  .ex-load-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--border);
    transition: background 0.25s, transform 0.25s;
  }
  .ex-load-dot--active {
    background: var(--accent);
    transform: scale(1.4);
  }
  .ex-load-dot--done {
    background: var(--c-green);
  }

  /* Error icon */
  .ex-err-icon {
    font-size: 44px;
    margin-bottom: -4px;
  }
  .ex-retry-btn {
    margin-top: 8px;
    background: var(--accent);
    border: none;
    color: #000;
    font-size: 14px;
    font-weight: 700;
    padding: 12px 32px;
    border-radius: 99px;
    cursor: pointer;
    transition: all 0.18s ease;
    letter-spacing: 0.01em;
  }
  .ex-retry-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
  .ex-retry-btn:active {
    transform: translateY(0);
    filter: brightness(0.95);
  }

  /* ══════════════════════════════════════════════════════
     ANDROID MATERIAL YOU BOTTOM NAV
  ══════════════════════════════════════════════════════ */
  .ex-bottom-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 900;
    height: 72px;
    background: var(--navbar);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 4px;
  }

  .ex-nav-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
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

  .ex-nav-pill {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 32px;
    border-radius: 16px;
    background: transparent;
    transition:
      width 0.3s cubic-bezier(0.4,0,0.2,1),
      background 0.3s ease;
    z-index: 0;
  }
  .ex-nav-item--active .ex-nav-pill {
    width: 60px;
    background: var(--accent-bg);
  }

  .ex-nav-icon {
    position: relative;
    z-index: 1;
    width: 24px; height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .ex-nav-icon svg { width: 22px; height: 22px; }

  .ex-nav-item--active {
    color: var(--accent);
  }
  .ex-nav-item--active .ex-nav-icon {
    transform: translateY(-2px) scale(1.1);
  }

  .ex-nav-label {
    position: relative;
    z-index: 1;
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.01em;
    line-height: 1;
    white-space: nowrap;
    transition: font-weight 0.15s ease, color 0.2s ease;
  }
  .ex-nav-item--active .ex-nav-label {
    font-weight: 700;
  }

  /* ══════════════════════════════════════════════════════
     SNACKBAR
  ══════════════════════════════════════════════════════ */
  .ex-snack {
    position: fixed;
    bottom: 84px;
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
  .ex-snack--success { background: var(--c-green-dim); border: 1px solid var(--c-green); color: var(--c-green); }
  .ex-snack--error   { background: var(--c-red-dim);   border: 1px solid var(--c-red);   color: var(--c-red);   }
  .ex-snack--info    { background: var(--c-blue-dim);  border: 1px solid var(--c-blue);  color: var(--c-blue);  }
  .ex-snack-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
`;

/* Inject once */
if (typeof document !== "undefined" && !document.getElementById("examiner-css")) {
  const s = document.createElement("style");
  s.id = "examiner-css";
  s.textContent = EXAMINER_CSS;
  document.head.appendChild(s);
}

export { SectionBuilder };