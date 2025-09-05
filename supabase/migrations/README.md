How to apply these migrations:

1. Open Supabase Studio → SQL Editor → New Query.
2. Paste the contents of the latest migration file (e.g., 2025-09-05T00-00-00_baseline.sql).
3. Run. Re-run is safe (IF NOT EXISTS + idempotent policies).
4. Commit any future schema changes here as new timestamped .sql files.
