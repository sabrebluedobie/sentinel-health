# Dexcom Integration - User Guide & Troubleshooting

## 🎯 Quick Start for New Users

### Step 1: Enable CGM Module
1. Go to **Settings** → **Modules**
2. Check the box for **"Glucose Tracking"**
3. Click **Save Changes**

### Step 2: Connect Dexcom
1. Go to **Settings** → **CGM Integration**
2. Click the **Dexcom** tab
3. Click **"Connect Dexcom Account"** button
4. You'll be redirected to Dexcom's login page
5. Log in with your Dexcom credentials
6. Click **"Authorize"** to allow Sentrya to access your glucose data
7. You'll be redirected back to Sentrya

### Step 3: Verify Connection
- You should see a green success message
- Your Dexcom connection status will show as **"Connected"**
- Glucose data will automatically sync every hour

---

## 🔍 Troubleshooting Guide

### Issue 1: "Connect Dexcom Account" Button Does Nothing
**Problem:** Clicking the button doesn't redirect to Dexcom

**Solutions:**
1. Check browser console for errors (F12 → Console tab)
2. Make sure pop-up blocker isn't blocking the redirect
3. Try a different browser (Chrome, Firefox, Safari)
4. Clear browser cache and cookies
5. Make sure you're using HTTPS (not HTTP)

**Expected Behavior:** Should redirect to `https://sandbox-api.dexcom.com/v2/oauth2/login` or `https://api.dexcom.com/v2/oauth2/login`

---

### Issue 2: "Authorization Failed" After Logging into Dexcom
**Problem:** Error message after clicking "Authorize" on Dexcom's page

**Common Causes:**
- **Invalid Redirect URI**: The redirect URL must exactly match what's registered in Dexcom Developer Portal
- **Wrong Environment**: Using sandbox credentials in production or vice versa
- **Expired Developer Account**: Dexcom developer accounts need periodic renewal

**Solutions:**
1. Verify the redirect URI in Dexcom Developer Portal matches:
   ```
   https://sentrya.com/api/dexcom/callback
   ```
   (or your actual domain)

2. Check which environment you're using:
   - **Sandbox** (testing): `sandbox-api.dexcom.com`
   - **Production** (real data): `api.dexcom.com`

3. Check environment variables on Vercel:
   - `VITE_DEXCOM_CLIENT_ID`
   - `VITE_DEXCOM_REDIRECT_URI`
   - `VITE_DEXCOM_ENVIRONMENT` (should be "production" or "sandbox")

---

### Issue 3: Connection Shows as "Connected" But No Data Appears
**Problem:** Successfully connected but glucose readings don't show up

**Check These:**

1. **Wait for Initial Sync**
   - First sync can take up to 5 minutes
   - Refresh the page after a few minutes

2. **Verify Data Exists in Dexcom**
   - Log into your Dexcom Clarity account
   - Make sure you have recent glucose readings there
   - Sentrya can only sync data that exists in Dexcom

3. **Check Token Expiration**
   - Dexcom tokens expire after 2 hours
   - Sentrya auto-refreshes them, but if it fails, disconnect and reconnect

4. **Manual Sync**
   - Click the **"Sync Now"** button in CGM Settings
   - Watch for success/error messages

5. **Check Database**
   - Go to Supabase Dashboard → Table Editor
   - Look at `glucose_readings` table
   - Filter by `user_id` and `source = 'dexcom'`
   - If data is there but not showing in app, it's a frontend issue

---

### Issue 4: "Invalid Token" or "Unauthorized" Errors
**Problem:** Connection was working but now shows errors

**Solutions:**

1. **Refresh Token Expired**
   - Dexcom refresh tokens expire after 90 days
   - Disconnect and reconnect your Dexcom account

2. **Dexcom Account Issue**
   - Make sure your Dexcom account is active
   - Try logging into Dexcom Clarity directly
   - If that fails, contact Dexcom support

3. **Developer App Deactivated**
   - Check Dexcom Developer Portal
   - Make sure the OAuth app is still active

---

### Issue 5: Data Syncing Stops After Working Initially
**Problem:** Was syncing fine, then stopped

**Checklist:**

1. **Check Connection Status**
   - Go to Settings → CGM Integration
   - Look for error messages
   - Connection status should be green

2. **Dexcom Service Outage**
   - Check Dexcom status page
   - Try accessing Dexcom Clarity web app

3. **Rate Limiting**
   - Dexcom limits API calls
   - Sentrya syncs every hour to stay within limits
   - If you manually sync too many times, you may hit rate limits

