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
  const { data, error } = await supabase
    .from('admins')
    .select('role')
    .eq('email', email)
    .eq('role', 'admin')
    .maybeSingle();
  if (error) console.warn('[Auth] admins table check failed:', error.message, '— email:', email);
  console.info('[Auth] admins table →', email, '→ is_admin:', !!data, data ? `(role=${data.role})` : '(no row / RLS blocked)');
  return !!data;
}

export async function fetchProfile(userId: string, email?: string): Promise<{ is_admin: boolean; deposit_balance: number }> {
  let profileAdmin = false;
  let depositBalance = 0;

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin,deposit_balance')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.warn('[Auth] profiles query failed:', profileError.message);
  } else {
    profileAdmin   = profileData?.is_admin   ?? false;
    depositBalance = profileData?.deposit_balance ?? 0;
    console.info('[Auth] profiles table → is_admin:', profileAdmin, '| deposit_balance:', depositBalance);
  }

  const adminTableResult = email ? await checkAdminByEmail(email) : false;

  const is_admin = profileAdmin || adminTableResult;
  console.info('[Auth] fetchProfile final → is_admin:', is_admin, '| source: profiles=', profileAdmin, 'admins_table=', adminTableResult);
  return { is_admin, deposit_balance: depositBalance };
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
    refreshToken: auth.session.refresh_token,
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
