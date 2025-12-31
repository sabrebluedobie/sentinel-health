# How to Run Pending Migrations

You have 3 migrations that need to be run on your Supabase database:

1. `2025-12-31T00-00-00_add-dexcom-integration.sql` (Dexcom OAuth tables)
2. `2025-12-31T00-00-00_update-dexcom-integration.sql` (Dexcom updates)
3. `2025-12-31T01-00-00_add-medication-management.sql` (Medication tracking)

## ✅ Recommended Method: Supabase Dashboard

### Step 1: Go to SQL Editor
1. Open https://supabase.com/dashboard
2. Select your Sentrya project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run Dexcom Integration (Migration 1)
1. Click **+ New Query**
2. Copy the entire contents of:
   ```
   supabase/migrations/2025-12-31T00-00-00_add-dexcom-integration.sql
   ```
3. Paste into the SQL editor
4. Click **Run** (or press Cmd+Enter)
5. Wait for "Success. No rows returned"

### Step 3: Run Dexcom Update (Migration 2)
1. Click **+ New Query** again
2. Copy the entire contents of:
   ```
   supabase/migrations/2025-12-31T00-00-00_update-dexcom-integration.sql
   ```
3. Paste into the SQL editor
4. Click **Run**
5. Wait for success message

### Step 4: Run Medication Management (Migration 3)
1. Click **+ New Query** again
2. Copy the entire contents of:
   ```
   supabase/migrations/2025-12-31T01-00-00_add-medication-management.sql
   ```
3. Paste into the SQL editor
4. Click **Run**
5. Wait for success message

### Step 5: Verify Tables Were Created
1. Click **Table Editor** in the left sidebar
2. You should see new tables:
   - `dexcom_connections`
   - `dexcom_egvs` (glucose readings from Dexcom)
   - `medications`
   - `medication_logs`

## ⚠️ Common Errors

**"relation already exists"**: Table already created, you can skip that migration

**"syntax error"**: Make sure you copied the ENTIRE file contents, including all the comments at the top

**"permission denied"**: Make sure you're using the SQL Editor, not the table editor

## 🎉 After Running Migrations

Once all 3 migrations are successful:
1. Refresh your Sentrya app
2. Go to `/medication` route
3. Try adding a medication
4. Go to Settings → CGM Integration to connect Dexcom

The 406 errors will disappear!
