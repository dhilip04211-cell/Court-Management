import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, ROLE_ROUTES, GOOGLE_CLIENT_ID } from "./AuthContext.jsx";

export default function LoginPage() {
    const { loginWithGoogle, gsiReady, user } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const btnRef = useRef(null);

    useEffect(() => {
        if (user) navigate(ROLE_ROUTES[user.role] || "/", { replace: true });
    }, [user]);

    useEffect(() => {
        if (!gsiReady || !btnRef.current) return;
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredential,
            ux_mode: "popup",
        });
        window.google.accounts.id.renderButton(btnRef.current, {
            theme: "filled_black",
            size: "large",
            shape: "rectangular",
            width: 320,
            text: "signin_with",
            logo_alignment: "left",
        });
    }, [gsiReady]);

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

    return (
        <div style={s.bg}>
            <div style={s.grid} />
            <div style={s.card}>

                <div style={s.emblem}>
                    <div style={s.emblemCircle}>⚖️</div>
                    <div style={s.emblemLine} />
                </div>

                <h1 style={s.title}>COURT CMS</h1>
                <p style={s.subtitle}>Court Office Management System</p>
                <p style={s.district}>Secure Staff Portal</p>

                <div style={s.btnWrap}>
                    {!gsiReady
                        ? <div style={s.loadingText}>Loading…</div>
                        : <div ref={btnRef} style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }} />
                    }
                </div>

                {error && <div style={s.errorBox}>⚠️ {error}</div>}

                <div style={s.footer}>Tamil Nadu Judiciary · Court Management System</div>
            </div>
        </div>
    );
}

const s = {
    bg: {
        minHeight: "100dvh", background: "#0b1120",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", position: "relative", overflow: "hidden",
    },
    grid: {
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(212,175,55,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.04) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
    },
    card: {
        width: "100%", maxWidth: "400px", position: "relative", zIndex: 1,
        background: "rgba(15,23,42,0.95)", border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: "20px", padding: "clamp(28px,6vw,44px)",
        boxShadow: "0 0 60px rgba(212,175,55,0.08),0 24px 48px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column", alignItems: "center",
    },
    emblem: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" },
    emblemCircle: {
        width: "72px", height: "72px", borderRadius: "50%", fontSize: "32px",
        background: "rgba(212,175,55,0.1)", border: "2px solid rgba(212,175,55,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px",
    },
    emblemLine: { width: "60px", height: "2px", background: "linear-gradient(90deg,transparent,#D4AF37,transparent)" },
    title: {
        textAlign: "center", fontSize: "clamp(22px,5vw,28px)", fontWeight: "800",
        letterSpacing: "0.18em", color: "#D4AF37", marginBottom: "6px", fontFamily: "Georgia,serif",
    },
    subtitle: { textAlign: "center", fontSize: "13px", color: "#94a3b8", marginBottom: "4px" },
    district: {
        textAlign: "center", fontSize: "11px", color: "rgba(212,175,55,0.6)",
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "32px",
    },
    btnWrap: { display: "flex", justifyContent: "center", width: "100%", marginBottom: "16px", minHeight: "44px" },
    loadingText: { color: "rgba(148,163,184,0.5)", fontSize: "13px", padding: "12px 0" },
    errorBox: {
        width: "100%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: "8px", padding: "10px 14px", color: "#fca5a5", fontSize: "13px",
        marginBottom: "16px", textAlign: "center",
    },
    footer: {
        textAlign: "center", fontSize: "11px", color: "rgba(148,163,184,0.4)",
        borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", width: "100%",
    },
};