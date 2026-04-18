import { supabase } from '../lib/supabase';

function shapeWatch(row: any) {
  return {
    ...row,
    watch: {
      brand: row.brand,
      model: row.model,
      reference_number: row.reference_number,
      year: row.year,
      condition: row.condition,
    },
    profit_loss: row.current_value != null
      ? Number(row.current_value) - Number(row.purchase_price)
      : null,
    profit_loss_percent: row.current_value != null && Number(row.purchase_price) > 0
      ? ((Number(row.current_value) - Number(row.purchase_price)) / Number(row.purchase_price)) * 100
      : null,
  };
}

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
