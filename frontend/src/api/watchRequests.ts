import { supabase } from '../lib/supabase';

export type WatchRequestStatus = 'new' | 'contacted' | 'completed';

export interface WatchRequestPayload {
  name: string;
  phone: string;
  email?: string;
  user_id?: string;
  brand: string;
  model?: string;
  reference_number?: string;
  condition?: string;
  year?: number;
  notes?: string;
  image_url?: string;
}

export const uploadWatchRequestImage = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('watch-requests')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data: { publicUrl } } = supabase.storage.from('watch-requests').getPublicUrl(path);
  return publicUrl;
};

export const submitWatchRequest = async (payload: WatchRequestPayload) => {
  const { data, error } = await supabase
    .from('watch_requests')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getAllWatchRequests = async () => {
  const { data, error } = await supabase
    .from('watch_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const updateWatchRequestStatus = async (id: number, status: WatchRequestStatus) => {
  const { data, error } = await supabase
    .from('watch_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteWatchRequest = async (id: number) => {
  const { error } = await supabase
    .from('watch_requests')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
};
