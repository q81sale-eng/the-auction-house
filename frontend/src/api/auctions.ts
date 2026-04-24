import { supabase } from '../lib/supabase';

function shapeAuction(a: any, auctionImages?: { image_url: string; sort_order: number }[]) {
  if (!a) return a;

  const rows = auctionImages ?? (a.auction_images ?? []);
  const dbImages: { path: string; alt_text: string }[] = (rows as { image_url: string; sort_order: number }[])
    .sort((x, y) => x.sort_order - y.sort_order)
    .map(img => ({ path: img.image_url, alt_text: a.title }));

  // Fallback: if no auction_images rows, use legacy image_url column
  const images = dbImages.length > 0
    ? dbImages
    : (a.image_url ? [{ path: a.image_url, alt_text: a.title }] : []);

  return {
    ...a,
    bid_increment: a.bid_increment ?? 100,
    watch: {
      brand: a.brand,
      model: a.title,
      reference_number: a.reference,
      condition: a.condition,
      has_box: a.has_box ?? false,
      has_papers: a.has_papers ?? false,
      primary_image: images[0] ?? undefined,
      images,
    },
  };
}

export const getAuctions = async (params?: Record<string, any>) => {
  const page = params?.page ?? 1;
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let q = supabase
    .from('auctions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params?.status) q = q.eq('status', params.status);
  if (params?.brand) q = q.eq('brand', params.brand);
  if (params?.min_price) q = q.gte('starting_price', params.min_price);
  if (params?.max_price) q = q.lte('starting_price', params.max_price);

  const { data, count, error } = await q;
  if (error) {
    console.error('[getAuctions] Supabase error:', error.message, error);
    throw new Error(error.message);
  }

  console.info('[getAuctions] rows returned:', data?.length ?? 0, '| total count:', count, '| params:', params);

  return {
    data: (data ?? []).map((a: any) => shapeAuction(a)),
    total: count ?? 0,
    last_page: Math.ceil((count ?? 0) / perPage),
    current_page: page,
  };
};

export const getAuction = async (slug: string) => {
  // Bare auction fetch — no joins to avoid RLS failures
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('[getAuction] fetch failed:', error.message, error);
    throw new Error(error.message);
  }

  // Fetch images and bids in parallel — both are independent queries
  const [imagesResult, bidsResult] = await Promise.all([
    supabase
      .from('auction_images')
      .select('image_url, sort_order')
      .eq('auction_id', data.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('bids')
      .select('id, amount, created_at, user_id')
      .eq('auction_id', data.id)
      .order('amount', { ascending: false }),
  ]);

  if (imagesResult.error) console.warn('[getAuction] images fetch error:', imagesResult.error.message);
  if (bidsResult.error)  console.warn('[getAuction] bids fetch error:',   bidsResult.error.message);

  const auctionImages = imagesResult.data ?? [];
  const bidsData      = bidsResult.data   ?? [];

  return {
    ...shapeAuction(data, auctionImages),
    bids: bidsData,
    bids_count: bidsData.length,
  };
};

export const getBidHistory = async (auctionId: string, params?: Record<string, any>) => {
  const { data, error } = await supabase
    .from('bids')
    .select('*, profiles(name)')
    .eq('auction_id', auctionId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return { data: data ?? [] };
};

export const placeBid = async (auctionId: string, amount: number, userId?: string, refreshToken?: string) => {
  let { data: { session } } = await supabase.auth.getSession();

  // If session missing but we have a refresh token, restore it
  if (!session && refreshToken) {
    const stored = localStorage.getItem('auth_token');
    if (stored && refreshToken) {
      const { data: refreshed } = await supabase.auth.setSession({
        access_token: stored,
        refresh_token: refreshToken,
      });
      session = refreshed.session;
    }
  }

  let uid: string | undefined = userId || session?.user?.id;

  console.log('[placeBid] userId:', userId, '| session uid:', session?.user?.id, '| uid:', uid);

  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    uid = user?.id;
  }

  if (!uid) throw new Error('You must be signed in to bid');

  const { data: auction } = await supabase
    .from('auctions')
    .select('current_bid, starting_price, status')
    .eq('id', auctionId)
    .single();

  if (!auction) throw new Error('Auction not found');
  if (auction.status !== 'live') throw new Error(`Auction is not live (status: ${auction.status})`);
  const floor = Number(auction.current_bid ?? auction.starting_price);
  if (amount <= floor) throw new Error(`Bid must be greater than ${floor}`);

  const { data, error } = await supabase
    .from('bids')
    .insert({ auction_id: auctionId, user_id: uid, amount })
    .select()
    .single();
  if (error) {
    console.error('[placeBid] insert error:', error);
    throw new Error(error.message);
  }

  // Update current bid and counter — ignore error if column name differs
  const currentCount = (auction as any).bids_count ?? (auction as any).bid_count ?? 0;
  await supabase
    .from('auctions')
    .update({ current_bid: amount, bids_count: currentCount + 1, updated_at: new Date().toISOString() })
    .eq('id', auctionId);

  return data;
};

export const buyNow = async (auctionId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('You must be signed in to purchase');

  const { data, error } = await supabase
    .from('auctions')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', auctionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};
