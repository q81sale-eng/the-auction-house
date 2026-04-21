import { supabase } from '../lib/supabase';

function shapeAuction(a: any) {
  if (!a) return a;
  const dbImages: { path: string; alt_text: string }[] = (
    (a.auction_images ?? []) as { image_url: string; sort_order: number }[]
  )
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
    data: (data ?? []).map(shapeAuction),
    total: count ?? 0,
    last_page: Math.ceil((count ?? 0) / perPage),
    current_page: page,
  };
};

export const getAuction = async (slug: string) => {
  const { data, error } = await supabase
    .from('auctions')
    .select('*, auction_images(id, image_url, sort_order), bids(id, amount, created_at, user_id, profiles(name))')
    .eq('slug', slug)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...shapeAuction(data),
    bids: (data.bids ?? [])
      .sort((a: any, b: any) => Number(b.amount) - Number(a.amount))
      .map((b: any) => ({ ...b, user: b.profiles })),
    bids_count: data.bids?.length ?? 0,
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

export const placeBid = async (auctionId: string, amount: number) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('You must be signed in to bid');

  const { data: auction } = await supabase
    .from('auctions')
    .select('current_bid, starting_price, status')
    .eq('id', auctionId)
    .single();

  if (!auction || auction.status !== 'live') throw new Error('This auction is not live');
  const floor = Number(auction.current_bid ?? auction.starting_price);
  if (amount <= floor) throw new Error(`Bid must be greater than ${floor}`);

  const { data, error } = await supabase
    .from('bids')
    .insert({ auction_id: auctionId, user_id: user.id, amount })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from('auctions')
    .update({ current_bid: amount, bids_count: (auction as any).bids_count + 1, updated_at: new Date().toISOString() })
    .eq('id', auctionId);

  return data;
};

export const buyNow = async (auctionId: string) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('You must be signed in to purchase');

  const { data, error } = await supabase
    .from('auctions')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', auctionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};
