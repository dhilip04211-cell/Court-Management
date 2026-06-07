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

    const handleCredential = async (credentialResponse) => {
        setLoading(true);
        setError("");
        const result = loginWithGoogle(credentialResponse);
        if (!result.ok) {
            setError(result.error);
            setLoading(false);
            return;
        }
        
        // Don't wait for token - let it request in background
        // This prevents login screen from hanging
        setLoading(false);
        navigate(ROLE_ROUTES[result.user.role] || "/", { replace: true });
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
        minHeight: "100dvh",
        background: "radial-gradient(circle at top, rgba(212,175,55,0.14), transparent 36%), linear-gradient(135deg, #070b15 0%, #0c162d 52%, #121d36 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", position: "relative", overflow: "hidden",
    },
    grid: {
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        opacity: 0.55,
    },
    card: {
        width: "100%", maxWidth: "420px", position: "relative", zIndex: 1,
        background: "rgba(11,18,34,0.96)", border: "1px solid rgba(212,175,55,0.18)",
        borderRadius: "22px", padding: "clamp(28px,6vw,44px)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
        display: "flex", flexDirection: "column", alignItems: "center",
        backdropFilter: "blur(14px)",
    },
    emblem: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" },
    emblemCircle: {
        width: "72px", height: "72px", borderRadius: "50%", fontSize: "32px",
        background: "radial-gradient(circle at 30% 30%, rgba(212,175,55,0.25), rgba(212,175,55,0.08) 55%, transparent 100%)",
        border: "1px solid rgba(212,175,55,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px",
        boxShadow: "0 0 30px rgba(212,175,55,0.12)",
    },
    emblemLine: { width: "60px", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" },
    title: {
        textAlign: "center", fontSize: "clamp(24px,5vw,30px)", fontWeight: "800",
        letterSpacing: "0.18em", color: "#F3D38B", marginBottom: "8px", fontFamily: "Georgia,serif",
        textShadow: "0 2px 12px rgba(0,0,0,0.25)",
    },
    subtitle: { textAlign: "center", fontSize: "13px", color: "#b9c4d6", marginBottom: "6px", maxWidth: "84%" },
    district: {
        textAlign: "center", fontSize: "11px", color: "rgba(212,175,55,0.72)",
        letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "28px",
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