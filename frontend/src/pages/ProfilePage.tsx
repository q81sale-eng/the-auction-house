import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { useT } from '../i18n/useLanguage';
import { useCurrencyStore, convertFromGBP, convertToGBP, CURRENCY_SYMBOLS } from '../store/currencyStore';

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getUserBids(userId: string) {
  const { data, error } = await supabase
    .from('bids')
    .select(`
      id, amount, created_at, is_winning, status,
      watch_title, watch_image_url, watch_brand, watch_model,
      auction:auctions ( id, title, status, slug, image_url )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function getUserPurchases(userId: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      id, final_price, purchased_at,
      watch_title, watch_brand, watch_model, watch_image_url,
      auction_slug, listing_slug
    `)
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false });
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

// ─── Bid status helper ────────────────────────────────────────────────────────

function bidStatus(bid: any, labels: any): { label: string; color: string } {
  const a = bid.auction;
  // Auction still exists
  if (a) {
    if (a.status === 'live' || a.status === 'upcoming') {
      return bid.is_winning
        ? { label: labels.winning, color: 'text-green-400' }
        : { label: labels.active,  color: 'text-blue-400'  };
    }
    // ended / sold / cancelled
    return bid.is_winning
      ? { label: labels.won,  color: 'text-gold-500'    }
      : { label: labels.lost, color: 'text-obsidian-400' };
  }
  // Auction deleted — fall back to stored bid.status
  if (bid.status === 'won')  return { label: labels.won,  color: 'text-gold-500'    };
  if (bid.status === 'lost') return { label: labels.lost, color: 'text-obsidian-400' };
  return { label: labels.active, color: 'text-obsidian-400' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.profile;
  const { currency } = useCurrencyStore();
  const fmt = (v: number | string | null | undefined) =>
    formatCurrency(v != null ? convertFromGBP(Number(v), currency) : v, currency);

  const [tab, setTab]           = useState<'profile' | 'bids' | 'deposits' | 'security'>('profile');
  const [offersTab, setOffersTab] = useState<'bids' | 'purchases'>('bids');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    country: user?.country || '', bio: user?.bio || '',
  });
  const [pwForm, setPwForm]           = useState({ password: '', confirm: '' });
  const [depositAmount, setDepositAmount]   = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userId = user?.id as string;

  const { data: bids = [], isLoading: bidsLoading } = useQuery({
    queryKey: ['profile-bids', userId],
    queryFn: () => getUserBids(userId),
    enabled: tab === 'bids' && offersTab === 'bids' && !!userId,
  });

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['profile-purchases', userId],
    queryFn: () => getUserPurchases(userId),
    enabled: tab === 'bids' && offersTab === 'purchases' && !!userId,
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
    onSuccess: () => { setMessage({ type: 'success', text: t.security.success }); setPwForm({ password: '', confirm: '' }); },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || t.security.error }),
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const amountGBP = convertToGBP(amount, currency);
      const newBalance = await adjustBalance(userId, amountGBP, user?.deposit_balance ?? 0);
      await supabase.from('transactions').insert({ user_id: userId, type: 'deposit', amount: amountGBP, reference: `DEP-${Date.now()}` });
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
      const amountGBP = convertToGBP(amount, currency);
      const newBalance = await adjustBalance(userId, -amountGBP, user?.deposit_balance ?? 0);
      await supabase.from('transactions').insert({ user_id: userId, type: 'withdrawal', amount: amountGBP, reference: `WIT-${Date.now()}` });
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
    { id: 'profile'  as const, label: t.tabs.profile  },
    { id: 'bids'     as const, label: t.tabs.bids     },
    { id: 'deposits' as const, label: t.tabs.deposits },
    { id: 'security' as const, label: t.tabs.security },
  ];

  const subTabCls = (id: string) =>
    `px-4 py-2 text-xs uppercase tracking-wider transition-colors border-b-2 ${
      offersTab === id
        ? 'border-gold-500 text-gold-500'
        : 'border-transparent text-obsidian-400 hover:text-white'
    }`;

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
              {user?.country    && <span className="text-obsidian-400 text-xs">{user.country}</span>}
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-obsidian-400 text-xs uppercase tracking-wider">{t.header.balance}</p>
            <p className="text-gold-500 text-2xl font-semibold">{fmt(user?.deposit_balance || 0)}</p>
          </div>
        </div>

        {/* Primary tabs */}
        <div className="flex border-b border-obsidian-800 mb-8">
          {tabList.map(tb => (
            <button key={tb.id} onClick={() => { setTab(tb.id); setMessage(null); }}
              className={`px-6 py-3 text-sm uppercase tracking-wider transition-colors ${
                tab === tb.id ? 'border-b-2 border-gold-500 text-gold-500' : 'text-obsidian-400 hover:text-white'
              }`}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* Global message */}
        {message && (
          <div className={`p-3 mb-6 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {message.text}
          </div>
        )}

        {/* ── Profile ────────────────────────────────────────────────────── */}
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

        {/* ── My Offers (Bids + Purchases) ───────────────────────────────── */}
        {tab === 'bids' && (
          <div>
            {/* Sub-tab bar */}
            <div className="flex gap-1 border-b border-obsidian-800 mb-6">
              <button onClick={() => setOffersTab('bids')}      className={subTabCls('bids')}>{t.bids.title}</button>
              <button onClick={() => setOffersTab('purchases')} className={subTabCls('purchases')}>{t.purchases.title}</button>
            </div>

            {/* My Bids */}
            {offersTab === 'bids' && (
              <div className="card overflow-hidden">
                {bidsLoading ? (
                  <div className="divide-y divide-obsidian-800">
                    {[1,2,3].map(i => <div key={i} className="p-4 animate-pulse h-16 bg-obsidian-900" />)}
                  </div>
                ) : bids.length === 0 ? (
                  <p className="text-center text-obsidian-400 py-12 text-sm">{t.bids.empty}</p>
                ) : (
                  <div className="divide-y divide-obsidian-800">
                    {bids.map((bid: any) => {
                      const auction  = bid.auction as any;
                      const imgSrc   = bid.watch_image_url || auction?.image_url || null;
                      const title    = bid.watch_title || auction?.title || `${bid.watch_brand || ''} ${bid.watch_model || ''}`.trim() || 'Unknown Watch';
                      const { label: statusLabel, color: statusColor } = bidStatus(bid, t.bids);
                      const slug     = auction?.slug;

                      return (
                        <div key={bid.id} className="p-4 flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="w-12 h-12 bg-obsidian-800 border border-obsidian-700 shrink-0 overflow-hidden">
                            {imgSrc
                              ? <img src={imgSrc} alt={title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              : <div className="w-full h-full flex items-center justify-center text-obsidian-600 text-xs font-bold">{title.slice(0,2).toUpperCase()}</div>
                            }
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{title}</p>
                            <p className="text-obsidian-500 text-xs mt-0.5">{formatDateTime(bid.created_at)}</p>
                          </div>

                          {/* Amount + status */}
                          <div className="text-right shrink-0">
                            <p className="text-white font-semibold text-sm">{fmt(bid.amount)}</p>
                            <span className={`text-xs uppercase tracking-wider ${statusColor}`}>{statusLabel}</span>
                          </div>

                          {/* Link if auction still exists */}
                          {slug && (
                            <Link to={`/auctions/${slug}`}
                              className="text-obsidian-500 hover:text-gold-500 transition-colors shrink-0 ml-2"
                              title={t.bids.viewAuction}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* My Purchases */}
            {offersTab === 'purchases' && (
              <div className="card overflow-hidden">
                {purchasesLoading ? (
                  <div className="divide-y divide-obsidian-800">
                    {[1,2,3].map(i => <div key={i} className="p-4 animate-pulse h-16 bg-obsidian-900" />)}
                  </div>
                ) : purchases.length === 0 ? (
                  <p className="text-center text-obsidian-400 py-12 text-sm">{t.purchases.empty}</p>
                ) : (
                  <div className="divide-y divide-obsidian-800">
                    {purchases.map((p: any) => {
                      const title   = p.watch_title || `${p.watch_brand || ''} ${p.watch_model || ''}`.trim() || 'Watch';
                      const imgSrc  = p.watch_image_url || null;
                      const detailPath = p.auction_slug
                        ? `/auctions/${p.auction_slug}`
                        : p.listing_slug ? `/marketplace/${p.listing_slug}` : null;

                      return (
                        <div key={p.id} className="p-4 flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="w-12 h-12 bg-obsidian-800 border border-obsidian-700 shrink-0 overflow-hidden">
                            {imgSrc
                              ? <img src={imgSrc} alt={title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              : <div className="w-full h-full flex items-center justify-center text-obsidian-600 text-xs font-bold">{title.slice(0,2).toUpperCase()}</div>
                            }
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{title}</p>
                            {p.watch_brand && (
                              <p className="text-gold-500 text-xs uppercase tracking-wider mt-0.5">{p.watch_brand}</p>
                            )}
                          </div>

                          {/* Price + date */}
                          <div className="text-right shrink-0">
                            <p className="text-white font-semibold text-sm">{fmt(p.final_price)}</p>
                            <p className="text-obsidian-500 text-xs mt-0.5">{formatDate(p.purchased_at)}</p>
                          </div>

                          {/* Link to detail if slug still valid */}
                          {detailPath && (
                            <Link to={detailPath}
                              className="text-obsidian-500 hover:text-gold-500 transition-colors shrink-0 ml-2"
                              title={p.auction_slug ? t.bids.viewAuction : t.purchases.viewListing}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Deposits ───────────────────────────────────────────────────── */}
        {tab === 'deposits' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-serif text-white text-lg mb-4">{t.deposits.depositTitle}</h3>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400 pointer-events-none select-none text-sm">
                      {CURRENCY_SYMBOLS[currency]}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      className="input-field pl-9"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => { const n = parseFloat(depositAmount); if (n > 0) depositMutation.mutate(n); }}
                    disabled={depositMutation.isPending || !depositAmount}
                    className="btn-gold">
                    {depositMutation.isPending ? '...' : t.deposits.deposit}
                  </button>
                </div>
                <p className="text-obsidian-500 text-xs mt-2">{t.deposits.minimum}: {fmt(100)}</p>
              </div>
              <div className="card p-6">
                <h3 className="font-serif text-white text-lg mb-4">{t.deposits.withdrawTitle}</h3>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400 pointer-events-none select-none text-sm">
                      {CURRENCY_SYMBOLS[currency]}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      className="input-field pl-9"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => { const n = parseFloat(withdrawAmount); if (n > 0) withdrawMutation.mutate(n); }}
                    disabled={withdrawMutation.isPending || !withdrawAmount}
                    className="btn-outline">
                    {withdrawMutation.isPending ? '...' : t.deposits.withdraw}
                  </button>
                </div>
                <p className="text-obsidian-500 text-xs mt-2">{t.deposits.available} {fmt(user?.deposit_balance || 0)}</p>
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
                        {d.type === 'deposit' ? '+' : '-'}{fmt(parseFloat(d.amount))}
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

        {/* ── Security ───────────────────────────────────────────────────── */}
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
