import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, ROLE_ROUTES, GOOGLE_CLIENT_ID } from "./AuthContext.jsx";
import { useTheme } from "./App.jsx";

export default function LoginPage() {
  const { loginWithGoogle, gsiReady, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef(null);
  const d = theme === "night";

  useEffect(() => { setTimeout(() => setMounted(true), 40); }, []);

  /* If already logged in, go home */
  useEffect(() => {
    if (user) navigate(ROLE_ROUTES[user.role] || "/", { replace: true });
  }, [user]);

  /* Render Google button whenever gsiReady or theme changes */
  useEffect(() => {
    if (!gsiReady || !btnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      ux_mode: "popup",
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: d ? "filled_black" : "outline",
      size: "large",
      shape: "pill",
      width: 300,
      text: "signin_with",
      logo_alignment: "left",
    });
  }, [gsiReady, theme]);

  const handleCredential = (credentialResponse) => {
    setLoading(true);
    setError("");
    const result = loginWithGoogle(credentialResponse);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      navigate(ROLE_ROUTES[result.user.role] || "/", { replace: true });
    }
  };

  /* ── theme-aware tokens ── */
  const T = d ? {
    bg:       "#0d1117",
    gridClr:  "rgba(201,168,76,0.04)",
    card:     "rgba(22,27,34,0.97)",
    border:   "rgba(201,168,76,0.28)",
    title:    "#C9A84C",
    sub:      "#8b949e",
    badge:    "rgba(201,168,76,0.08)",
    badgeBdr: "rgba(201,168,76,0.2)",
    footer:   "rgba(139,148,158,0.45)",
    divider:  "rgba(255,255,255,0.06)",
    shadow:   "0 0 80px rgba(201,168,76,0.1),0 32px 64px rgba(0,0,0,0.6)",
    toggleBg: "rgba(201,168,76,0.1)",
    glow:     "radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 70%)",
  } : {
    bg:       "#f0f2f5",
    gridClr:  "rgba(139,105,20,0.06)",
    card:     "#ffffff",
    border:   "rgba(139,105,20,0.3)",
    title:    "#8B6914",
    sub:      "#6b7280",
    badge:    "rgba(139,105,20,0.08)",
    badgeBdr: "rgba(139,105,20,0.2)",
    footer:   "rgba(107,114,128,0.55)",
    divider:  "rgba(0,0,0,0.07)",
    shadow:   "0 0 60px rgba(139,105,20,0.08),0 20px 48px rgba(0,0,0,0.1)",
    toggleBg: "rgba(139,105,20,0.1)",
    glow:     "radial-gradient(circle,rgba(139,105,20,0.08) 0%,transparent 70%)",
  };

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:16, position:"relative", overflow:"hidden", transition:"background 0.3s" }}>

      {/* grid */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:`linear-gradient(${T.gridClr} 1px,transparent 1px),linear-gradient(90deg,${T.gridClr} 1px,transparent 1px)`, backgroundSize:"40px 40px" }} />
      {/* glow */}
      <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:T.glow, top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }} />

      {/* theme toggle */}
      <button onClick={toggleTheme} style={{ position:"absolute", top:16, right:16, zIndex:10, background:T.toggleBg, border:`1px solid ${T.border}`, color:T.title, borderRadius:50, padding:"7px 14px", cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6, transition:"all 0.25s", backdropFilter:"blur(8px)" }}>
        <span style={{ fontSize:16 }}>{d ? "☀️" : "🌙"}</span>
        <span>{d ? "Day" : "Night"}</span>
      </button>

      {/* card */}
      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1, background:T.card, border:`1px solid ${T.border}`, borderRadius:24, padding:"clamp(28px,6vw,48px)", boxShadow:T.shadow, display:"flex", flexDirection:"column", alignItems:"center", transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)", opacity: mounted ? 1 : 0, transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}>

        {/* emblem */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:22 }}>
          <div style={{ width:80, height:80, borderRadius:"50%", fontSize:36, background:T.badge, border:`2px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, boxShadow:`0 0 28px ${T.badge}`, animation:"cmsPulse 3s infinite" }}>⚖️</div>
          <div style={{ width:64, height:2, background:`linear-gradient(90deg,transparent,${T.title},transparent)` }} />
        </div>

        <h1 style={{ textAlign:"center", fontSize:"clamp(22px,5vw,30px)", fontWeight:800, letterSpacing:"0.18em", color:T.title, marginBottom:5, fontFamily:"Georgia,serif" }}>COURT CMS</h1>
        <p style={{ textAlign:"center", fontSize:13, color:T.sub, marginBottom:6 }}>Court Office Management System</p>

        {/* portal badge */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:T.badge, border:`1px solid ${T.badgeBdr}`, borderRadius:20, padding:"4px 13px", marginBottom:30 }}>
          <span style={{ fontSize:11, color:T.title, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:600 }}>📋 Examiner Portal</span>
        </div>

        {/* sign-in */}
        <p style={{ textAlign:"center", fontSize:12, color:T.sub, marginBottom:14, letterSpacing:"0.04em" }}>Sign in with your authorised Google account</p>
        <div style={{ display:"flex", justifyContent:"center", minHeight:44, marginBottom:16 }}>
          {!gsiReady
            ? <div style={{ color:T.sub, fontSize:13, padding:"12px 0", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ display:"inline-block", width:15, height:15, border:`2px solid ${T.title}`, borderTopColor:"transparent", borderRadius:"50%", animation:"cmsSpin 0.7s linear infinite" }} />
                Loading…
              </div>
            : <div ref={btnRef} style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto", transition:"opacity 0.2s" }} />
          }
        </div>

        {error && (
          <div style={{ width:"100%", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:12, padding:"11px 16px", color:"#f87171", fontSize:13, marginBottom:14, textAlign:"center", display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
            <span>⚠️</span>{error}
          </div>
        )}

        <div style={{ textAlign:"center", fontSize:11, color:T.footer, borderTop:`1px solid ${T.divider}`, paddingTop:16, width:"100%" }}>
          Tamil Nadu Judiciary · Court Management System
        </div>
      </div>

      <style>{`
        @keyframes cmsSpin   { to { transform: rotate(360deg); } }
        @keyframes cmsPulse  { 0%,100%{box-shadow:0 0 20px rgba(201,168,76,0.12);} 50%{box-shadow:0 0 32px rgba(201,168,76,0.28);} }
      `}</style>
    </div>
  );
}