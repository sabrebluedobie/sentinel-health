# Dexcom Integration - Quick Troubleshooting Flowchart

## START HERE: User Clicks "Connect Dexcom Account"

### ❓ Does clicking the button do anything?

**NO** → Button does nothing, page doesn't change
- ✅ Check browser console (F12) for errors
- ✅ Disable pop-up blocker for sentrya.com
- ✅ Try different browser (Chrome, Firefox)
- ✅ Verify Vercel environment variables are set
- ✅ Check `/api/dexcom/authorize` endpoint exists (not 404)

**YES** → Redirects somewhere
- Continue to next question ↓

---

### ❓ Where does it redirect to?

**DEXCOM LOGIN PAGE** (api.dexcom.com or sandbox-api.dexcom.com)
- ✅ GOOD! OAuth is working
- Continue to next question ↓

**ERROR PAGE** or stays on Sentrya
- ✅ Check VITE_DEXCOM_CLIENT_ID is correct
- ✅ Check VITE_DEXCOM_REDIRECT_URI matches Dexcom Developer Portal
- ✅ Check VITE_DEXCOM_ENVIRONMENT (production vs sandbox)
- ✅ Verify Dexcom OAuth app is ACTIVE in developer portal

**404 PAGE**
- ✅ Vercel serverless functions not deployed
- ✅ Check `/api/dexcom/` folder exists in deployment
- ✅ Redeploy from Vercel dashboard

---

### ❓ Can user log into Dexcom?

**NO** → Login fails
- ✅ Verify user has active Dexcom account
- ✅ Try logging into Dexcom Clarity directly (clarity.dexcom.com)
- ✅ Reset Dexcom password if needed
- ✅ NOT a Sentrya issue - Dexcom account problem

**YES** → Login successful
- Continue to next question ↓

---

### ❓ Does "Authorize" button appear after login?

**NO** → Stuck on login page or error
- ✅ Clear Dexcom cookies
- ✅ Try incognito/private window
- ✅ Check VITE_DEXCOM_CLIENT_ID is valid
- ✅ Check OAuth app status in Dexcom Developer Portal

**YES** → "Authorize" button shows
- Continue to next question ↓

---

### ❓ What happens after clicking "Authorize"?

**REDIRECTS BACK TO SENTRYA** → Good!
- Continue to next question ↓

