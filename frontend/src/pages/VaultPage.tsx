import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVault, addToVault, updateVaultWatch, removeFromVault } from '../api/vault';
import { Layout } from '../components/layout/Layout';
import { formatCurrency, formatDate } from '../utils/format';

const CONDITIONS = ['new', 'excellent', 'good', 'fair'];
const SOURCES = ['auction', 'marketplace', 'external', 'gift', 'other'];

const blankForm = { brand: '', model: '', reference_number: '', year: '', condition: 'excellent', purchase_price: '', purchased_at: '', purchase_source: 'external', notes: '', is_private: true };

export const VaultPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const { data, isLoading } = useQuery({ queryKey: ['vault'], queryFn: getVault });

  const addMutation = useMutation({
    mutationFn: addToVault,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vault'] }); setShowAdd(false); setForm(blankForm); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateVaultWatch(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vault'] }); setEditId(null); },
  });

  const removeMutation = useMutation({
    mutationFn: removeFromVault,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vault'] }),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({ ...form, year: form.year ? parseInt(form.year) : undefined });
  };

  const handleEditSave = (id: number) => {
    updateMutation.mutate({ id, data: editForm });
  };

  const summary = data?.summary;
  const watches = data?.watches || [];

  const plColor = (val: number) => val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-obsidian-400';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-subtitle">Portfolio</p>
            <h1 className="section-title">Watch Vault</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-gold">+ Add Watch</button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Total Watches', value: summary.total_watches, fmt: false },
              { label: 'Total Cost', value: summary.total_cost, fmt: true },
              { label: 'Portfolio Value', value: summary.total_value, fmt: true },
              { label: 'Total P&L', value: summary.total_profit_loss, fmt: true, highlight: true },
            ].map(({ label, value, fmt, highlight }) => (
              <div key={label} className="bg-obsidian-900 border border-obsidian-800 p-5">
                <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-2">{label}</p>
                <p className={`text-2xl font-semibold ${highlight ? plColor(value) : 'text-white'}`}>
                  {fmt ? formatCurrency(value) : value}
                </p>
                {highlight && summary.total_cost > 0 && (
                  <p className={`text-xs mt-1 ${plColor(value)}`}>
                    {summary.total_profit_loss_percent > 0 ? '+' : ''}{summary.total_profit_loss_percent.toFixed(1)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Form */}
        {showAdd && (
          <div className="bg-obsidian-900 border border-gold-500/30 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl text-white">Add Watch to Vault</h2>
              <button onClick={() => setShowAdd(false)} className="text-obsidian-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Brand *</label>
                  <input className="input-field" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Model *</label>
                  <input className="input-field" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Reference</label>
                  <input className="input-field" value={form.reference_number} onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))} />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Year</label>
                  <input type="number" className="input-field" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} min={1900} max={new Date().getFullYear()} />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Condition *</label>
                  <select className="input-field" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Purchase Price (£) *</label>
                  <input type="number" className="input-field" value={form.purchase_price} onChange={e => setForm(p => ({ ...p, purchase_price: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Purchase Date *</label>
                  <input type="date" className="input-field" value={form.purchased_at} onChange={e => setForm(p => ({ ...p, purchased_at: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Source</label>
                  <select className="input-field" value={form.purchase_source} onChange={e => setForm(p => ({ ...p, purchase_source: e.target.value }))}>
                    {SOURCES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Visibility</label>
                  <select className="input-field" value={form.is_private ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, is_private: e.target.value === 'true' }))}>
                    <option value="true">Private</option>
                    <option value="false">Public</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Notes</label>
                <textarea className="input-field h-20 resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={addMutation.isPending} className="btn-gold">
                  {addMutation.isPending ? 'Adding...' : 'Add to Vault'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-outline">Cancel</button>
              </div>
              {addMutation.isError && (
                <p className="text-red-400 text-sm mt-3">{(addMutation.error as any)?.response?.data?.message || 'Failed to add watch'}</p>
              )}
            </form>
          </div>
        )}

        {/* Watch List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse h-24" />
            ))}
          </div>
        ) : watches.length > 0 ? (
          <div className="space-y-4">
            {watches.map((vw: any) => (
              <div key={vw.id} className="card p-6">
                {editId === vw.id ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Purchase Price</label>
                      <input type="number" className="input-field text-sm" defaultValue={vw.purchase_price}
                        onChange={e => setEditForm(p => ({ ...p, purchase_price: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Current Value</label>
                      <input type="number" className="input-field text-sm" defaultValue={vw.current_value || ''}
                        onChange={e => setEditForm(p => ({ ...p, current_value: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Notes</label>
                      <input type="text" className="input-field text-sm" defaultValue={vw.notes || ''}
                        onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                    <div className="flex items-end gap-2">
                      <button onClick={() => handleEditSave(vw.id)} className="btn-gold py-2 px-4 text-xs">Save</button>
                      <button onClick={() => setEditId(null)} className="btn-outline py-2 px-4 text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-gold-500 text-xs font-bold">
                        {vw.watch?.brand?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gold-500 text-xs uppercase tracking-wider">{vw.watch?.brand}</p>
                        <p className="text-white font-serif text-lg">{vw.watch?.model}</p>
                        <p className="text-obsidian-400 text-xs">
                          {vw.watch?.reference_number && `Ref. ${vw.watch.reference_number} · `}
                          {vw.watch?.year && `${vw.watch.year} · `}
                          Purchased {formatDate(vw.purchased_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 flex-wrap">
                      <div className="text-right">
                        <p className="text-obsidian-400 text-xs uppercase tracking-wider">Cost</p>
                        <p className="text-white font-semibold">{formatCurrency(vw.purchase_price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-obsidian-400 text-xs uppercase tracking-wider">Value</p>
                        <p className="text-white font-semibold">{vw.current_value ? formatCurrency(vw.current_value) : '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-obsidian-400 text-xs uppercase tracking-wider">P&L</p>
                        <p className={`font-semibold ${plColor(vw.profit_loss || 0)}`}>
                          {vw.profit_loss ? `${vw.profit_loss > 0 ? '+' : ''}${formatCurrency(vw.profit_loss)}` : '—'}
                        </p>
                        {vw.profit_loss_percent ? (
                          <p className={`text-xs ${plColor(vw.profit_loss_percent)}`}>
                            {vw.profit_loss_percent > 0 ? '+' : ''}{Number(vw.profit_loss_percent).toFixed(1)}%
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditId(vw.id); setEditForm({}); }}
                          className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors">Edit</button>
                        <button onClick={() => { if (window.confirm('Remove from vault?')) removeMutation.mutate(vw.id); }}
                          className="text-obsidian-400 hover:text-red-400 text-xs uppercase tracking-wider transition-colors">Remove</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-obsidian-800 bg-obsidian-900">
            <p className="font-serif text-2xl text-white mb-3">Your vault is empty</p>
            <p className="text-obsidian-400 text-sm mb-6">Start tracking your watch portfolio</p>
            <button onClick={() => setShowAdd(true)} className="btn-gold">Add Your First Watch</button>
          </div>
        )}
      </div>
    </Layout>
  );
};
