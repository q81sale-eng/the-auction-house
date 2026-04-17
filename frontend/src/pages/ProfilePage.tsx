import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDateTime } from '../utils/format';
import api from '../api/client';

const getProfile = () => api.get('/profile').then(r => r.data);
const updateProfile = (data: any) => api.put('/profile', data).then(r => r.data);
const updatePassword = (data: any) => api.put('/profile/password', data).then(r => r.data);
const getDeposits = () => api.get('/deposits').then(r => r.data);
const doDeposit = (amount: number) => api.post('/deposits/deposit', { amount }).then(r => r.data);
const doWithdraw = (amount: number) => api.post('/deposits/withdraw', { amount }).then(r => r.data);

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'profile' | 'bids' | 'deposits' | 'security'>('profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', country: user?.country || '', bio: user?.bio || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { data: depositsData } = useQuery({ queryKey: ['deposits'], queryFn: getDeposits, enabled: tab === 'deposits' });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => { setUser(data); setMessage({ type: 'success', text: 'Profile updated' }); queryClient.invalidateQueries({ queryKey: ['profile'] }); },
    onError: () => setMessage({ type: 'error', text: 'Update failed' }),
  });

  const passwordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => { setMessage({ type: 'success', text: 'Password updated' }); setPwForm({ current_password: '', password: '', password_confirmation: '' }); },
    onError: (err: any) => setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' }),
  });

  const depositMutation = useMutation({
    mutationFn: (amount: number) => doDeposit(amount),
    onSuccess: (data) => {
      setMessage({ type: 'success', text: `Deposited ${formatCurrency(parseFloat(depositAmount))} successfully` });
      setDepositAmount('');
      if (user) setUser({ ...user, deposit_balance: data.balance });
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
    onError: (err: any) => setMessage({ type: 'error', text: err.response?.data?.message || 'Deposit failed' }),
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => doWithdraw(amount),
    onSuccess: (data) => {
      setMessage({ type: 'success', text: `Withdrawn ${formatCurrency(parseFloat(withdrawAmount))} successfully` });
      setWithdrawAmount('');
      if (user) setUser({ ...user, deposit_balance: data.balance });
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
    onError: (err: any) => setMessage({ type: 'error', text: err.response?.data?.message || 'Withdrawal failed' }),
  });

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'bids', label: 'My Bids' },
    { id: 'deposits', label: 'Deposits' },
    { id: 'security', label: 'Security' },
  ] as const;

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
              {user?.is_verified && <span className="text-green-400 text-xs uppercase tracking-wider">✓ Verified</span>}
              {user?.country && <span className="text-obsidian-400 text-xs">{user.country}</span>}
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-obsidian-400 text-xs uppercase tracking-wider">Balance</p>
            <p className="text-gold-500 text-2xl font-semibold">{formatCurrency(user?.deposit_balance || 0)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-obsidian-800 mb-8">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMessage(null); }}
              className={`px-6 py-3 text-sm uppercase tracking-wider transition-colors ${tab === t.id ? 'border-b-2 border-gold-500 text-gold-500' : 'text-obsidian-400 hover:text-white'}`}>
              {t.label}
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
            <h2 className="font-serif text-xl text-white mb-6">Personal Information</h2>
            <form onSubmit={e => { e.preventDefault(); profileMutation.mutate(profileForm); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Full Name</label>
                  <input className="input-field" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Phone</label>
                  <input className="input-field" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Country</label>
                <input className="input-field" value={profileForm.country} onChange={e => setProfileForm(p => ({ ...p, country: e.target.value }))} />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Bio</label>
                <textarea className="input-field h-24 resize-none" value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} />
              </div>
              <button type="submit" disabled={profileMutation.isPending} className="btn-gold">
                {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Bids Tab */}
        {tab === 'bids' && (
          <div className="card overflow-hidden">
            <div className="p-6 border-b border-obsidian-800">
              <h2 className="font-serif text-xl text-white">Bid History</h2>
            </div>
            {profile?.bids?.data?.length > 0 ? (
              <div className="divide-y divide-obsidian-800">
                {profile.bids.data.map((bid: any) => (
                  <div key={bid.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{bid.auction?.watch?.brand} {bid.auction?.watch?.model}</p>
                      <p className="text-obsidian-400 text-xs">{formatDateTime(bid.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatCurrency(parseFloat(bid.amount))}</p>
                      <span className={`text-xs uppercase tracking-wider ${bid.is_winning ? 'text-green-400' : bid.status === 'won' ? 'text-gold-500' : 'text-obsidian-400'}`}>
                        {bid.is_winning ? 'Winning' : bid.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-obsidian-400 py-12 text-sm">No bids yet</p>
            )}
          </div>
        )}

        {/* Deposits Tab */}
        {tab === 'deposits' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-serif text-white text-lg mb-4">Deposit Funds</h3>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400">£</span>
                    <input type="number" min="100" step="100" placeholder="Amount" className="input-field pl-8"
                      value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                  </div>
                  <button onClick={() => depositAmount && depositMutation.mutate(parseFloat(depositAmount))}
                    disabled={depositMutation.isPending} className="btn-gold">
                    {depositMutation.isPending ? '...' : 'Deposit'}
                  </button>
                </div>
                <p className="text-obsidian-500 text-xs mt-2">Minimum deposit: £100</p>
              </div>
              <div className="card p-6">
                <h3 className="font-serif text-white text-lg mb-4">Withdraw Funds</h3>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400">£</span>
                    <input type="number" min="100" step="100" placeholder="Amount" className="input-field pl-8"
                      value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                  </div>
                  <button onClick={() => withdrawAmount && withdrawMutation.mutate(parseFloat(withdrawAmount))}
                    disabled={withdrawMutation.isPending} className="btn-outline">
                    {withdrawMutation.isPending ? '...' : 'Withdraw'}
                  </button>
                </div>
                <p className="text-obsidian-500 text-xs mt-2">Available: {formatCurrency(user?.deposit_balance || 0)}</p>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="p-5 border-b border-obsidian-800">
                <h3 className="font-serif text-white text-lg">Transaction History</h3>
              </div>
              {depositsData?.data?.length > 0 ? (
                <div className="divide-y divide-obsidian-800">
                  {depositsData.data.map((d: any) => (
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
                <p className="text-center text-obsidian-400 py-10 text-sm">No transactions yet</p>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div className="card p-8">
            <h2 className="font-serif text-xl text-white mb-6">Change Password</h2>
            <form onSubmit={e => { e.preventDefault(); passwordMutation.mutate(pwForm); }} className="space-y-4">
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Current Password</label>
                <input type="password" className="input-field" value={pwForm.current_password}
                  onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} required />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">New Password</label>
                <input type="password" className="input-field" value={pwForm.password}
                  onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Confirm New Password</label>
                <input type="password" className="input-field" value={pwForm.password_confirmation}
                  onChange={e => setPwForm(p => ({ ...p, password_confirmation: e.target.value }))} required />
              </div>
              <button type="submit" disabled={passwordMutation.isPending} className="btn-gold">
                {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};
