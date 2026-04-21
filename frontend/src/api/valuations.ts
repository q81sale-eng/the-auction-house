import { supabase } from '../lib/supabase';

export type ValuationStatus = 'pending' | 'in_review' | 'completed' | 'rejected';

// ── Vault Watches ─────────────────────────────────────────────────────────────

export const getUserVaultWatches = async () => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return [];

  const { data, error } = await supabase
    .from('vault_watches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const createVaultWatch = async (payload: {
  brand: string;
  model?: string;
  reference_number?: string;
  year?: number;
  condition?: string;
  description?: string;
  image_url?: string;
}) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vault_watches')
    .insert({ ...payload, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

// ── Valuation Requests ────────────────────────────────────────────────────────

export const requestValuation = async (watchId: number) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('valuation_requests')
    .select('id, status')
    .eq('watch_id', watchId)
    .eq('user_id', user.id)
    .in('status', ['pending', 'in_review'])
    .maybeSingle();

  if (existing) throw new Error('duplicate');

  const { data, error } = await supabase
    .from('valuation_requests')
    .insert({ user_id: user.id, watch_id: watchId, status: 'pending' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getWatchValuationRequest = async (watchId: number) => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return null;

  const { data } = await supabase
    .from('valuation_requests')
    .select('*')
    .eq('watch_id', watchId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
};

export const getUserValuationRequests = async () => {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return [];

  const { data, error } = await supabase
    .from('valuation_requests')
    .select('*, vault_watches(brand, model, reference_number)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getAllValuationRequests = async () => {
  const { data, error } = await supabase
    .from('valuation_requests')
    .select('*, vault_watches(brand, model, reference_number), profiles(name, email)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[getAllValuationRequests] error:', error.message);
    throw new Error(error.message);
  }
  return data ?? [];
};

export const updateValuationRequest = async (
  id: number,
  updates: { status: ValuationStatus; valuation_amount?: number | null; valuation_notes?: string | null }
) => {
  const { data, error } = await supabase
    .from('valuation_requests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};
