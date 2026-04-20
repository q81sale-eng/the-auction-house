-- =============================================================================
-- Migration 004: Definitive auctions schema sync
-- Run this ONCE in Supabase → SQL Editor → New Query → RUN
-- Every ADD COLUMN IF NOT EXISTS is a no-op if the column already exists.
-- Safe to run multiple times on any installation.
-- =============================================================================

ALTER TABLE auctions
  -- ── Identifying info ──────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS title             TEXT,
  ADD COLUMN IF NOT EXISTS brand             TEXT,
  ADD COLUMN IF NOT EXISTS reference         TEXT,
  ADD COLUMN IF NOT EXISTS description       TEXT,
  ADD COLUMN IF NOT EXISTS condition         TEXT         DEFAULT 'excellent',
  ADD COLUMN IF NOT EXISTS status            TEXT         DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS slug              TEXT,

  -- ── Pricing ───────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS starting_price    DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_bid       DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS buy_now_price     DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS bid_increment     DECIMAL(12,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS deposit_required  DECIMAL(12,2) DEFAULT 0,

  -- ── Images ────────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS image_url         TEXT,

  -- ── Schedule ──────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS starts_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at           TIMESTAMPTZ,

  -- ── Counters ──────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS bids_count        INTEGER       DEFAULT 0,

  -- ── Ownership ─────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS seller_id         UUID,
  ADD COLUMN IF NOT EXISTS created_by        UUID,

  -- ── Timestamps ────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ   DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ   DEFAULT NOW();

-- Back-fill sensible defaults on rows that pre-date these columns
UPDATE auctions SET bid_increment    = 100 WHERE bid_increment    IS NULL;
UPDATE auctions SET deposit_required = 0   WHERE deposit_required IS NULL;
UPDATE auctions SET bids_count       = 0   WHERE bids_count       IS NULL;
UPDATE auctions SET starting_price   = 0   WHERE starting_price   IS NULL;

-- ── auction_images (multi-image support) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_images (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id  UUID        NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  image_url   TEXT        NOT NULL,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE auction_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'auction_images'
       AND policyname = 'auction_images_public_select'
  ) THEN
    CREATE POLICY "auction_images_public_select" ON auction_images
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'auction_images'
       AND policyname = 'auction_images_admin_all'
  ) THEN
    CREATE POLICY "auction_images_admin_all" ON auction_images
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles
           WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_auction_images_auction_id
  ON auction_images(auction_id, sort_order);

-- ── Reload PostgREST schema cache ────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
