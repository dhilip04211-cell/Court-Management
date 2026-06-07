import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import LoginPage from "./LoginPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

/* ─── AUTO IMPORT ─── */
const autoPages = import.meta.glob("./**/*.jsx", { eager: true });

/* ─── MENU CONFIG ─── */
const sections = [
  { title: "Head Clerk", route: "/headclerk/dashboard", icon: "👨‍💼", color: "#D4AF37" },
  { title: "MC Section", route: "/mc/mc",               icon: "⚖️",  color: "#4CAF50" },
  { title: "Examiner",   route: "/examiner/examiner",    icon: "📋",  color: "#2196F3" },
  { title: "RC Section", route: "/rc/rc",                icon: "📁",  color: "#9C27B0" },
];

const SKIP_FILES = ["App.jsx","main.jsx","AuthContext.jsx","LoginPage.jsx","ProtectedRoute.jsx"];

/* ─── THEME CONTEXT ─── */
const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("court_theme");
    if (saved === "night") return "dark";
    if (saved === "day") return "light";
    return saved || "dark";
  });
  const toggleTheme = () =>
    setTheme(t => { const n = t === "dark" ? "light" : "dark"; localStorage.setItem("court_theme", n); return n; });
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

/* ─── AUTO ROUTES ─── */
function generateAutoRoutes() {
  const usedRoutes = new Set();
  return Object.entries(autoPages)
    .filter(([path]) => !SKIP_FILES.some(f => path.includes(f)))
    .map(([path, module]) => {
      let routePath = path.replace("./","/").replace(/\.jsx$/,"").toLowerCase();
      if (routePath.endsWith("/index")) routePath = routePath.replace("/index","");
      if (usedRoutes.has(routePath)) return null;
      usedRoutes.add(routePath);
      const Component = module.default;
      if (!Component) return null;
      return (
        <Route key={routePath} path={routePath}
          element={<ProtectedRoute><Component /></ProtectedRoute>} />
      );
    }).filter(Boolean);
}

