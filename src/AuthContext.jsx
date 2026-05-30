import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const GOOGLE_CLIENT_ID = "879226759032-983f068npvn7t0npk72nbq8lp402q98a.apps.googleusercontent.com";
export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

/* ─────────────────────────────────────────────────────────────────
   ALLOWED EMAILS — ONLY these Google accounts can login.
   Add your staff email addresses here (lowercase).
   Example:
     "headclerk@tndistrict.gov.in",
     "examiner@gmail.com",
   If this list is EMPTY, all Google accounts are allowed (for testing).
───────────────────────────────────────────────────────────────── */
export const ALLOWED_EMAILS = [
  "dhileepank2@gmail.com"
];

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

  /* ── OAuth2 access token for Google Sheets ── */
  const [tok, setTok] = useState(() => sessionStorage.getItem("court_cms_tok") || null);
  const tokenClientRef = useRef(null);
  const tokenCallbackRef = useRef(null);

  useEffect(() => {
    loadGsiScript().then(() => {
      setGsiReady(true);
      /* Initialize the token client for Sheets scope */
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SHEETS_SCOPE,
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            console.error("Token error:", tokenResponse.error);
            tokenCallbackRef.current?.(null);
            return;
          }
          const accessToken = tokenResponse.access_token;
          sessionStorage.setItem("court_cms_tok", accessToken);
          setTok(accessToken);

          /* Auto-clear token when it expires (default 1 hour) */
          const expiresIn = (tokenResponse.expires_in || 3600) * 1000;
          setTimeout(() => {
            sessionStorage.removeItem("court_cms_tok");
            setTok(null);
          }, expiresIn);

          tokenCallbackRef.current?.(accessToken);
        },
      });
    });
  }, []);

  /* Call this to get/refresh the Sheets access token */
  const requestSheetsToken = () => {
    return new Promise((resolve) => {
      if (!tokenClientRef.current) return resolve(null);
      tokenCallbackRef.current = resolve;
      tokenClientRef.current.requestAccessToken({ prompt: "" });
    });
  };

  const loginWithGoogle = (credentialResponse) => {
    const payload = decodeJwt(credentialResponse.credential);
    if (!payload) return { ok: false, error: "Invalid Google response. Please try again." };

    const email = (payload.email || "").toLowerCase().trim();

    /* ── EMAIL WHITELIST CHECK ── */
    if (ALLOWED_EMAILS.length > 0) {
      const allowed = ALLOWED_EMAILS.map(e => e.toLowerCase().trim());
      if (!allowed.includes(email)) {
        return {
          ok: false,
          error: "Access denied. This account is not authorised. Contact your administrator.",
        };
      }
    }

    const userData = {
      email,
      name: payload.name || "",
      picture: payload.picture || null,
      role: "user",
      label: payload.name || email,
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
    if (tok && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(tok, () => { });
    }
    sessionStorage.removeItem("court_cms_user");
    sessionStorage.removeItem("court_cms_tok");
    setUser(null);
    setTok(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, gsiReady, tok, requestSheetsToken }}>
      {children}
    </AuthContext.Provider>
  );
}
import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const GOOGLE_CLIENT_ID = "879226759032-983f068npvn7t0npk72nbq8lp402q98a.apps.googleusercontent.com";
export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

/* ─────────────────────────────────────────────────────────────────
   ALLOWED EMAILS — ONLY these Google accounts can login.
   Add your staff email addresses here (lowercase).
   Example:
     "headclerk@tndistrict.gov.in",
     "examiner@gmail.com",
   If this list is EMPTY, all Google accounts are allowed (for testing).
───────────────────────────────────────────────────────────────── */
export const ALLOWED_EMAILS = [
  "dhileepank2@gmail.com"
];

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

  /* ── OAuth2 access token for Google Sheets ── */
  const [tok, setTok] = useState(() => sessionStorage.getItem("court_cms_tok") || null);
  const tokenClientRef = useRef(null);
  const tokenCallbackRef = useRef(null);

  useEffect(() => {
    loadGsiScript().then(() => {
      setGsiReady(true);
      /* Initialize the token client for Sheets scope */
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SHEETS_SCOPE,
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            console.error("Token error:", tokenResponse.error);
            tokenCallbackRef.current?.(null);
            return;
          }
          const accessToken = tokenResponse.access_token;
          sessionStorage.setItem("court_cms_tok", accessToken);
          setTok(accessToken);

          /* Auto-clear token when it expires (default 1 hour) */
          const expiresIn = (tokenResponse.expires_in || 3600) * 1000;
          setTimeout(() => {
            sessionStorage.removeItem("court_cms_tok");
            setTok(null);
          }, expiresIn);

          tokenCallbackRef.current?.(accessToken);
        },
      });
    });
  }, []);

  /* Call this to get/refresh the Sheets access token */
  const requestSheetsToken = () => {
    return new Promise((resolve) => {
      if (!tokenClientRef.current) return resolve(null);
      tokenCallbackRef.current = resolve;
      tokenClientRef.current.requestAccessToken({ prompt: "" });
    });
  };

  const loginWithGoogle = (credentialResponse) => {
    const payload = decodeJwt(credentialResponse.credential);
    if (!payload) return { ok: false, error: "Invalid Google response. Please try again." };

    const email = (payload.email || "").toLowerCase().trim();

    /* ── EMAIL WHITELIST CHECK ── */
    if (ALLOWED_EMAILS.length > 0) {
      const allowed = ALLOWED_EMAILS.map(e => e.toLowerCase().trim());
      if (!allowed.includes(email)) {
        return {
          ok: false,
          error: "Access denied. This account is not authorised. Contact your administrator.",
        };
      }
    }

    const userData = {
      email,
      name: payload.name || "",
      picture: payload.picture || null,
      role: "user",
      label: payload.name || email,
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
    if (tok && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(tok, () => { });
    }
    sessionStorage.removeItem("court_cms_user");
    sessionStorage.removeItem("court_cms_tok");
    setUser(null);
    setTok(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, gsiReady, tok, requestSheetsToken }}>
      {children}
    </AuthContext.Provider>
  );
}
