import React, { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const GOOGLE_CLIENT_ID = "879226759032-983f068npvn7t0npk72nbq8lp402q98a.apps.googleusercontent.com";

export const ROLE_ROUTES = {
    default: "/",
};

/* ─── Load Google Identity Services script once ─── */
function loadGsiScript() {
    return new Promise((resolve) => {
        if (window.google?.accounts) return resolve();
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.defer = true;
        s.onload = resolve;
        document.head.appendChild(s);
    });
}

/* ─── Decode JWT from Google credential ─── */
function decodeJwt(token) {
    try {
        const payload = token.split(".")[1];
        return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = sessionStorage.getItem("court_cms_user");
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    const [gsiReady, setGsiReady] = useState(false);

    useEffect(() => {
        loadGsiScript().then(() => setGsiReady(true));
    }, []);

    const loginWithGoogle = (credentialResponse) => {
        const payload = decodeJwt(credentialResponse.credential);
        if (!payload) return { ok: false, error: "Invalid Google response. Please try again." };

        const userData = {
            email: payload.email || "",
            name: payload.name || "",
            picture: payload.picture || null,
            role: "user",
            label: payload.name || payload.email,
            icon: "👤",
        };

        sessionStorage.setItem("court_cms_user", JSON.stringify(userData));
        setUser(userData);
        return { ok: true, user: userData };
    };

    const logout = () => {
        if (user?.email && window.google?.accounts?.id) {
            window.google.accounts.id.revoke(user.email, () => { });
        }
        sessionStorage.removeItem("court_cms_user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loginWithGoogle, logout, gsiReady }}>
            {children}
        </AuthContext.Provider>
    );
}