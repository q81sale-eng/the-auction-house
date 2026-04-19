import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVault, addToVault, updateVaultWatch, removeFromVault, uploadVaultImage } from '../api/vault';
import { Layout } from '../components/layout/Layout';
import { formatCurrency, formatDate } from '../utils/format';
import { useT } from '../i18n/useLanguage';
import { useAuthStore } from '../store/authStore';

const CONDITIONS = ['new', 'excellent', 'good', 'fair'] as const;
const SOURCES = ['auction', 'marketplace', 'external', 'gift', 'other'] as const;

const blankForm = { brand: '', model: '', reference_number: '', year: '', condition: 'excellent', purchase_price: '', purchased_at: '', purchase_source: 'external', notes: '', is_private: true };

export const VaultPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.vault;
  const { user } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({ queryKey: ['vault'], queryFn: getVault });

  const addMutation = useMutation({
    mutationFn: addToVault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      setShowAdd(false);
      setForm(blankForm);
      setImageFile(null);
      setImagePreview(null);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateVaultWatch(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vault'] }); setEditId(null); },
  });

  const removeMutation = useMutation({
    mutationFn: removeFromVault,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vault'] }),
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    let image_url: string | undefined;
    if (imageFile && user?.id) {
      setUploading(true);
      try {
        image_url = await uploadVaultImage(imageFile, user.id as string);
      } catch (err: any) {
        setUploading(false);
        addMutation.reset();
        return;
      }
      setUploading(false);
    }
    addMutation.mutate({ ...form, year: form.year ? parseInt(form.year) : undefined, image_url: image_url ?? null });
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
              <button onClick={() => { setShowAdd(false); clearImage(); }} className="text-obsidian-400 hover:text-white">✕</button>
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

              {/* Image upload */}
              <div className="mb-6">
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Watch Photo</label>
                <div className="flex items-start gap-4">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 shrink-0">
                      <img src={imagePreview} alt="preview" className="w-24 h-24 object-cover border border-obsidian-700" />
                      <button type="button" onClick={clearImage}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-obsidian-900 border border-obsidian-700 text-obsidian-400 hover:text-red-400 text-xs flex items-center justify-center">✕</button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border border-dashed border-obsidian-700 hover:border-gold-500/50 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0">
                      <svg className="w-6 h-6 text-obsidian-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-obsidian-500 text-xs">Upload</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                      className="hidden" onChange={handleImageChange} />
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors">
                      {imageFile ? 'Change photo' : 'Choose photo'}
                    </button>
                    <p className="text-obsidian-600 text-xs mt-1">JPEG, PNG or WebP · max 5 MB</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={addMutation.isPending || uploading} className="btn-gold">
                  {uploading ? 'Uploading...' : addMutation.isPending ? t.actions.adding : t.actions.add}
                </button>
                <button type="button" onClick={() => { setShowAdd(false); clearImage(); }} className="btn-outline">{t.actions.cancel}</button>
              </div>
              {addMutation.isError && (
                <p className="text-red-400 text-sm mt-3">{(addMutation.error as Error)?.message || 'Failed to add watch'}</p>
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
                      <button onClick={() => handleEditSave(vw.id)} className="btn-gold py-2 px-4 text-xs">{t.actions.save}</button>
                      <button onClick={() => setEditId(null)} className="btn-outline py-2 px-4 text-xs">{t.actions.cancel}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      {vw.watch?.image_url ? (
                        <img src={vw.watch.image_url} alt={vw.watch.model}
                          className="w-12 h-12 object-cover border border-obsidian-700 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-gold-500 text-xs font-bold shrink-0">
                          {vw.watch?.brand?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-gold-500 text-xs uppercase tracking-wider">{vw.watch?.brand}</p>
                        <p className="text-white font-serif text-lg">{vw.watch?.model}</p>
                        <p className="text-obsidian-400 text-xs">
                          {vw.watch?.reference_number && `Ref. ${vw.watch.reference_number} · `}
                          {vw.watch?.year && `${vw.watch.year} · `}
                          {t.table.purchased} {formatDate(vw.purchased_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 flex-wrap">
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
                      <div className="flex gap-2">
                        <button onClick={() => { setEditId(vw.id); setEditForm({}); }}
                          className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors">{t.actions.edit}</button>
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
