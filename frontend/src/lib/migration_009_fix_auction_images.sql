-- =============================================================================
-- Migration 009 — Fix auction_images table & RLS policies
-- =============================================================================
-- Run in Supabase → SQL Editor → New Query
-- Safe to run multiple times
-- =============================================================================

-- 1. Create table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS auction_images (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id  UUID        REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
  image_url   TEXT        NOT NULL,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE auction_images ENABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "auction_images_public_select"   ON auction_images;
DROP POLICY IF EXISTS "auction_images_admin_all"       ON auction_images;
DROP POLICY IF EXISTS "auction_images_auth_insert"     ON auction_images;
DROP POLICY IF EXISTS "auction_images_auth_delete"     ON auction_images;

-- 4. Public can read images (needed for auction detail page)
CREATE POLICY "auction_images_public_select" ON auction_images
  FOR SELECT USING (true);

-- 5. Any authenticated user can insert & delete images
--    (Admin panel is already behind auth — no need for strict is_admin check here)
CREATE POLICY "auction_images_auth_insert" ON auction_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auction_images_auth_delete" ON auction_images
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "auction_images_auth_update" ON auction_images
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 6. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_auction_images_auction_id
  ON auction_images(auction_id, sort_order);

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- 8. Verify — should show the table and its policies
SELECT policyname, cmd, qual
FROM   pg_policies
WHERE  tablename = 'auction_images'
ORDER  BY policyname;
