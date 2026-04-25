import { supabase } from '../lib/supabase';

export interface PriceIndexEntry {
  id: number;
  brand: string;
  model: string | null;
  reference_number: string | null;
  condition: string | null;
  sale_price: number;
  sale_date: string;
  image_url: string | null;
  notes: string | null;
  created_at: string;
}

export const uploadPriceIndexImage = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `price-index/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('vault-watches')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data: { publicUrl } } = supabase.storage.from('vault-watches').getPublicUrl(path);
  return publicUrl;
};

export const searchPriceIndex = async (q: string): Promise<PriceIndexEntry[]> => {
  const term = q.trim();
  if (!term) return [];
  const like = `%${term}%`;
  const { data, error } = await supabase
    .from('price_index')
    .select('*')
    .or(`brand.ilike.${like},model.ilike.${like},reference_number.ilike.${like}`)
    .order('sale_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const getAllPriceIndex = async (): Promise<PriceIndexEntry[]> => {
  const { data, error } = await supabase
    .from('price_index')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const createPriceIndexEntry = async (payload: Omit<PriceIndexEntry, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('price_index')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const updatePriceIndexEntry = async (id: number, payload: Partial<Omit<PriceIndexEntry, 'id' | 'created_at'>>) => {
  const { data, error } = await supabase
    .from('price_index')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const deletePriceIndexEntry = async (id: number) => {
  const { error } = await supabase
    .from('price_index')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
};
