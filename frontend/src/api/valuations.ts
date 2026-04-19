import { supabase } from '../lib/supabase';

export type ValuationStatus = 'pending' | 'in_review' | 'completed' | 'rejected';

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

export const getAllValuationRequests = async () => {
  const { data, error } = await supabase
    .from('valuation_requests')
    .select('*, vault_watches(brand, model, reference_number)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
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
