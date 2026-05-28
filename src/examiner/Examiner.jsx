import { useState, useEffect } from "react";
import { CLIENT_ID, SCOPE, THEMES, SMAP as SMAP_DEFAULT } from "./constants/config.js";
import { loadStationsFromSheet, loadAllData } from "./utils/sheets.js";
import { getCSS } from "./utils/styles.js";
import { AuthPrompt } from "./components/AuthPrompt.jsx";
import SectionBuilder from "./components/SectionBuilder.jsx";
import NumPad2 from "./components/NumPad2.jsx";
import DateNumPad from "./components/DateNumPad.jsx";
import FIRNumPad from "./components/FIRNumPad.jsx";
import EntryTab from "./tabs/EntryTab.jsx";
import ViewerTab from "./tabs/ViewerTab.jsx";
import FTCTab from "./tabs/FTCTab.jsx";
import AbstractTab from "./tabs/AbstractTab.jsx";

export default function Examiner() {
  const [tok, setTok] = useState(() => {
    try { return localStorage.getItem("goog_tok") || null; } catch { return null; }
  });
  const [tokExpiry, setTokExpiry] = useState(() => {
    try { return Number(localStorage.getItem("goog_tok_exp")) || 0; } catch { return 0; }
  });
  const [db, setDb] = useState(null);
  const [smap, setSmap] = useState(SMAP_DEFAULT); // ← stations state, default from config
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("entry");
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem("fir_theme") || "night"; } catch { return "night"; }
  });

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    let s = document.getElementById("fir-css");
    if (!s) {
      s = document.createElement("style");
      s.id = "fir-css";
      document.head.appendChild(s);
    }
    s.textContent = getCSS(theme.vars);
    if (!document.querySelector('meta[name="viewport"]')) {
      const m = document.createElement("meta");
      m.name = "viewport";
      m.content = "width=device-width, initial-scale=1, maximum-scale=1";
      document.head.appendChild(m);
    }
  }, [themeId]);

  function switchTheme(id) {
    setThemeId(id);
    try { localStorage.setItem("fir_theme", id); } catch { }
  }

  useEffect(() => {
    if (tok && !db && !loading) fetchAll(tok);
  }, [tok]);

  useEffect(() => {
    if (!tokExpiry) return;
    const msLeft = tokExpiry - Date.now() - 5 * 60 * 1000;
    if (msLeft <= 0) { refreshToken(); return; }
    const t = setTimeout(refreshToken, msLeft);
    return () => clearTimeout(t);
  }, [tokExpiry]);

  function refreshToken() {
    if (!window.google) return;
    window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: SCOPE,
      callback: (r) => {
        if (r.access_token) {
          const exp = Date.now() + (r.expires_in || 3600) * 1000;
          try {
            localStorage.setItem("goog_tok", r.access_token);
            localStorage.setItem("goog_tok_exp", String(exp));
          } catch { }
          setTok(r.access_token);
          setTokExpiry(exp);
        }
      },
      prompt: "",
    }).requestAccessToken();
  }

  function signIn() {
    const load = () => {
      window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPE,
        callback: (r) => {
          if (r.access_token) {
            const exp = Date.now() + (r.expires_in || 3600) * 1000;
            try {
              localStorage.setItem("goog_tok", r.access_token);
              localStorage.setItem("goog_tok_exp", String(exp));
            } catch { }
            setTok(r.access_token);
            setTokExpiry(exp);
          }
        },
      }).requestAccessToken();
    };
    if (!window.google) {
      const sc = document.createElement("script");
      sc.src = "https://accounts.google.com/gsi/client";
      sc.onload = load;
      document.head.appendChild(sc);
    } else {
      load();
    }
  }

  function signOut() {
    try {
      localStorage.removeItem("goog_tok");
      localStorage.removeItem("goog_tok_exp");
    } catch { }
    setTok(null); setTokExpiry(0); setDb(null); setError(null);
  }

  async function fetchAll(token) {
    setLoading(true);
    setError(null);
    try {
      // ── Load station names from FIR sheet tabs first ──────────────────
      const loadedSmap = await loadStationsFromSheet(token);
      const finalSmap = (loadedSmap && loadedSmap.length) ? loadedSmap : SMAP_DEFAULT;
      setSmap(finalSmap);

      // ── Load all sheet data using live station list ────────────────────
      const data = await loadAllData(token, finalSmap);
      setDb(data);
    } catch (e) {
      console.error("Load error:", e);
      setError("Failed to load data. Check network / permissions or reload.");
    }
    setLoading(false);
  }

  const tabs = [
    { id: "entry", label: "📝 FIR Entry" },
    { id: "viewer", label: "🔍 Viewer" },
    { id: "ftc", label: "📁 FIR→Case" },
    { id: "abstract", label: "📊 Abstract" },
  ];

  if (!tok) return <AuthPrompt onSignIn={signIn} />;

  return (
    <div className="examiner-app">
      <div className="theme-bar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="theme-lbl">Theme:</span>
          {THEMES.map(t => (
            <div key={t.id} className={`theme-pill ${themeId === t.id ? "act" : ""}`} onClick={() => switchTheme(t.id)}>
              {t.label}
            </div>
          ))}
        </div>
        <div className="auth-area" style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <div className={`dot ${tok ? "on" : ""}`} />
          <span style={{ fontSize: 10, color: "var(--txt3)" }}>{tok ? "Connected" : "Offline"}</span>
          <button className="btn btn-o btn-sm" onClick={signOut}>Sign Out</button>
        </div>
      </div>

      {loading || (!db && !error) ? (
        <div className="spin-wrap">
          <div className="spin"></div> Loading data from Google Sheets...
        </div>
      ) : error ? (
        <div className="msg-err" style={{ margin: "20px auto", maxWidth: "400px", textAlign: "center" }}>
          {error}
        </div>
      ) : (
        <>
          <div className="tabs">
            {tabs.map(t => (
              <div key={t.id} className={`tab ${activeTab === t.id ? "act" : ""}`}
                onClick={() => setActiveTab(t.id)}>{t.label}</div>
            ))}
          </div>

          <div className="pane">
            {activeTab === "entry" && <EntryTab db={db} setDb={setDb} tok={tok} smap={smap} />}
            {activeTab === "viewer" && <ViewerTab db={db} smap={smap} />
            {activeTab === "ftc" && <FTCTab db={db} setDb={setDb} tok={tok} smap={smap} />}
            {activeTab === "abstract" && <AbstractTab db={db} tok={tok} smap={smap} />}
          </div>
        </>
      )}
    </div>
  );
}

export { SectionBuilder, NumPad2, DateNumPad, FIRNumPad, AuthPrompt };