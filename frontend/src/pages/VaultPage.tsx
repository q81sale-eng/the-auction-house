import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVault, addToVault, uploadImagesForWatch, updateVaultWatch, markAsSold, removeFromVault } from '../api/vault';
import { Layout } from '../components/layout/Layout';
import { formatCurrency } from '../utils/format';
import { useT } from '../i18n/useLanguage';
import { useAuthStore } from '../store/authStore';
import { useCurrencyStore, convertFromGBP } from '../store/currencyStore';

const CONDITIONS = ['new', 'excellent', 'good', 'fair'] as const;
const SOURCES = ['auction', 'marketplace', 'external', 'gift', 'other'] as const;

const blankForm = {
  brand: '', model: '', reference_number: '', serial_number: '', year: '', condition: 'excellent',
  purchase_price: '', current_value: '', purchased_at: '', purchase_source: 'external', notes: '',
};

type Preview = { file: File; previewUrl: string };

export const VaultPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.vault;
  const { user } = useAuthStore();
  const { currency } = useCurrencyStore();
  const fmt = (amount: number | null | undefined) =>
    formatCurrency(amount != null ? convertFromGBP(amount, currency) : amount, currency);

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [addError, setAddError] = useState('');

  // Sold flow
  const [soldModalId, setSoldModalId] = useState<number | null>(null);
  const [soldPriceInput, setSoldPriceInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error: vaultError } = useQuery({
    queryKey: ['vault'],
    queryFn: getVault,
    retry: 1,
  });

  const addMutation = useMutation({
    mutationFn: addToVault,
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      setShowAdd(false); setForm(blankForm); setAddError('');
      const files = previews.map(p => p.file);
      previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
      setPreviews([]);
      if (files.length > 0 && user?.id) {
        uploadImagesForWatch(row.id, user.id as string, files)
          .then(() => queryClient.invalidateQueries({ queryKey: ['vault'] }))
          .catch(err => console.warn('[Vault] image upload:', err.message));
      }
    },
    onError: (err: Error) => setAddError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateVaultWatch(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vault'] }); setEditId(null); },
  });

  const soldMutation = useMutation({
    mutationFn: ({ id, price }: { id: number; price: number }) => markAsSold(id, price),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vault'] }); setSoldModalId(null); setSoldPriceInput(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: removeFromVault,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vault'] }),
  });

  const handleFilesPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPreviews(p => [...p, ...files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f) }))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePreview = (idx: number) => {
    setPreviews(p => { URL.revokeObjectURL(p[idx].previewUrl); return p.filter((_, i) => i !== idx); });
  };

  const closeAdd = () => {
    previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setShowAdd(false); setForm(blankForm); setPreviews([]); setAddError('');
  };

  const handleDelete = (id: number, label: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الساعة "${label}"؟\nلا يمكن التراجع عن هذا الإجراء.`)) {
      deleteMutation.mutate(id);
    }
  };

  const summary = data?.summary;
  const watches = data?.watches ?? [];
  const soldWatches = data?.soldWatches ?? [];

  const plColor = (val: number | null) =>
    val == null ? 'text-obsidian-400' : val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-obsidian-400';

  // ── Watch card (shared for active and sold) ───────────────────────────────────
  const WatchRow = ({ vw, isSold = false }: { vw: any; isSold?: boolean }) => (
    <div className={`card p-5 ${isSold ? 'opacity-70' : ''}`}>
      {/* Edit mode */}
      {editId === vw.id ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.fields.purchasePrice}</label>
            <input type="number" className="input-field text-sm" defaultValue={vw.purchase_price}
              onChange={e => setEditForm(p => ({ ...p, purchase_price: e.target.value }))} />
          </div>
          <div>
            <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.fields.currentValue}</label>
            <input type="number" className="input-field text-sm" defaultValue={vw.current_value || ''}
              onChange={e => setEditForm(p => ({ ...p, current_value: e.target.value }))} />
          </div>
          <div>
            <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.fields.notes}</label>
            <input type="text" className="input-field text-sm" defaultValue={vw.notes || ''}
              onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => updateMutation.mutate({ id: vw.id, data: editForm })} className="btn-gold py-2 px-4 text-xs">{t.actions.save}</button>
            <button onClick={() => setEditId(null)} className="btn-outline py-2 px-4 text-xs">{t.actions.cancel}</button>
          </div>
        </div>
      ) : (
        <>
          {/* Main row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link to={`/vault/${vw.id}`} className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-90 transition-opacity">
              {/* Image */}
              {vw.image_url ? (
                <img src={vw.image_url} alt={vw.model} className="w-14 h-14 object-cover border border-obsidian-700 shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-gold-500 text-xs font-bold shrink-0">
                  {vw.brand?.slice(0, 2).toUpperCase()}
                </div>
              )}
              {/* Identity */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-gold-500 text-xs uppercase tracking-wider">{vw.brand}</p>
                  {isSold && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-obsidian-800 border border-obsidian-600 text-obsidian-400">
                      مباعة
                    </span>
                  )}
                </div>
                <p className="text-white font-serif text-lg leading-snug truncate">{vw.model}</p>
                <div className="flex items-center gap-3 mt-1">
                  {vw.reference_number && <p className="text-obsidian-400 text-xs">Ref. {vw.reference_number}</p>}
                  {vw.year && <p className="text-obsidian-400 text-xs">{vw.year}</p>}
                </div>
              </div>
            </Link>

            {/* Financials */}
            <div className="flex items-center gap-5 shrink-0 border-t border-obsidian-800 sm:border-0 pt-3 sm:pt-0">
              <div className="text-right min-w-[64px]">
                <p className="text-obsidian-500 text-[10px] uppercase tracking-wider mb-0.5">{t.table.cost}</p>
                <p className="text-white text-sm font-semibold">{fmt(vw.purchase_price)}</p>
              </div>
              {isSold ? (
                <div className="text-right min-w-[64px]">
                  <p className="text-obsidian-500 text-[10px] uppercase tracking-wider mb-0.5">سعر البيع</p>
                  <p className="text-white text-sm font-semibold">{vw.sold_price ? fmt(vw.sold_price) : '—'}</p>
                </div>
              ) : (
                <div className="text-right min-w-[64px]">
                  <p className="text-obsidian-500 text-[10px] uppercase tracking-wider mb-0.5">{t.table.value}</p>
                  <p className="text-white text-sm font-semibold">{vw.current_value ? fmt(vw.current_value) : '—'}</p>
                </div>
              )}
              <div className="text-right min-w-[64px]">
                <p className="text-obsidian-500 text-[10px] uppercase tracking-wider mb-0.5">{t.table.pl}</p>
                <p className={`text-sm font-semibold ${plColor(vw.profit_loss)}`}>
                  {vw.profit_loss != null ? `${vw.profit_loss > 0 ? '+' : ''}${fmt(vw.profit_loss)}` : '—'}
                </p>
                {vw.profit_loss_percent != null && (
                  <p className={`text-[10px] ${plColor(vw.profit_loss_percent)}`}>
                    {vw.profit_loss_percent > 0 ? '+' : ''}{Number(vw.profit_loss_percent).toFixed(1)}%
                  </p>
                )}
              </div>

              {/* Actions */}
              {!isSold && (
                <div className="flex flex-col gap-1 shrink-0 ms-1">
                  <button
                    onClick={() => { setSoldModalId(vw.id); setSoldPriceInput(''); }}
                    className="text-[11px] whitespace-nowrap px-3 py-1.5 border border-gold-500/40 text-gold-500 hover:bg-gold-500/10 transition-colors"
                  >
                    تم البيع
                  </button>
                  <button
                    onClick={() => handleDelete(vw.id, `${vw.brand} ${vw.model}`)}
                    disabled={deleteMutation.isPending}
                    className="text-[11px] whitespace-nowrap px-3 py-1.5 border border-obsidian-700 text-obsidian-400 hover:text-red-400 hover:border-red-400/50 transition-colors"
                  >
                    حذف
                  </button>
                </div>
              )}
              {isSold && (
                <button
                  onClick={() => handleDelete(vw.id, `${vw.brand} ${vw.model}`)}
                  disabled={deleteMutation.isPending}
                  className="text-[11px] whitespace-nowrap px-3 py-1.5 border border-obsidian-700 text-obsidian-400 hover:text-red-400 hover:border-red-400/50 transition-colors ms-1"
                >
                  حذف
                </button>
              )}
            </div>
          </div>

          {/* Sold price input */}
          {soldModalId === vw.id && (
            <div className="mt-4 pt-4 border-t border-obsidian-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-obsidian-300 text-sm mb-2">أدخل سعر البيع (د.ك) لحساب الربح / الخسارة:</p>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  autoFocus
                  value={soldPriceInput}
                  onChange={e => setSoldPriceInput(e.target.value)}
                  placeholder="0.000"
                  className="input-field w-48 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => soldMutation.mutate({ id: vw.id, price: parseFloat(soldPriceInput) || 0 })}
                  disabled={soldMutation.isPending}
                  className="btn-gold text-sm py-2 px-5"
                >
                  {soldMutation.isPending ? 'جارٍ...' : 'تأكيد البيع'}
                </button>
                <button
                  onClick={() => setSoldModalId(null)}
                  className="btn-outline text-sm py-2 px-4"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

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

        {/* Summary Cards — active watches only */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {([
              { label: t.summary.totalWatches,   value: summary.total_watches,      isCurrency: false },
              { label: t.summary.totalCost,       value: summary.total_cost,         isCurrency: true  },
              { label: t.summary.portfolioValue,  value: summary.total_value,        isCurrency: true  },
              { label: t.summary.totalPL,         value: summary.total_profit_loss,  isCurrency: true, highlight: true },
            ] as { label: string; value: number; isCurrency: boolean; highlight?: boolean }[]).map(({ label, value, isCurrency, highlight }) => (
              <div key={label} className="bg-obsidian-900 border border-obsidian-800 p-5">
                <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-2">{label}</p>
                <p className={`text-2xl font-semibold ${highlight ? plColor(value) : 'text-white'}`}>
                  {isCurrency ? fmt(value) : value}
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

        {/* Add Watch Form */}
        {showAdd && (
          <div className="bg-obsidian-900 border border-gold-500/30 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl text-white">{t.addTitle}</h2>
              <button onClick={closeAdd} className="text-obsidian-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(form); }}>
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
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.serialNumber}</label>
                  <input className="input-field" value={form.serial_number} onChange={e => setForm(p => ({ ...p, serial_number: e.target.value }))} />
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
                  <input type="number" className="input-field" value={form.purchase_price} onChange={e => setForm(p => ({ ...p, purchase_price: e.target.value }))} required min={0} />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.currentValue}</label>
                  <input type="number" className="input-field" value={form.current_value} onChange={e => setForm(p => ({ ...p, current_value: e.target.value }))} min={0} placeholder="اختياري" />
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
              </div>
              <div className="mb-4">
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.notes}</label>
                <textarea className="input-field h-20 resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="mb-6">
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">صور الساعة</label>
                <div className="flex flex-wrap gap-3 items-start">
                  {previews.map((p, idx) => (
                    <div key={idx} className="relative w-20 h-20 shrink-0">
                      <img src={p.previewUrl} alt="" className="w-20 h-20 object-cover border border-obsidian-700" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-gold-500/90 text-obsidian-950 text-[9px] uppercase tracking-wider text-center py-0.5">
                          Cover
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
                  <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFilesPick} />
                </div>
                <p className="text-obsidian-600 text-xs mt-2">JPEG, PNG أو WebP · الحد الأقصى 5 MB · أول صورة تصبح الغلاف</p>
              </div>
              <div className="flex gap-3 items-center">
                <button type="submit" disabled={addMutation.isPending} className="btn-gold">
                  {addMutation.isPending ? t.actions.adding : t.actions.add}
                </button>
                <button type="button" onClick={closeAdd} className="btn-outline">{t.actions.cancel}</button>
              </div>
              {addError && <p className="text-red-400 text-sm mt-3">{addError}</p>}
            </form>
          </div>
        )}

        {vaultError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 mb-6">
            Failed to load vault: {(vaultError as Error).message}
          </div>
        )}

        {/* Active watches */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="card p-6 animate-pulse h-24" />)}
          </div>
        ) : watches.length > 0 ? (
          <div className="space-y-3 mb-12">
            {watches.map((vw: any) => <WatchRow key={vw.id} vw={vw} />)}
          </div>
        ) : (
          <div className="text-center py-20 border border-obsidian-800 bg-obsidian-900 mb-12">
            <p className="font-serif text-2xl text-white mb-3">{t.empty}</p>
            <p className="text-obsidian-400 text-sm mb-6">{t.emptyDesc}</p>
            <button onClick={() => setShowAdd(true)} className="btn-gold">{t.addFirst}</button>
          </div>
        )}

        {/* Sold watches section */}
        {soldWatches.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-obsidian-800" />
              <p className="text-obsidian-500 text-xs uppercase tracking-widest">الساعات المباعة ({soldWatches.length})</p>
              <div className="h-px flex-1 bg-obsidian-800" />
            </div>
            <div className="space-y-3">
              {soldWatches.map((vw: any) => <WatchRow key={vw.id} vw={vw} isSold />)}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
