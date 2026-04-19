import { supabase } from '../lib/supabase';

// ─── Storage ──────────────────────────────────────────────────────────────────

export const uploadVaultImage = async (file: File, userId: string): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('vault-watches')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data: { publicUrl } } = supabase.storage.from('vault-watches').getPublicUrl(path);
  return publicUrl;
};

// ─── Shape helpers ────────────────────────────────────────────────────────────

function shapeWatch(row: any) {
  return {
    ...row,
    watch: {
      brand: row.brand,
      model: row.model,
      reference_number: row.reference_number,
      year: row.year,
      condition: row.condition,
      image_url: row.image_url ?? null,
    },
    images: (row.vault_watch_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    cover_image_url: row.image_url ?? null,
    profit_loss: row.current_value != null
      ? Number(row.current_value) - Number(row.purchase_price)
      : null,
    profit_loss_percent: row.current_value != null && Number(row.purchase_price) > 0
      ? ((Number(row.current_value) - Number(row.purchase_price)) / Number(row.purchase_price)) * 100
      : null,
  };
}

// ─── Vault list — no join, just vault_watches ─────────────────────────────────

export const getVault = async () => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vault_watches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const watches = (data ?? []).map(shapeWatch);
  const totalCost = watches.reduce((s, w) => s + Number(w.purchase_price ?? 0), 0);
  const totalValue = watches.reduce((s, w) => s + Number(w.current_value ?? w.purchase_price ?? 0), 0);
  const totalPL = totalValue - totalCost;

  return {
    watches,
    summary: {
      total_watches: watches.length,
      total_cost: totalCost,
      total_value: totalValue,
      total_profit_loss: totalPL,
      total_profit_loss_percent: totalCost > 0 ? (totalPL / totalCost) * 100 : 0,
    },
  };
};

// ─── Detail page — joins images ───────────────────────────────────────────────

export const getVaultWatch = async (id: number) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const withImages = await supabase
    .from('vault_watches')
    .select('*, vault_watch_images(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!withImages.error) return shapeWatch(withImages.data);

  const plain = await supabase
    .from('vault_watches')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (plain.error) throw new Error(plain.error.message);
  return shapeWatch(plain.data);
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const addToVault = async (data: Record<string, any>) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const payload: Record<string, any> = {
    brand:            data.brand,
    model:            data.model,
    reference_number: data.reference_number || null,
    serial_number:    data.serial_number || null,
    year:             data.year !== '' && data.year != null ? Number(data.year) : null,
    condition:        data.condition || 'excellent',
    purchase_price:   data.purchase_price !== '' ? Number(data.purchase_price) : null,
    current_value:    data.current_value !== '' && data.current_value != null ? Number(data.current_value) : null,
    purchased_at:     data.purchased_at || null,
    purchase_source:  data.purchase_source || 'external',
    notes:            data.notes || null,
    user_id:          user.id,
  };

  const { data: row, error } = await supabase
    .from('vault_watches')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return row;
};

// Uploads images in the background — does not block form close
export const uploadImagesForWatch = async (watchId: number, userId: string, files: File[]): Promise<void> => {
  if (!files.length) return;

  // Always upload first file and save URL immediately — guarantees cover shows in list
  const firstUrl = await uploadVaultImage(files[0], userId);
  await supabase.from('vault_watches').update({ image_url: firstUrl }).eq('id', watchId);

  // Try to populate vault_watch_images for gallery support
  const probe = await supabase.from('vault_watch_images').select('id').eq('watch_id', -999).limit(1);
  if (probe.error) return; // table absent — vault_watches.image_url already set above

  const { data: existing } = await supabase
    .from('vault_watch_images').select('id').eq('watch_id', watchId);
  const offset = existing?.length ?? 0;

  const records: { watch_id: number; user_id: string; url: string; is_cover: boolean; sort_order: number }[] = [
    { watch_id: watchId, user_id: userId, url: firstUrl, is_cover: offset === 0, sort_order: offset },
  ];

  for (let i = 1; i < files.length; i++) {
    const url = await uploadVaultImage(files[i], userId);
    records.push({ watch_id: watchId, user_id: userId, url, is_cover: false, sort_order: offset + i });
  }

  const { error } = await supabase.from('vault_watch_images').insert(records);
  if (error) throw new Error(error.message);
};

export const addImagesToWatch = uploadImagesForWatch;

export const setCoverImage = async (watchId: number, imageId: number, imageUrl: string) => {
  await supabase.from('vault_watch_images').update({ is_cover: false }).eq('watch_id', watchId);
  const { error } = await supabase.from('vault_watch_images').update({ is_cover: true }).eq('id', imageId);
  if (error) throw new Error(error.message);
  await supabase.from('vault_watches').update({ image_url: imageUrl }).eq('id', watchId);
};

export const removeWatchImage = async (imageId: number, watchId: number) => {
  const { data: img } = await supabase.from('vault_watch_images').select('*').eq('id', imageId).maybeSingle();
  const { error } = await supabase.from('vault_watch_images').delete().eq('id', imageId);
  if (error) throw new Error(error.message);
  if (img?.is_cover) {
    const { data: next } = await supabase
      .from('vault_watch_images').select('*').eq('watch_id', watchId)
      .order('sort_order').limit(1).maybeSingle();
    if (next) {
      await supabase.from('vault_watch_images').update({ is_cover: true }).eq('id', next.id);
      await supabase.from('vault_watches').update({ image_url: next.url }).eq('id', watchId);
    } else {
      await supabase.from('vault_watches').update({ image_url: null }).eq('id', watchId);
    }
  }
};

export const updateVaultWatch = async (id: number, data: Record<string, any>) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const payload: Record<string, any> = {
    ...data,
    updated_at: new Date().toISOString(),
    purchase_price: data.purchase_price !== '' && data.purchase_price != null ? Number(data.purchase_price) : undefined,
    current_value:  data.current_value  !== '' && data.current_value  != null ? Number(data.current_value)  : null,
    year:           data.year           !== '' && data.year           != null ? Number(data.year)           : null,
  };

  const { data: row, error } = await supabase
    .from('vault_watches')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row;
};

export const removeFromVault = async (id: number) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');
  const { error } = await supabase
    .from('vault_watches')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);
};
