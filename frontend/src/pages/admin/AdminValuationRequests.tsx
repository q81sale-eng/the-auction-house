import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAllValuationRequests, updateValuationRequest, type ValuationStatus } from '../../api/valuations';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUSES: ValuationStatus[] = ['pending', 'in_review', 'completed', 'rejected'];

const STATUS_LABELS: Record<ValuationStatus, string> = {
  pending:   'Pending',
  in_review: 'In Review',
  completed: 'Completed',
  rejected:  'Rejected',
};

const STATUS_COLORS: Record<ValuationStatus, string> = {
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  in_review: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/15 text-green-400 border-green-500/30',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/30',
};

export const AdminValuationRequests: React.FC = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState({ status: 'pending' as ValuationStatus, valuation_amount: '', valuation_notes: '' });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin', 'valuation-requests'],
    queryFn: getAllValuationRequests,
  });

  const updateMutation = useMutation({
    mutationFn: () => updateValuationRequest(selected.id, {
      status: form.status,
      valuation_amount: form.valuation_amount ? Number(form.valuation_amount) : null,
      valuation_notes: form.valuation_notes || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'valuation-requests'] });
      setSelected(null);
    },
  });

  const openRequest = (req: any) => {
    setSelected(req);
    setForm({
      status: req.status,
      valuation_amount: req.valuation_amount ?? '',
      valuation_notes: req.valuation_notes ?? '',
    });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Valuation Requests</h1>
          <p className="text-obsidian-400 text-sm">User-submitted valuation requests</p>
        </div>
        <span className="text-obsidian-400 text-sm">{requests.length} total</span>
      </div>

      {/* Edit panel */}
      {selected && (
        <div className="card p-6 mb-8 border-gold-500/30">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="font-serif text-xl text-white">
                {selected.vault_watches?.brand} {selected.vault_watches?.model}
              </h2>
              {selected.vault_watches?.reference_number && (
                <p className="text-obsidian-400 text-xs mt-0.5">Ref. {selected.vault_watches.reference_number}</p>
              )}
              <p className="text-obsidian-500 text-xs mt-1">Requested {formatDate(selected.created_at)}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-obsidian-400 hover:text-white">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Status *</label>
              <select
                className="input-field text-sm"
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value as ValuationStatus }))}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Valuation Amount (£)</label>
              <input
                type="number"
                className="input-field text-sm"
                value={form.valuation_amount}
                onChange={e => setForm(p => ({ ...p, valuation_amount: e.target.value }))}
                placeholder="e.g. 12500"
              />
            </div>
          </div>
          <div className="mb-5">
            <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Notes</label>
            <textarea
              className="input-field text-sm h-24 resize-none"
              value={form.valuation_notes}
              onChange={e => setForm(p => ({ ...p, valuation_notes: e.target.value }))}
              placeholder="Market conditions, condition assessment, comparable sales..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="btn-gold">
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setSelected(null)} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {/* Requests table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {['Watch', 'User', 'Requested', 'Status', 'Amount', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-obsidian-800 rounded animate-pulse" /></td></tr>
              ))
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-obsidian-500">No valuation requests yet.</td></tr>
            ) : (
              requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-obsidian-900/50">
                  <td className="px-4 py-3">
                    <p className="text-white text-xs font-medium">
                      {req.vault_watches?.brand} {req.vault_watches?.model}
                    </p>
                    {req.vault_watches?.reference_number && (
                      <p className="text-obsidian-500 text-xs">{req.vault_watches.reference_number}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-obsidian-300 text-xs">
                    <p>{req.profiles?.name || '—'}</p>
                    <p className="text-obsidian-500">{req.profiles?.email || req.user_id?.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 text-obsidian-400 text-xs">{formatDate(req.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs uppercase tracking-wider px-2 py-1 border ${STATUS_COLORS[req.status as ValuationStatus] ?? 'text-obsidian-400'}`}>
                      {STATUS_LABELS[req.status as ValuationStatus] ?? req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gold-500 text-xs font-semibold">
                    {req.valuation_amount ? formatCurrency(Number(req.valuation_amount)) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openRequest(req)}
                      className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors">
                      Review →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};
