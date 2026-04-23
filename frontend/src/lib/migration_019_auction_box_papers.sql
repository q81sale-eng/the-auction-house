-- Add box and papers columns to auctions table
ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS has_box    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_papers BOOLEAN NOT NULL DEFAULT false;
