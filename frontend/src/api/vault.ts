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

function resolveImages(row: any) {
  const images: any[] = (row.vault_watch_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const cover = images.find(i => i.is_cover) ?? images[0] ?? null;
  const coverUrl: string | null = cover?.url ?? row.image_url ?? null;
  return { images, coverUrl };
}

function shapeWatch(row: any) {
  const { images, coverUrl } = resolveImages(row);
  return {
    ...row,
    watch: {
      brand: row.brand,
      model: row.model,
      reference_number: row.reference_number,
      year: row.year,
      condition: row.condition,
      image_url: coverUrl,
    },
    images,
    cover_image_url: coverUrl,
    profit_loss: row.current_value != null
      ? Number(row.current_value) - Number(row.purchase_price)
      : null,
    profit_loss_percent: row.current_value != null && Number(row.purchase_price) > 0
      ? ((Number(row.current_value) - Number(row.purchase_price)) / Number(row.purchase_price)) * 100
      : null,
  };
}

// ─── Vault queries ────────────────────────────────────────────────────────────

export const getVault = async () => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vault_watches')
    .select('*, vault_watch_images(*)')
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

export const getVaultWatch = async (id: number) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vault_watches')
    .select('*, vault_watch_images(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (error) throw new Error(error.message);
  return shapeWatch(data);
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const addToVault = async (data: Record<string, any>) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const { data: row, error } = await supabase
    .from('vault_watches')
    .insert({ ...data, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row;
};

export const addImagesToWatch = async (watchId: number, userId: string, files: File[]) => {
  const { data: existing } = await supabase
    .from('vault_watch_images')
    .select('id')
    .eq('watch_id', watchId);
  const offset = existing?.length ?? 0;
  const hasCover = offset > 0;

  const records: { watch_id: number; user_id: string; url: string; is_cover: boolean; sort_order: number }[] = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadVaultImage(files[i], userId);
    records.push({ watch_id: watchId, user_id: userId, url, is_cover: !hasCover && i === 0, sort_order: offset + i });
  }

  const { error } = await supabase.from('vault_watch_images').insert(records);
  if (error) throw new Error(error.message);

  const coverRecord = records.find(r => r.is_cover);
  if (coverRecord) {
    await supabase.from('vault_watches').update({ image_url: coverRecord.url }).eq('id', watchId);
  }
  return records;
};

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

  const { data: row, error } = await supabase
    .from('vault_watches')
    .update({ ...data, updated_at: new Date().toISOString() })
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
