import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  is_verified: boolean;
  deposit_balance: number;
  phone?: string;
  country?: string;
}

// Fetch is_admin and deposit_balance from the profiles table.
// Gracefully returns defaults if the table doesn't exist yet.
export async function fetchProfile(userId: string): Promise<{ is_admin: boolean; deposit_balance: number }> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin,deposit_balance')
      .eq('id', userId)
      .single();
    return { is_admin: data?.is_admin ?? false, deposit_balance: data?.deposit_balance ?? 0 };
  } catch {
    return { is_admin: false, deposit_balance: 0 };
  }
}

function supabaseError(msg: string): never {
  const err = new Error(msg);
  (err as any).response = { data: { message: msg } };
  throw err;
}

// ─── Register ────────────────────────────────────────────────────────────────

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  country?: string;
}) => {
  const { data: auth, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { name: data.name, phone: data.phone ?? '', country: data.country ?? '' },
    },
  });

  if (error) supabaseError(error.message);
  if (!auth.user) supabaseError('Registration failed. Please try again.');

  const m = auth.user.user_metadata ?? {};
  const profile = await fetchProfile(auth.user.id);

  return {
    user: {
      id: auth.user.id,
      name: m.name || auth.user.email || '',
      email: auth.user.email || '',
      is_admin: profile.is_admin,
      is_verified: !!auth.user.email_confirmed_at,
      deposit_balance: profile.deposit_balance,
      phone: m.phone,
      country: m.country,
    } as AuthUser,
    token: auth.session?.access_token ?? '',
  };
};

// ─── Login ───────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string) => {
  const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) supabaseError(error.message);
  if (!auth.user) supabaseError('Login failed. Please try again.');

  const m = auth.user.user_metadata ?? {};
  const profile = await fetchProfile(auth.user.id);

  return {
    user: {
      id: auth.user.id,
      name: m.name || auth.user.email || '',
      email: auth.user.email || '',
      is_admin: profile.is_admin,
      is_verified: !!auth.user.email_confirmed_at,
      deposit_balance: profile.deposit_balance,
      phone: m.phone,
      country: m.country,
    } as AuthUser,
    token: auth.session.access_token,
  };
};

// ─── Logout ──────────────────────────────────────────────────────────────────

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) supabaseError(error.message);
};

// ─── Current user ────────────────────────────────────────────────────────────

export const getMe = async (): Promise<AuthUser> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) supabaseError('Not authenticated');
  const m = user!.user_metadata ?? {};
  const profile = await fetchProfile(user!.id);
  return {
    id: user!.id,
    name: m.name || user!.email || '',
    email: user!.email || '',
    is_admin: profile.is_admin,
    is_verified: !!user!.email_confirmed_at,
    deposit_balance: profile.deposit_balance,
    phone: m.phone,
    country: m.country,
  };
};
