import React, { useState } from "react";
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

/* ─── AUTO IMPORT (Vite glob — excludes App/main/Auth/Login/ProtectedRoute) ─── */
const autoPages = import.meta.glob(
  "./**/*.jsx",
  { eager: true }
);

/* ─── MENU CONFIG ─── */
const sections = [
  { title: "Head Clerk", route: "/headclerk/dashboard", icon: "👨‍💼", color: "#D4AF37" },
  { title: "MC Section", route: "/mc/mc", icon: "⚖️", color: "#4CAF50" },
  { title: "Examiner", route: "/examiner/examiner", icon: "📋", color: "#2196F3" },
  { title: "RC Section", route: "/rc/rc", icon: "📁", color: "#9C27B0" },
];

/* ─── SKIP LIST for auto-route generator ─── */
const SKIP_FILES = [
  "App.jsx", "main.jsx", "AuthContext.jsx",
  "LoginPage.jsx", "ProtectedRoute.jsx",
];

/* ─── AUTO ROUTES ─── */
function generateAutoRoutes() {
  const usedRoutes = new Set();

  return Object.entries(autoPages)
    .filter(([path]) => !SKIP_FILES.some(f => path.includes(f)))
    .map(([path, module]) => {
      let routePath = path
        .replace("./", "/")
        .replace(/\.jsx$/, "")
        .toLowerCase();

      if (routePath.endsWith("/index")) {
        routePath = routePath.replace("/index", "");
      }

      if (usedRoutes.has(routePath)) return null;
      usedRoutes.add(routePath);

      const Component = module.default;
      if (!Component) return null;

      return (
        <Route
          key={routePath}
          path={routePath}
          element={
            <ProtectedRoute>
              <Component />
            </ProtectedRoute>
          }
        />
      );
    })
    .filter(Boolean);
}

