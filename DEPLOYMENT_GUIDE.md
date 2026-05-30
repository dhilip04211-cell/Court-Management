# Deployment Guide for Vercel Fix

## What Was Fixed
The examiner section wasn't loading data in Vercel because it was making direct frontend calls to Google Sheets API, which caused CORS errors. This has been fixed by creating a backend proxy layer.

## Steps to Deploy

### 1. Update Your Repository
```bash
git add api/ src/examiner/utils/sheets.js VERCEL_DEPLOYMENT_FIX.md
git commit -m "fix: Create Vercel serverless functions to proxy Google Sheets API

- Add /api/sheets.js for basic CRUD operations
- Add /api/sheets-ops.js for complex batch operations
- Update frontend to use /api/* endpoints instead of direct API calls
- Fixes CORS issues and improves security
- Works on both localhost and Vercel deployments"
git push origin main
```

### 2. Deploy to Vercel
If using Vercel CLI:
```bash
vercel deploy --prod
```

Or if using GitHub integration:
- Push to main branch
- Vercel will auto-deploy

### 3. Verify Deployment

**Check that examiner section works:**
1. Open your Vercel deployment URL
2. Navigate to Examiner section
3. Data should load (you'll see loading progress)
4. No CORS errors in browser console

**Check API calls:**
1. Open DevTools (F12)
2. Go to Network tab
3. Look for `/api/sheets` requests
4. Should see successful responses (status 200)

### 4. If Issues Persist

**Check Vercel Function Logs:**
1. Go to Vercel dashboard → your project
2. Click "Functions"
3. Check logs for `sheets.js` and `sheets-ops.js`
4. Look for error messages

**Check Google Sheets API:**
- Verify `SID` in `/src/examiner/constants/config.js` are correct
- Ensure Google OAuth credentials are valid
- Check that service account has access to those spreadsheets

**Enable Debug Logging:**
In browser console, the app will log all errors. Check for:
- `sheetsGet error`
- `sheetsUpdate error`
- `getSheetMeta error`

### 5. Environment Variables (If Needed)

Currently no environment variables are required as auth tokens come from the browser. If you want to change this:

1. Create `.env.local` for local development
2. Update Vercel environment variables in dashboard if needed

**Note:** Authentication is still OAuth-based from the browser; tokens are just now proxied securely through the backend.

## Rollback (If Needed)

If you encounter issues:
```bash
git revert HEAD
git push origin main
# Vercel will redeploy previous version
```

## Performance Expectations

- **Local dev**: No noticeable difference
- **Vercel prod**: Slightly faster (server-side request + proxy is usually faster than browser → Google directly)
- **Network tab**: One extra request per operation to `/api/sheets*`

## Support

For detailed technical info, see `VERCEL_DEPLOYMENT_FIX.md`
