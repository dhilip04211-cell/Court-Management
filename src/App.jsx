import React, { useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";

/* AUTO IMPORT */
const autoPages = import.meta.glob(
  "./**/*.jsx",
  { eager: true }
);

/* MENU */
const sections = [
  {
    title: "Head Clerk",
    route: "/headclerk/dashboard",
    icon: "👨‍💼",
    accent: "#F59E0B",
    bg: "linear-gradient(135deg, #78350F 0%, #92400E 100%)",
    desc: "Dashboard & Overview",
  },
  {
    title: "MC Section",
    route: "/mc/mc",
    icon: "⚖️",
    accent: "#34D399",
    bg: "linear-gradient(135deg, #064E3B 0%, #065F46 100%)",
    desc: "Magistrate Court",
  },
  {
    title: "Examiner",
    route: "/examiner/examiner",
    icon: "📋",
    accent: "#60A5FA",
    bg: "linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)",
    desc: "Case Examination",
  },
  {
    title: "RC Section",
    route: "/rc/rc",
    icon: "📁",
    accent: "#C084FC",
    bg: "linear-gradient(135deg, #3B0764 0%, #581C87 100%)",
    desc: "Record & Registry",
  },
];

/* AUTO ROUTES */
function generateAutoRoutes() {
  const usedRoutes = new Set();
  return Object.entries(autoPages)
    .filter(([path]) => !path.includes("App.jsx") && !path.includes("main.jsx"))
    .map(([path, module]) => {
      let routePath = path.replace("./", "/").replace(/\.jsx$/, "").toLowerCase();
      if (routePath.endsWith("/index")) routePath = routePath.replace("/index", "");
      if (usedRoutes.has(routePath)) return null;
      usedRoutes.add(routePath);
      const Component = module.default;
      if (!Component) return null;
      return <Route key={routePath} path={routePath} element={<Component />} />;
    })
    .filter(Boolean);
}

/* HOME */
function Home() {
  return (
    <div className="home-wrap">
      <div className="hero-section">
        <div className="hero-icon">⚖️</div>
        <h1 className="hero-title">Court Management System</h1>
        <p className="hero-subtitle">Select a section below to get started</p>
      </div>

      <div className="section-grid">
        {sections.map((item, i) => (
          <Link key={i} to={item.route} className="section-card" style={{ "--card-accent": item.accent }}>
            <div className="card-bg" style={{ background: item.bg }} />
            <div className="card-content">
              <div className="card-icon-wrap">
                <span className="card-icon">{item.icon}</span>
              </div>
              <div className="card-text">
                <h2 className="card-title">{item.title}</h2>
                <p className="card-desc">{item.desc}</p>
              </div>
              <div className="card-arrow">→</div>
            </div>
            <div className="card-accent-bar" style={{ background: item.accent }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* NAV LINK with active state */
function NavLink({ item, onClick }) {
  const loc = useLocation();
  const isActive = loc.pathname.startsWith(item.route.split("/").slice(0, 2).join("/"));
  return (
    <Link
      to={item.route}
      className={`nav-item ${isActive ? "nav-active" : ""}`}
      onClick={onClick}
      style={{ "--nav-accent": item.accent }}
    >
      <span className="nav-icon">{item.icon}</span>
      <span className="nav-label">{item.title}</span>
    </Link>
  );
}

/* APP */
export default function App() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <HashRouter>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          width: 100%;
          height: 100%;
          overflow-x: hidden;
        }

        /* ── THEME TOKENS ── */
        body[data-theme="dark"] {
          --bg-base:     #0F1117;
          --bg-surface:  #1A1D27;
          --bg-elevated: #222636;
          --bg-overlay:  #2A2F42;
          --border:      rgba(255,255,255,0.10);
          --border-focus:rgba(255,255,255,0.25);
          --text-primary:   #F0F2F8;
          --text-secondary: #A8B0C8;
          --text-muted:     #6070A0;
          --gold:      #F4C842;
          --gold-dim:  rgba(244,200,66,0.15);
          --shadow:    0 4px 24px rgba(0,0,0,0.5);
          --shadow-card: 0 2px 12px rgba(0,0,0,0.4);
          --nav-bg:    rgba(15,17,23,0.97);
        }

        body[data-theme="light"] {
          --bg-base:     #F4F6FC;
          --bg-surface:  #FFFFFF;
          --bg-elevated: #EEF1FA;
          --bg-overlay:  #E4E8F5;
          --border:      rgba(0,0,0,0.10);
          --border-focus:rgba(0,0,0,0.25);
          --text-primary:   #111827;
          --text-secondary: #374151;
          --text-muted:     #6B7280;
          --gold:      #D97706;
          --gold-dim:  rgba(217,119,6,0.12);
          --shadow:    0 4px 24px rgba(0,0,0,0.12);
          --shadow-card: 0 2px 12px rgba(0,0,0,0.08);
          --nav-bg:    rgba(255,255,255,0.97);
        }

        body {
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 15px;
          line-height: 1.6;
          transition: background 0.3s, color 0.3s;
          -webkit-font-smoothing: antialiased;
        }

        a { text-decoration: none; color: inherit; }

        /* ── APP SHELL ── */
        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-height: 100dvh;
        }

        /* ── NAVBAR ── */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: var(--nav-bg);
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 0 20px;
          height: 60px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 0 var(--border);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          text-decoration: none;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: var(--gold-dim);
          border: 1.5px solid var(--gold);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .logo-text {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.3px;
        }

        .logo-text span {
          color: var(--gold);
        }

        /* Desktop nav links */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          justify-content: center;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          white-space: nowrap;
          border: 1.5px solid transparent;
        }

        .nav-item:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
          border-color: var(--border);
        }

        .nav-item.nav-active {
          background: var(--gold-dim);
          color: var(--gold);
          border-color: var(--gold);
        }

        .nav-icon { font-size: 16px; line-height: 1; }
        .nav-label { font-size: 14px; }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-shrink: 0;
        }

        /* Theme toggle */
        .theme-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text-secondary);
          font-size: 17px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }

        .theme-btn:hover {
          border-color: var(--gold);
          color: var(--gold);
          background: var(--gold-dim);
        }

        /* Hamburger */
        .menu-btn {
          display: none;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text-primary);
          font-size: 18px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
        }

        /* ── MOBILE DRAWER ── */
        .mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 1100;
          backdrop-filter: blur(4px);
        }

        .mobile-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: min(320px, 85vw);
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          z-index: 1200;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 32px rgba(0,0,0,0.3);
          overflow-y: auto;
        }

        .mobile-drawer.open {
          transform: translateX(0);
        }

        .mobile-overlay.open { display: block; }

        .drawer-header {
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .drawer-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .drawer-title span { color: var(--gold); }

        .drawer-close {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          color: var(--text-secondary);
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drawer-nav {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .drawer-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s;
          border: 1.5px solid transparent;
          cursor: pointer;
        }

        .drawer-item:hover, .drawer-item.active {
          background: var(--gold-dim);
          color: var(--gold);
          border-color: var(--gold);
        }

        .drawer-item-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          border: 1px solid var(--border);
        }

        .drawer-item-text .di-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          display: block;
        }

        .drawer-item-text .di-desc {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 1px;
          display: block;
        }

        .drawer-footer {
          padding: 16px;
          border-top: 1px solid var(--border);
        }

        .theme-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--bg-elevated);
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .theme-row-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .toggle-pill {
          display: flex;
          background: var(--bg-overlay);
          border-radius: 8px;
          padding: 3px;
          gap: 3px;
          border: 1px solid var(--border);
        }

        .toggle-opt {
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--text-muted);
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }

        .toggle-opt.on {
          background: var(--gold);
          color: #000;
        }

        /* ── CONTENT ── */
        .content {
          flex: 1;
          padding: 24px 20px;
          width: 100%;
        }

        /* ── HOME ── */
        .home-wrap {
          max-width: 900px;
          margin: 0 auto;
        }

        .hero-section {
          text-align: center;
          padding: 40px 20px 36px;
        }

        .hero-icon {
          font-size: 52px;
          margin-bottom: 16px;
          line-height: 1;
        }

        .hero-title {
          font-size: clamp(26px, 5vw, 38px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          margin-bottom: 10px;
        }

        .hero-subtitle {
          font-size: 17px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        /* Section cards */
        .section-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .section-card {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          border: 1.5px solid var(--border);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          display: block;
          box-shadow: var(--shadow-card);
        }

        .section-card:hover {
          transform: translateY(-4px) scale(1.01);
          border-color: var(--card-accent);
          box-shadow: 0 12px 32px rgba(0,0,0,0.25);
        }

        .card-bg {
          position: absolute;
          inset: 0;
          opacity: 0.7;
        }

        .card-content {
          position: relative;
          z-index: 2;
          padding: 22px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .card-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          backdrop-filter: blur(8px);
        }

        .card-icon { font-size: 26px; line-height: 1; }

        .card-text { flex: 1; }

        .card-title {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.2px;
          margin-bottom: 3px;
        }

        .card-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          font-weight: 500;
        }

        .card-arrow {
          font-size: 20px;
          color: rgba(255,255,255,0.6);
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .section-card:hover .card-arrow {
          transform: translateX(4px);
          color: rgba(255,255,255,0.9);
        }

        .card-accent-bar {
          height: 3px;
          width: 100%;
          position: relative;
          z-index: 2;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .nav-links { display: none; }
          .menu-btn { display: flex; }
        }

        @media (max-width: 640px) {
          .navbar { padding: 0 14px; }
          .content { padding: 16px 12px; }
          .section-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .hero-section { padding: 28px 12px 24px; }
          .hero-title { font-size: 24px; }
          .hero-subtitle { font-size: 15px; }
          .card-title { font-size: 17px; }
          .logo-text { display: none; }
        }

        /* ── GLOBAL SHARED STYLES for sub-pages ── */

        /* Typography scale — readable on all screens */
        .page-title {
          font-size: clamp(20px, 4vw, 28px);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.3px;
          margin-bottom: 4px;
        }

        .page-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        /* Cards / surfaces */
        .surface {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: var(--shadow-card);
        }

        .surface-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--gold);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
        }

        /* Form elements — LARGE and readable */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.2px;
        }

        .field-input {
          background: var(--bg-elevated);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          color: var(--text-primary);
          padding: 11px 14px;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          width: 100%;
          transition: border-color 0.15s, background 0.15s;
          -webkit-appearance: none;
          appearance: none;
        }

        .field-input:focus {
          border-color: var(--gold);
          background: var(--bg-surface);
        }

        .field-input::placeholder {
          color: var(--text-muted);
        }

        select.field-input { cursor: pointer; }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
          margin-bottom: 14px;
        }

        /* Buttons — large tap targets */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.18s;
          font-family: inherit;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }

        .btn-primary {
          background: var(--gold);
          color: #000;
          border-color: var(--gold);
        }

        .btn-primary:hover { filter: brightness(1.1); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; 