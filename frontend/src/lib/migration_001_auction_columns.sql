-- =============================================================================
-- Migration 001: Add missing columns to auctions table
-- =============================================================================
-- Run this in Supabase → SQL Editor if auction creation fails with
-- "Could not find the 'ends_at' column of 'auctions'" (or similar).
--
-- Uses ADD COLUMN IF NOT EXISTS — safe to run on both new and existing tables.
-- =============================================================================

ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS starts_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bid_increment     DECIMAL(10,2) NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS deposit_required  DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Also ensure profiles has full_name and bio (in case older setup was run)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name  TEXT,
  ADD COLUMN IF NOT EXISTS bio        TEXT;

-- Back-fill full_name from name where full_name is still null
UPDATE profiles SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- Refresh PostgREST schema cache so the new columns are visible immediately
NOTIFY pgrst, 'reload schema';
