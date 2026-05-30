import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, ROLE_ROUTES } from "./AuthContext.jsx";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }
        setLoading(true);
        setError("");
        // Small delay for UX
        await new Promise(r => setTimeout(r, 400));
        const result = login(username, password);
        setLoading(false);
        if (!result.ok) {
            setError(result.error);
        } else {
            const dest = ROLE_ROUTES[result.user.role] || "/";
            navigate(dest, { replace: true });
        }
    };

    return (
        <div style={styles.bg}>
            {/* Subtle grid overlay */}
            <div style={styles.grid} />

            <div style={styles.card}>
                {/* Emblem */}
                <div style={styles.emblem}>
                    <div style={styles.emblemCircle}>
                        <span style={styles.emblemIcon}>⚖️</span>
                    </div>
                    <div style={styles.emblemLine} />
                </div>

                <h1 style={styles.title}>COURT CMS</h1>
                <p style={styles.subtitle}>Court Office Management System</p>
                <p style={styles.district}>Secure Staff Portal</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Username */}
                    <div style={styles.field}>
                        <label style={styles.label}>USERNAME</label>
                        <div style={styles.inputWrap}>
                            <span style={styles.inputIcon}>👤</span>
                            <input
                                type="text"
                                value={username}
                                onChange={e => { setUsername(e.target.value); setError(""); }}
                                placeholder="Enter your username"
                                style={styles.input}
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div style={styles.field}>
                        <label style={styles.label}>PASSWORD</label>
                        <div style={styles.inputWrap}>
                            <span style={styles.inputIcon}>🔒</span>
                            <input
                                type={showPwd ? "text" : "password"}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError(""); }}
                                placeholder="Enter your password"
                                style={{ ...styles.input, paddingRight: "44px" }}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(p => !p)}
                                style={styles.eyeBtn}
                                tabIndex={-1}
                            >
                                {showPwd ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={styles.errorBox}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.btn,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? "wait" : "pointer",
                        }}
                    >
                        {loading ? "Authenticating…" : "Sign In →"}
                    </button>
                </form>

                <div style={styles.footer}>
                    Tamil Nadu Judiciary · Court Management System
                </div>
            </div>
        </div>
    );
}

/* ─── Styles ─── */
const styles = {
    bg: {
        minHeight: "100vh",
        minHeight: "100dvh",
        background: "#0b1120",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        position: "relative",
        overflow: "hidden",
    },
    grid: {
        position: "absolute",
        inset: 0,
        backgroundImage:
            "linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
    },
    card: {
        width: "100%",
        maxWidth: "420px",
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: "20px",
        padding: "clamp(28px, 6vw, 44px)",
        boxShadow: "0 0 60px rgba(212,175,55,0.08), 0 24px 48px rgba(0,0,0,0.5)",
        position: "relative",
        zIndex: 1,
    },
    emblem: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "20px",
    },
    emblemCircle: {
        width: "72px",
        height: "72px",
        borderRadius: "50%",
        background: "rgba(212,175,55,0.1)",
        border: "2px solid rgba(212,175,55,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "12px",
    },
    emblemIcon: {
        fontSize: "34px",
    },
    emblemLine: {
        width: "60px",
        height: "2px",
        background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
    },
    title: {
        textAlign: "center",
        fontSize: "clamp(22px, 5vw, 28px)",
        fontWeight: "800",
        letterSpacing: "0.18em",
        color: "#D4AF37",
        marginBottom: "6px",
        fontFamily: "'Georgia', serif",
    },
    subtitle: {
        textAlign: "center",
        fontSize: "clamp(12px, 2.5vw, 14px)",
        color: "#94a3b8",
        marginBottom: "4px",
        letterSpacing: "0.04em",
    },
    district: {
        textAlign: "center",
        fontSize: "clamp(10px, 2vw, 12px)",
        color: "rgba(212,175,55,0.6)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: "28px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "0.12em",
        color: "rgba(212,175,55,0.8)",
    },
    inputWrap: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    inputIcon: {
        position: "absolute",
        left: "12px",
        fontSize: "16px",
        pointerEvents: "none",
        zIndex: 1,
    },
    input: {
        width: "100%",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px",
        padding: "12px 12px 12px 40px",
        color: "white",
        fontSize: "15px",
        outline: "none",
        transition: "border-color 0.2s",
        fontFamily: "inherit",
    },
    eyeBtn: {
        position: "absolute",
        right: "10px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "16px",
        padding: "4px",
        lineHeight: 1,
    },
    errorBox: {
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: "8px",
        padding: "10px 14px",
        color: "#fca5a5",
        fontSize: "13px",
    },
    btn: {
        marginTop: "4px",
        background: "linear-gradient(135deg, #D4AF37 0%, #b8941e 100%)",
        border: "none",
        borderRadius: "12px",
        padding: "14px",
        color: "#0b1120",
        fontSize: "15px",
        fontWeight: "700",
        letterSpacing: "0.06em",
        transition: "transform 0.15s, box-shadow 0.15s",
        boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
    },
    footer: {
        marginTop: "24px",
        textAlign: "center",
        fontSize: "11px",
        color: "rgba(148,163,184,0.5)",
        letterSpacing: "0.04em",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "16px",
    },
};