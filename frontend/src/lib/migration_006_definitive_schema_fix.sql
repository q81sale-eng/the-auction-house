-- =============================================================================
-- Migration 006 — Definitive auctions schema fix
-- Uses information_schema to check each column before adding it.
-- More reliable than ADD COLUMN IF NOT EXISTS on older PostgreSQL versions.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query → paste this file → Run
--
-- AFTER RUNNING:
--   Go to Supabase Dashboard → Settings → API → click "Restart" (or reload)
--   This forces PostgREST to pick up the new columns immediately.
-- =============================================================================

DO $$
DECLARE
  t TEXT := 'auctions';
BEGIN

  -- ── Core details ────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='title') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN title TEXT';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='brand') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN brand TEXT NOT NULL DEFAULT ''''';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='reference') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN reference TEXT';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='description') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN description TEXT';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='condition') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN condition TEXT DEFAULT ''excellent''';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='status') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN status TEXT DEFAULT ''upcoming''';
  END IF;

  -- ── Pricing ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='starting_price') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN starting_price DECIMAL(12,2) NOT NULL DEFAULT 0';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='current_bid') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN current_bid DECIMAL(12,2)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='buy_now_price') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN buy_now_price DECIMAL(12,2)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='bid_increment') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN bid_increment DECIMAL(12,2) NOT NULL DEFAULT 100';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='deposit_required') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN deposit_required DECIMAL(12,2) NOT NULL DEFAULT 0';
  END IF;

  -- ── Images ──────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='image_url') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN image_url TEXT';
  END IF;

  -- ── Schedule ────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='starts_at') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN starts_at TIMESTAMPTZ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='ends_at') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN ends_at TIMESTAMPTZ';
  END IF;

  -- ── Routing & counters ──────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='slug') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN slug TEXT';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='bids_count') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN bids_count INTEGER NOT NULL DEFAULT 0';
  END IF;

  -- ── Ownership ───────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='seller_id') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN seller_id UUID';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN created_by UUID';
  END IF;

  -- ── Timestamps ──────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='created_at') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW()';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name=t AND column_name='updated_at') THEN
    EXECUTE 'ALTER TABLE auctions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW()';
  END IF;

END $$;

-- Back-fill sensible defaults on rows that pre-date the columns
UPDATE auctions SET bid_increment    = 100       WHERE bid_increment    IS NULL;
UPDATE auctions SET deposit_required = 0         WHERE deposit_required IS NULL;
UPDATE auctions SET bids_count       = 0         WHERE bids_count       IS NULL;
UPDATE auctions SET starting_price   = 0         WHERE starting_price   IS NULL;
UPDATE auctions SET status           = 'upcoming' WHERE status           IS NULL;
UPDATE auctions SET condition        = 'excellent' WHERE condition        IS NULL;

-- ── Reload PostgREST schema cache (two methods for reliability) ──────────────
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- ── Verify: show all auctions columns after migration ────────────────────────
SELECT column_name, data_type, column_default
FROM   information_schema.columns
WHERE  table_name = 'auctions'
ORDER  BY ordinal_position;
