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
    images: (row.vault_watch_images ?? [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((img: any) => ({ ...img, url: img.url ?? img.image_url })),
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

  const { data: existing } = await supabase
    .from('vault_watch_images').select('id').eq('watch_id', watchId);
  const offset = existing?.length ?? 0;

  for (let i = 0; i < files.length; i++) {
    const imageUrl = await uploadVaultImage(files[i], userId);

    // First image always saved as cover on vault_watches for guaranteed display
    if (i === 0 && offset === 0) {
      await supabase.from('vault_watches').update({ image_url: imageUrl }).eq('id', watchId);
    }

    // Insert into vault_watch_images using image_url column
    const { error } = await supabase.from('vault_watch_images').insert({
      watch_id: watchId,
      image_url: imageUrl,
      sort_order: offset + i,
    });

    if (error) {
      console.error('[Vault] vault_watch_images insert error:', error.message);
      // Still save first image to vault_watches so it shows in list
      if (i === 0) {
        await supabase.from('vault_watches').update({ image_url: imageUrl }).eq('id', watchId);
      }
    }
  }
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
  if (img?.is_cover || img?.sort_order === 0) {
    const { data: next } = await supabase
      .from('vault_watch_images').select('*').eq('watch_id', watchId)
      .order('sort_order').limit(1).maybeSingle();
    if (next) {
      await supabase.from('vault_watch_images').update({ is_cover: true }).eq('id', next.id);
      await supabase.from('vault_watches').update({ image_url: next.url ?? next.image_url }).eq('id', watchId);
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