/* ─── HOME ─── */
function Home() {
  const { theme } = useTheme();
  const d = theme === "dark";
  return (
    <>
      <div className="hero">
        <h1 style={{ color: d ? "#f1f5f9" : "#1a1a18" }}>⚖️ Court Management</h1>
        <p style={{ color: d ? "#94a3b8" : "#6b7280" }}>Court Office Management Dashboard</p>
      </div>
      <div className="card-grid">
        {sections.map((item, i) => (
          <Link key={i} to={item.route} className="dashboard-card" data-theme={theme}>
            <div className="card-icon" style={{ color: item.color }}>{item.icon}</div>
            <h2>{item.title}</h2>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ─── THEME TOGGLE BUTTON ─── */
function ThemeToggle({ mobile = false }) {
  const { theme, toggleTheme } = useTheme();
  const d = theme === "dark";
  return (
    <button
      className={mobile ? "theme-toggle-mobile" : "theme-toggle"}
      onClick={toggleTheme}
      title={d ? "Switch to Day Mode" : "Switch to Night Mode"}
    >
      <span className="theme-icon">{d ? "☀️" : "🌙"}</span>
      <span className="theme-label">{d ? "Day" : "Night"}</span>
    </button>
  );
}

/* ─── NAVBAR ─── */
function Navbar({ mobileMenu, setMobileMenu }) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const d = theme === "dark";

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <>
      <nav className="navbar" data-theme={theme}>
        <Link to="/" className="logo" data-theme={theme}>⚖️ Court CMS</Link>

        <div className="nav-menu">
          {sections.map((item, i) => (
            <Link key={i} to={item.route} className="nav-link" data-theme={theme}>
              {item.icon} {item.title}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          <ThemeToggle />

          {user && (
            <>
              {user.picture
                ? <img src={user.picture} alt="" className="user-avatar" />
                : <span className="user-badge" data-theme={theme}>{user.icon} {user.label}</span>
              }
              <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
            </>
          )}
          <button className="menu-btn" data-theme={theme}
            onClick={() => setMobileMenu(p => !p)} aria-label="Toggle menu">
            {mobileMenu ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {mobileMenu && (
        <div className="mobile-menu" data-theme={theme}>
          {sections.map((item, i) => (
            <Link key={i} to={item.route} onClick={() => setMobileMenu(false)}>
              {item.icon} {item.title}
            </Link>
          ))}
          <ThemeToggle mobile />
          {user && (
            <button className="mobile-logout"
              onClick={() => { setMobileMenu(false); handleLogout(); }}>
              🚪 Sign Out ({user.label})
            </button>
          )}
        </div>
      )}
    </>
  );
}

/* ─── SHELL ─── */
function Shell({ children }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const { theme } = useTheme();
  return (
    <div className="app" data-theme={theme}>
      <Navbar mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} />
      <div className="content">{children}</div>
    </div>
  );
}

/* ─── INNER APP ─── */
function InnerApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Shell><Home /></Shell></ProtectedRoute>} />
      {generateAutoRoutes().map(route =>
        React.cloneElement(route, { element: <Shell>{route.props.element}</Shell> })
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ─── ROOT APP ─── */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <GlobalStyles />
          <InnerApp />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

/* ─── GLOBAL STYLES ─── */
function GlobalStyles() {
  return (
    <style>{`
      *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #root { width: 100%; height: 100%; overflow-x: hidden; }

      /* ── THEME VARS ── */
      :root {
        --bg:        #0d1117;
        --bg2:       #161b22;
        --nav-bg:    rgba(13,17,23,0.97);
        --border:    rgba(201,168,76,0.15);
        --txt:       #e6edf3;
        --txt2:      #94a3b8;
        --gold:      #C9A84C;
        --gold-dim:  rgba(201,168,76,0.12);
        --card-bg:   rgba(255,255,255,0.04);
        --card-bdr:  rgba(255,255,255,0.08);
        --menu-bg:   rgba(13,17,23,0.98);
        --menu-item: rgba(255,255,255,0.05);
      }

      /* Day overrides */
      [data-theme="light"] {
        --bg:        #f0f2f5;
        --bg2:       #ffffff;
        --nav-bg:    rgba(255,255,255,0.97);
        --border:    rgba(139,105,20,0.2);
        --txt:       #1a1a18;
        --txt2:      #6b7280;
        --gold:      #8B6914;
        --gold-dim:  rgba(139,105,20,0.1);
        --card-bg:   rgba(0,0,0,0.025);
        --card-bdr:  rgba(0,0,0,0.08);
        --menu-bg:   rgba(255,255,255,0.98);
        --menu-item: rgba(0,0,0,0.04);
      }

      body {
        background: var(--bg);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: var(--txt);
        line-height: 1.5;
        transition: background 0.3s ease, color 0.3s ease;
      }

      /* ── APP SHELL ── */
      .app {
        display: flex; flex-direction: column;
        width: 100%; min-height: 100vh; min-height: 100dvh;
        background: var(--bg);
        transition: background 0.3s ease;
      }

      /* ── NAVBAR ── */
      .navbar {
        position: sticky; top: 0; z-index: 1000; width: 100%;
        background: var(--nav-bg);
        backdrop-filter: blur(14px);
        border-bottom: 1px solid var(--border);
        padding: 10px 16px;
        display: flex; align-items: center; gap: 12px; flex-shrink: 0;
        transition: background 0.3s ease, border-color 0.3s ease;
      }

      .logo {
        font-size: clamp(17px, 4vw, 22px); font-weight: 800;
        color: var(--gold); white-space: nowrap; flex-shrink: 0;
        letter-spacing: 0.05em; font-family: Georgia, serif;
        text-decoration: none; transition: color 0.3s;
      }

      .nav-menu { display: flex; gap: clamp(2px, 1.5vw, 10px); flex-wrap: wrap; flex: 1; }

      .nav-link {
        text-decoration: none; color: var(--txt2);
        padding: 6px 10px; border-radius: 8px;
        transition: all 0.2s ease;
        font-size: clamp(12px, 1.8vw, 13px); white-space: nowrap;
      }
      .nav-link:hover { background: var(--gold-dim); color: var(--gold); }

      .nav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

      /* ── THEME TOGGLE ── */
      .theme-toggle {
        display: flex; align-items: center; gap: 5px;
        background: var(--gold-dim);
        border: 1px solid var(--border);
        color: var(--gold); border-radius: 50px;
        padding: 6px 13px; cursor: pointer;
        font-size: 13px; font-weight: 600;
        transition: all 0.25s ease; white-space: nowrap;
      }
      .theme-toggle:hover { filter: brightness(1.15); transform: scale(1.03); }
      .theme-toggle .theme-icon { font-size: 15px; line-height: 1; }

      .theme-toggle-mobile {
        display: flex; align-items: center; gap: 8px;
        background: var(--gold-dim); border: 1px solid var(--border);
        color: var(--gold); padding: 11px 14px; border-radius: 8px;
        cursor: pointer; font-size: 14px; font-weight: 600; width: 100%;
        transition: all 0.2s;
      }
      .theme-toggle-mobile .theme-icon { font-size: 17px; }

      /* ── USER ── */
      .user-avatar {
        width: 32px; height: 32px; border-radius: 50%;
        border: 2px solid var(--gold);
        object-fit: cover; flex-shrink: 0;
      }
      .user-badge {
        font-size: 12px; color: var(--gold);
        background: var(--gold-dim); border: 1px solid var(--border);
        padding: 5px 10px; border-radius: 20px; white-space: nowrap;
      }

      .logout-btn {
        background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
        color: #fca5a5; padding: 6px 12px; border-radius: 8px;
        cursor: pointer; font-size: 13px; transition: all 0.2s; white-space: nowrap;
      }
      .logout-btn:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.5); }

      .menu-btn {
        display: none; background: var(--bg2); border: 1px solid var(--border);
        color: var(--txt); font-size: 24px; cursor: pointer;
        padding: 8px; flex-shrink: 0; width: 44px; height: 44px;
        border-radius: 12px; transition: background 0.2s, transform 0.2s;
        -webkit-tap-highlight-color: transparent;
      }
      .menu-btn:hover { background: var(--gold-dim); transform: translateY(-1px); }
      .menu-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }

      /* ── MOBILE MENU ── */
      .mobile-menu {
        display: flex; flex-direction: column; gap: 6px; padding: 10px;
        background: var(--menu-bg);
        border-bottom: 1px solid var(--border); width: 100%;
        transition: background 0.3s;
        animation: slideDown 0.2s ease;
      }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }

      .mobile-menu a {
        color: var(--txt); text-decoration: none; padding: 11px 14px;
        border-radius: 8px; background: var(--menu-item);
        transition: all 0.2s ease; border-left: 3px solid transparent; font-size: 14px;
      }
      .mobile-menu a:active, .mobile-menu a:hover {
        background: var(--gold-dim); border-left-color: var(--gold); color: var(--gold);
      }
      .mobile-logout {
        background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
        color: #fca5a5; padding: 11px 14px; border-radius: 8px;
        cursor: pointer; font-size: 14px; text-align: left; transition: all 0.2s; margin-top: 2px;
      }
      .mobile-logout:hover { background: rgba(239,68,68,0.15); }

      /* ── CONTENT ── */
      .content {
        flex: 1; padding: clamp(16px, 4vw, 32px); width: 100%;
        overflow-y: auto; -webkit-overflow-scrolling: touch;
      }

      /* ── HOME ── */
      .hero { margin-bottom: clamp(20px, 4vw, 32px); }
      .hero h1 {
        font-size: clamp(26px, 6vw, 40px); font-weight: 700;
        margin-bottom: 8px; font-family: Georgia, serif;
        transition: color 0.3s;
      }
      .hero p { font-size: clamp(13px, 3vw, 16px); transition: color 0.3s; }

      .card-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: clamp(14px, 3vw, 22px); max-width: 100%;
      }

      .dashboard-card {
        background: var(--card-bg); border: 1px solid var(--card-bdr);
        border-radius: 16px; padding: clamp(20px, 4vw, 28px);
        text-decoration: none; color: var(--txt);
        transition: all 0.3s ease; cursor: pointer;
        display: flex; flex-direction: column; min-height: 180px;
      }
      .dashboard-card:hover {
        transform: translateY(-4px); background: var(--gold-dim);
        border-color: var(--gold); box-shadow: 0 8px 32px rgba(201,168,76,0.1);
      }
      .card-icon { font-size: clamp(32px, 6vw, 44px); margin-bottom: 12px; line-height: 1; }
      .dashboard-card h2 {
        font-size: clamp(15px, 2.5vw, 20px); font-weight: 600; color: var(--txt);
      }

      /* ── RESPONSIVE ── */
      @media (max-width: 768px) {
        .nav-menu { display: none; }
        .user-badge { display: none; }
        .logout-btn { display: none; }
        .user-avatar { display: none; }
        .menu-btn { display: flex; align-items: center; justify-content: center; }
        .theme-toggle:not(.theme-toggle-mobile) .theme-label { display: none; }
        .theme-toggle { padding: 7px 10px; }
        .theme-toggle-mobile { width: 100%; justify-content: center; }
        .content { padding: 12px; }
        .card-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
        .dashboard-card { min-height: auto; padding: 16px; }
      }
      @media (max-width: 480px) {
        .logo { font-size: 16px; }
        .content { padding: 8px; }
        .card-grid { grid-template-columns: 1fr; gap: 8px; }
        .card-icon { font-size: 28px; }
        .dashboard-card h2 { font-size: 14px; }
      }
      @media (max-height: 600px) and (orientation: landscape) {
        .content { padding: 8px; }
      }

      input:focus {
        border-color: rgba(201,168,76,0.5) !important;
        box-shadow: 0 0 0 3px rgba(201,168,76,0.08);
      }
    `}</style>
  );
}