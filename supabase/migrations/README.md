# Migration Instructions

## What This Migration Does

This migration adds the missing columns to the `migraine_episodes` table that your LogMigraine form is trying to save. This will fix the data persistence issue.

### Added Columns:
- `duration_hours` - How long the migraine lasted
- `triggers` - Array of suspected triggers (stress, bright light, etc.)
- `medication_taken` - What medication was taken (e.g., "sumatriptan 50mg")
- `medication_effective` - Boolean: did the medication help?
- `source` - Where the data came from (manual, voice, import, etc.)

### Changed Columns:
- `symptoms` - Converted from `text` to `text[]` (array) to properly store comma-separated symptoms

### Bonus Features:
- Added indexes for better query performance
- Created a view called `migraine_medication_effectiveness` that shows:
  - Which medications you've tried
  - How many times you've taken each
  - Effectiveness percentage for each medication
  - Average pain level when taking each medication

## How to Run This Migration

### Option 1: Supabase CLI (Recommended)
```bash
cd /Users/melaniebrown/Sentinel-Health/sentinel-health
supabase db push
```

### Option 2: Manual (via Supabase Dashboard)
1. Go to https://supabase.com/dashboard
2. Select your project (gxstqtugvjwikiuznbfc)
3. Go to SQL Editor
4. Copy the contents of `supabase/migrations/2025-10-23T00-00-00_add-migraine-fields.sql`
5. Paste and run it

### Option 3: Direct SQL
If you have direct database access:
```bash
psql <your-connection-string> < supabase/migrations/2025-10-23T00-00-00_add-migraine-fields.sql
```

## After Running the Migration

Your LogMigraine form should now work correctly! All the medication fields will save properly.

You can also query the new medication effectiveness view:
```sql
SELECT * FROM migraine_medication_effectiveness;
```

This will show you which medications work best for you - perfect data for your neurologist!

## Files Changed
- ✅ Created: `supabase/migrations/2025-10-23T00-00-00_add-migraine-fields.sql`
- ✅ Fixed: `src/pages/LogMigraine.jsx` (column names now match database)
- ✅ Fixed: `vercel.json` (merged the two JSON objects)

## What Your Test Data Will Look Like

Your existing migraine episodes will:
- Keep all existing data (started_at, pain, notes)
- Have NULL values for the new fields (duration_hours, triggers, medication_taken, etc.)
- Have symptoms converted to an array (if they had commas, they'll be split properly)

New entries will have all the fields populated!