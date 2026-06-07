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
  const tokenRequestingRef = useRef(false);

  useEffect(() => {
    loadGsiScript().then(() => {
      setGsiReady(true);
      /* Initialize the token client for Sheets scope */
      try {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SHEETS_SCOPE,
          callback: (tokenResponse) => {
            if (tokenResponse.error) {
              console.error("Token callback error:", tokenResponse.error);
              tokenRequestingRef.current = false;
              tokenCallbackRef.current?.(null);
              return;
            }
            
            const accessToken = tokenResponse.access_token;
            if (accessToken) {
              sessionStorage.setItem("court_cms_tok", accessToken);
              setTok(accessToken);

              /* Auto-clear token when it expires (default 1 hour) */
              const expiresIn = (tokenResponse.expires_in || 3600) * 1000;
              setTimeout(() => {
                sessionStorage.removeItem("court_cms_tok");
                setTok(null);
              }, expiresIn);

              tokenCallbackRef.current?.(accessToken);
            } else {
              console.warn("No access token in response");
              tokenCallbackRef.current?.(null);
            }
            
            tokenRequestingRef.current = false;
          },
        });
        console.log("Token client initialized successfully");
      } catch (err) {
        console.error("Failed to initialize token client:", err);
      }
    }).catch(err => {
      console.error("Failed to load GSI script:", err);
    });
  }, []);

  /* Call this to get/refresh the Sheets access token */
  const requestSheetsToken = () => {
    return new Promise((resolve) => {
      /* If token already in storage, return it immediately */
      const storedTok = sessionStorage.getItem("court_cms_tok");
      if (storedTok) {
        console.log("Using stored token");
        return resolve(storedTok);
      }

      if (!tokenClientRef.current) {
        console.error("Token client not initialized - may not be ready yet");
        /* Try again - token client might still be initializing */
        setTimeout(() => {
          if (tokenClientRef.current) {
            console.log("Token client is now ready, retrying...");
            requestSheetsToken().then(resolve);
          } else {
            console.error("Token client still not available after 500ms retry");
            resolve(null);
          }
        }, 500);
        return;
      }

      /* Prevent duplicate simultaneous requests */
      if (tokenRequestingRef.current) {
        console.log("Token request already in progress");
        return resolve(null);
      }

      tokenRequestingRef.current = true;
      let isResolved = false;
      let timeoutHandle = null;

      /* Setup callback that will be called when token is received */
      tokenCallbackRef.current = (token) => {
        if (!isResolved) {
          isResolved = true;
          tokenRequestingRef.current = false;
          if (timeoutHandle) clearTimeout(timeoutHandle);
          
          if (token) {
            console.log("Token obtained successfully");
          } else {
            console.warn("Token callback received null - user may have denied permission or network failed");
          }
          resolve(token || null);
        }
      };

      /* Safety timeout - if nothing happens in 10 seconds, fail */
      timeoutHandle = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          tokenRequestingRef.current = false;
          console.error("Token request timeout after 10s - no response from Google API");
          resolve(null);
        }
      }, 10000);

      try {
        /* First attempt: silent request (no UI prompt) */
        console.log("Attempting silent token request...");
        tokenClientRef.current.requestAccessToken({ prompt: "none" });

        /* Fallback: if silent fails, try with prompt after 2 seconds */
        setTimeout(() => {
          if (!isResolved && tokenRequestingRef.current) {
            console.log("Silent request timed out, trying with prompt...");
            try {
              tokenClientRef.current.requestAccessToken({ prompt: "" });
            } catch (err) {
              console.error("Fallback (prompted) token request error:", err);
              if (!isResolved) {
                isResolved = true;
                tokenRequestingRef.current = false;
                if (timeoutHandle) clearTimeout(timeoutHandle);
                resolve(null);
              }
            }
          }
        }, 2000);
      } catch (err) {
        console.error("Initial token request error (this may be expected if user hasn't interacted with login):", err);
        if (timeoutHandle) clearTimeout(timeoutHandle);
        isResolved = true;
        tokenRequestingRef.current = false;
        resolve(null);
      }
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
    
    /* Background token request is optional - will happen when Examiner loads */
    /* No need to block or require it at login time */
    
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
    tokenRequestingRef.current = false;
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, gsiReady, tok, requestSheetsToken }}>
      {children}
    </AuthContext.Provider>
  );
}
