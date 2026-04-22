-- =============================================================================
-- Migration 010 — marketplace_listings table
-- =============================================================================
-- Run in Supabase → SQL Editor → New Query
-- =============================================================================

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  slug              TEXT          UNIQUE NOT NULL,
  title             TEXT          NOT NULL,
  brand             TEXT          NOT NULL DEFAULT '',
  model             TEXT,
  reference_number  TEXT,
  year              INT,
  movement          TEXT,
  case_material     TEXT,
  bracelet_material TEXT,
  dial_color        TEXT,
  case_diameter     DECIMAL(5,2),
  water_resistance  TEXT,
  power_reserve     TEXT,
  complications     TEXT,
  serial_number     TEXT,
  has_box           BOOLEAN       NOT NULL DEFAULT false,
  has_papers        BOOLEAN       NOT NULL DEFAULT false,
  condition         TEXT          NOT NULL DEFAULT 'excellent',
  description       TEXT,
  price             DECIMAL(12,2) NOT NULL DEFAULT 0,
  negotiable        BOOLEAN       NOT NULL DEFAULT false,
  status            TEXT          NOT NULL DEFAULT 'active',
  image_url         TEXT,
  seller_name       TEXT,
  seller_id         UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

-- RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_public_select"  ON marketplace_listings;
DROP POLICY IF EXISTS "listings_auth_insert"    ON marketplace_listings;
DROP POLICY IF EXISTS "listings_auth_update"    ON marketplace_listings;
DROP POLICY IF EXISTS "listings_auth_delete"    ON marketplace_listings;

CREATE POLICY "listings_public_select" ON marketplace_listings
  FOR SELECT USING (true);

CREATE POLICY "listings_auth_insert" ON marketplace_listings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "listings_auth_update" ON marketplace_listings
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "listings_auth_delete" ON marketplace_listings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Index
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status
  ON marketplace_listings(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_brand
  ON marketplace_listings(brand);

-- Reload schema
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'marketplace_listings' ORDER BY ordinal_position;
