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

async function checkAdminByEmail(email: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('admins')
      .select('role')
      .eq('email', email)
      .eq('role', 'admin')
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function fetchProfile(userId: string, email?: string): Promise<{ is_admin: boolean; deposit_balance: number }> {
  let profileAdmin = false;
  let depositBalance = 0;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin,deposit_balance')
      .eq('id', userId)
      .single();
    profileAdmin = data?.is_admin ?? false;
    depositBalance = data?.deposit_balance ?? 0;
  } catch {
    // profiles table may not exist yet; continue
  }

  const adminTableResult = email ? await checkAdminByEmail(email) : false;

  return { is_admin: profileAdmin || adminTableResult, deposit_balance: depositBalance };
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
  const profile = await fetchProfile(auth.user.id, auth.user.email ?? undefined);

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
  const profile = await fetchProfile(auth.user.id, auth.user.email ?? undefined);

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
  const profile = await fetchProfile(user!.id, user!.email ?? undefined);
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
