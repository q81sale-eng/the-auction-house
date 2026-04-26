import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import {
  getAllWatchRefEntries,
  createWatchRefEntry,
  updateWatchRefEntry,
  deleteWatchRefEntry,
  uploadWatchRefImage,
  slugify,
  type WatchRefEntry,
} from '../../api/watchReference';
import { useT } from '../../i18n/useLanguage';

type FormState = {
  brand: string;
  brand_slug: string;
  model: string;
  model_slug: string;
  reference: string;
  material: string;
  case_size: string;
  bracelet: string;
  dial_color: string;
  year_from: string;
  year_to: string;
  movement: string;
  water_resistance: string;
  image_url: string;
  notes: string;
};

const EMPTY: FormState = {
  brand: '', brand_slug: '', model: '', model_slug: '',
  reference: '', material: '', case_size: '', bracelet: '',
  dial_color: '', year_from: '', year_to: '', movement: '',
  water_resistance: '', image_url: '', notes: '',
};

export const AdminWatchReference: React.FC = () => {
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.admin.watchRef;

  const [editing, setEditing] = useState<WatchRefEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterBrand, setFilterBrand] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['admin', 'watch-ref'],
    queryFn: getAllWatchRefEntries,
  });

  const brands = Array.from(new Set(entries.map(e => e.brand))).sort();

  const filtered = filterBrand
    ? entries.filter(e => e.brand === filterBrand)
    : entries;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setImageFile(null);
    setImagePreview(null);
    setFormOpen(true);
  };

  const openEdit = (entry: WatchRefEntry) => {
    setEditing(entry);
    setForm({
      brand:            entry.brand,
      brand_slug:       entry.brand_slug,
      model:            entry.model,
      model_slug:       entry.model_slug,
      reference:        entry.reference,
      material:         entry.material ?? '',
      case_size:        entry.case_size ?? '',
      bracelet:         entry.bracelet ?? '',
      dial_color:       entry.dial_color ?? '',
      year_from:        entry.year_from != null ? String(entry.year_from) : '',
      year_to:          entry.year_to != null ? String(entry.year_to) : '',
      movement:         entry.movement ?? '',
      water_resistance: entry.water_resistance ?? '',
      image_url:        entry.image_url ?? '',
      notes:            entry.notes ?? '',
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

  const f = (k: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const val = e.target.value;
    setForm(prev => {
      const next = { ...prev, [k]: val };
      if (k === 'brand' && !editing) next.brand_slug = slugify(val);
      if (k === 'model' && !editing) next.model_slug = slugify(val);
      return next;
    });
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
        try { image_url = await uploadWatchRefImage(imageFile); }
        finally { setUploading(false); }
      }
      const payload = {
        brand:            form.brand.trim(),
        brand_slug:       form.brand_slug.trim() || slugify(form.brand),
        model:            form.model.trim(),
        model_slug:       form.model_slug.trim() || slugify(form.model),
        reference:        form.reference.trim(),
        material:         form.material.trim() || null,
        case_size:        form.case_size.trim() || null,
        bracelet:         form.bracelet.trim() || null,
        dial_color:       form.dial_color.trim() || null,
        year_from:        form.year_from ? Number(form.year_from) : null,
        year_to:          form.year_to ? Number(form.year_to) : null,
        movement:         form.movement.trim() || null,
        water_resistance: form.water_resistance.trim() || null,
        image_url,
        notes:            form.notes.trim() || null,
      };
      if (editing) return updateWatchRefEntry(editing.id, payload);
      return createWatchRefEntry(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'watch-ref'] });
      queryClient.invalidateQueries({ queryKey: ['watch-ref-brands'] });
      queryClient.invalidateQueries({ queryKey: ['watch-ref-models'] });
      queryClient.invalidateQueries({ queryKey: ['watch-ref-entries'] });
      closeForm();
    },
    onError: (err: any) => alert('خطأ: ' + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWatchRefEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'watch-ref'] });
      queryClient.invalidateQueries({ queryKey: ['watch-ref-brands'] });
    },
    onError: (err: any) => alert('خطأ في الحذف: ' + err.message),
  });

  const canSave = form.brand.trim() && form.model.trim() && form.reference.trim();

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">{t.title}</h1>
          <p className="text-obsidian-400 text-sm">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-obsidian-400 text-sm">{entries.length} {t.total}</span>
          <button onClick={openAdd} className="btn-gold text-sm">{t.add}</button>
        </div>
      </div>

      {/* Add / Edit form */}
      {formOpen && (
        <div className="card p-6 mb-8 border-gold-500/30">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-serif text-lg text-white">{editing ? t.edit : t.add}</h2>
            <button onClick={closeForm} className="text-obsidian-400 hover:text-white text-lg leading-none">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: image + brand/model identity */}
            <div className="space-y-4">
              {/* Image */}
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Image</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="" className="w-full h-44 object-cover bg-obsidian-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setForm(p => ({ ...p, image_url: '' }));
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                      className="absolute top-2 end-2 bg-black/60 hover:bg-black/80 text-white w-7 h-7 flex items-center justify-center text-sm"
                    >✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-36 border border-dashed border-obsidian-600 hover:border-gold-500/50 flex flex-col items-center justify-center gap-2 text-obsidian-500 hover:text-obsidian-300 transition-colors"
                  >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">{t.imageHint}</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.brand} *</label>
                <input type="text" className="input-field text-sm" value={form.brand} onChange={f('brand')} placeholder="Rolex" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.brandSlug}</label>
                <input type="text" className="input-field text-sm font-mono" value={form.brand_slug} onChange={f('brand_slug')} placeholder="rolex" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.model} *</label>
                <input type="text" className="input-field text-sm" value={form.model} onChange={f('model')} placeholder="Submariner" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.modelSlug}</label>
                <input type="text" className="input-field text-sm font-mono" value={form.model_slug} onChange={f('model_slug')} placeholder="submariner" />
              </div>
            </div>

            {/* Right: specs */}
            <div className="space-y-4">
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.reference} *</label>
                <input type="text" className="input-field text-sm font-mono" value={form.reference} onChange={f('reference')} placeholder="126610LN" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.yearFrom}</label>
                  <input type="number" className="input-field text-sm" value={form.year_from} onChange={f('year_from')} placeholder="2020" min="1850" max="2030" />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.yearTo}</label>
                  <input type="number" className="input-field text-sm" value={form.year_to} onChange={f('year_to')} placeholder="2024" min="1850" max="2030" />
                </div>
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.material}</label>
                <input type="text" className="input-field text-sm" value={form.material} onChange={f('material')} placeholder="Stainless Steel" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.caseSize}</label>
                <input type="text" className="input-field text-sm" value={form.case_size} onChange={f('case_size')} placeholder="41" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.bracelet}</label>
                <input type="text" className="input-field text-sm" value={form.bracelet} onChange={f('bracelet')} placeholder="Oyster" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.dialColor}</label>
                <input type="text" className="input-field text-sm" value={form.dial_color} onChange={f('dial_color')} placeholder="Black" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.movement}</label>
                <input type="text" className="input-field text-sm" value={form.movement} onChange={f('movement')} placeholder="Cal. 3235 (Automatic)" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.waterResistance}</label>
                <input type="text" className="input-field text-sm" value={form.water_resistance} onChange={f('water_resistance')} placeholder="300 m" />
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
              disabled={saveMutation.isPending || uploading || !canSave}
              className="btn-gold"
            >
              {(saveMutation.isPending || uploading) ? t.saving : t.save}
            </button>
            <button onClick={closeForm} className="btn-outline">{t.cancel}</button>
          </div>
        </div>
      )}

      {/* Filter */}
      {brands.length > 1 && (
        <div className="mb-4 flex items-center gap-3">
          <select
            value={filterBrand}
            onChange={e => setFilterBrand(e.target.value)}
            className="input-field text-sm w-48"
          >
            <option value="">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {filterBrand && (
            <button onClick={() => setFilterBrand('')} className="text-obsidian-500 hover:text-obsidian-300 text-xs transition-colors">Clear</button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              <th className="text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{t.brand} / {t.model}</th>
              <th className="text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{t.reference}</th>
              <th className="hidden sm:table-cell text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{t.caseSize}</th>
              <th className="hidden md:table-cell text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{t.material}</th>
              <th className="hidden lg:table-cell text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{t.yearFrom}–{t.yearTo}</th>
              <th className="text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-4 bg-obsidian-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-obsidian-500">{t.noData}</td>
              </tr>
            ) : (
              filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-obsidian-900/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {entry.image_url ? (
                        <img src={entry.image_url} alt="" className="w-10 h-10 object-cover bg-obsidian-800 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-obsidian-800 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-white text-xs font-medium">{entry.brand}</p>
                        <p className="text-obsidian-500 text-xs">{entry.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gold-500 text-xs font-mono">{entry.reference}</td>
                  <td className="hidden sm:table-cell px-4 py-3 text-obsidian-400 text-xs">
                    {entry.case_size ? `${entry.case_size} mm` : '—'}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-obsidian-400 text-xs">{entry.material ?? '—'}</td>
                  <td className="hidden lg:table-cell px-4 py-3 text-obsidian-500 text-xs">
                    {entry.year_from
                      ? entry.year_to && entry.year_to !== entry.year_from
                        ? `${entry.year_from}–${entry.year_to}`
                        : String(entry.year_from)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(entry)}
                        className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors"
                      >
                        {t.edit}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('حذف هذا الريفرنس؟')) deleteMutation.mutate(entry.id);
                        }}
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
