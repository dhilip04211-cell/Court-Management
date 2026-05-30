import React, { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

/* ─── User Roles & Credentials ─── */
const USERS = [
    { username: "headclerk", password: "hc@2025", role: "headclerk", label: "Head Clerk", icon: "👨‍💼" },
    { username: "mc", password: "mc@2025", role: "mc", label: "MC Section", icon: "⚖️" },
    { username: "examiner", password: "ex@2025", role: "examiner", label: "Examiner", icon: "📋" },
    { username: "rc", password: "rc@2025", role: "rc", label: "RC Section", icon: "📁" },
    { username: "admin", password: "admin@2025", role: "admin", label: "Admin", icon: "🔐" },
];

export const ROLE_ROUTES = {
    headclerk: "/headclerk/dashboard",
    mc: "/mc/mc",
    examiner: "/examiner/examiner",
    rc: "/rc/rc",
    admin: "/",
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = sessionStorage.getItem("court_cms_user");
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    const login = (username, password) => {
        const found = USERS.find(
            u => u.username === username.trim().toLowerCase() &&
                u.password === password
        );
        if (!found) return { ok: false, error: "Invalid username or password" };
        const userData = { username: found.username, role: found.role, label: found.label, icon: found.icon };
        sessionStorage.setItem("court_cms_user", JSON.stringify(userData));
        setUser(userData);
        return { ok: true, user: userData };
    };

    const logout = () => {
        sessionStorage.removeItem("court_cms_user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}