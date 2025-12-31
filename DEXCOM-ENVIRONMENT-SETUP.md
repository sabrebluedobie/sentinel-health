# Quick Dexcom Environment Setup

## Step 1: Set Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Click your **Sentrya** project
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)
5. Add these variables:

### Required Variables:

**VITE_DEXCOM_CLIENT_ID**
- Value: Your Dexcom OAuth Client ID from developer portal
- Example: `abc123xyz456`
- Environment: Production, Preview, Development (check all)

**VITE_DEXCOM_CLIENT_SECRET**
- Value: Your Dexcom OAuth Client Secret from developer portal  
- Example: `secret_abc123xyz456`
- Environment: Production, Preview, Development (check all)

**VITE_DEXCOM_REDIRECT_URI**
- Value: `https://sentrya.com/api/dexcom/callback`
- Environment: Production, Preview, Development (check all)
- NOTE: Must EXACTLY match what's in Dexcom Developer Portal

**VITE_DEXCOM_ENVIRONMENT**
- Value: `production` (for real Dexcom data)
- OR: `sandbox` (for testing only)
- Environment: Production, Preview, Development (check all)

### Click "Save" for each variable!

---

## Step 2: Get Your Dexcom OAuth Credentials

If you don't have them yet:

1. Go to https://developer.dexcom.com
2. Log in (or create developer account)
3. Create a new OAuth2 application
4. Fill in:
   - **Application Name:** Sentrya Health
   - **Redirect URI:** `https://sentrya.com/api/dexcom/callback`
   - **Environment:** Production (or Sandbox for testing)
5. Save and copy:
   - **Client ID** → Use for VITE_DEXCOM_CLIENT_ID
   - **Client Secret** → Use for VITE_DEXCOM_CLIENT_SECRET

---

## Step 3: Verify Deployment

After setting environment variables:

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments**
3. Click **Redeploy** on the latest deployment
   - OR make a small change and push to trigger new deployment
4. Wait for deployment to finish (~2 minutes)

---

## Step 4: Test Endpoints

Open these in your browser:

### Test 1: Authorize
```
https://sentrya.com/api/dexcom/authorize
```

✅ **GOOD:** Redirects to Dexcom login page
❌ **BAD:** Shows 404 error

### Test 2: Callback  
```
https://sentrya.com/api/dexcom/callback
```

✅ **GOOD:** Shows error like "Missing authorization code"
❌ **BAD:** Shows 404 error

### Test 3: Sync
```
https://sentrya.com/api/dexcom/sync
```

✅ **GOOD:** Shows error like "Unauthorized" or "Missing user_id"  
❌ **BAD:** Shows 404 error

---

## Step 5: Test in App

1. Go to https://sentrya.com
2. Log in
3. Settings → CGM Integration → Dexcom tab
4. Click "Connect Dexcom Account"
5. Should redirect to Dexcom login

---

## Troubleshooting

### Issue: Environment variables not working

**Fix:** After adding env vars, you MUST:
1. Redeploy from Vercel dashboard
2. OR push a new commit to trigger deployment
3. Wait for deployment to complete
4. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: 404 on all endpoints

**Cause:** Serverless functions not deployed

**Fix:**
1. Check that `/api/dexcom/*.js` files exist in your repo
2. Verify they're in the deployment (Vercel → Deployments → Browse Files)
3. Check `vercel.json` routes configuration

### Issue: "This app is not authorized"

**Cause:** Wrong environment setting

**Fix:**
- Using production Dexcom account? → `VITE_DEXCOM_ENVIRONMENT=production`
- Using sandbox/test account? → `VITE_DEXCOM_ENVIRONMENT=sandbox`
- They must match!

---

## Quick Reference

**Production Setup (Real Dexcom):**
```bash
VITE_DEXCOM_ENVIRONMENT=production
VITE_DEXCOM_REDIRECT_URI=https://sentrya.com/api/dexcom/callback
```

**Sandbox Setup (Testing Only):**
```bash
VITE_DEXCOM_ENVIRONMENT=sandbox
VITE_DEXCOM_REDIRECT_URI=https://sentrya.com/api/dexcom/callback
```

---

## Need Help?

1. Screenshot of Vercel environment variables page
2. Screenshot of Dexcom Developer Portal settings
3. Error message you're seeing
4. Which endpoint returns 404 (if any)

Send to: support@sentrya.com
