import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAdminWatches, createWatch, deleteWatch } from '../../api/admin';

const CONDITIONS = ['new', 'excellent', 'good', 'fair'];
const blankForm = { brand: '', model: '', reference_number: '', year: '', movement: '', case_material: '', bracelet_material: '', case_diameter: '', dial_color: '', condition: 'excellent', description: '', serial_number: '', has_box: false, has_papers: false, water_resistance: '', power_reserve: '', complications: '' };

export const AdminWatches: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({ queryKey: ['admin', 'watches', page], queryFn: () => getAdminWatches({ page }) });

  const createMutation = useMutation({
    mutationFn: createWatch,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'watches'] }); setShowCreate(false); setForm(blankForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWatch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'watches'] }),
    onError: (err: any) => alert(err?.response?.data?.message || err.message || 'Delete failed'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, year: form.year ? parseInt(form.year) : undefined, case_diameter: form.case_diameter ? parseFloat(form.case_diameter) : undefined });
  };

  const tf = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
    className: 'input-field text-sm',
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">Watches</h1>
          <p className="text-obsidian-400 text-sm">{data?.total || 0} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold">+ Add Watch</button>
      </div>

      {showCreate && (
        <div className="card p-6 mb-8 border-gold-500/30">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-serif text-xl text-white">Add Watch</h2>
            <button onClick={() => setShowCreate(false)} className="text-obsidian-400 hover:text-white">✕</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Brand *</label><input type="text" {...tf('brand')} required /></div>
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Model *</label><input type="text" {...tf('model')} required /></div>
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Reference</label><input type="text" {...tf('reference_number')} /></div>
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Year</label><input type="number" {...tf('year')} min={1900} max={new Date().getFullYear()} /></div>
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Movement</label><input type="text" placeholder="automatic / manual / quartz" {...tf('movement')} /></div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Condition *</label>
                <select {...tf('condition')} required>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Case Material</label><input type="text" {...tf('case_material')} /></div>
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Bracelet Material</label><input type="text" {...tf('bracelet_material')} /></div>
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Case Diameter (mm)</label><input type="number" step="0.1" {...tf('case_diameter')} /></div>
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Dial Color</label><input type="text" {...tf('dial_color')} /></div>
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Water Resistance</label><input type="text" placeholder="e.g. 300m" {...tf('water_resistance')} /></div>
              <div><label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Serial Number</label><input type="text" {...tf('serial_number')} /></div>
              <div className="flex items-center gap-6 pt-4">
                <label className="flex items-center gap-2 text-obsidian-300 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.has_box} onChange={e => setForm(p => ({ ...p, has_box: e.target.checked }))} className="accent-gold-500" />
                  Has Box
                </label>
                <label className="flex items-center gap-2 text-obsidian-300 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.has_papers} onChange={e => setForm(p => ({ ...p, has_papers: e.target.checked }))} className="accent-gold-500" />
                  Has Papers
                </label>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">Description</label>
              <textarea {...tf('description')} className="input-field text-sm h-20 resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending} className="btn-gold">
                {createMutation.isPending ? 'Adding...' : 'Add Watch'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-outline">Cancel</button>
            </div>
            {createMutation.isError && (
              <p className="text-red-400 text-xs mt-2">{(createMutation.error as any)?.response?.data?.message || 'Error'}</p>
            )}
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {['Brand', 'Model', 'Reference', 'Year', 'Condition', 'Box/Papers', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-obsidian-800 rounded animate-pulse" /></td></tr>
              ))
            ) : data?.data?.map((w: any) => (
              <tr key={w.id} className="hover:bg-obsidian-900/50">
                <td className="px-4 py-3 text-gold-500 font-medium">{w.brand}</td>
                <td className="px-4 py-3 text-white">{w.model}</td>
                <td className="px-4 py-3 text-obsidian-300">{w.reference_number || '—'}</td>
                <td className="px-4 py-3 text-obsidian-300">{w.year || '—'}</td>
                <td className="px-4 py-3 text-obsidian-300 capitalize">{w.condition}</td>
                <td className="px-4 py-3 text-obsidian-300 text-xs">
                  {[w.has_box && 'Box', w.has_papers && 'Papers'].filter(Boolean).join(', ') || 'None'}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => { if (window.confirm('Delete watch? This may affect auctions and listings.')) deleteMutation.mutate(w.id); }}
                    className="text-obsidian-400 hover:text-red-400 text-xs transition-colors">Delete</button>
                </td>
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
