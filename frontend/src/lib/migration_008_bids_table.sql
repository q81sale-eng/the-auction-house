-- =============================================================================
-- Migration 008 — bids table
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query → paste → Run
-- =============================================================================

CREATE TABLE IF NOT EXISTS bids (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id  UUID        NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id),
  amount      DECIMAL(12,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Anyone can view bids (public bid history)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bids' AND policyname='bids_public_select') THEN
    CREATE POLICY "bids_public_select" ON bids
      FOR SELECT USING (true);
  END IF;
END $$;

-- Authenticated users can insert their own bids
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bids' AND policyname='bids_insert_own') THEN
    CREATE POLICY "bids_insert_own" ON bids
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Admins can manage all bids
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bids' AND policyname='bids_admin_all') THEN
    CREATE POLICY "bids_admin_all" ON bids
      FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'bids' ORDER BY ordinal_position;
