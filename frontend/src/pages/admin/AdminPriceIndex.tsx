import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import {
  getAllPriceIndex,
  createPriceIndexEntry,
  updatePriceIndexEntry,
  deletePriceIndexEntry,
  uploadPriceIndexImage,
  type PriceIndexEntry,
} from '../../api/priceIndex';
import { formatCurrency, formatDate } from '../../utils/format';
import { useT } from '../../i18n/useLanguage';

const fmt = (v: number) => formatCurrency(v, 'KWD');

const CONDITIONS = ['unworn', 'used', 'used_marks', 'unworn_storage'] as const;

type FormState = {
  brand: string;
  model: string;
  reference_number: string;
  condition: string;
  sale_price: string;
  sale_date: string;
  notes: string;
  image_url: string;
};

const EMPTY_FORM: FormState = {
  brand: '', model: '', reference_number: '', condition: '',
  sale_price: '', sale_date: '', notes: '', image_url: '',
};

export const AdminPriceIndex: React.FC = () => {
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.admin.priceIndex;
  const conditionLabels = tr.admin.condition;

  const [editing, setEditing] = useState<PriceIndexEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['admin', 'price-index'],
    queryFn: getAllPriceIndex,
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setFormOpen(true);
  };

  const openEdit = (entry: PriceIndexEntry) => {
    setEditing(entry);
    setForm({
      brand:            entry.brand,
      model:            entry.model ?? '',
      reference_number: entry.reference_number ?? '',
      condition:        entry.condition ?? '',
      sale_price:       String(entry.sale_price),
      sale_date:        entry.sale_date?.slice(0, 10) ?? '',
      notes:            entry.notes ?? '',
      image_url:        entry.image_url ?? '',
    });
    setImageFile(null);
    setImagePreview(entry.image_url ?? null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let image_url = form.image_url || null;
      if (imageFile) {
        setUploading(true);
        try { image_url = await uploadPriceIndexImage(imageFile); }
        finally { setUploading(false); }
      }
      const payload = {
        brand:            form.brand.trim(),
        model:            form.model.trim() || null,
        reference_number: form.reference_number.trim() || null,
        condition:        form.condition || null,
        sale_price:       Number(form.sale_price),
        sale_date:        form.sale_date,
        notes:            form.notes.trim() || null,
        image_url,
      };
      if (editing) return updatePriceIndexEntry(editing.id, payload);
      return createPriceIndexEntry(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'price-index'] });
      closeForm();
    },
    onError: (err: any) => alert('خطأ: ' + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePriceIndexEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'price-index'] }),
    onError: (err: any) => alert('خطأ في الحذف: ' + err.message),
  });

  const f = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">{t.title}</h1>
          <p className="text-obsidian-400 text-sm">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-obsidian-400 text-sm">{entries.length} {t.total}</span>
          <button onClick={openAdd} className="btn-gold text-sm">{t.add}</button>
        </div>
      </div>

      {/* Add / Edit form panel */}
      {formOpen && (
        <div className="card p-6 mb-8 border-gold-500/30">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-serif text-lg text-white">{editing ? t.edit : t.add}</h2>
            <button onClick={closeForm} className="text-obsidian-400 hover:text-white text-lg leading-none">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: image + price + date */}
            <div className="space-y-4">
              {/* Image */}
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Image</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="" className="w-full h-40 object-cover bg-obsidian-800 rounded" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); setForm(p => ({ ...p, image_url: '' })); if (fileRef.current) fileRef.current.value = ''; }}
                      className="absolute top-2 end-2 bg-black/60 hover:bg-black/80 text-white w-6 h-6 flex items-center justify-center text-sm"
                    >✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-36 border border-dashed border-obsidian-600 hover:border-gold-500/50 flex flex-col items-center justify-center gap-2 text-obsidian-500 hover:text-obsidian-300 transition-colors"
                  >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span className="text-xs">{t.imageHint}</span>
                  </button>
                )}
              </div>

              {/* Sale Price */}
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.salePrice}</label>
                <input type="number" required className="input-field text-sm" value={form.sale_price} onChange={f('sale_price')} placeholder="0" min="0" />
              </div>

              {/* Sale Date */}
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.saleDate}</label>
                <input type="date" required className="input-field text-sm" value={form.sale_date} onChange={f('sale_date')} />
              </div>
            </div>

            {/* Right: watch details */}
            <div className="space-y-4">
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.brand} *</label>
                <input type="text" required className="input-field text-sm" value={form.brand} onChange={f('brand')} placeholder="Rolex" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.model}</label>
                <input type="text" className="input-field text-sm" value={form.model} onChange={f('model')} placeholder="Daytona" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.reference}</label>
                <input type="text" className="input-field text-sm" value={form.reference_number} onChange={f('reference_number')} placeholder="116500LN" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.condition}</label>
                <select className="input-field text-sm" value={form.condition} onChange={f('condition')}>
                  <option value="">—</option>
                  {CONDITIONS.map(c => (
                    <option key={c} value={c}>{(conditionLabels as any)[c] ?? c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.notes}</label>
                <textarea className="input-field text-sm h-16 resize-none" value={form.notes} onChange={f('notes')} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-5 border-t border-obsidian-700">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || uploading || !form.brand || !form.sale_price || !form.sale_date}
              className="btn-gold"
            >
              {(saveMutation.isPending || uploading) ? t.saving : t.save}
            </button>
            <button onClick={closeForm} className="btn-outline">{t.cancel}</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              <th className="text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{t.brand} / {t.model}</th>
              <th className="hidden sm:table-cell text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{t.reference}</th>
              <th className="hidden md:table-cell text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{t.condition}</th>
              <th className="text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{t.salePrice}</th>
              <th className="hidden sm:table-cell text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{t.saleDate}</th>
              <th className="text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-obsidian-800 rounded animate-pulse" /></td></tr>
              ))
            ) : entries.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-obsidian-500">{t.noData}</td></tr>
            ) : (
              entries.map(entry => (
                <tr key={entry.id} className="hover:bg-obsidian-900/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {entry.image_url ? (
                        <img src={entry.image_url} alt="" className="w-10 h-10 object-cover bg-obsidian-800 flex-shrink-0 rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-obsidian-800 flex-shrink-0 rounded" />
                      )}
                      <div>
                        <p className="text-white text-xs font-medium">{entry.brand}</p>
                        {entry.model && <p className="text-obsidian-500 text-xs">{entry.model}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-obsidian-400 text-xs font-mono">{entry.reference_number ?? '—'}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-obsidian-400 text-xs">
                    {entry.condition ? ((conditionLabels as any)[entry.condition] ?? entry.condition) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gold-500 text-xs font-semibold">{fmt(Number(entry.sale_price))}</td>
                  <td className="hidden sm:table-cell px-4 py-3 text-obsidian-400 text-xs">{formatDate(entry.sale_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(entry)}
                        className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors"
                      >
                        {t.edit}
                      </button>
                      <button
                        onClick={() => { if (window.confirm('حذف هذا المدخل؟')) deleteMutation.mutate(entry.id); }}
                        className="text-obsidian-600 hover:text-red-400 text-xs transition-colors"
                      >
                        حذف
                      </button>
                    </div>
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
