-- Allow authenticated admins to delete from all main tables

-- Auctions
DROP POLICY IF EXISTS "admin_delete_auctions" ON auctions;
CREATE POLICY "admin_delete_auctions" ON auctions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Bids
DROP POLICY IF EXISTS "admin_delete_bids" ON bids;
CREATE POLICY "admin_delete_bids" ON bids
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Marketplace listings
DROP POLICY IF EXISTS "admin_delete_listings" ON marketplace_listings;
CREATE POLICY "admin_delete_listings" ON marketplace_listings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Banners
DROP POLICY IF EXISTS "admin_delete_banners" ON banners;
CREATE POLICY "admin_delete_banners" ON banners
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Valuation requests
DROP POLICY IF EXISTS "admin_delete_valuation_requests" ON valuation_requests;
CREATE POLICY "admin_delete_valuation_requests" ON valuation_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
