-- Supabase RLS lockdown for the Prisma-managed public schema.
-- MANUAL ONLY: not run by the build. Review, then run in Supabase -> SQL Editor
-- after owner approval. Reversible (see ROLLBACK at the bottom). Deletes no data.
--
-- Why: the app reaches Postgres only server-side through Prisma (DATABASE_URL).
-- Supabase also exposes every public table through its REST/GraphQL API to the
-- `anon` and `authenticated` roles. With RLS disabled, anyone holding the
-- project's anon key can read/write those tables directly, bypassing all
-- per-user checks in the app. Enabling RLS with no policies denies those roles
-- everything, while the table owner (the role Prisma connects as) is unaffected
-- because RLS is enabled but not FORCED.

-- STEP 1 (run first, read-only): confirm Prisma's role owns the tables or bypasses RLS.
-- Every row must show owner_is_current_user = true OR current_user_bypasses_rls = true.
-- If not, STOP: enabling RLS would block the app.
SELECT c.relname AS table_name,
       pg_get_userbyid(c.relowner) = current_user AS owner_is_current_user,
       (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS current_user_bypasses_rls,
       c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY 1;

-- STEP 2: enable RLS on every public table and remove API-role access.
BEGIN;
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
COMMIT;

-- STEP 3 (verify): should return zero rows.
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;

-- Tables created later by `prisma db push` start with RLS disabled; re-run STEP 2
-- after schema changes, or check Supabase -> Advisors -> Security.

-- ROLLBACK (only if the app loses database access):
-- DO $$ DECLARE t record; BEGIN
--   FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
--     EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.tablename);
--   END LOOP; END $$;