/* ─── HOME ─── */
function Home() {
  return (
    <>
      <div className="hero">
        <h1>⚖️ Court Management</h1>
        <p>Court Office Management Dashboard</p>
      </div>
      <div className="card-grid">
        {sections.map((item, i) => (
          <Link key={i} to={item.route} className="dashboard-card">
            <div className="card-icon" style={{ color: item.color }}>
              {item.icon}
            </div>
            <h2>{item.title}</h2>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ─── NAVBAR (uses auth) ─── */
function Navbar({ mobileMenu, setMobileMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">⚖️ Court CMS</div>

        <div className="nav-menu">
          {sections.map((item, i) => (
            <Link key={i} to={item.route} className="nav-link">
              {item.icon} {item.title}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          {user && (
            <>
              <span className="user-badge">
                {user.icon} {user.label}
              </span>
              <button className="logout-btn" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          )}
          <button
            className="menu-btn"
            onClick={() => setMobileMenu(p => !p)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </nav>

      {mobileMenu && (
        <div className="mobile-menu">
          {sections.map((item, i) => (
            <Link
              key={i}
              to={item.route}
              onClick={() => setMobileMenu(false)}
            >
              {item.icon} {item.title}
            </Link>
          ))}
          {user && (
            <button
              className="mobile-logout"
              onClick={() => { setMobileMenu(false); handleLogout(); }}
            >
              🚪 Sign Out ({user.label})
            </button>
          )}
        </div>
      )}
    </>
  );
}

/* ─── SHELL (layout with navbar) ─── */
function Shell({ children }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  return (
    <div className="app">
      <Navbar mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} />
      <div className="content">{children}</div>
    </div>
  );
}

/* ─── INNER APP (needs Router context) ─── */
function InnerApp() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Shell><Home /></Shell>
          </ProtectedRoute>
        }
      />

      {/* Auto-generated protected routes */}
      {generateAutoRoutes().map(route =>
        React.cloneElement(route, {
          element: (
            <Shell>
              {route.props.element}
            </Shell>
          ),
        })
      )}

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ─── ROOT APP ─── */
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <GlobalStyles />
        <InnerApp />
      </HashRouter>
    </AuthProvider>
  );
}

/* ─── GLOBAL STYLES ─── */
function GlobalStyles() {
  return (
    <style>{`
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

      body {
        background: #0b1120;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: white;
        line-height: 1.5;
      }

      /* ── APP SHELL ── */
      .app {
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: 100vh;
        min-height: 100dvh;
      }

      /* ── NAVBAR ── */
      .navbar {
        position: sticky;
        top: 0;
        z-index: 1000;
        width: 100%;
        background: rgba(15,23,42,0.97);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(212,175,55,0.15);
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .logo {
        font-size: clamp(18px, 4vw, 24px);
        font-weight: 800;
        color: #D4AF37;
        white-space: nowrap;
        flex-shrink: 0;
        letter-spacing: 0.05em;
        font-family: Georgia, serif;
      }

      .nav-menu {
        display: flex;
        gap: clamp(4px, 1.5vw, 12px);
        flex-wrap: wrap;
        flex: 1;
      }

      .nav-link {
        text-decoration: none;
        color: #cbd5e1;
        padding: 6px 10px;
        border-radius: 8px;
        transition: all 0.2s ease;
        font-size: clamp(12px, 1.8vw, 14px);
        white-space: nowrap;
      }

      .nav-link:hover {
        background: rgba(212,175,55,0.12);
        color: #D4AF37;
      }

      .nav-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }

      .user-badge {
        font-size: 12px;
        color: rgba(212,175,55,0.85);
        background: rgba(212,175,55,0.08);
        border: 1px solid rgba(212,175,55,0.2);
        padding: 5px 10px;
        border-radius: 20px;
        white-space: nowrap;
      }

      .logout-btn {
        background: rgba(239,68,68,0.1);
        border: 1px solid rgba(239,68,68,0.25);
        color: #fca5a5;
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .logout-btn:hover {
        background: rgba(239,68,68,0.2);
        border-color: rgba(239,68,68,0.5);
      }

      .menu-btn {
        display: none;
        background: none;
        border: none;
        color: white;
        font-size: 26px;
        cursor: pointer;
        padding: 6px;
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
      }

      /* ── MOBILE MENU ── */
      .mobile-menu {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px;
        background: rgba(15,23,42,0.98);
        border-bottom: 1px solid rgba(212,175,55,0.1);
        width: 100%;
      }

      .mobile-menu a {
        color: white;
        text-decoration: none;
        padding: 11px 14px;
        border-radius: 8px;
        background: rgba(255,255,255,0.05);
        transition: all 0.2s ease;
        border-left: 3px solid transparent;
        font-size: 14px;
      }

      .mobile-menu a:active, .mobile-menu a:hover {
        background: rgba(212,175,55,0.12);
        border-left-color: #D4AF37;
        color: #D4AF37;
      }

      .mobile-logout {
        background: rgba(239,68,68,0.08);
        border: 1px solid rgba(239,68,68,0.2);
        color: #fca5a5;
        padding: 11px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        text-align: left;
        transition: all 0.2s;
        margin-top: 4px;
      }

      .mobile-logout:hover {
        background: rgba(239,68,68,0.15);
      }

      /* ── CONTENT ── */
      .content {
        flex: 1;
        padding: clamp(16px, 4vw, 32px);
        width: 100%;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      /* ── HOME PAGE ── */
      .hero {
        margin-bottom: clamp(20px, 4vw, 32px);
      }

      .hero h1 {
        font-size: clamp(26px, 6vw, 40px);
        font-weight: 700;
        margin-bottom: 8px;
        font-family: Georgia, serif;
        color: #f1f5f9;
      }

      .hero p {
        color: #94a3b8;
        font-size: clamp(13px, 3vw, 16px);
      }

      .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: clamp(14px, 3vw, 22px);
        max-width: 100%;
      }

      .dashboard-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: clamp(20px, 4vw, 28px);
        text-decoration: none;
        color: white;
        transition: all 0.3s ease;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        min-height: 180px;
      }

      .dashboard-card:hover {
        transform: translateY(-4px);
        background: rgba(255,255,255,0.08);
        border-color: rgba(212,175,55,0.3);
        box-shadow: 0 8px 32px rgba(212,175,55,0.08);
      }

      .card-icon {
        font-size: clamp(32px, 6vw, 44px);
        margin-bottom: 12px;
        line-height: 1;
      }

      .dashboard-card h2 {
        font-size: clamp(15px, 2.5vw, 20px);
        line-height: 1.4;
        font-weight: 600;
        color: #e2e8f0;
      }

      /* ── RESPONSIVE ── */
      @media (max-width: 768px) {
        .nav-menu { display: none; }
        .user-badge { display: none; }
        .logout-btn { display: none; }
        .menu-btn { display: block; }

        .content { padding: 12px; }

        .card-grid {
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .dashboard-card {
          min-height: auto;
          padding: 16px;
        }
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

      /* ── INPUT FOCUS RING ── */
      input:focus {
        border-color: rgba(212,175,55,0.5) !important;
        box-shadow: 0 0 0 3px rgba(212,175,55,0.08);
      }
    `}</style>
  );
}
