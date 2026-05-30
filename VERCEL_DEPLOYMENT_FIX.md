# Vercel Deployment Fix: Examiner Data Fetching

## Problem
The examiner section was not loading/fetching data when deployed to Vercel. This occurred because:

1. **CORS Issues**: Frontend was making direct requests to Google Sheets API (`sheets.googleapis.com`) from the browser, which violates CORS policies when deployed to Vercel domains.
2. **Authentication Token Exposure**: Bearer tokens were being sent directly from client-side code, which is a security risk and can fail in production environments.
3. **Client-Side API Dependency**: Direct reliance on Google Sheets API endpoints meant the app broke if Google changed API behavior or added restrictions.

## Solution
Implemented **Vercel Serverless Functions** as a backend proxy layer:

### Files Created
1. **`/api/sheets.js`** - Main proxy for Google Sheets API operations
   - Handles GET requests (sheetsGet)
   - Handles PUT requests (sheetsUpdate)
   - Handles POST requests (sheetsAppend)
   - All requests proxied through server-side functions

2. **`/api/sheets-ops.js`** - Complex operations proxy
   - Handles metadata queries (getMeta)
   - Sheet ID lookups (getSheetIdByName)
   - Batch updates (batchUpdate)
   - Row deletion/insertion operations

### Files Modified
1. **`/src/examiner/utils/sheets.js`** - Updated all API calls
   - Changed from direct Google Sheets API calls to `/api/*` endpoints
   - Maintained same function signatures (backward compatible)
   - Added `getApiBase()` helper to detect environment (localhost vs production)
   - All authentication now happens server-side

## How It Works

### Before (Broken)
```
Frontend → Google Sheets API
        (direct request with Bearer token)
        (CORS blocked on Vercel)
```

### After (Fixed)
```
Frontend → Vercel Function (/api/sheets) → Google Sheets API
        (POST request)              (Bearer token secure)
        (No CORS issues)            (Server-to-server communication)
```

## Benefits
✅ **No CORS Issues** - Server handles all cross-origin requests  
✅ **Secure Auth** - Tokens no longer exposed to client  
✅ **Production Ready** - Works on localhost and Vercel deployments  
✅ **Backward Compatible** - Function signatures unchanged  
✅ **Error Handling** - Proper error propagation through proxy  

## Testing Instructions

1. **Local Development** (should still work):
   ```bash
   npm run dev
   # API calls will route to http://localhost:5173/api/*
   ```

2. **Vercel Deployment** (now fixed):
   - Deploy to Vercel as usual
   - Examiner section should load data correctly
   - Check browser console for any errors

3. **Debug API Calls**:
   - Open DevTools → Network tab
   - Look for requests to `/api/sheets` and `/api/sheets-ops`
   - Verify responses contain data (not errors)

## Environment Detection
The `getApiBase()` function automatically detects the environment:
- **Localhost**: `http://localhost:PORT`
- **Production**: Uses same origin as deployment domain
- **Vercel**: Routes requests to `https://your-domain/api/*`

## Migration Notes
If you have other parts of the app making direct Google Sheets API calls, apply the same pattern:
1. Create a serverless function in `/api/`
2. Update client code to call the function instead
3. Move authentication token handling to the function
