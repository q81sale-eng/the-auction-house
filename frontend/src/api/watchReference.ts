import { supabase } from '../lib/supabase';

export interface WatchRefEntry {
  id: number;
  brand: string;
  brand_slug: string;
  model: string;
  model_slug: string;
  reference: string;
  material: string | null;
  case_size: string | null;
  bracelet: string | null;
  dial_color: string | null;
  year_from: number | null;
  year_to: number | null;
  movement: string | null;
  water_resistance: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface BrandSummary {
  brand: string;
  brand_slug: string;
  count: number;
}

export interface ModelSummary {
  model: string;
  model_slug: string;
  count: number;
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const getWatchBrands = async (): Promise<BrandSummary[]> => {
  const { data, error } = await supabase
    .from('watch_reference_catalog')
    .select('brand, brand_slug')
    .order('brand');
  if (error) throw new Error(error.message);
  const map = new Map<string, BrandSummary>();
  for (const row of (data ?? [])) {
    if (!map.has(row.brand_slug)) {
      map.set(row.brand_slug, { brand: row.brand, brand_slug: row.brand_slug, count: 0 });
    }
    map.get(row.brand_slug)!.count++;
  }
  return Array.from(map.values()).sort((a, b) => a.brand.localeCompare(b.brand));
};

export const getWatchModels = async (brandSlug: string): Promise<ModelSummary[]> => {
  const { data, error } = await supabase
    .from('watch_reference_catalog')
    .select('model, model_slug')
    .eq('brand_slug', brandSlug)
    .order('model');
  if (error) throw new Error(error.message);
  const map = new Map<string, ModelSummary>();
  for (const row of (data ?? [])) {
    if (!map.has(row.model_slug)) {
      map.set(row.model_slug, { model: row.model, model_slug: row.model_slug, count: 0 });
    }
    map.get(row.model_slug)!.count++;
  }
  return Array.from(map.values()).sort((a, b) => a.model.localeCompare(b.model));
};

export const getWatchReferences = async (brandSlug: string, modelSlug: string): Promise<WatchRefEntry[]> => {
  const { data, error } = await supabase
    .from('watch_reference_catalog')
    .select('*')
    .eq('brand_slug', brandSlug)
    .eq('model_slug', modelSlug)
    .order('reference');
  if (error) throw new Error(error.message);
  return (data ?? []) as WatchRefEntry[];
};

export const getAllWatchRefEntries = async (): Promise<WatchRefEntry[]> => {
  const { data, error } = await supabase
    .from('watch_reference_catalog')
    .select('*')
    .order('brand, model, reference');
  if (error) throw new Error(error.message);
  return (data ?? []) as WatchRefEntry[];
};

export const uploadWatchRefImage = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `watch-ref/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('vault-watches')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data: { publicUrl } } = supabase.storage.from('vault-watches').getPublicUrl(path);
  return publicUrl;
};

export const createWatchRefEntry = async (entry: Omit<WatchRefEntry, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('watch_reference_catalog')
    .insert([entry])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as WatchRefEntry;
};

export const updateWatchRefEntry = async (id: number, entry: Partial<Omit<WatchRefEntry, 'id' | 'created_at'>>) => {
  const { data, error } = await supabase
    .from('watch_reference_catalog')
    .update(entry)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as WatchRefEntry;
};

export const deleteWatchRefEntry = async (id: number) => {
  const { error } = await supabase
    .from('watch_reference_catalog')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
};
