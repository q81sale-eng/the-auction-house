-- =============================================================================
-- Migration 013 — add show_overlay column to banners
-- =============================================================================

ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS show_overlay BOOLEAN NOT NULL DEFAULT true;

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');
