-- Create a secure server-side function to delete an auction
-- SECURITY DEFINER = runs as the DB owner, bypassing RLS
-- Still checks that the caller is an admin before deleting

CREATE OR REPLACE FUNCTION admin_delete_auction(p_auction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM bids          WHERE auction_id = p_auction_id;
  DELETE FROM auction_images WHERE auction_id = p_auction_id;
  DELETE FROM auctions       WHERE id         = p_auction_id;
END;
$$;

-- Grant execution to authenticated users (the function itself checks admin)
GRANT EXECUTE ON FUNCTION admin_delete_auction(UUID) TO authenticated;
