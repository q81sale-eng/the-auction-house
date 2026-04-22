-- =============================================================================
-- Migration 011 — vault_watches: sold status, sold_price, sold_at
-- =============================================================================
-- Run in Supabase → SQL Editor → New Query
-- =============================================================================

ALTER TABLE vault_watches
  ADD COLUMN IF NOT EXISTS status     TEXT          NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS sold_price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS sold_at    TIMESTAMPTZ;

-- Back-fill existing rows
UPDATE vault_watches SET status = 'active' WHERE status IS NULL OR status = '';

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'vault_watches' AND column_name IN ('status','sold_price','sold_at')
ORDER BY column_name;
