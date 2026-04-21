-- =============================================================================
-- Migration 007 — Valuation Requests system
--
-- Creates two tables:
--   vault_watches       — watches submitted by users for valuation
--   valuation_requests  — valuation requests linked to vault_watches
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query → paste → Run
-- =============================================================================

-- ── 1. vault_watches ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vault_watches (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand            TEXT        NOT NULL DEFAULT '',
  model            TEXT,
  reference_number TEXT,
  year             INTEGER,
  condition        TEXT        DEFAULT 'good',
  description      TEXT,
  image_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vault_watches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vault_watches' AND policyname='vault_watches_owner_all') THEN
    CREATE POLICY "vault_watches_owner_all" ON vault_watches
      FOR ALL TO authenticated
      USING  (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vault_watches' AND policyname='vault_watches_admin_all') THEN
    CREATE POLICY "vault_watches_admin_all" ON vault_watches
      FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

-- ── 2. valuation_requests ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS valuation_requests (
  id                BIGSERIAL PRIMARY KEY,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_id          BIGINT      REFERENCES vault_watches(id) ON DELETE SET NULL,
  status            TEXT        NOT NULL DEFAULT 'pending',
  valuation_amount  DECIMAL(12,2),
  valuation_notes   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE valuation_requests ENABLE ROW LEVEL SECURITY;

-- Users can manage their own requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='valuation_requests' AND policyname='valuation_requests_owner_all') THEN
    CREATE POLICY "valuation_requests_owner_all" ON valuation_requests
      FOR ALL TO authenticated
      USING  (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Admin can read and update all requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='valuation_requests' AND policyname='valuation_requests_admin_all') THEN
    CREATE POLICY "valuation_requests_admin_all" ON valuation_requests
      FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;

-- ── 3. Reload schema cache ────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- ── 4. Verify ─────────────────────────────────────────────────────────────────

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('vault_watches', 'valuation_requests')
ORDER BY table_name, ordinal_position;
