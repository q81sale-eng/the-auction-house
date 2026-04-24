import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL  || 'https://placeholder.supabase.co';
const key = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Always log which Supabase project this build is wired to so mismatches are obvious.
console.info('[Supabase] project URL →', url);

if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.error(
    '[Supabase] ❌ REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY are NOT set.\n' +
    'If running locally: add them to frontend/.env.local\n' +
    'If on Vercel: add them in Vercel → Project → Settings → Environment Variables, then redeploy.'
  );
}

export const supabase = createClient(url, key);
export const supabaseUrl = url; // re-exported so other modules can reference it in logs

// Ensures the Supabase client has an active session.
// If getSession() returns null, tries to restore from Zustand persisted tokens.
export const ensureSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  // Lazy import to avoid circular deps
  const { useAuthStore } = await import('../store/authStore');
  const { token, refreshToken } = useAuthStore.getState();
  if (token && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });
    if (!error && data.session) return data.session;
    if (error) console.warn('[ensureSession] setSession failed:', error.message);
  }
  return null;
};
