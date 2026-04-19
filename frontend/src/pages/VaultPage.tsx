import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVault, addToVault, addImagesToWatch, updateVaultWatch, removeFromVault } from '../api/vault';
import { Layout } from '../components/layout/Layout';
import { formatCurrency, formatDate } from '../utils/format';
import { useT } from '../i18n/useLanguage';
import { useAuthStore } from '../store/authStore';

const CONDITIONS = ['new', 'excellent', 'good', 'fair'] as const;
const SOURCES = ['auction', 'marketplace', 'external', 'gift', 'other'] as const;

const blankForm = {
  brand: '', model: '', reference_number: '', year: '', condition: 'excellent',
  purchase_price: '', purchased_at: '', purchase_source: 'external', notes: '', is_private: true,
};

type Preview = { file: File; previewUrl: string };

export const VaultPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.vault;
  const { user } = useAuthStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error: vaultError } = useQuery({ queryKey: ['vault'], queryFn: getVault });

  const addMutation = useMutation({
    mutationFn: addToVault,
    onSuccess: async (row) => {
      // Upload images after the watch row is confirmed saved
      if (previews.length > 0 && user?.id) {
        setUploading(true);
        try {
          await addImagesToWatch(row.id, user.id as string, previews.map(p => p.file));
        } catch (e: any) {
          setUploadError(e.message);
        }
        setUploading(false);
      }
      // Invalidate and close only after everything is done
      await queryClient.invalidateQueries({ queryKey: ['vault'] });
      setShowAdd(false);
      setForm(blankForm);
      setPreviews([]);
      setUploadError('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateVaultWatch(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vault'] }); setEditId(null); },
  });

  const removeMutation = useMutation({
    mutationFn: removeFromVault,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vault'] }),
  });

  const handleFilesPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newPreviews = files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPreviews(p => [...p, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePreview = (idx: number) => {
    setPreviews(p => {
      URL.revokeObjectURL(p[idx].previewUrl);
      return p.filter((_, i) => i !== idx);
    });
  };

  const closeAdd = () => {
    previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setShowAdd(false);
    setForm(blankForm);
    setPreviews([]);
    setUploadError('');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(form); // vault.ts addToVault now handles all numeric coercions
  };

  const summary = data?.summary;
  const watches = data?.watches || [];
  const plColor = (val: number) => val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-obsidian-400';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-subtitle">{t.eyebrow}</p>
            <h1 className="section-title">{t.title}</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-gold">{t.addWatch}</button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {([
              { label: t.summary.totalWatches, value: summary.total_watches, fmt: false },
              { label: t.summary.totalCost, value: summary.total_cost, fmt: true },
              { label: t.summary.portfolioValue, value: summary.total_value, fmt: true },
              { label: t.summary.totalPL, value: summary.total_profit_loss, fmt: true, highlight: true },
            ] as { label: string; value: number; fmt: boolean; highlight?: boolean }[]).map(({ label, value, fmt, highlight }) => (
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
              <h2 className="font-serif text-xl text-white">{t.addTitle}</h2>
              <button onClick={closeAdd} className="text-obsidian-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.brand} *</label>
                  <input className="input-field" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.model} *</label>
                  <input className="input-field" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.reference}</label>
                  <input className="input-field" value={form.reference_number} onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))} />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.year}</label>
                  <input type="number" className="input-field" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} min={1900} max={new Date().getFullYear()} />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.condition} *</label>
                  <select className="input-field" value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{t.conditions[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.purchasePrice} *</label>
                  <input type="number" className="input-field" value={form.purchase_price} onChange={e => setForm(p => ({ ...p, purchase_price: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.purchaseDate} *</label>
                  <input type="date" className="input-field" value={form.purchased_at} onChange={e => setForm(p => ({ ...p, purchased_at: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.source}</label>
                  <select className="input-field" value={form.purchase_source} onChange={e => setForm(p => ({ ...p, purchase_source: e.target.value }))}>
                    {SOURCES.map(s => <option key={s} value={s}>{t.sources[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.visibility}</label>
                  <select className="input-field" value={form.is_private ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, is_private: e.target.value === 'true' }))}>
                    <option value="true">{t.fields.private}</option>
                    <option value="false">{t.fields.public}</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.notes}</label>
                <textarea className="input-field h-20 resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>

              {/* Multi-image upload */}
              <div className="mb-6">
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Watch Photos</label>
                <div className="flex flex-wrap gap-3 items-start">
                  {previews.map((p, idx) => (
                    <div key={idx} className="relative w-20 h-20 shrink-0">
                      <img src={p.previewUrl} alt="" className="w-20 h-20 object-cover border border-obsidian-700" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-gold-500/90 text-obsidian-950 text-[9px] uppercase tracking-wider text-center py-0.5">
                          {t.detail.cover}
                        </span>
                      )}
                      <button type="button" onClick={() => removePreview(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-obsidian-900 border border-obsidian-700 text-obsidian-400 hover:text-red-400 text-xs flex items-center justify-center">
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 border border-dashed border-obsidian-700 hover:border-gold-500/50 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0">
                    <svg className="w-5 h-5 text-obsidian-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-obsidian-500 text-[10px]">Add</span>
                  </button>
                  <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
                    className="hidden" onChange={handleFilesPick} />
                </div>
                <p className="text-obsidian-600 text-xs mt-2">JPEG, PNG or WebP · max 5 MB each · first image becomes cover</p>
                {uploadError && <p className="text-red-400 text-xs mt-1">{uploadError}</p>}
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={addMutation.isPending || uploading} className="btn-gold">
                  {uploading ? t.detail.uploading : addMutation.isPending ? t.actions.adding : t.actions.add}
                </button>
                <button type="button" onClick={closeAdd} className="btn-outline">{t.actions.cancel}</button>
              </div>
              {addMutation.isError && (
                <p className="text-red-400 text-sm mt-3">{(addMutation.error as Error)?.message || 'Failed to add watch'}</p>
              )}
            </form>
          </div>
        )}

        {/* Vault query error */}
        {vaultError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 mb-6">
            Failed to load vault: {(vaultError as Error).message}
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
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.fields.purchasePrice}</label>
                      <input type="number" className="input-field text-sm" defaultValue={vw.purchase_price}
                        onChange={e => setEditForm(p => ({ ...p, purchase_price: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.summary.portfolioValue}</label>
                      <input type="number" className="input-field text-sm" defaultValue={vw.current_value || ''}
                        onChange={e => setEditForm(p => ({ ...p, current_value: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.fields.notes}</label>
                      <input type="text" className="input-field text-sm" defaultValue={vw.notes || ''}
                        onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                    <div className="flex items-end gap-2">
                      <button onClick={() => updateMutation.mutate({ id: vw.id, data: editForm })}
                        className="btn-gold py-2 px-4 text-xs">{t.actions.save}</button>
                      <button onClick={() => setEditId(null)} className="btn-outline py-2 px-4 text-xs">{t.actions.cancel}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Clickable info area → detail page */}
                    <Link to={`/vault/${vw.id}`} className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                      {vw.watch?.image_url ? (
                        <img src={vw.watch.image_url} alt={vw.watch.model}
                          className="w-14 h-14 object-cover border border-obsidian-700 shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-gold-500 text-xs font-bold shrink-0">
                          {vw.watch?.brand?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-gold-500 text-xs uppercase tracking-wider">{vw.watch?.brand}</p>
                        <p className="text-white font-serif text-lg truncate">{vw.watch?.model}</p>
                        <p className="text-obsidian-400 text-xs">
                          {vw.watch?.reference_number && `Ref. ${vw.watch.reference_number} · `}
                          {vw.watch?.year && `${vw.watch.year} · `}
                          {t.table.purchased} {formatDate(vw.purchased_at)}
                        </p>
                      </div>
                    </Link>

                    {/* Stats + actions */}
                    <div className="flex items-center gap-6 flex-wrap shrink-0">
                      <div className="text-right">
                        <p className="text-obsidian-400 text-xs uppercase tracking-wider">{t.table.cost}</p>
                        <p className="text-white font-semibold">{formatCurrency(vw.purchase_price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-obsidian-400 text-xs uppercase tracking-wider">{t.table.value}</p>
                        <p className="text-white font-semibold">{vw.current_value ? formatCurrency(vw.current_value) : '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-obsidian-400 text-xs uppercase tracking-wider">{t.table.pl}</p>
                        <p className={`font-semibold ${plColor(vw.profit_loss || 0)}`}>
                          {vw.profit_loss ? `${vw.profit_loss > 0 ? '+' : ''}${formatCurrency(vw.profit_loss)}` : '—'}
                        </p>
                        {vw.profit_loss_percent ? (
                          <p className={`text-xs ${plColor(vw.profit_loss_percent)}`}>
                            {vw.profit_loss_percent > 0 ? '+' : ''}{Number(vw.profit_loss_percent).toFixed(1)}%
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => navigate(`/vault/${vw.id}`)}
                          className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors">
                          {t.detail.editWatch}
                        </button>
                        <button onClick={() => { if (window.confirm(t.removeConfirm)) removeMutation.mutate(vw.id); }}
                          className="text-obsidian-400 hover:text-red-400 text-xs uppercase tracking-wider transition-colors">{t.actions.remove}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-obsidian-800 bg-obsidian-900">
            <p className="font-serif text-2xl text-white mb-3">{t.empty}</p>
            <p className="text-obsidian-400 text-sm mb-6">{t.emptyDesc}</p>
            <button onClick={() => setShowAdd(true)} className="btn-gold">{t.addFirst}</button>
          </div>
        )}
      </div>
    </Layout>
  );
};
