import React, { useState, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";

/* AUTO IMPORT */
const autoPages = import.meta.glob("./**/*.jsx", { eager: true });

/* MENU SECTIONS */
const sections = [
  { title: "Head Clerk",  route: "/headclerk/dashboard", icon: "👨‍💼", accent: "#F59E0B" },
  { title: "MC Section",  route: "/mc/mc",               icon: "⚖️",  accent: "#10B981" },
  { title: "Examiner",    route: "/examiner/examiner",    icon: "📋",  accent: "#3B82F6" },
  { title: "RC Section",  route: "/rc/rc",                icon: "📁",  accent: "#8B5CF6" },
];

/* AUTO ROUTES */
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

/* NAV LINK with active state */
function NavLink({ to, children, onClick }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link to={to} className={`nav-link${active ? " active" : ""}`} onClick={onClick}>
      {children}
    </Link>
  );
}

/* HOME */
function Home({ dark }) {
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

/* APP */
export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("court-theme");
    return saved ? saved === "dark" : true;
  });
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem("court-theme", dark ? "dark" : "light");
  }, [dark]);

  // Close menu on outside tap
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

  const t = dark ? themes.dark : themes.light;

  return (
    <HashRouter>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

        *, *::before, *::after {
          margin: 0; padding: 0; box-sizing: border-box;
        }

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
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          text-align: left !important;
          border: none !important;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
        }

        h1, h2, h3 {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          margin: 0;
          color: ${t.textStrong};
          letter-spacing: -0.02em;
        }

        p { margin: 0; }

        .app {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          width: 100%;
          background: ${t.bg};
          transition: background 0.3s;
        }

        /* ── NAVBAR ── */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
          height: 60px;
          background: ${t.navbar};
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid ${t.border};
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: background 0.3s, border-color 0.3s;
          box-shadow: 0 1px 0 ${t.border};
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
          cursor: pointer;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: ${t.logoIconBg};
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px ${t.logoIconShadow};
        }

        .logo-text {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: ${t.textStrong};
          letter-spacing: -0.03em;
          white-space: nowrap;
        }

        .logo-text span {
          color: ${t.accent};
        }

        .nav-menu {
          display: flex;
          gap: 4px;
          align-items: center;
          flex: 1;
          justify-content: center;
        }

        .nav-link {
          text-decoration: none;
          color: ${t.navText};
          padding: 8px 14px;
          border-radius: 10px;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          letter-spacing: -0.01em;
        }

        .nav-link:hover {
          background: ${t.navHoverBg};
          color: ${t.accent};
        }

        .nav-link.active {
          background: ${t.accentBg};
          color: ${t.accent};
          font-weight: 600;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .theme-btn {
          width: 38px;
          height: 38px;
          background: ${t.btnBg};
          border: 1px solid ${t.border};
          border-radius: 10px;
          color: ${t.textStrong};
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
        }

        .theme-btn:hover {
          background: ${t.navHoverBg};
          border-color: ${t.accent};
          transform: scale(1.05);
        }

        .menu-btn {
          display: none;
          width: 38px;
          height: 38px;
          background: ${t.btnBg};
          border: 1px solid ${t.border};
          border-radius: 10px;
          color: ${t.textStrong};
          font-size: 20px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
        }

        .menu-btn:hover {
          background: ${t.navHoverBg};
        }

        /* ── MOBILE MENU ── */
        .mobile-menu {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          z-index: 999;
          background: ${t.mobilMenuBg};
          border-bottom: 1px solid ${t.border};
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 8px 32px ${t.shadow};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .mobile-menu .nav-link {
          padding: 13px 16px;
          border-radius: 10px;
          background: ${t.mobileItemBg};
          font-size: 15px;
          color: ${t.textStrong};
          border: 1px solid ${t.border};
        }

        .mobile-menu .nav-link:hover,
        .mobile-menu .nav-link:active {
          background: ${t.accentBg};
          color: ${t.accent};
          border-color: ${t.accentBorder};
        }

        /* ── CONTENT ── */
        .content {
          flex: 1;
          padding: 28px 20px;
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
        }

        /* ── HOME ── */
        .home-wrap {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .home-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 0 4px;
        }

        .home-icon-wrap {
          width: 56px;
          height: 56px;
          background: ${t.logoIconBg};
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          box-shadow: 0 4px 16px ${t.logoIconShadow};
          margin-bottom: 4px;
        }

        .home-title {
          font-size: clamp(26px, 6vw, 38px);
          color: ${t.textStrong};
          line-height: 1.1;
        }

        .home-sub {
          color: ${t.textMuted};
          font-size: 15px;
          font-weight: 400;
        }

        /* ── CARD GRID ── */
        .card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .dashboard-card {
          background: ${t.cardBg};
          border: 1px solid ${t.cardBorder};
          border-radius: 16px;
          text-decoration: none;
          color: ${t.textStrong};
          transition: all 0.22s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          box-shadow: 0 2px 8px ${t.cardShadow};
        }

        .dashboard-card:hover,
        .dashboard-card:active {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px ${t.cardShadowHover};
          border-color: var(--card-accent);
        }

        .card-accent-bar {
          height: 4px;
          width: 100%;
          background: var(--card-accent);
          flex-shrink: 0;
        }

        .card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .card-icon {
          font-size: 32px;
          line-height: 1;
        }

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: ${t.textStrong};
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .card-arrow {
          font-size: 18px;
          color: ${t.textMuted};
          margin-top: auto;
          transition: transform 0.2s;
          font-weight: 300;
        }

        .dashboard-card:hover .card-arrow {
          transform: translateX(4px);
          color: var(--card-accent);
        }

        /* ── TABLET ── */
        @media (min-width: 640px) {
          .card-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .card-body { padding: 24px; }
          .card-icon { font-size: 38px; }
          .card-title { font-size: 17px; }
        }

        @media (min-width: 900px) {
          .card-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* ── MOBILE ── */
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

        /* ── LANDSCAPE ── */
        @media (max-height: 600px) and (orientation: landscape) {
          .content { padding: 12px; }
        }

        /* ── SCROLLBAR ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: ${t.scrollbar};
          border-radius: 999px;
        }
      `}</style>

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
            <Route path="/" element={<Home dark={dark} />} />
            {generateAutoRoutes()}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
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
