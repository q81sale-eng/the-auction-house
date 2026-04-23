-- Run this in Supabase SQL Editor to fix auction delete

-- 1. Add auction_images DELETE policy if missing
DROP POLICY IF EXISTS "admin_delete_auction_images" ON auction_images;
CREATE POLICY "admin_delete_auction_images" ON auction_images
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 2. Verify RLS is enabled on all tables
ALTER TABLE auction_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids            ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions        ENABLE ROW LEVEL SECURITY;
