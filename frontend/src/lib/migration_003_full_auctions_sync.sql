-- =============================================================================
-- Migration 003: Full auctions table sync
-- Adds every column the frontend expects. Safe to run on ANY installation —
-- ADD COLUMN IF NOT EXISTS is a no-op when the column already exists.
-- Run this in Supabase → SQL Editor → New query
-- =============================================================================

ALTER TABLE auctions
  -- ── Core details ─────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS reference         TEXT,
  ADD COLUMN IF NOT EXISTS description       TEXT,
  ADD COLUMN IF NOT EXISTS condition         TEXT         DEFAULT 'excellent',
  ADD COLUMN IF NOT EXISTS status            TEXT         DEFAULT 'upcoming',

  -- ── Pricing ───────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS current_bid       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS buy_now_price     DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS bid_increment     DECIMAL(10,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS deposit_required  DECIMAL(10,2) DEFAULT 0,

  -- ── Image (legacy single-image column, still used as thumbnail fallback) ──
  ADD COLUMN IF NOT EXISTS image_url         TEXT,

  -- ── Schedule ──────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS starts_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at           TIMESTAMPTZ,

  -- ── Counters & routing ────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS bids_count        INT          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slug              TEXT,

  -- ── Ownership ─────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS seller_id         UUID,
  ADD COLUMN IF NOT EXISTS created_by        UUID,

  -- ── Timestamps ────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ  DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ  DEFAULT NOW();

-- Back-fill bid_increment = 100 on any rows where it is NULL
-- (rows inserted before this column existed)
UPDATE auctions SET bid_increment    = 100 WHERE bid_increment    IS NULL;
UPDATE auctions SET deposit_required = 0   WHERE deposit_required IS NULL;
UPDATE auctions SET bids_count       = 0   WHERE bids_count       IS NULL;

-- ── auction_images table (safe to re-run) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_images (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id  UUID        NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  image_url   TEXT        NOT NULL,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE auction_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'auction_images' AND policyname = 'auction_images_public_select'
  ) THEN
    CREATE POLICY "auction_images_public_select" ON auction_images
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'auction_images' AND policyname = 'auction_images_admin_all'
  ) THEN
    CREATE POLICY "auction_images_admin_all" ON auction_images
      FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_auction_images_auction_id
  ON auction_images(auction_id, sort_order);

-- ── Force PostgREST to reload its schema cache immediately ────────────────────
NOTIFY pgrst, 'reload schema';
