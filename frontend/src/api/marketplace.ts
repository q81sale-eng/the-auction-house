import { supabase } from '../lib/supabase';

function shapeListing(l: any) {
  if (!l) return l;
  return {
    ...l,
    watch: {
      brand: l.brand,
      model: l.model,
      reference_number: l.reference_number,
      year: l.year,
      condition: l.condition,
      movement: l.movement,
      case_material: l.case_material,
      bracelet_material: l.bracelet_material,
      dial_color: l.dial_color,
      case_diameter: l.case_diameter,
      water_resistance: l.water_resistance,
      power_reserve: l.power_reserve,
      complications: l.complications,
      serial_number: l.serial_number,
      has_box: l.has_box,
      has_papers: l.has_papers,
      primary_image: l.image_url ? { path: l.image_url, alt_text: l.title } : undefined,
      images: l.image_url ? [{ path: l.image_url, alt_text: l.title }] : [],
    },
  };
}

export const getListings = async (params?: Record<string, any>) => {
  const page = params?.page ?? 1;
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let q = supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact' })
    .range(from, to);

  if (params?.brand) q = q.eq('brand', params.brand);
  if (params?.condition) q = q.eq('condition', params.condition);
  if (params?.min_price) q = q.gte('price', params.min_price);
  if (params?.max_price) q = q.lte('price', params.max_price);
  if (params?.search) {
    q = q.or(`title.ilike.%${params.search}%,brand.ilike.%${params.search}%,model.ilike.%${params.search}%`);
  }

  if (params?.sort === 'price_asc') q = q.order('price', { ascending: true });
  else if (params?.sort === 'price_desc') q = q.order('price', { ascending: false });
  else q = q.order('created_at', { ascending: false });

  const { data, count, error } = await q;
  if (error) throw new Error(error.message);

  return {
    data: (data ?? []).map(shapeListing),
    total: count ?? 0,
    last_page: Math.ceil((count ?? 0) / perPage),
    current_page: page,
  };
};

export const getListing = async (slug: string) => {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw new Error(error.message);
  return shapeListing(data);
};
