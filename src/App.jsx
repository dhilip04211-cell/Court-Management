import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { CLIENT_ID, SCOPE } from "./examiner/constants/config.js";

/* ═══════════════════════════════════════════════════════════
   AUTH CONTEXT
   Wraps the entire app. All sections access token via useAuth().
═══════════════════════════════════════════════════════════ */
export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [tok, setTok] = useState(() => {
    try { return localStorage.getItem("goog_tok") || null; } catch { return null; }
  });
  const [tokExpiry, setTokExpiry] = useState(() => {
    try { return Number(localStorage.getItem("goog_tok_exp")) || 0; } catch { return 0; }
  });
  const [showExpireWarn, setShowExpireWarn] = useState(false);
  const refreshTimerRef = useRef(null);
  const warnTimerRef    = useRef(null);

  // Schedule token refresh and expiry warning
  useEffect(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (warnTimerRef.current)    clearTimeout(warnTimerRef.current);
    if (!tokExpiry) return;

    const msLeft  = tokExpiry - Date.now();
    const refresh = msLeft - 5 * 60 * 1000; // refresh 5 min before expiry
    const warn    = msLeft - 5 * 60 * 1000 - 30 * 1000; // warn 5.5 min before

    if (warn > 0) {
      warnTimerRef.current = setTimeout(() => {
        setShowExpireWarn(true);
        setTimeout(() => setShowExpireWarn(false), 8000);
      }, warn);
    }

    if (refresh <= 0) {
      silentRefresh();
      return;
    }
    refreshTimerRef.current = setTimeout(silentRefresh, refresh);
    return () => {
      clearTimeout(refreshTimerRef.current);
      clearTimeout(warnTimerRef.current);
    };
  }, [tokExpiry]);

  function silentRefresh() {
    if (typeof window === "undefined" || !window.google) return;
    try {
      window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        prompt: "",
        callback: (r) => {
          if (r?.access_token) saveToken(r);
        },
      }).requestAccessToken();
    } catch { /* silent */ }
  }

  function saveToken(r) {
    const exp = Date.now() + (r.expires_in || 3600) * 1000;
    try {
      localStorage.setItem("goog_tok", r.access_token);
      localStorage.setItem("goog_tok_exp", String(exp));
    } catch { }
    setTok(r.access_token);
    setTokExpiry(exp);
  }

  function signIn() {
    const doAuth = () => {
      window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (r) => {
          if (r?.access_token) saveToken(r);
        },
      }).requestAccessToken();
    };

    if (!window.google) {
      const sc = document.createElement("script");
      sc.src = "https://accounts.google.com/gsi/client";
      sc.onload = doAuth;
      document.head.appendChild(sc);
    } else {
      doAuth();
    }
  }

  function signOut() {
    clearTimeout(refreshTimerRef.current);
    clearTimeout(warnTimerRef.current);
    try {
      localStorage.removeItem("goog_tok");
      localStorage.removeItem("goog_tok_exp");
    } catch { }
    setTok(null);
    setTokExpiry(0);
    setShowExpireWarn(false);
  }

  return (
    <AuthContext.Provider value={{ tok, tokExpiry, signIn, signOut }}>
      {children}
      {showExpireWarn && (
        <div className="token-snackbar">
          ⏱ Session expiring soon — refreshing…
        </div>
      )}
    </AuthContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTO ROUTES
═══════════════════════════════════════════════════════════ */
const autoPages = import.meta.glob("./**/*.jsx", { eager: true });

function generateAutoRoutes() {
  const used = new Set();
  return Object.entries(autoPages)
    .filter(([p]) => !p.includes("App.jsx") && !p.includes("main.jsx"))
    .map(([path, mod]) => {
      let route = path.replace("./", "/").replace(/\.jsx$/, "").toLowerCase();
      if (route.endsWith("/index")) route = route.replace("/index", "");
      if (used.has(route)) return null;
      used.add(route);
      const Component = mod.default;
      if (!Component) return null;
      return <Route key={route} path={route} element={<Component />} />;
    })
    .filter(Boolean);
}

/* ═══════════════════════════════════════════════════════════
   MENU SECTIONS
═══════════════════════════════════════════════════════════ */
const sections = [
  { title: "Head Clerk",  route: "/headclerk/dashboard", icon: "👨‍💼", accent: "#F59E0B" },
  { title: "MC Section",  route: "/mc/mc",               icon: "⚖️",  accent: "#10B981" },
  { title: "Examiner",    route: "/examiner/examiner",    icon: "📋",  accent: "#3B82F6" },
  { title: "RC Section",  route: "/rc/rc",                icon: "📁",  accent: "#8B5CF6" },
];

/* ═══════════════════════════════════════════════════════════
   NAV LINK
═══════════════════════════════════════════════════════════ */
function NavLink({ to, children, onClick }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link to={to} className={`nav-link${active ? " active" : ""}`} onClick={onClick}>
      {children}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════
   FULL-SCREEN AUTH GATE
═══════════════════════════════════════════════════════════ */
function AuthGate() {
  const { signIn } = useAuth();
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-icon">⚖️</div>
        <div className="auth-badge">Court Management System</div>
        <div className="auth-title">Sign in to continue</div>
        <div className="auth-sub">
          This system requires a Google account authorised for Court Management access.
        </div>
        <button className="auth-btn" onClick={signIn}>
          <svg className="auth-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
        <div className="auth-note">
          Only authorised court personnel can access this system.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOME
═══════════════════════════════════════════════════════════ */
function Home() {
  return (
    <div className="home-wrap">
      <div className="home-header">
        <div className="home-icon-wrap">
          <span className="home-icon">⚖️</span>
        </div>
        <h1 className="home-title">Court Management</h1>
        <p className="home-sub">Court Office Management System</p>
      </div>
      <div className="card-grid">
        {sections.map((item, i) => (
          <Link key={i} to={item.route} className="dashboard-card" style={{ "--card-accent": item.accent }}>
            <div className="card-accent-bar" />
            <div className="card-body">
              <span className="card-icon">{item.icon}</span>
              <h2 className="card-title">{item.title}</h2>
              <span className="card-arrow">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APP SHELL (inside HashRouter, can use useAuth)
═══════════════════════════════════════════════════════════ */
function AppShell({ dark, setDark }) {
  const { tok, signOut } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);

  // Close mobile menu on outside tap
  useEffect(() => {
    if (!mobileMenu) return;
    const handler = (e) => {
      if (!e.target.closest(".mobile-menu") && !e.target.closest(".menu-btn")) {
        setMobileMenu(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [mobileMenu]);

  if (!tok) return <AuthGate />;

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <Link to="/" className="logo" onClick={() => setMobileMenu(false)}>
          <div className="logo-icon">⚖️</div>
          <span className="logo-text">Court <span>Management</span></span>
        </Link>

        <div className="nav-menu">
          {sections.map((item, i) => (
            <NavLink key={i} to={item.route}>
              {item.icon} {item.title}
            </NavLink>
          ))}
        </div>

        <div className="navbar-right">
          <button
            className="theme-btn"
            onClick={() => setDark(!dark)}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <button
            className="signout-btn"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
          >
            ↩
          </button>
          <button
            className="menu-btn"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="mobile-menu">
          {sections.map((item, i) => (
            <NavLink key={i} to={item.route} onClick={() => setMobileMenu(false)}>
              {item.icon} {item.title}
            </NavLink>
          ))}
        </div>
      )}

      {/* PAGE CONTENT */}
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          {generateAutoRoutes()}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("court-theme");
    return saved ? saved === "dark" : true;
  });

  // Apply theme to <html> for CSS variable switching
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("court-theme", dark ? "dark" : "light");
  }, [dark]);

  const t = dark ? themes.dark : themes.light;

  return (
    <AuthProvider>
      <HashRouter>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

          *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

          html, body {
            width: 100%; height: 100%; overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          body {
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: ${t.bg};
            color: ${t.text};
            transition: background 0.3s, color 0.3s;
            line-height: 1.5;
          }

          #root {
            width: 100% !important; max-width: 100% !important;
            margin: 0 !important; text-align: left !important;
            border: none !important; min-height: 100svh;
            display: flex; flex-direction: column;
          }

          h1, h2, h3 {
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 600; margin: 0;
            color: ${t.textStrong}; letter-spacing: -0.02em;
          }

          p { margin: 0; }

          .app {
            display: flex; flex-direction: column;
            min-height: 100dvh; width: 100%;
            background: ${t.bg}; transition: background 0.3s;
          }

          /* ── NAVBAR ── */
          .navbar {
            position: sticky; top: 0; z-index: 1000;
            width: 100%; height: 60px;
            background: ${t.navbar};
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid ${t.border};
            padding: 0 20px;
            display: flex; align-items: center;
            justify-content: space-between; gap: 12px;
            transition: background 0.3s, border-color 0.3s;
            box-shadow: 0 1px 0 ${t.border};
          }

          .logo {
            display: flex; align-items: center; gap: 10px;
            text-decoration: none; flex-shrink: 0; cursor: pointer;
          }

          .logo-icon {
            width: 36px; height: 36px;
            background: ${t.logoIconBg};
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px; flex-shrink: 0;
            box-shadow: 0 2px 8px ${t.logoIconShadow};
          }

          .logo-text {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 17px; font-weight: 700;
            color: ${t.textStrong}; letter-spacing: -0.03em; white-space: nowrap;
          }

          .logo-text span { color: ${t.accent}; }

          .nav-menu {
            display: flex; gap: 4px; align-items: center;
            flex: 1; justify-content: center;
          }

          .nav-link {
            text-decoration: none; color: ${t.navText};
            padding: 8px 14px; border-radius: 10px;
            transition: all 0.2s ease; font-size: 14px; font-weight: 500;
            white-space: nowrap; display: flex; align-items: center;
            gap: 6px; letter-spacing: -0.01em;
          }

          .nav-link:hover { background: ${t.navHoverBg}; color: ${t.accent}; }
          .nav-link.active {
            background: ${t.accentBg}; color: ${t.accent}; font-weight: 600;
          }

          .navbar-right {
            display: flex; align-items: center; gap: 8px; flex-shrink: 0;
          }

          .theme-btn, .signout-btn {
            width: 38px; height: 38px;
            background: ${t.btnBg};
            border: 1px solid ${t.border};
            border-radius: 10px;
            color: ${t.textStrong}; font-size: 18px;
            cursor: pointer; display: flex;
            align-items: center; justify-content: center;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent; flex-shrink: 0;
          }

          .theme-btn:hover, .signout-btn:hover {
            background: ${t.navHoverBg}; border-color: ${t.accent}; transform: scale(1.05);
          }

          .signout-btn { font-size: 16px; }
          .signout-btn:hover { border-color: #F85149; color: #F85149; }

          .menu-btn {
            display: none; width: 38px; height: 38px;
            background: ${t.btnBg}; border: 1px solid ${t.border};
            border-radius: 10px; color: ${t.textStrong}; font-size: 20px;
            cursor: pointer; align-items: center; justify-content: center;
            transition: all 0.2s ease;
            -webkit-tap-highlight-color: transparent; flex-shrink: 0;
          }

          .menu-btn:hover { background: ${t.navHoverBg}; }

          /* ── MOBILE MENU ── */
          .mobile-menu {
            position: fixed; top: 60px; left: 0; right: 0; z-index: 999;
            background: ${t.mobilMenuBg};
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid ${t.border};
            padding: 12px; display: flex; flex-direction: column; gap: 4px;
            box-shadow: 0 8px 32px ${t.shadow};
          }

          .mobile-menu .nav-link {
            color: ${t.text}; padding: 12px 16px; border-radius: 12px;
            background: ${t.mobileItemBg}; font-size: 15px; font-weight: 500;
            border: 1px solid transparent;
          }

          .mobile-menu .nav-link:hover,
          .mobile-menu .nav-link:active {
            background: ${t.accentBg}; color: ${t.accent}; border-color: ${t.accentBorder};
          }

          /* ── CONTENT ── */
          .content {
            flex: 1; padding: 28px 20px; width: 100%;
            max-width: 960px; margin: 0 auto;
          }

          /* ── HOME ── */
          .home-wrap { display: flex; flex-direction: column; gap: 32px; }

          .home-header {
            display: flex; flex-direction: column;
            align-items: flex-start; gap: 8px; padding: 8px 0 4px;
          }

          .home-icon-wrap {
            width: 56px; height: 56px; background: ${t.logoIconBg};
            border-radius: 16px; display: flex; align-items: center;
            justify-content: center; font-size: 28px;
            box-shadow: 0 4px 16px ${t.logoIconShadow}; margin-bottom: 4px;
          }

          .home-title { font-size: clamp(26px, 6vw, 38px); color: ${t.textStrong}; line-height: 1.1; }
          .home-sub { color: ${t.textMuted}; font-size: 15px; font-weight: 400; }

          /* ── CARD GRID ── */
          .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }

          .dashboard-card {
            background: ${t.cardBg}; border: 1px solid ${t.cardBorder};
            border-radius: 16px; text-decoration: none; color: ${t.textStrong};
            transition: all 0.22s ease; cursor: pointer;
            display: flex; flex-direction: column; overflow: hidden;
            position: relative; box-shadow: 0 2px 8px ${t.cardShadow};
          }

          .dashboard-card:hover, .dashboard-card:active {
            transform: translateY(-3px);
            box-shadow: 0 8px 28px ${t.cardShadowHover};
            border-color: var(--card-accent);
          }

          .card-accent-bar { height: 4px; width: 100%; background: var(--card-accent); flex-shrink: 0; }

          .card-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
          .card-icon { font-size: 32px; line-height: 1; }
          .card-title { font-size: 15px; font-weight: 600; color: ${t.textStrong}; line-height: 1.3; letter-spacing: -0.01em; }
          .card-arrow { font-size: 18px; color: ${t.textMuted}; margin-top: auto; transition: transform 0.2s; font-weight: 300; }

          .dashboard-card:hover .card-arrow { transform: translateX(4px); color: var(--card-accent); }

          /* ── RESPONSIVE ── */
          @media (min-width: 640px) {
            .card-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .card-body { padding: 24px; }
            .card-icon { font-size: 38px; }
            .card-title { font-size: 17px; }
          }

          @media (min-width: 900px) { .card-grid { grid-template-columns: repeat(4, 1fr); } }

          @media (max-width: 768px) {
            .nav-menu { display: none; }
            .menu-btn { display: flex; }
            .content { padding: 20px 14px; }
          }

          @media (max-width: 480px) {
            .navbar { padding: 0 12px; }
            .logo-text { font-size: 15px; }
            .content { padding: 16px 12px; }
            .card-grid { gap: 12px; }
            .card-body { padding: 16px; }
            .card-icon { font-size: 28px; }
            .card-title { font-size: 14px; }
            .home-title { font-size: 24px; }
          }

          @media (max-height: 600px) and (orientation: landscape) { .content { padding: 12px; } }

          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${t.scrollbar}; border-radius: 999px; }
        `}</style>

        <AppShell dark={dark} setDark={setDark} />
      </HashRouter>
    </AuthProvider>
  );
}

/* ── THEME TOKENS ── */
const themes = {
  dark: {
    bg:             "#0D1117",
    navbar:         "rgba(13,17,23,0.92)",
    mobilMenuBg:    "rgba(13,17,23,0.97)",
    mobileItemBg:   "rgba(255,255,255,0.04)",
    text:           "#C9D1D9",
    textStrong:     "#F0F6FC",
    textMuted:      "#8B949E",
    navText:        "#C9D1D9",
    navHoverBg:     "rgba(240,246,252,0.08)",
    accent:         "#F0A500",
    accentBg:       "rgba(240,165,0,0.12)",
    accentBorder:   "rgba(240,165,0,0.35)",
    border:         "rgba(240,246,252,0.08)",
    cardBg:         "rgba(22,27,34,0.9)",
    cardBorder:     "rgba(240,246,252,0.07)",
    cardShadow:     "rgba(0,0,0,0.3)",
    cardShadowHover:"rgba(0,0,0,0.5)",
    btnBg:          "rgba(255,255,255,0.06)",
    logoIconBg:     "rgba(240,165,0,0.15)",
    logoIconShadow: "rgba(240,165,0,0.2)",
    shadow:         "rgba(0,0,0,0.5)",
    scrollbar:      "rgba(255,255,255,0.15)",
  },
  light: {
    bg:             "#F6F8FA",
    navbar:         "rgba(255,255,255,0.92)",
    mobilMenuBg:    "rgba(255,255,255,0.97)",
    mobileItemBg:   "rgba(0,0,0,0.03)",
    text:           "#444D56",
    textStrong:     "#0D1117",
    textMuted:      "#6A737D",
    navText:        "#444D56",
    navHoverBg:     "rgba(13,17,23,0.05)",
    accent:         "#D4830A",
    accentBg:       "rgba(212,131,10,0.1)",
    accentBorder:   "rgba(212,131,10,0.35)",
    border:         "#E1E4E8",
    cardBg:         "#FFFFFF",
    cardBorder:     "#E1E4E8",
    cardShadow:     "rgba(0,0,0,0.06)",
    cardShadowHover:"rgba(0,0,0,0.14)",
    btnBg:          "rgba(0,0,0,0.05)",
    logoIconBg:     "rgba(212,131,10,0.1)",
    logoIconShadow: "rgba(212,131,10,0.15)",
    shadow:         "rgba(0,0,0,0.12)",
    scrollbar:      "rgba(0,0,0,0.18)",
  },
};