4. **Reconnect**
   - Click **"Disconnect"**
   - Wait 10 seconds
   - Click **"Connect Dexcom Account"** again

---

### Issue 6: Wrong Data Showing Up
**Problem:** Glucose readings seem incorrect or belong to someone else

**This Should NEVER Happen** - but if it does:

1. **Immediately Disconnect**
   - Click "Disconnect" in CGM Settings

2. **Clear Your Dexcom Data**
   - Go to Supabase Dashboard
   - Delete your records from `glucose_readings` table
   - Delete your record from `dexcom_connections` table

3. **Report the Bug**
   - Email: support@sentrya.com
   - Include: Time it happened, what you saw, your user email

4. **Reconnect Carefully**
   - Make sure you're logged into YOUR Dexcom account
   - Not someone else's on the same computer

---

## ✅ Expected Behavior (What Success Looks Like)

### Initial Connection
1. Click "Connect Dexcom Account"
2. Redirected to Dexcom login
3. Enter Dexcom credentials
4. Click "Authorize"
5. Redirected back to Sentrya
6. See green success message: "Dexcom connected successfully!"
7. Connection status shows green "Connected"

### Data Syncing
1. Initial sync happens within 5 minutes
2. Glucose readings appear in Dashboard
3. Charts update with Dexcom data (labeled as "dexcom" source)
4. Auto-sync every hour in background
5. Manual sync available anytime

### Glucose Data Display
- **Dashboard:** Latest reading + 7-day chart
- **Table:** All readings with timestamps
- **Source:** Shows "dexcom" vs "manual"
- **Trends:** Arrow indicators (↑↗→↘↓)

---

## 🔐 Privacy & Security

**What Sentrya Can Access:**
- Your glucose readings (last 90 days)
- Trend arrows
- Timestamps

**What Sentrya CANNOT Access:**
- Your Dexcom login password
- Other users' data
- Calibration data
- Transmitter info

**Data Storage:**
- All data encrypted in Supabase
- Row-level security enforced
- You can only see YOUR data
- Disconnect anytime to stop syncing

---

## 📊 Data Retention

**Dexcom API Limits:**
- Can fetch last 90 days of data
- Sentrya stores it indefinitely (unless you delete)

**Syncing:**
- Auto-sync: Every hour
- Keeps last 120 days in database (configurable)
- Older data auto-archived

---

## 🆘 Still Having Issues?

### Quick Diagnostic Checks

1. **Browser Console Errors**
   ```
   Press F12 → Console tab
   Look for red errors
   Take a screenshot
   ```

2. **Network Tab**
   ```
   F12 → Network tab
   Try connecting to Dexcom
   Look for failed requests (red)
   Check response codes (should be 200)
   ```

3. **Supabase Logs**
   ```
   Supabase Dashboard → Logs
   Filter by your user_id
   Look for errors in dexcom-related queries
   ```

### Contact Support
- **Email:** support@sentrya.com
- **Include:**
  - Browser & version (Chrome 120, Safari 17, etc)
  - Screenshot of error message
  - Console errors (if any)
  - When it started happening
  - Steps you've already tried

---

## 🎓 Training Video (Coming Soon)
We're creating a video walkthrough showing:
- How to connect Dexcom
- What to expect during sync
- How to troubleshoot common issues

---

## ⚙️ Advanced: Environment Variables

**For Developers/Admins Only**

These must be set in Vercel:

```bash
# Dexcom OAuth
VITE_DEXCOM_CLIENT_ID=your_client_id_here
VITE_DEXCOM_CLIENT_SECRET=your_client_secret_here
VITE_DEXCOM_REDIRECT_URI=https://sentrya.com/api/dexcom/callback

# Environment (sandbox or production)
VITE_DEXCOM_ENVIRONMENT=production

# Supabase (for serverless functions)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📝 Known Limitations

1. **Dexcom G6/G7 Only**: Requires compatible Dexcom CGM
2. **90-Day History**: Can only fetch last 90 days on first connect
3. **Hourly Sync**: Not real-time (updates every hour)
4. **Rate Limits**: Dexcom limits API calls per day
5. **Sandbox vs Production**: Must use correct environment

---

## 🚀 Future Enhancements

Planned features:
- Real-time sync (if Dexcom adds support)
- Notifications for high/low alerts
- Export glucose data to CSV
- Share data with healthcare providers
- Integration with Apple Health

---

**Last Updated:** December 31, 2024
**Version:** 1.0
**Support:** support@sentrya.com
