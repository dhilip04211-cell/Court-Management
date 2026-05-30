import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const GOOGLE_CLIENT_ID = "879226759032-983f068npvn7t0npk72nbq8lp402q98a.apps.googleusercontent.com";
export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export const ALLOWED_EMAILS = [
  "dhileepank2@gmail.com"
];

/* ── Login always goes to home ── */
export const ROLE_ROUTES = {
  default: "/",
};

/* ── Session expiry options (minutes). 0 = never ── */
export const SESSION_OPTIONS = [
  { label: "Never",    minutes: 0    },
  { label: "15 min",   minutes: 15   },
  { label: "30 min",   minutes: 30   },
  { label: "1 hour",   minutes: 60   },
  { label: "2 hours",  minutes: 120  },
  { label: "4 hours",  minutes: 240  },
  { label: "8 hours",  minutes: 480  },
];

const SESSION_KEY   = "court_cms_user";
const TOK_KEY       = "court_cms_tok";
const EXPIRY_KEY    = "court_cms_expiry_min";   // chosen duration
const LOGIN_AT_KEY  = "court_cms_login_at";     // timestamp

function loadGsiScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true; s.onload = resolve;
    document.head.appendChild(s);
  });
}

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}

/* Returns ms remaining, or Infinity if no expiry set */
function msRemaining(minutes, loginAt) {
  if (!minutes || !loginAt) return Infinity;
  return loginAt + minutes * 60_000 - Date.now();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  });

  const [gsiReady, setGsiReady]   = useState(false);
  const [tok,      setTok]        = useState(() => sessionStorage.getItem(TOK_KEY) || null);
  const [sessionMinutes, setSessionMinutesState] = useState(
    () => Number(localStorage.getItem(EXPIRY_KEY) || 0)
  );
  /* countdown display value in seconds, null = no expiry */
  const [countdown, setCountdown] = useState(null);

  const tokenClientRef   = useRef(null);
  const tokenCallbackRef = useRef(null);
  const expiryTimerRef   = useRef(null);
  const countdownRef     = useRef(null);

  /* ── core logout ── */
  const logout = useCallback((silent = false) => {
    if (!silent && user?.email && window.google?.accounts?.id)
      window.google.accounts.id.revoke(user.email, () => {});
    if (tok && window.google?.accounts?.oauth2)
      window.google.accounts.oauth2.revoke(tok, () => {});
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOK_KEY);
    sessionStorage.removeItem(LOGIN_AT_KEY);
    clearTimeout(expiryTimerRef.current);
    clearInterval(countdownRef.current);
    setUser(null);
    setTok(null);
    setCountdown(null);
  }, [user, tok]);

  /* ── arm the expiry clock whenever user or sessionMinutes changes ── */
  const armExpiry = useCallback((minutes, loginAt) => {
    clearTimeout(expiryTimerRef.current);
    clearInterval(countdownRef.current);
    setCountdown(null);

    const ms = msRemaining(minutes, loginAt);
    if (!isFinite(ms) || ms <= 0) {
      if (ms <= 0) logout(true); // already expired
      return;
    }

    /* hard logout at expiry */
    expiryTimerRef.current = setTimeout(() => logout(true), ms);

    /* live countdown tick every second */
    const tick = () => {
      const left = msRemaining(minutes, loginAt);
      if (left <= 0) { setCountdown(0); return; }
      setCountdown(Math.ceil(left / 1000));
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
  }, [logout]);

  /* ── re-arm when settings change ── */
  useEffect(() => {
    if (!user) return;
    const loginAt = Number(sessionStorage.getItem(LOGIN_AT_KEY) || Date.now());
    armExpiry(sessionMinutes, loginAt);
    return () => { clearTimeout(expiryTimerRef.current); clearInterval(countdownRef.current); };
  }, [user, sessionMinutes, armExpiry]);

  /* ── persist + expose session duration setter ── */
  const setSessionMinutes = (minutes) => {
    localStorage.setItem(EXPIRY_KEY, minutes);
    setSessionMinutesState(minutes);
  };

  /* ── GSI + token client init ── */
  useEffect(() => {
    loadGsiScript().then(() => {
      setGsiReady(true);
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SHEETS_SCOPE,
        callback: (tokenResponse) => {
          if (tokenResponse.error) { tokenCallbackRef.current?.(null); return; }
          const accessToken = tokenResponse.access_token;
          sessionStorage.setItem(TOK_KEY, accessToken);
          setTok(accessToken);
          const exp = (tokenResponse.expires_in || 3600) * 1000;
          setTimeout(() => { sessionStorage.removeItem(TOK_KEY); setTok(null); }, exp);
          tokenCallbackRef.current?.(accessToken);
        },
      });
    });
  }, []);

  const requestSheetsToken = () => new Promise((resolve) => {
    if (!tokenClientRef.current) return resolve(null);
    tokenCallbackRef.current = resolve;
    tokenClientRef.current.requestAccessToken({ prompt: "" });
  });

  const loginWithGoogle = (credentialResponse) => {
    const payload = decodeJwt(credentialResponse.credential);
    if (!payload) return { ok: false, error: "Invalid Google response. Please try again." };

    const email = (payload.email || "").toLowerCase().trim();
    if (ALLOWED_EMAILS.length > 0) {
      const allowed = ALLOWED_EMAILS.map(e => e.toLowerCase().trim());
      if (!allowed.includes(email))
        return { ok: false, error: "Access denied. This account is not authorised. Contact your administrator." };
    }

    const now = Date.now();
    const userData = {
      email, name: payload.name || "",
      picture: payload.picture || null,
      role: "user", label: payload.name || email, icon: "📋",
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    sessionStorage.setItem(LOGIN_AT_KEY, String(now));
    setUser(userData);
    return { ok: true, user: userData };
  };

  /* ── format countdown for display ── */
  const countdownLabel = (() => {
    if (countdown === null) return null;
    if (countdown <= 0)     return "Expired";
    const h = Math.floor(countdown / 3600);
    const m = Math.floor((countdown % 3600) / 60);
    const s = countdown % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
    if (m > 0) return `${m}m ${String(s).padStart(2,"0")}s`;
    return `${s}s`;
  })();

  return (
    <AuthContext.Provider value={{
      user, loginWithGoogle, logout,
      gsiReady, tok, requestSheetsToken,
      sessionMinutes, setSessionMinutes,
      SESSION_OPTIONS,
      countdown, countdownLabel,
    }}>
      {children}
    </AuthContext.Provider>
  );
}