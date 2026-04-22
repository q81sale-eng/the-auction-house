-- =============================================================================
-- Migration 014 — add retail_price to auctions and marketplace_listings
-- =============================================================================

ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS retail_price DECIMAL(12,2);

ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS retail_price DECIMAL(12,2);

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
