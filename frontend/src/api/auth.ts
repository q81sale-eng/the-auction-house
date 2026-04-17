import { supabase } from '../lib/supabase';

// Shape returned to authStore — matches the existing User interface
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

function mapUser(u: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']>): AuthUser {
  const m = u.user_metadata ?? {};
  return {
    id: u.id,
    name: m.name || u.email || '',
    email: u.email || '',
    is_admin: m.is_admin === true,
    is_verified: !!u.email_confirmed_at,
    deposit_balance: 0,
    phone: m.phone,
    country: m.country,
  };
}

function supabaseError(msg: string): never {
  throw { response: { data: { message: msg } } };
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
      data: {
        name: data.name,
        phone: data.phone ?? '',
        country: data.country ?? '',
      },
    },
  });

  if (error) supabaseError(error.message);
  if (!auth.user) supabaseError('Registration failed. Please try again.');

  // If email confirmation is required, session will be null.
  // Return the user anyway — the RegisterPage will redirect to home;
  // protected routes will block access until confirmed.
  return {
    user: mapUser(auth.user),
    token: auth.session?.access_token ?? '',
  };
};

// ─── Login ───────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string) => {
  const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) supabaseError(error.message);
  if (!auth.user) supabaseError('Login failed. Please try again.');

  return {
    user: mapUser(auth.user),
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
  return mapUser(user!);
};
