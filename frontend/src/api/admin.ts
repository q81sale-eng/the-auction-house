import { supabase, supabaseUrl } from '../lib/supabase';
import { applyWatermark } from '../utils/watermark';

const PER_PAGE = 20;

function paginate<T>(data: T[] | null, count: number | null, page: number) {
  return {
    data: data ?? [],
    total: count ?? 0,
    last_page: Math.ceil((count ?? 0) / PER_PAGE),
    current_page: page,
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getAdminDashboard = async () => {
  const [auctionsRes, usersRes, bidsRes, recentAuctionsRes, recentUsersRes] = await Promise.all([
    supabase.from('auctions').select('status'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('bids').select('id', { count: 'exact', head: true }),
    supabase.from('auctions').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('id,name,email,is_admin,created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const statuses = auctionsRes.data ?? [];
  return {
    stats: {
      live_auctions:     statuses.filter(a => a.status === 'live').length,
      upcoming_auctions: statuses.filter(a => a.status === 'upcoming').length,
      total_auctions:    statuses.length,
      total_users:       usersRes.count ?? 0,
      total_bids:        bidsRes.count ?? 0,
    },
    recent_auctions: recentAuctionsRes.data ?? [],
    recent_users:    recentUsersRes.data ?? [],
  };
};

// ─── Auctions ─────────────────────────────────────────────────────────────────

export const getAdminAuctions = async (params?: { page?: number; status?: string }) => {
  const page = params?.page ?? 1;
  const from = (page - 1) * PER_PAGE;
  const to   = from + PER_PAGE - 1;

  let q = supabase.from('auctions').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
  if (params?.status) q = q.eq('status', params.status);

  const { data, count } = await q;
  return paginate(data, count, page);
};

export const getAuction = async (id: string) => {
  const { data, error } = await supabase.from('auctions').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

export const createAuction = async (payload: Record<string, any>) => {
  const { data: { user } } = await supabase.auth.getUser();
  const slug = `${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
  const insertRow = { ...payload, slug, seller_id: user?.id ?? null, created_by: user?.id ?? null, updated_at: new Date().toISOString() };

  // ── Debug: log which Supabase project and exactly what we're inserting ──────
  console.group('[createAuction] DEBUG');
  console.info('Supabase project URL :', supabaseUrl);
  console.info('Authenticated user ID:', user?.id ?? '(not signed in)');
  console.info('Insert payload        :', JSON.stringify(insertRow, null, 2));
  console.groupEnd();
  // ──────────────────────────────────────────────────────────────────────────

  const { data, error } = await supabase
    .from('auctions')
    .insert(insertRow)
    .select()
    .single();
  if (error) {
    console.error('[createAuction] Supabase error:', error);
    const e = new Error(error.message); (e as any).response = { data: { message: error.message } }; throw e;
  }
  return data;
};

export const updateAuction = async (id: string, payload: Record<string, any>) => {
  const { data, error } = await supabase
    .from('auctions')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) { const e = new Error(error.message); (e as any).response = { data: { message: error.message } }; throw e; }
  return data;
};

export const updateAuctionStatus = async (id: string, status: string) =>
  updateAuction(id, { status });

export const renewAuction = async (id: string, endsAt: string) =>
  updateAuction(id, { status: 'live', ends_at: endsAt });

export const deleteAuction = async (id: string) => {
  const { error } = await supabase.rpc('admin_delete_auction', { p_auction_id: id });
  if (error) throw new Error(error.message);
};

export const uploadAuctionImages = async (files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const watermarked = await applyWatermark(file);
    const ext  = file.name.split('.').pop() ?? 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('auction-images')
      .upload(path, watermarked, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data: { publicUrl } } = supabase.storage.from('auction-images').getPublicUrl(path);
    urls.push(publicUrl);
  }
  return urls;
};

export const getAuctionImages = async (auctionId: string) => {
  const { data, error } = await supabase
    .from('auction_images')
    .select('id, image_url, sort_order')
    .eq('auction_id', auctionId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const insertAuctionImages = async (auctionId: string, urls: string[]) => {
  if (!urls.length) return;
  const rows = urls.map((image_url, sort_order) => ({ auction_id: auctionId, image_url, sort_order }));
  const { error } = await supabase.from('auction_images').insert(rows);
  if (error) throw new Error(error.message);
};

export const deleteAllAuctionImages = async (auctionId: string) => {
  const { error } = await supabase.from('auction_images').delete().eq('auction_id', auctionId);
  if (error) throw new Error(error.message);
};

// ─── Marketplace Listings ─────────────────────────────────────────────────────

export const getAdminListings = async (params?: { page?: number }) => {
  const page = params?.page ?? 1;
  const from = (page - 1) * PER_PAGE;
  const to   = from + PER_PAGE - 1;
  const { data, count } = await supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  return paginate(data, count, page);
};

export const createListing = async (payload: Record<string, any>) => {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert(payload)
    .select()
    .single();
  if (error) { const e = new Error(error.message); (e as any).response = { data: { message: error.message } }; throw e; }
  return data;
};

export const updateListing = async (id: string, payload: Record<string, any>) => {
  const { error } = await supabase
    .from('marketplace_listings')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { const e = new Error(error.message); (e as any).response = { data: { message: error.message } }; throw e; }
};

export const deleteListing = async (id: string) => {
  const { error } = await supabase.from('marketplace_listings').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ─── Banners ──────────────────────────────────────────────────────────────────

export const getAdminBanners = async () => {
  const { data, error } = await supabase
    .from('banners').select('*').order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const createBanner = async (payload: Record<string, any>) => {
  const { data, error } = await supabase.from('banners').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateBanner = async (id: string, payload: Record<string, any>) => {
  const { error } = await supabase
    .from('banners').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteBanner = async (id: string) => {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const uploadBannerImage = async (file: File): Promise<string> => {
  const ext  = file.name.split('.').pop() ?? 'jpg';
  const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('auction-images')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data: { publicUrl } } = supabase.storage.from('auction-images').getPublicUrl(path);
  return publicUrl;
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const getAdminUsers = async (params?: { page?: number }) => {
  const page = params?.page ?? 1;
  const from = (page - 1) * PER_PAGE;
  const to   = from + PER_PAGE - 1;

  const { data, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  return paginate(data, count, page);
};

export const updateUser = async (id: string, payload: Record<string, any>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) { const e = new Error(error.message); (e as any).response = { data: { message: error.message } }; throw e; }
  return data;
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) { const e = new Error(error.message); (e as any).response = { data: { message: error.message } }; throw e; }
};

// ─── Bids ─────────────────────────────────────────────────────────────────────

export const getAdminBids = async (params?: { page?: number; auction_id?: string }) => {
  const page = params?.page ?? 1;
  const from = (page - 1) * PER_PAGE;
  const to   = from + PER_PAGE - 1;

  let q = supabase
    .from('bids')
    .select('id,amount,created_at,auction_id,user_id,auctions(title,brand),profiles(name,email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params?.auction_id) q = q.eq('auction_id', params.auction_id);

  const { data, count } = await q;
  return paginate(data, count, page);
};

// ─── Legacy exports (keep watch functions for AdminWatches compatibility) ─────

const emptyPage = { data: [] as any[], total: 0, last_page: 1, current_page: 1 };
export const getAdminWatches    = (_p?: any) => Promise.resolve(emptyPage);
export const createWatch        = (_d: any) => Promise.resolve({});
export const updateWatch        = (_id: any, _d: any) => Promise.resolve({});
export const deleteWatch        = (_id: any) => Promise.resolve({});
export const getAdminValuations = (_p?: any) => Promise.resolve(emptyPage);
export const createValuation    = (_d: any) => Promise.resolve({});

// ─── Catalog ──────────────────────────────────────────────────────────────────

export const getAdminCatalog = async () => {
  const { data, error } = await supabase
    .from('catalog_watches')
    .select('*')
    .order('brand', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const createCatalogWatch = async (payload: Record<string, any>) => {
  const { data, error } = await supabase.from('catalog_watches').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateCatalogWatch = async (id: string, payload: Record<string, any>) => {
  const { error } = await supabase.from('catalog_watches').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
};

export const deleteCatalogWatch = async (id: string) => {
  const { error } = await supabase.from('catalog_watches').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const uploadCatalogImage = async (file: File): Promise<string> => {
  const watermarked = await applyWatermark(file);
  const ext  = file.name.split('.').pop();
  const path = `catalog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('auction-images').upload(path, watermarked, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = supabase.storage.from('auction-images').getPublicUrl(path);
  return publicUrl;
};
