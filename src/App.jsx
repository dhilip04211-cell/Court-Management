import React, { useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  Navigate,
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
    color: "#D4AF37",
  },
  {
    title: "MC Section",
    route: "/mc/mc",
    icon: "⚖️",
    color: "#4CAF50",
  },
  {
    title: "Examiner",
    route: "/examiner/examiner",
    icon: "📋",
    color: "#2196F3",
  },
  {
    title: "RC Section",
    route: "/rc/rc",
    icon: "📁",
    color: "#9C27B0",
  },
];

/* AUTO ROUTES */
function generateAutoRoutes() {
  const usedRoutes = new Set();

  return Object.entries(autoPages)
    .filter(
      ([path]) =>
        !path.includes("App.jsx") &&
        !path.includes("main.jsx")
    )
    .map(([path, module]) => {
      let routePath = path
        .replace("./", "/")
        .replace(/\.jsx$/, "")
        .toLowerCase();

      if (routePath.endsWith("/index")) {
        routePath = routePath.replace(
          "/index",
          ""
        );
      }

      if (usedRoutes.has(routePath))
        return null;

      usedRoutes.add(routePath);

      const Component =
        module.default;

      if (!Component) return null;

      return (
        <Route
          key={routePath}
          path={routePath}
          element={<Component />}
        />
      );
    })
    .filter(Boolean);
}

/* HOME */
function Home() {
  return (
    <>
      <div className="hero">
        <h1>
          ⚖️ Court Management
        </h1>

        <p>
          Court Office Management
          Dashboard
        </p>
      </div>

      <div className="card-grid">
        {sections.map((item, i) => (
          <Link
            key={i}
            to={item.route}
            className="dashboard-card"
          >
            <div
              className="card-icon"
              style={{
                color: item.color,
              }}
            >
              {item.icon}
            </div>

            <h2>{item.title}</h2>
          </Link>
        ))}
      </div>
    </>
  );
}

