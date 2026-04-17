import { createClient } from '@supabase/supabase-js';

const url  = process.env.REACT_APP_SUPABASE_URL  ?? '';
const key  = process.env.REACT_APP_SUPABASE_ANON_KEY ?? '';

if (!url || !key) {
  console.warn(
    '[Supabase] REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY are not set. ' +
    'Auth will not work until these are configured in your environment.'
  );
}

export const supabase = createClient(url, key);
