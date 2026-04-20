-- =============================================================================
-- Migration 002: auction_images table + belt-and-suspenders bid_increment fix
-- =============================================================================
-- Run this in Supabase → SQL Editor → New query
-- Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- =============================================================================

-- 1. Ensure bid_increment exists on auctions (catches any missed migration 001)
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS bid_increment     DECIMAL(10,2) NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS deposit_required  DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS starts_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seller_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create auction_images table
CREATE TABLE IF NOT EXISTS auction_images (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id  UUID REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
  image_url   TEXT NOT NULL,
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row-level security
ALTER TABLE auction_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auction_images_public_select" ON auction_images
  FOR SELECT USING (true);

CREATE POLICY "auction_images_admin_all" ON auction_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 4. Index for fast per-auction image lookups
CREATE INDEX IF NOT EXISTS idx_auction_images_auction_id
  ON auction_images(auction_id, sort_order);

-- 5. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