/* APP */
export default function App() {
  const [mobileMenu, setMobileMenu] =
    useState(false);

  return (
    <HashRouter>
      <style>{`
        *{
          margin:0;
          padding:0;
          box-sizing:border-box;
        }

        html, body, #root {
          width: 100%;
          height: 100%;
          overflow-x: hidden;
        }

        body{
          background:#0b1120;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color:white;
          line-height: 1.5;
        }

        .app{
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
        }

        /* NAVBAR */

        .navbar{
          position:sticky;
          top:0;
          z-index:1000;
          width: 100%;
          background: rgba(15,23,42,0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 12px 16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          flex-shrink: 0;
        }

        .logo{
          font-size: clamp(20px, 5vw, 26px);
          font-weight:bold;
          color:#facc15;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nav-menu{
          display:flex;
          gap: clamp(8px, 2vw, 14px);
          flex-wrap: wrap;
          justify-content: center;
          flex: 1;
        }

        .nav-link{
          text-decoration:none;
          color:white;
          padding: 8px 12px;
          border-radius:12px;
          transition:.3s ease;
          font-size: clamp(13px, 2vw, 15px);
          white-space: nowrap;
        }

        .nav-link:hover, .nav-link:active{
          background: rgba(250,204,21,0.15);
          color: #facc15;
        }

        .menu-btn{
          display:none;
          background:none;
          border:none;
          color:white;
          font-size:28px;
          cursor:pointer;
          padding: 8px;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }

        /* MOBILE MENU */

        .mobile-menu{
          display:none;
          flex-direction:column;
          gap:8px;
          padding: 12px;
          background: linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(20,30,50,0.98) 100%);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          max-height: calc(100vh - 56px);
          overflow-y: auto;
          width: 100%;
        }

        .mobile-menu a{
          color:white;
          text-decoration:none;
          padding: 12px 14px;
          border-radius:8px;
          background: rgba(255,255,255,0.06);
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }

        .mobile-menu a:active, .mobile-menu a:hover{
          background: rgba(250,204,21,0.15);
          border-left-color: #facc15;
          color: #facc15;
        }

        /* CONTENT */

        .content{
          flex: 1;
          padding: clamp(16px, 5vw, 35px);
          width: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .hero{
          margin-bottom: clamp(20px, 5vw, 30px);
        }

        .hero h1{
          font-size: clamp(28px, 8vw, 42px);
          font-weight: 700;
          margin-bottom: 8px;
        }

        .hero p{
          color:#94a3b8;
          font-size: clamp(14px, 4vw, 18px);
        }

        /* CARDS */

        .card-grid{
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 100%, 280px), 1fr));
          gap: clamp(16px, 4vw, 24px);
          max-width: 100%;
        }

        .dashboard-card{
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: clamp(20px, 5vw, 28px);
          text-decoration:none;
          color:white;
          transition: all 0.3s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          aspect-ratio: 1/1;
          min-height: 200px;
        }

        .dashboard-card:hover, .dashboard-card:active{
          transform: translateY(-4px) scale(1.02);
          background: rgba(255,255,255,0.1);
          border-color: rgba(250,204,21,0.3);
        }

        .card-icon{
          font-size: clamp(36px, 8vw, 48px);
          margin-bottom: 12px;
          line-height: 1;
        }

        .dashboard-card h2{
          font-size: clamp(16px, 3vw, 22px);
          line-height:1.4;
          font-weight: 600;
        }

        /* TABLETS & LANDSCAPE */
        @media (max-width: 1024px) {
          .navbar {
            padding: 10px 12px;
          }
          .content {
            padding: clamp(12px, 4vw, 24px);
          }
          .card-grid {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          }
        }

        /* MOBILE */

        @media(max-width:768px){
          .app {
            height: 100dvh;
          }

          .navbar{
            padding: 10px;
            gap: 8px;
          }

          .nav-menu{
            display:none;
          }

          .menu-btn{
            display:block;
          }

          .content {
            padding: 12px;
          }

          .card-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .dashboard-card {
            aspect-ratio: auto;
            min-height: auto;
            padding: 20px;
          }
        }

        @media(max-width:480px){
          .logo {
            font-size: 18px;
          }

          .content {
            padding: 8px;
          }

          .hero h1 {
            font-size: 24px;
          }

          .hero p {
            font-size: 13px;
          }

          .card-grid {
            gap: 8px;
          }

          .dashboard-card {
            padding: 16px;
            border-radius: 12px;
          }

          .card-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }

          .dashboard-card h2 {
            font-size: 14px;
          }
        }

        /* LANDSCAPE FIXES */
        @media (max-height: 600px) and (orientation: landscape) {
          .app {
            min-height: auto;
          }
          .content {
            max-height: calc(100vh - 56px);
            padding: 8px;
          }
        }
      `}</style>

      <div className="app">

        {/* TOP MENU */}
        <nav className="navbar">
          <div className="logo">
            ⚖️ Court CMS
          </div>

          <div className="nav-menu">
            {sections.map(
              (item, i) => (
                <Link
                  key={i}
                  to={item.route}
                  className="nav-link"
                >
                  {item.icon}
                  {" "}
                  {item.title}
                </Link>
              )
            )}
          </div>

          <button
            className="menu-btn"
            onClick={() =>
              setMobileMenu(
                !mobileMenu
              )
            }
          >
            ☰
          </button>
        </nav>

        {/* MOBILE MENU */}
        {mobileMenu && (
          <div className="mobile-menu">
            {sections.map(
              (item, i) => (
                <Link
                  key={i}
                  to={item.route}
                  onClick={() =>
                    setMobileMenu(
                      false
                    )
                  }
                >
                  {item.icon}
                  {" "}
                  {item.title}
                </Link>
              )
            )}
          </div>
        )}

        <div className="content">
          <Routes>
            <Route
              path="/"
              element={<Home />}
            />

            {generateAutoRoutes()}

            <Route
              path="*"
              element={
                <Navigate to="/" />
              }
            />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}