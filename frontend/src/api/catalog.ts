import { supabase } from '../lib/supabase';

export interface CatalogWatch {
  id: string;
  slug: string;
  brand: string;
  model: string;
  reference_number?: string;
  year_introduced?: number;
  movement?: string;
  case_material?: string;
  case_diameter?: number;
  bracelet_material?: string;
  dial_color?: string;
  water_resistance?: string;
  power_reserve?: string;
  complications?: string;
  description?: string;
  retail_price: number;
  image_url?: string;
  active: boolean;
  sort_order: number;
}

export const getCatalog = async (brand?: string, search?: string): Promise<CatalogWatch[]> => {
  let q = supabase
    .from('catalog_watches')
    .select('*')
    .eq('active', true)
    .order('brand', { ascending: true })
    .order('sort_order', { ascending: true });

  if (brand) q = q.eq('brand', brand);
  if (search) q = q.or(`brand.ilike.%${search}%,model.ilike.%${search}%,reference_number.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const getCatalogWatch = async (slug: string): Promise<CatalogWatch> => {
  const { data, error } = await supabase
    .from('catalog_watches')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getCatalogBrands = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('catalog_watches')
    .select('brand')
    .eq('active', true);
  if (error) return [];
  const unique = Array.from(new Set((data ?? []).map((r: any) => r.brand as string))).sort();
  return unique;
};
