# Dexcom Integration - Pre-Flight Checklist

## ✅ Before Your Sister-in-Law Connects

### 1. Verify Vercel Environment Variables
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
```
VITE_DEXCOM_CLIENT_ID = [your client ID]
VITE_DEXCOM_CLIENT_SECRET = [your client secret]
VITE_DEXCOM_REDIRECT_URI = https://sentrya.com/api/dexcom/callback
VITE_DEXCOM_ENVIRONMENT = production (or sandbox for testing)
VITE_SUPABASE_URL = [your supabase URL]
VITE_SUPABASE_ANON_KEY = [your anon key]
```

### 2. Verify Dexcom Developer Portal Settings
Go to https://developer.dexcom.com

**Check:**
- [ ] OAuth App is ACTIVE (not deactivated)
- [ ] Redirect URI exactly matches: `https://sentrya.com/api/dexcom/callback`
- [ ] Using correct environment (production vs sandbox)
- [ ] Scopes include: `offline_access` (for refresh tokens)

### 3. Test the Serverless Functions
Open these URLs in browser (should NOT return 404):

```
https://sentrya.com/api/dexcom/authorize
https://sentrya.com/api/dexcom/callback
https://sentrya.com/api/dexcom/sync
```

**Expected:** 
- Should redirect or show JSON error (not 404)
- 404 = functions not deployed

### 4. Database Tables Ready
Go to Supabase → Table Editor

**Verify these tables exist:**
- [ ] `dexcom_connections`
- [ ] `dexcom_egvs`
- [ ] `glucose_readings`

**If missing:** Run the Dexcom migrations from earlier

### 5. Test with Your Own Account First
**Before** your sister-in-law tries:

1. Go to Settings → CGM Integration → Dexcom tab
2. Click "Connect Dexcom Account"
3. Log in with YOUR Dexcom account (if you have one)
4. Verify it works end-to-end

**If you don't have Dexcom:**
- Use Dexcom Sandbox with test account
- Environment variable: `VITE_DEXCOM_ENVIRONMENT=sandbox`

---

## 🎬 Day-Of Steps (When Sister-in-Law Tries)

### Pre-Connection
1. **Make sure she's on the latest version**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

2. **She should have:**
   - Active Dexcom account
   - Recent glucose readings in Dexcom Clarity
   - Know her Dexcom login credentials

### During Connection
**Watch for these potential issues:**

1. **Pop-up Blocker**
   - If button does nothing, check browser's pop-up blocker
   - Allow pop-ups for sentrya.com

2. **Wrong Credentials**
   - Make sure she's using DEXCOM credentials
   - Not Sentrya credentials
   - Not Dexcom Share follower credentials

3. **Redirect Loop**
   - If keeps going back to Dexcom login
   - Clear cookies for dexcom.com
   - Try incognito/private window

4. **"Invalid Redirect URI"**
   - Means Dexcom Developer Portal redirect doesn't match
   - Double-check it EXACTLY matches your Vercel function URL

### Post-Connection
1. **Verify Success Message**
   - Should see green notification: "Dexcom connected successfully!"
   - Connection status should show "Connected"

2. **Wait for Initial Sync**
   - Can take 2-5 minutes
   - Refresh page after a few minutes
   - Check Dashboard for glucose readings

3. **Verify Data**
   - Latest glucose reading should match her Dexcom app
   - Check source shows "dexcom" (not "manual")

---

## 🐛 Common First-Time Issues

### Issue: "Failed to connect to Dexcom"
**Likely Cause:** Environment variables wrong or missing

**Fix:**
1. Check Vercel env vars are deployed
2. Redeploy if you just added them
3. Wait 1-2 minutes for deployment to propagate

### Issue: Connection succeeds but no data
**Likely Cause:** Data sync hasn't run yet or failed

**Fix:**
1. Wait 5 minutes
2. Click "Sync Now" button manually
3. Check browser console for errors (F12)
4. Check Vercel Function Logs

### Issue: "This app is not authorized"
**Likely Cause:** Dexcom Developer App is in sandbox mode

**Fix:**
1. If using production Dexcom account:
   - Set `VITE_DEXCOM_ENVIRONMENT=production`
   - Use production Dexcom OAuth app
2. If using sandbox/testing:
   - Set `VITE_DEXCOM_ENVIRONMENT=sandbox`
   - Use sandbox credentials

---

## 📞 Support Script (What to Say)

**If she has issues, here's what to ask:**

1. **"What browser are you using?"**
   - Chrome/Firefox work best
   - Safari sometimes has cookie issues

2. **"Did you see the Dexcom login page?"**
   - YES = OAuth redirect working
   - NO = Check pop-up blocker or env vars

3. **"What error message do you see?"**
   - Screenshot is helpful
   - Exact wording matters

4. **"Can you open the browser console?" (F12)**
   - Look for red errors
   - Screenshot the console

5. **"What's your Dexcom account email?"**
   - Helps you check database for her connection
   - NEVER ask for password

---

## 🎯 Success Criteria

She should see:
- ✅ Green "Connected" status in CGM Settings
- ✅ Latest glucose reading on Dashboard (matches her Dexcom app)
- ✅ 7-day glucose chart populated
- ✅ Source labeled as "dexcom"
- ✅ Auto-sync happening every hour

---

## 🚨 Emergency Rollback

If things go completely wrong:

1. **Disable Dexcom Integration**
   - Comment out the Dexcom tab in CGMSettings.jsx
   - Push update to hide the feature temporarily

2. **Clear Her Data**
   ```sql
   DELETE FROM dexcom_connections WHERE user_id = '[her user id]';
   DELETE FROM glucose_readings WHERE user_id = '[her user id]' AND source = 'dexcom';
   ```

3. **Fix Issue**
   - Debug locally
   - Test with sandbox
   - Redeploy

4. **Re-enable**
   - Uncomment code
   - Push update
   - Have her try again

---

## 📊 Monitoring Dashboard

**While she's testing, watch:**

1. **Vercel Function Logs**
   - Vercel → Your Project → Functions
   - Filter by `/api/dexcom/`
   - Look for errors

2. **Supabase Logs**
   - Supabase → Logs
   - Filter by `dexcom_connections` table
   - Should see INSERT when she connects

3. **Browser DevTools**
   - Have her screen share if needed
   - Watch Network tab for failed requests

---

## ✨ Beta Tester Feedback Form

After she tries, ask:

1. How easy was the connection process? (1-10)
2. Did you encounter any errors?
3. How long did first sync take?
4. Does the data match your Dexcom app?
5. Is anything confusing?
6. What would make it better?

**Document all feedback for future users!**

---

Good luck! 🎉

**Remember:**
- Stay calm if something breaks
- Most issues are environment variables
- Worst case: rollback and fix later
- Best case: works perfectly and you have a happy beta tester!

---

**Contact Melanie:** (your phone/slack/discord)
**During Test Window:** Be available to help troubleshoot

