import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDateTime } from '../utils/format';
import { useT } from '../i18n/useLanguage';

async function getUserBids(userId: string) {
  const { data, error } = await supabase
    .from('bids')
    .select('id, amount, created_at, is_winning, status, auctions(title, brand, slug)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function updateProfileInDb(userId: string, fields: { name?: string; phone?: string; country?: string; bio?: string }) {
  const { error } = await supabase.from('profiles').update(fields).eq('id', userId);
  if (error) throw new Error(error.message);
}

async function adjustBalance(userId: string, delta: number, currentBalance: number) {
  const newBalance = currentBalance + delta;
  if (newBalance < 0) throw new Error('Insufficient balance');
  const { error } = await supabase.from('profiles').update({ deposit_balance: newBalance }).eq('id', userId);
  if (error) throw new Error(error.message);
  return newBalance;
}

async function getTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.profile;
  const [tab, setTab] = useState<'profile' | 'bids' | 'deposits' | 'security'>('profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', country: user?.country || '', bio: user?.bio || '' });
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' });
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userId = user?.id as string;

  const { data: bids = [] } = useQuery({
    queryKey: ['profile-bids', userId],
    queryFn: () => getUserBids(userId),
    enabled: tab === 'bids' && !!userId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => getTransactions(userId),
    enabled: tab === 'deposits' && !!userId,
  });

  const profileMutation = useMutation({
    mutationFn: (fields: typeof profileForm) => updateProfileInDb(userId, fields),
    onSuccess: () => {
      if (user) setUser({ ...user, ...profileForm });
      setMessage({ type: 'success', text: t.info.saved });
    },
    onError: () => setMessage({ type: 'error', text: t.info.saveError }),
  });

  const passwordMutation = useMutation({
    mutationFn: async ({ password, confirm }: { password: string; confirm: string }) => {
      if (password !== confirm) throw new Error(t.security.mismatch);
      if (password.length < 8) throw new Error(t.security.tooShort);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: t.security.success });
      setPwForm({ password: '', confirm: '' });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || t.security.error }),
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const newBalance = await adjustBalance(userId, amount, user?.deposit_balance ?? 0);
      await supabase.from('transactions').insert({ user_id: userId, type: 'deposit', amount, reference: `DEP-${Date.now()}` }).select().single();
      return newBalance;
    },
    onSuccess: (newBalance) => {
      if (user) setUser({ ...user, deposit_balance: newBalance });
      setDepositAmount('');
      setMessage({ type: 'success', text: t.deposits.success });
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
    onError: () => setMessage({ type: 'error', text: t.deposits.failed }),
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const newBalance = await adjustBalance(userId, -amount, user?.deposit_balance ?? 0);
      await supabase.from('transactions').insert({ user_id: userId, type: 'withdrawal', amount, reference: `WIT-${Date.now()}` }).select().single();
      return newBalance;
    },
    onSuccess: (newBalance) => {
      if (user) setUser({ ...user, deposit_balance: newBalance });
      setWithdrawAmount('');
      setMessage({ type: 'success', text: t.deposits.success });
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
    onError: () => setMessage({ type: 'error', text: t.deposits.failed }),
  });

  const tabList = [
    { id: 'profile' as const, label: t.tabs.profile },
    { id: 'bids' as const, label: t.tabs.bids },
    { id: 'deposits' as const, label: t.tabs.deposits },
    { id: 'security' as const, label: t.tabs.security },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-6 mb-10">
          <div className="w-20 h-20 bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
            <span className="font-serif text-gold-500 text-3xl">{user?.name?.charAt(0)}</span>
          </div>
          <div>
            <h1 className="font-serif text-3xl text-white">{user?.name}</h1>
            <p className="text-obsidian-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              {user?.is_verified && <span className="text-green-400 text-xs uppercase tracking-wider">{t.header.verified}</span>}
              {user?.country && <span className="text-obsidian-400 text-xs">{user.country}</span>}
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-obsidian-400 text-xs uppercase tracking-wider">{t.header.balance}</p>
            <p className="text-gold-500 text-2xl font-semibold">{formatCurrency(user?.deposit_balance || 0)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-obsidian-800 mb-8">
          {tabList.map(tb => (
            <button key={tb.id} onClick={() => { setTab(tb.id); setMessage(null); }}
              className={`px-6 py-3 text-sm uppercase tracking-wider transition-colors ${tab === tb.id ? 'border-b-2 border-gold-500 text-gold-500' : 'text-obsidian-400 hover:text-white'}`}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 mb-6 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="card p-8">
            <h2 className="font-serif text-xl text-white mb-6">{t.info.title}</h2>
            <form onSubmit={e => { e.preventDefault(); profileMutation.mutate(profileForm); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.info.name}</label>
                  <input className="input-field" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.info.phone}</label>
                  <input className="input-field" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.info.country}</label>
                <input className="input-field" value={profileForm.country} onChange={e => setProfileForm(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.info.bio}</label>
                <textarea className="input-field h-24 resize-none" value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} />
              </div>
              <button type="submit" disabled={profileMutation.isPending} className="btn-gold">
                {profileMutation.isPending ? t.info.saving : t.info.save}
              </button>
            </form>
          </div>
        )}

        {/* Bids Tab */}
        {tab === 'bids' && (
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-obsidian-800">
              <h2 className="font-serif text-xl text-white">{t.bids.title}</h2>
            </div>
            {bids.length > 0 ? (
              <div className="divide-y divide-obsidian-800">
                {bids.map((bid: any) => (
                  <div key={bid.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{(bid.auctions as any)?.title || `${(bid.auctions as any)?.brand || ''}`}</p>
                      <p className="text-obsidian-400 text-xs">{formatDateTime(bid.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(parseFloat(bid.amount))}</p>
                      <span className={`text-xs uppercase tracking-wider ${bid.is_winning ? 'text-green-400' : bid.status === 'won' ? 'text-gold-500' : 'text-obsidian-400'}`}>
                        {bid.is_winning ? t.bids.winning : bid.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-obsidian-400 py-12 text-sm">{t.bids.empty}</p>
            )}
          </div>
        )}

        {/* Deposits Tab */}
        {tab === 'deposits' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-serif text-white text-lg mb-4">{t.deposits.depositTitle}</h3>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400">£</span>
                    <input type="number" min="100" step="100" placeholder="Amount" className="input-field pl-8"
                      value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                  </div>
                  <button onClick={() => depositAmount && depositMutation.mutate(parseFloat(depositAmount))}
                    disabled={depositMutation.isPending} className="btn-gold">
                    {depositMutation.isPending ? '...' : t.deposits.deposit}
                  </button>
                </div>
                <p className="text-obsidian-500 text-xs mt-2">{t.deposits.minDeposit}</p>
              </div>
              <div className="card p-6">
                <h3 className="font-serif text-white text-lg mb-4">{t.deposits.withdrawTitle}</h3>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400">£</span>
                    <input type="number" min="100" step="100" placeholder="Amount" className="input-field pl-8"
                      value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                  </div>
                  <button onClick={() => withdrawAmount && withdrawMutation.mutate(parseFloat(withdrawAmount))}
                    disabled={withdrawMutation.isPending} className="btn-outline">
                    {withdrawMutation.isPending ? '...' : t.deposits.withdraw}
                  </button>
                </div>
                <p className="text-obsidian-500 text-xs mt-2">{t.deposits.available} {formatCurrency(user?.deposit_balance || 0)}</p>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="p-5 border-b border-obsidian-800">
                <h3 className="font-serif text-white text-lg">{t.deposits.history}</h3>
              </div>
              {transactions.length > 0 ? (
                <div className="divide-y divide-obsidian-800">
                  {transactions.map((d: any) => (
                    <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm capitalize">{d.type}</p>
                        <p className="text-obsidian-500 text-xs">{formatDateTime(d.created_at)} · {d.reference}</p>
                      </div>
                      <span className={`font-semibold ${d.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                        {d.type === 'deposit' ? '+' : '-'}{formatCurrency(parseFloat(d.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-obsidian-400 py-10 text-sm">{t.deposits.empty}</p>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div className="card p-8">
            <h2 className="font-serif text-xl text-white mb-6">{t.security.title}</h2>
            <form onSubmit={e => { e.preventDefault(); passwordMutation.mutate(pwForm); }} className="space-y-4">
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.security.newPw}</label>
                <input type="password" className="input-field" value={pwForm.password}
                  onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.security.confirm}</label>
                <input type="password" className="input-field" value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required />
              </div>
              <button type="submit" disabled={passwordMutation.isPending} className="btn-gold">
                {passwordMutation.isPending ? t.security.submitting : t.security.submit}
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};
