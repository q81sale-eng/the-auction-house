import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import {
  getAdminBanners, createBanner, updateBanner, deleteBanner, uploadBannerImage,
} from '../../api/admin';

const blank = {
  eyebrow: '', title: '', subtitle: '', cta_text: '', cta_url: '/', active: true, show_overlay: true,
};

type BannerForm = typeof blank;

export const AdminBanners: React.FC = () => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<BannerForm>(blank);
  const [newImgFile, setNewImgFile] = useState<File | null>(null);
  const [newImgPreview, setNewImgPreview] = useState('');
  const [createError, setCreateError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [editImgFile, setEditImgFile] = useState<File | null>(null);
  const [editImgPreview, setEditImgPreview] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: getAdminBanners,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });

  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateBanner(id, { active }),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, sort_order }: { id: string; sort_order: number }) => updateBanner(id, { sort_order }),
    onSuccess: invalidate,
  });

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setSaving(true);
    try {
      let image_url: string | null = null;
      if (newImgFile) image_url = await uploadBannerImage(newImgFile);
      await createBanner({ ...form, image_url });
      invalidate();
      setShowCreate(false);
      setForm(blank);
      setNewImgFile(null);
      if (newImgPreview) { URL.revokeObjectURL(newImgPreview); setNewImgPreview(''); }
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleNewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (newImgPreview) URL.revokeObjectURL(newImgPreview);
    setNewImgFile(f);
    setNewImgPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (b: any) => {
    setEditId(b.id);
    setEditForm({ eyebrow: b.eyebrow ?? '', title: b.title ?? '', subtitle: b.subtitle ?? '', cta_text: b.cta_text ?? '', cta_url: b.cta_url ?? '/', active: b.active, show_overlay: b.show_overlay ?? true });
    setEditImgFile(null);
    setEditImgPreview(b.image_url ?? '');
  };

  const handleEditFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setEditImgFile(f);
    setEditImgPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setEditSaving(true);
    try {
      const payload: Record<string, any> = { ...editForm };
      if (editImgFile) payload.image_url = await uploadBannerImage(editImgFile);
      await updateBanner(editId, payload);
      invalidate();
      setEditId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const ef = (k: string) => ({
    value: editForm[k] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditForm(p => ({ ...p, [k]: e.target.value })),
    className: 'input-field text-sm',
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">البنرات الإعلانية</h1>
          <p className="text-obsidian-400 text-sm">{banners.length} بنر · يظهر في الصفحة الرئيسية</p>
        </div>
        <button onClick={() => setShowCreate(s => !s)} className="btn-gold">+ بنر جديد</button>
      </div>

      {/* ── Create form ────────────────────────────────────────────────────────── */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-obsidian-900 border border-gold-500/30 p-6 mb-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-lg text-white">إنشاء بنر جديد</h2>
            <button type="button" onClick={() => setShowCreate(false)} className="text-obsidian-400 hover:text-white">✕</button>
          </div>

          {/* Image upload */}
          <div>
            <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">صورة الخلفية</label>
            <div className="flex items-start gap-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-40 h-24 bg-obsidian-800 border border-obsidian-700 overflow-hidden flex items-center justify-center cursor-pointer hover:border-gold-500/50 transition-colors shrink-0"
              >
                {newImgPreview
                  ? <img src={newImgPreview} alt="" className="w-full h-full object-cover" />
                  : <span className="text-obsidian-600 text-2xl">+</span>}
              </div>
              <div>
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline text-xs py-2 px-4 mb-1">
                  {newImgPreview ? 'تغيير الصورة' : 'رفع صورة'}
                </button>
                <p className="text-obsidian-500 text-xs">JPEG · PNG · WebP</p>
                <p className="text-obsidian-600 text-xs mt-1">إذا لم ترفع صورة يُعرض تدرج لوني فقط</p>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleNewFile} className="hidden" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">النص الصغير (eyebrow)</label>
              <input type="text" placeholder="مثال: مباشر الآن" value={form.eyebrow}
                onChange={e => setForm(p => ({ ...p, eyebrow: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">العنوان الرئيسي *</label>
              <input type="text" placeholder="مثال: مزادات حصرية" value={form.title} required
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">الوصف</label>
              <input type="text" placeholder="مثال: ساعات نادرة من أرقى دور الصناعة" value={form.subtitle}
                onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">نص الزر</label>
              <input type="text" placeholder="مثال: تصفح الآن" value={form.cta_text}
                onChange={e => setForm(p => ({ ...p, cta_text: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">رابط الزر *</label>
              <input type="text" placeholder="/auctions أو /marketplace" value={form.cta_url} required
                onChange={e => setForm(p => ({ ...p, cta_url: e.target.value }))} className="input-field" />
            </div>
          </div>

          {/* show_overlay toggle */}
          <div className="flex items-center justify-between border border-obsidian-800 p-3">
            <div>
              <p className="text-white text-sm">إظهار النص على الصورة</p>
              <p className="text-obsidian-500 text-xs mt-0.5">العنوان والوصف يظهران فوق الصورة داخل البنر</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, show_overlay: !p.show_overlay }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${form.show_overlay ? 'bg-gold-500' : 'bg-obsidian-700'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.show_overlay ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
          </div>

          {createError && <p className="text-red-400 text-sm">{createError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-gold">{saving ? 'جارٍ الحفظ...' : 'نشر البنر'}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-outline">إلغاء</button>
          </div>
        </form>
      )}

      {/* ── Banner list ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-24 animate-pulse" />)}</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 border border-obsidian-800 bg-obsidian-900">
          <p className="text-obsidian-400 text-sm">لا توجد بنرات — أنشئ أول بنر</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b: any, idx: number) => (
            <div key={b.id} className={`card overflow-hidden ${!b.active ? 'opacity-50' : ''}`}>
              {editId === b.id ? (
                /* ── Edit form inline ── */
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-sm font-medium">تعديل البنر</p>
                    <button onClick={() => setEditId(null)} className="text-obsidian-400 hover:text-white text-lg leading-none">✕</button>
                  </div>

                  {/* Edit image */}
                  <div className="flex items-start gap-4">
                    <div
                      onClick={() => editFileRef.current?.click()}
                      className="w-40 h-24 bg-obsidian-800 border border-obsidian-700 overflow-hidden flex items-center justify-center cursor-pointer hover:border-gold-500/50 transition-colors shrink-0"
                    >
                      {editImgPreview
                        ? <img src={editImgPreview} alt="" className="w-full h-full object-cover" />
                        : <span className="text-obsidian-600 text-2xl">+</span>}
                    </div>
                    <div>
                      <button type="button" onClick={() => editFileRef.current?.click()} className="btn-outline text-xs py-2 px-4 mb-1">
                        {editImgPreview ? 'تغيير الصورة' : 'رفع صورة'}
                      </button>
                      <p className="text-obsidian-500 text-xs">JPEG · PNG · WebP</p>
                    </div>
                    <input ref={editFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEditFile} className="hidden" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">eyebrow</label>
                      <input type="text" {...ef('eyebrow')} />
                    </div>
                    <div>
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">العنوان *</label>
                      <input type="text" {...ef('title')} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">الوصف</label>
                      <input type="text" {...ef('subtitle')} />
                    </div>
                    <div>
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">نص الزر</label>
                      <input type="text" {...ef('cta_text')} />
                    </div>
                    <div>
                      <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">رابط الزر</label>
                      <input type="text" {...ef('cta_url')} />
                    </div>
                  </div>
                  {/* show_overlay toggle */}
                  <div className="flex items-center justify-between border border-obsidian-800 p-3">
                    <div>
                      <p className="text-white text-sm">إظهار النص على الصورة</p>
                      <p className="text-obsidian-500 text-xs mt-0.5">العنوان والوصف يظهران فوق الصورة داخل البنر</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm(p => ({ ...p, show_overlay: !p.show_overlay }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${editForm.show_overlay ? 'bg-gold-500' : 'bg-obsidian-700'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${editForm.show_overlay ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleSaveEdit} disabled={editSaving} className="btn-gold text-sm py-2 px-5">
                      {editSaving ? 'جارٍ...' : 'حفظ'}
                    </button>
                    <button onClick={() => setEditId(null)} className="btn-outline text-sm py-2 px-4">إلغاء</button>
                  </div>
                </div>
              ) : (
                /* ── Display row ── */
                <div className="flex items-center gap-4 p-4">
                  {/* Preview */}
                  <div className="w-28 h-16 shrink-0 overflow-hidden border border-obsidian-700">
                    {b.image_url
                      ? <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full" style={{ background: b.bg_color }} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {b.eyebrow && <p className="text-gold-500 text-[10px] uppercase tracking-wider mb-0.5">{b.eyebrow}</p>}
                    <p className="text-white font-medium truncate">{b.title}</p>
                    {b.subtitle && <p className="text-obsidian-400 text-xs truncate">{b.subtitle}</p>}
                    <p className="text-obsidian-600 text-xs mt-0.5">{b.cta_url}</p>
                  </div>

                  {/* Order */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => reorderMutation.mutate({ id: b.id, sort_order: b.sort_order - 1 })}
                      disabled={idx === 0}
                      className="w-7 h-7 border border-obsidian-700 text-obsidian-400 hover:text-gold-500 hover:border-gold-500/50 flex items-center justify-center text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                      title="تحريك للأعلى"
                    >▲</button>
                    <button
                      onClick={() => reorderMutation.mutate({ id: b.id, sort_order: b.sort_order + 1 })}
                      disabled={idx === banners.length - 1}
                      className="w-7 h-7 border border-obsidian-700 text-obsidian-400 hover:text-gold-500 hover:border-gold-500/50 flex items-center justify-center text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                      title="تحريك للأسفل"
                    >▼</button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Active toggle */}
                    <button
                      onClick={() => toggleMutation.mutate({ id: b.id, active: !b.active })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${b.active ? 'bg-gold-500' : 'bg-obsidian-700'}`}
                      title={b.active ? 'إيقاف' : 'تفعيل'}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${b.active ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                    <button onClick={() => openEdit(b)} className="text-obsidian-400 hover:text-gold-500 text-xs transition-colors px-2">تعديل</button>
                    <button
                      onClick={() => { if (window.confirm('حذف هذا البنر؟')) deleteMutation.mutate(b.id); }}
                      className="text-obsidian-400 hover:text-red-400 text-xs transition-colors px-2"
                    >حذف</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};
