import { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext.jsx";
import { SMAP as SMAP_DEFAULT } from "../examiner/constants/config.js";
import { loadStationsFromSheet, loadAllData } from "../examiner/utils/sheets.js";
import CasePropertyTab from "./tabs/CasePropertyTab.jsx";

const LOAD_STEPS = [
  { label: "Connecting to Google Sheets…", weight: 15 },
  { label: "Loading station list…", weight: 25 },
  { label: "Fetching FIR records…", weight: 25 },
  { label: "Fetching case data…", weight: 20 },
  { label: "Building local index…", weight: 15 },
];

const TABS = [
  {
    id: "case_property",
    label: "Case Property",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9" />
        <path d="M9 22V12h6v10" />
        <path d="M2 10.6L12 2l10 8.6" />
      </svg>
    ),
  },
];

export default function Dashboard() {
  const { tok, requestSheetsToken } = useAuth();

  const [db, setDb] = useState(null);
  const [smap, setSmap] = useState(SMAP_DEFAULT);
  const [activeTab, setActiveTab] = useState("case_property");

  /* loading states */
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [loadPhase, setLoadPhase] = useState("idle"); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState("");

  const loadTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (loadPhase === "done" && loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, [loadPhase]);

  /* Animated progress helper */
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

  /* Load data from sheet */
  useEffect(() => {
    if (loadPhase !== "idle") return;
    
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    
    if (tok) {
      setLoadPhase("loading");
      fetchAll(tok);
      
      loadTimeoutRef.current = setTimeout(() => {
        if (loadPhase === "loading") {
          setErrorMsg("Data loading timeout. Please check your network and try again.");
          setLoadPhase("error");
        }
      }, 45000);
    } else {
      setProgress(0);
      setStepLabel("Requesting Google Sheets access…");
      setLoadPhase("loading");
      
      requestSheetsToken().then((freshTok) => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        
        if (freshTok) {
          setStepLabel("Loading data…");
          fetchAll(freshTok);
          
          loadTimeoutRef.current = setTimeout(() => {
            if (loadPhase === "loading") {
              setErrorMsg("Data loading timeout. Please check your network and try again.");
              setLoadPhase("error");
            }
          }, 45000);
        } else {
          setErrorMsg("Could not obtain Google Sheets access.");
          setLoadPhase("error");
        }
      }).catch((err) => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
        setErrorMsg("Authentication error: " + (err?.message || "Could not obtain access"));
        setLoadPhase("error");
      });
    }
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
      await new Promise(res => setTimeout(res, 120));
    }

    try {
      await advance(0); // Connecting…
      
      const loadedSmap = await (async () => {
        await advance(1); // Loading stations…
        return await loadStationsFromSheet(token);
      })();
      const finalSmap = loadedSmap?.length ? loadedSmap : SMAP_DEFAULT;
      setSmap(finalSmap);

      await advance(2); // Fetching FIR records…
      await advance(3); // Fetching case data…
      const data = await loadAllData(token, finalSmap);

      await advance(4); // Building index…
      await new Promise(res => animateTo(100, res));
      await new Promise(res => setTimeout(res, 300));

      setDb(data);
      setLoadPhase("done");
    } catch (e) {
      console.error("Load error:", e);
      setErrorMsg(e?.message ? `Failed to load data: ${e.message}` : "Failed to load data.");
      setLoadPhase("error");
    }
  }

  function handleRetry() {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setDb(null);
    setErrorMsg("");
    setProgress(0);
    setStepLabel("");
    setLoadPhase("idle");
  }

  if (loadPhase === "loading" || loadPhase === "idle") {
    return <LoadingScreen progress={progress} stepLabel={stepLabel} />;
  }

  if (loadPhase === "error" || !db) {
    return <ErrorScreen msg={errorMsg} onRetry={handleRetry} />;
  }

  return (
    <div className="hc-root">
      <div className="hc-pane">
        {activeTab === "case_property" && <CasePropertyTab db={db} SMAP={smap} />}
      </div>

      {/* Bottom Navigation */}
      <nav className="hc-bottom-nav" aria-label="Head Clerk tabs">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`hc-nav-item${active ? " hc-nav-item--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? "page" : undefined}
            >
              <span className="hc-nav-pill" aria-hidden="true" />
              <span className="hc-nav-icon">{tab.icon}</span>
              <span className="hc-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ── Loading Screen Component ── */
function LoadingScreen({ progress, stepLabel }) {
  return (
    <div className="hc-load-screen">
      <div className="hc-load-card">
        <div className="hc-load-icon-wrap">
          <div className="hc-load-icon-ring" />
          <span className="hc-load-icon-emoji">👨‍💼</span>
        </div>
        <div className="hc-load-title">Head Clerk</div>
        <div className="hc-load-sub">Court Management System</div>
        <div className="hc-prog-wrap">
          <div className="hc-prog-track">
            <div className="hc-prog-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="hc-prog-pct">{progress}%</div>
        </div>
        <div className="hc-load-step-label">{stepLabel || "Initialising…"}</div>
        <div className="hc-load-dots">
          {[0, 1, 2, 3, 4].map(i => {
            const cumWeights = [0, 15, 40, 65, 85, 100];
            const active = progress >= cumWeights[i] && progress < cumWeights[i + 1];
            const done = progress >= cumWeights[i + 1];
            return (
              <div
                key={i}
                className={`hc-load-dot${done ? " hc-load-dot--done" : active ? " hc-load-dot--active" : ""}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Error Screen Component ── */
function ErrorScreen({ msg, onRetry }) {
  return (
    <div className="hc-load-screen">
      <div className="hc-load-card hc-load-card--error">
        <div className="hc-err-icon">⚠️</div>
        <div className="hc-load-title">Load Failed</div>
        <div className="hc-load-sub" style={{ color: "var(--c-red)", marginTop: 4, whiteSpace: "pre-wrap" }}>
          {msg}
        </div>
        <button className="hc-retry-btn" onClick={onRetry}>↺ Retry</button>
      </div>
    </div>
  );
}

/* ── Inject Scoped Styles ── */
const HEADCLERK_CSS = `
  .hc-root {
    display: flex;
    flex-direction: column;
    min-height: calc(100dvh - 60px);
    background: var(--bg);
    padding-bottom: 72px;
    position: relative;
  }
  .hc-pane {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Dual toggles */
  .hc-tab-toggles {
    display: flex;
    gap: 8px;
    background: var(--bg3, rgba(255, 255, 255, 0.03));
    padding: 4px;
    border-radius: 12px;
    border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    width: fit-content;
  }
  .hc-toggle-btn {
    background: transparent;
    border: none;
    color: var(--txt2);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .hc-toggle-btn:hover {
    color: var(--txt);
    background: rgba(255, 255, 255, 0.04);
  }
  .hc-toggle-btn-active {
    background: var(--accent) !important;
    color: #000 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  /* Resolver UI */
  .hc-resolver-section {
    background: var(--card-bg, rgba(255, 255, 255, 0.02));
    border: 1px solid var(--card-bdr, rgba(255, 255, 255, 0.08));
    border-radius: 16px;
    padding: 16px;
    margin-top: 16px;
  }
  .hc-resolver-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--txt);
  }

  /* Loading screen */
  .hc-load-screen {
    position: fixed;
    inset: 0;
    z-index: 800;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: hc-fade-in 0.3s ease;
  }
  @keyframes hc-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .hc-load-card {
    background: var(--card-bg);
    border: 1px solid var(--card-bdr, rgba(255, 255, 255, 0.08));
    border-radius: 28px;
    padding: 40px 36px 36px;
    max-width: 360px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    box-shadow: 0 8px 40px var(--shadow);
    animation: hc-card-in 0.38s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes hc-card-in {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .hc-load-card--error {
    border-color: var(--c-red);
  }
  .hc-load-icon-wrap {
    position: relative;
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }
  .hc-load-icon-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: var(--accent);
    border-right-color: var(--accent);
    animation: hc-ring-spin 1.2s linear infinite;
    opacity: 0.7;
  }
  @keyframes hc-ring-spin {
    to { transform: rotate(360deg); }
  }
  .hc-load-icon-emoji {
    font-size: 32px;
    line-height: 1;
    z-index: 1;
  }
  .hc-load-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--txt);
    letter-spacing: -0.03em;
    margin-top: -4px;
  }
  .hc-load-sub {
    font-size: 12px;
    color: var(--txt2);
    margin-top: -8px;
    text-align: center;
  }
  .hc-prog-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
  }
  .hc-prog-track {
    position: relative;
    width: 100%;
    height: 8px;
    background: var(--bg3, var(--bg2));
    border-radius: 99px;
    overflow: hidden;
  }
  .hc-prog-fill {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    background: linear-gradient(90deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, #fff 30%) 100%);
    border-radius: 99px;
    transition: width 0.08s linear;
    min-width: 8px;
  }
  .hc-prog-pct {
    align-self: flex-end;
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--accent);
    letter-spacing: 0.02em;
  }
  .hc-load-step-label {
    font-size: 12px;
    color: var(--txt2);
    text-align: center;
    min-height: 18px;
    transition: opacity 0.2s;
    letter-spacing: 0.01em;
  }
  .hc-load-dots {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-top: 2px;
  }
  .hc-load-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--border, rgba(255, 255, 255, 0.1));
    transition: background 0.25s, transform 0.25s;
  }
  .hc-load-dot--active {
    background: var(--accent);
    transform: scale(1.4);
  }
  .hc-load-dot--done {
    background: var(--c-green, #3fb950);
  }
  .hc-err-icon {
    font-size: 44px;
    margin-bottom: -4px;
  }
  .hc-retry-btn {
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
  .hc-retry-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  /* Bottom nav bar */
  .hc-bottom-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 900;
    height: 72px;
    background: var(--navbar, var(--bg2));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border, rgba(255, 255, 255, 0.1));
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 4px;
  }
  .hc-nav-item {
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
    color: var(--txt3, var(--txt2));
    transition: color 0.2s ease;
  }
  .hc-nav-pill {
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
  .hc-nav-item--active .hc-nav-pill {
    width: 60px;
    background: var(--accent-bg, rgba(201,168,76,0.12));
  }
  .hc-nav-icon {
    position: relative;
    z-index: 1;
    width: 24px; height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .hc-nav-icon svg { width: 22px; height: 22px; }
  .hc-nav-item--active {
    color: var(--accent);
  }
  .hc-nav-item--active .hc-nav-icon {
    transform: translateY(-2px) scale(1.1);
  }
  .hc-nav-label {
    position: relative;
    z-index: 1;
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.01em;
    line-height: 1;
    white-space: nowrap;
    transition: font-weight 0.15s ease, color 0.2s ease;
  }
  .hc-nav-item--active .hc-nav-label {
    font-weight: 700;
  }
`;

if (typeof document !== "undefined" && !document.getElementById("headclerk-css")) {
  const style = document.createElement("style");
  style.id = "headclerk-css";
  style.textContent = HEADCLERK_CSS;
  document.head.appendChild(style);
}
