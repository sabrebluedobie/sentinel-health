# 🚀 Dexcom Setup for Vercel

## Where to Put Environment Variables

### **Vercel Dashboard** (Production)

1. Go to https://vercel.com
2. Click your project
3. Settings → Environment Variables
4. Add these variables:

```
DEXCOM_CLIENT_ID = your_client_id_here
DEXCOM_CLIENT_SECRET = your_client_secret_here  
DEXCOM_REDIRECT_URI = https://your-domain.com/api/dexcom/callback

SUPABASE_URL = your_supabase_url
SUPABASE_SERVICE_KEY = your_service_role_key
```

5. Click "Save"
6. Redeploy your site

---

### **Local Development** (.env file)

Create `.env` in your project root:

```bash
# Dexcom
DEXCOM_CLIENT_ID=your_client_id
DEXCOM_CLIENT_SECRET=your_client_secret
DEXCOM_REDIRECT_URI=http://localhost:5173/api/dexcom/callback

# Supabase (you probably already have these)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
```

Then restart your dev server:
```bash
npm run dev
```

---

## ✅ Quick Setup Checklist

**1. Database Migration**
```bash
# Run in Supabase SQL Editor:
/Users/bluedobiedev/Sentinel-Health/sentrya/supabase/migrations/2025-12-31T00-00-00_update-dexcom-integration.sql
```

**2. Vercel Environment Variables**
- Go to Vercel Dashboard
- Settings → Environment Variables  
- Add all 5 variables listed above
- Click "Save"
- Trigger a new deployment

**3. Update Router**
```jsx
// Add to your router:
import CGMSettings from '@/pages/CGMSettings';

<Route path="/settings/cgm" element={<CGMSettings />} />
```

**4. Test It**
```bash
# Start dev server
npm run dev

# Navigate to:
http://localhost:5173/settings/cgm

# Click "Connect Dexcom Account"
```

---

## 📁 Files Created (Vercel-compatible)

```
✅ api/dexcom/authorize.js    - OAuth start
✅ api/dexcom/callback.js     - OAuth callback  
✅ api/dexcom/sync.js         - Data sync
✅ src/hooks/useDexcom.js     - React hook
✅ src/components/DexcomConnection.jsx - UI
✅ src/pages/CGMSettings.jsx  - Settings page
```

---

## 🧪 Testing

**Test OAuth Flow:**
1. Go to /settings/cgm
2. Click "Connect Dexcom"
3. Should redirect to Dexcom login
4. After authorizing, check database:
   ```sql
   SELECT * FROM dexcom_connections;
   ```

**Test Sync:**
```bash
# In browser console or Postman:
POST /api/dexcom/sync
Content-Type: application/json

{
  "user_id": "your-user-uuid",
  "days": 7
}
```

---

## 🎯 That's It!

Your Dexcom integration is ready for Vercel! 🎉

**Environment variables go in:**
- ✅ Vercel Dashboard (for production)
- ✅ `.env` file (for local dev)
- ❌ NOT in your code
- ❌ NOT in git
