import { createClient } from '@supabase/supabase-js';

// REACT_APP_* vars are embedded at CRA build time. Fall back to a no-op
// placeholder so createClient never throws when env vars are absent —
// the app loads, auth calls simply fail with a network error instead.
const url = process.env.REACT_APP_SUPABASE_URL  || 'https://placeholder.supabase.co';
const key = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY are not set. ' +
    'Auth will not work until these are configured in Vercel → Settings → Environment Variables.'
  );
}

export const supabase = createClient(url, key);
