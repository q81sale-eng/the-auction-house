-- =============================================================================
-- Migration 005: admins table + RLS that lets users read their own admin row
-- Run this in Supabase → SQL Editor → New Query → Run
-- Safe to run multiple times.
-- =============================================================================

-- 1. Create the admins table if it doesn't already exist
CREATE TABLE IF NOT EXISTS admins (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT        NOT NULL UNIQUE,
  role       TEXT        NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 3. Allow any authenticated user to read rows where the email matches their own.
--    This is what lets checkAdminByEmail() work for the logged-in user.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'admins' AND policyname = 'admins_read_own'
  ) THEN
    CREATE POLICY "admins_read_own" ON admins
      FOR SELECT TO authenticated
      USING (email = auth.email());
  END IF;
END $$;

-- 4. Allow admin users to manage the table (insert/update/delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'admins' AND policyname = 'admins_admin_all'
  ) THEN
    CREATE POLICY "admins_admin_all" ON admins
      FOR ALL
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

-- 5. Ensure your admin account exists in the table
--    (replace with your actual email if different)
INSERT INTO admins (email, role)
VALUES ('q81sale@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 6. Also set is_admin = true directly on the profiles row as belt-and-suspenders
UPDATE profiles
SET is_admin = true
WHERE email = 'q81sale@gmail.com';

-- 7. Reload schema cache
NOTIFY pgrst, 'reload schema';
