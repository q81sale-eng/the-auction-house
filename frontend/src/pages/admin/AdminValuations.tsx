import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAdminValuations, createValuation, getAdminWatches } from '../../api/admin';
import { formatCurrency, formatDate } from '../../utils/format';

const blankForm = { watch_id: '', estimated_value: '', low_estimate: '', high_estimate: '', notes: '', valuation_date: new Date().toISOString().split('T')[0] };

export const AdminValuations: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({ queryKey: ['admin', 'valuations', page], queryFn: () => getAdminValuations({ page }) });
  const { data: watchesData } = useQuery({ queryKey: ['admin', 'watches', 'all'], queryFn: () => getAdminWatches({ per_page: 100 }) });

  const createMutation = useMutation({
    mutationFn: createValuation,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'valuations'] }); setShowCreate(false); setForm(blankForm); },
    onError: (err: any) => alert(err?.response?.data?.message || err.message || 'Save failed'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, watch_id: parseInt(form.watch_id) });
  };

  const tf = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
    className: 'input-field text-sm',
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Valuations</h1>
          <p className="text-obsidian-400 text-sm">Expert watch appraisals</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold">+ New Valuation</button>
      </div>

      {showCreate && (
        <div className="card p-6 mb-8 border-gold-500/30">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-serif text-xl text-white">Create Valuation</h2>
            <button onClick={() => setShowCreate(false)} className="text-obsidian-400 hover:text-white">✕</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-3">
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Watch *</label>
                <select {...tf('watch_id')} required>
                  <option value="">Select Watch</option>
                  {watchesData?.data?.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.brand} {w.model} {w.reference_number && `(${w.reference_number})`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Estimated Value (£) *</label>
                <input type="number" {...tf('estimated_value')} required />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Low Estimate (£)</label>
                <input type="number" {...tf('low_estimate')} />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">High Estimate (£)</label>
                <input type="number" {...tf('high_estimate')} />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Valuation Date *</label>
                <input type="date" {...tf('valuation_date')} required />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Notes</label>
              <textarea {...tf('notes')} className="input-field text-sm h-20 resize-none" placeholder="Market conditions, condition notes..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="btn-gold">
                {createMutation.isPending ? 'Saving...' : 'Save Valuation'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {['Watch', 'Estimated Value', 'Range', 'Date', 'Appraised By', 'Notes'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-obsidian-800 rounded animate-pulse" /></td></tr>
              ))
            ) : data?.data?.map((v: any) => (
              <tr key={v.id} className="hover:bg-obsidian-900/50">
                <td className="px-4 py-3">
                  <p className="text-white text-xs">{v.watch?.brand} {v.watch?.model}</p>
                  <p className="text-obsidian-500 text-xs">{v.watch?.reference_number}</p>
                </td>
                <td className="px-4 py-3 text-gold-500 font-semibold">{formatCurrency(parseFloat(v.estimated_value))}</td>
                <td className="px-4 py-3 text-obsidian-300 text-xs">
                  {v.low_estimate && v.high_estimate ? `${formatCurrency(parseFloat(v.low_estimate))} — ${formatCurrency(parseFloat(v.high_estimate))}` : '—'}
                </td>
                <td className="px-4 py-3 text-obsidian-300 text-xs">{formatDate(v.valuation_date)}</td>
                <td className="px-4 py-3 text-obsidian-300 text-xs">{v.admin?.name || '—'}</td>
                <td className="px-4 py-3 text-obsidian-400 text-xs max-w-xs truncate">{v.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(data?.last_page ?? 0) > 1 && (
          <div className="flex gap-2 p-4">
            {Array.from({ length: data!.last_page }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs transition-colors ${p === page ? 'bg-gold-500 text-obsidian-950' : 'border border-obsidian-700 text-obsidian-400 hover:border-gold-500'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