**ERROR: "Invalid Redirect URI"**
- ✅ VITE_DEXCOM_REDIRECT_URI doesn't match Dexcom Developer Portal
- ✅ Must be EXACT match (including https://, trailing slashes, etc)
- ✅ Example: `https://sentrya.com/api/dexcom/callback`

**ERROR: "This app is not authorized"**
- ✅ Using production account with sandbox environment (or vice versa)
- ✅ Check VITE_DEXCOM_ENVIRONMENT matches account type
- ✅ Or Dexcom OAuth app is deactivated

**REDIRECT LOOP** → Keeps going back to Dexcom
- ✅ Clear all cookies for dexcom.com
- ✅ Try incognito window
- ✅ Check callback function is handling code parameter correctly

---

### ❓ After redirect back to Sentrya, what shows?

**GREEN SUCCESS MESSAGE: "Dexcom connected successfully!"**
- ✅ PERFECT! Connection successful
- Continue to next question ↓

**RED ERROR MESSAGE**
- Read the exact error message
- Common errors:
  - "Failed to exchange code for token" → Check VITE_DEXCOM_CLIENT_SECRET
  - "Database error" → Check dexcom_connections table exists
  - "Failed to save connection" → Check RLS policies on dexcom_connections

**NO MESSAGE** → Silent failure
- ✅ Check browser console (F12) for errors
- ✅ Check Vercel function logs
- ✅ Check Supabase logs

---

### ❓ Does connection status show "Connected"?

**NO** → Shows "Not Connected" or error
- ✅ Database insert failed
- ✅ Check dexcom_connections table
- ✅ Check RLS policies allow INSERT
- ✅ Check user_id is correct

**YES** → Shows green "Connected"
- ✅ GOOD! Database connection saved
- Continue to next question ↓

---

### ❓ Do glucose readings appear within 5 minutes?

**YES** → Data appears on Dashboard
- ✅ **SUCCESS!** Integration working perfectly 🎉
- ✅ Verify data matches Dexcom app
- ✅ Check source shows "dexcom"

**NO** → No data after 5+ minutes
- Continue to troubleshooting ↓

---

## Data Not Appearing - Troubleshooting

### Step 1: Check if user HAS glucose data in Dexcom
- ✅ Log into Dexcom Clarity (clarity.dexcom.com)
- ✅ Verify recent readings exist there
- ✅ If no data in Clarity, Sentrya can't sync it

### Step 2: Manually trigger sync
- ✅ Click "Sync Now" button in CGM Settings
- ✅ Watch for error messages
- ✅ Check browser console for errors

### Step 3: Check Vercel function logs
- ✅ Vercel Dashboard → Functions → Filter by "dexcom"
- ✅ Look for errors in `/api/dexcom/sync`
- ✅ Common errors:
  - "Invalid token" → Token expired, reconnect
  - "Rate limit" → Wait an hour, Dexcom limits API calls
  - "No data found" → User has no recent glucose readings

### Step 4: Check Supabase database
- ✅ Supabase → Table Editor → `glucose_readings`
- ✅ Filter: `user_id = '[user's id]' AND source = 'dexcom'`
- ✅ If data EXISTS in database but not showing in app:
  - Frontend display issue, not API issue
  - Check Dashboard.jsx query
  - Check glucose chart component

### Step 5: Check token validity
- ✅ Supabase → Table Editor → `dexcom_connections`
- ✅ Find user's row
- ✅ Check `access_token_expires_at`
- ✅ If expired and not refreshing:
  - Disconnect and reconnect
  - Check refresh token logic in sync function

---

## Common Error Messages & Fixes

### "Failed to connect to Dexcom"
**Cause:** OAuth authorization failed  
**Fix:** Check environment variables, try again

### "Invalid token"
**Cause:** Access token expired  
**Fix:** Disconnect and reconnect

### "Rate limit exceeded"
**Cause:** Too many API calls to Dexcom  
**Fix:** Wait 1 hour, then try sync again

### "No data found"
**Cause:** User has no glucose readings in Dexcom  
**Fix:** Verify data exists in Dexcom Clarity

### "Database error"
**Cause:** Table doesn't exist or RLS blocking  
**Fix:** Run Dexcom migrations, check RLS policies

### "This app is not authorized"
**Cause:** Wrong environment or deactivated OAuth app  
**Fix:** Check VITE_DEXCOM_ENVIRONMENT, verify app is active

---

## Quick Diagnostic Commands

### Check if tables exist (Supabase SQL Editor)
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'dexcom%';
```

### Check user's connection status
```sql
SELECT * FROM dexcom_connections 
WHERE user_id = '[user's uuid]';
```

### Check user's glucose readings
```sql
SELECT COUNT(*), MIN(device_time), MAX(device_time)
FROM glucose_readings 
WHERE user_id = '[user's uuid]' 
  AND source = 'dexcom';
```

### Test token expiration
```sql
SELECT 
  user_id,
  access_token_expires_at,
  access_token_expires_at < NOW() as is_expired
FROM dexcom_connections;
```

---

## Emergency Fixes

### Fix 1: Reset user's connection
```sql
DELETE FROM dexcom_connections WHERE user_id = '[user's uuid]';
```
Then have user reconnect.

### Fix 2: Clear user's Dexcom data
```sql
DELETE FROM glucose_readings 
WHERE user_id = '[user's uuid]' 
  AND source = 'dexcom';
```

### Fix 3: Force token refresh
Update `access_token_expires_at` to past date:
```sql
UPDATE dexcom_connections 
SET access_token_expires_at = NOW() - INTERVAL '1 hour'
WHERE user_id = '[user's uuid]';
```
Then trigger sync.

---

## Still Stuck?

### Gather this info:
1. Browser & version
2. Exact error message (screenshot)
3. Browser console errors (screenshot)
4. Vercel function logs (screenshot)
5. Supabase connection status (screenshot)
6. User's Dexcom account type (production vs sandbox)

### Contact:
- Email: support@sentrya.com
- Attach all screenshots and info above

---

**Last Updated:** December 31, 2024
