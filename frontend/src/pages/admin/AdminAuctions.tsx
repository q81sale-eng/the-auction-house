import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAdminAuctions, createAuction, updateAuction, deleteAuction, getAdminWatches } from '../../api/admin';
import { formatCurrency, formatDateTime } from '../../utils/format';

const STATUS_COLORS: Record<string, string> = {
  live: 'bg-red-500/20 text-red-400',
  upcoming: 'bg-blue-500/20 text-blue-400',
  ended: 'bg-obsidian-800 text-obsidian-400',
  sold: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-orange-500/20 text-orange-400',
};

const blankForm = { watch_id: '', title: '', description: '', starting_price: '', reserve_price: '', buy_now_price: '', bid_increment: '250', deposit_required: '1000', starts_at: '', ends_at: '', auto_extend: true, extend_minutes: '5' };

export const AdminAuctions: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['admin', 'auctions', page], queryFn: () => getAdminAuctions({ page }) });
  const { data: watchesData } = useQuery({ queryKey: ['admin', 'watches', 'all'], queryFn: () => getAdminWatches({ per_page: 100 }) });

  const createMutation = useMutation({
    mutationFn: createAuction,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] }); setShowCreate(false); setForm(blankForm); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateAuction(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] }); setEditId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAuction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, watch_id: parseInt(form.watch_id), auto_extend: form.auto_extend });
  };

  const f = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
    className: 'input-field text-sm',
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Auctions</h1>
          <p className="text-obsidian-400 text-sm">{data?.total || 0} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold">+ New Auction</button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card p-6 mb-8 border-gold-500/30">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-serif text-xl text-white">Create Auction</h2>
            <button onClick={() => setShowCreate(false)} className="text-obsidian-400 hover:text-white">✕</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-3">
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Watch *</label>
                <select {...f('watch_id')} required>
                  <option value="">Select Watch</option>
                  {watchesData?.data?.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.brand} {w.model} {w.reference_number && `(${w.reference_number})`}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Title *</label>
                <input type="text" {...f('title')} required />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Starting Price (£) *</label>
                <input type="number" {...f('starting_price')} required />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Reserve Price (£)</label>
                <input type="number" {...f('reserve_price')} />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Buy Now Price (£)</label>
                <input type="number" {...f('buy_now_price')} />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Bid Increment (£) *</label>
                <input type="number" {...f('bid_increment')} required />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Deposit Required (£) *</label>
                <input type="number" {...f('deposit_required')} required />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Extend Minutes</label>
                <input type="number" {...f('extend_minutes')} />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Starts At *</label>
                <input type="datetime-local" {...f('starts_at')} required />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Ends At *</label>
                <input type="datetime-local" {...f('ends_at')} required />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Description</label>
              <textarea {...f('description')} className="input-field text-sm h-20 resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="btn-gold">
                {createMutation.isPending ? 'Creating...' : 'Create Auction'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-outline">Cancel</button>
            </div>
            {createMutation.isError && (
              <p className="text-red-400 text-xs mt-2">{(createMutation.error as any)?.response?.data?.message || 'Error creating auction'}</p>
            )}
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {['Watch', 'Title', 'Current Bid', 'Ends At', 'Bids', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-obsidian-800 rounded animate-pulse" /></td></tr>
              ))
            ) : data?.data?.map((a: any) => (
              <tr key={a.id} className="hover:bg-obsidian-900/50">
                <td className="px-4 py-3 text-obsidian-300 whitespace-nowrap">{a.watch?.brand} {a.watch?.model}</td>
                <td className="px-4 py-3 text-white max-w-xs truncate">{a.title}</td>
                <td className="px-4 py-3 text-white">{a.current_bid ? formatCurrency(parseFloat(a.current_bid)) : formatCurrency(parseFloat(a.starting_price))}</td>
                <td className="px-4 py-3 text-obsidian-300 whitespace-nowrap">{formatDateTime(a.ends_at)}</td>
                <td className="px-4 py-3 text-obsidian-300">{a.bids_count}</td>
                <td className="px-4 py-3">
                  {editId === a.id ? (
                    <div className="flex gap-2">
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                        className="bg-obsidian-800 border border-obsidian-700 text-white text-xs px-2 py-1">
                        {['upcoming', 'live', 'ended', 'cancelled', 'sold'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => updateMutation.mutate({ id: a.id, data: { status: editStatus } })} className="text-gold-500 text-xs">✓</button>
                      <button onClick={() => setEditId(null)} className="text-obsidian-400 text-xs">✕</button>
                    </div>
                  ) : (
                    <span className={`text-xs px-2 py-1 uppercase tracking-wider ${STATUS_COLORS[a.status] || 'text-obsidian-400'}`}>{a.status}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => { setEditId(a.id); setEditStatus(a.status); }}
                      className="text-obsidian-400 hover:text-gold-500 text-xs transition-colors">Edit</button>
                    <button onClick={() => { if (window.confirm('Delete auction?')) deleteMutation.mutate(a.id); }}
                      className="text-obsidian-400 hover:text-red-400 text-xs transition-colors">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.last_page > 1 && (
          <div className="flex gap-2 p-4">
            {Array.from({ length: data.last_page }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs transition-colors ${p === page ? 'bg-gold-500 text-obsidian-950' : 'border border-obsidian-700 text-obsidian-400 hover:border-gold-500'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
