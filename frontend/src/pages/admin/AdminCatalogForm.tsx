import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import {
  getAdminCatalog, createCatalogWatch, updateCatalogWatch, uploadCatalogImage,
} from '../../api/admin';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const blank = {
  brand: '', model: '', reference_number: '', year_introduced: '',
  movement: '', case_material: '', case_diameter: '', bracelet_material: '',
  dial_color: '', water_resistance: '', power_reserve: '', complications: '',
  description: '', retail_price: '', active: true,
};

const set = (form: any, setForm: any) => (k: string) =>
  (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p: any) => ({ ...p, [k]: e.target.value }));

export const AdminCatalogForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<typeof blank>(blank);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const s = set(form, setForm);

  useEffect(() => {
    if (!isEdit) return;
    getAdminCatalog().then(list => {
      const existing = list.find((w: any) => w.id === id);
      if (!existing) return;
      setForm({
        brand:             existing.brand             ?? '',
        model:             existing.model             ?? '',
        reference_number:  existing.reference_number  ?? '',
        year_introduced:   existing.year_introduced   != null ? String(existing.year_introduced) : '',
        movement:          existing.movement          ?? '',
        case_material:     existing.case_material     ?? '',
        case_diameter:     existing.case_diameter     != null ? String(existing.case_diameter)  : '',
        bracelet_material: existing.bracelet_material ?? '',
        dial_color:        existing.dial_color        ?? '',
        water_resistance:  existing.water_resistance  ?? '',
        power_reserve:     existing.power_reserve     ?? '',
        complications:     existing.complications     ?? '',
        description:       existing.description       ?? '',
        retail_price:      existing.retail_price      != null ? String(existing.retail_price)   : '',
        active:            existing.active            ?? true,
      });
      if (existing.image_url) setImgPreview(existing.image_url);
    });
  }, [id, isEdit]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (imgPreview && !imgPreview.startsWith('http')) URL.revokeObjectURL(imgPreview);
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.retail_price) { setError('سعر الوكيل مطلوب.'); return; }
    setSaving(true); setError('');
    try {
      let image_url: string | null = imgPreview.startsWith('http') ? imgPreview : null;
      if (imgFile) image_url = await uploadCatalogImage(imgFile);

      const payload: Record<string, any> = {
        brand:             form.brand,
        model:             form.model,
        reference_number:  form.reference_number  || null,
        year_introduced:   form.year_introduced   ? parseInt(form.year_introduced)  : null,
        movement:          form.movement          || null,
        case_material:     form.case_material     || null,
        case_diameter:     form.case_diameter     ? parseFloat(form.case_diameter)  : null,
        bracelet_material: form.bracelet_material || null,
        dial_color:        form.dial_color        || null,
        water_resistance:  form.water_resistance  || null,
        power_reserve:     form.power_reserve     || null,
        complications:     form.complications     || null,
        description:       form.description       || null,
        retail_price:      parseFloat(form.retail_price),
        active:            form.active,
        image_url,
      };

      if (!isEdit) {
        payload.slug = `${slugify(form.brand)}-${slugify(form.model)}-${Date.now().toString(36)}`;
        payload.sort_order = 0;
        await createCatalogWatch(payload);
      } else {
        await updateCatalogWatch(id!, payload);
      }
      navigate('/admin/catalog');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl text-white">{isEdit ? 'تعديل الساعة' : 'إضافة ساعة جديدة'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── الصورة ── */}
          <div className="bg-obsidian-900 border border-obsidian-800 p-6">
            <h2 className="font-serif text-white text-lg mb-4">صورة الساعة</h2>
            <div className="flex items-start gap-5">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-40 h-40 bg-obsidian-800 border border-obsidian-700 hover:border-gold-500/50 overflow-hidden flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                {imgPreview
                  ? <img src={imgPreview} alt="" className="w-full h-full object-contain p-2" />
                  : <span className="text-obsidian-600 text-3xl">+</span>}
              </div>
              <div className="pt-1">
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline text-xs py-2 px-4 mb-2">
                  {imgPreview ? 'تغيير الصورة' : 'رفع صورة'}
                </button>
                <p className="text-obsidian-500 text-xs">JPEG · PNG · WebP</p>
                <p className="text-obsidian-600 text-xs mt-1">يُفضّل خلفية بيضاء أو شفافة</p>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
            </div>
          </div>

          {/* ── معلومات الساعة ── */}
          <div className="bg-obsidian-900 border border-obsidian-800 p-6 space-y-4">
            <h2 className="font-serif text-white text-lg">معلومات الساعة</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">الماركة *</label>
                <input type="text" value={form.brand} onChange={s('brand')} className="input-field" required placeholder="Rolex" />
              </div>
              <div>
                <label className="label-field">الموديل *</label>
                <input type="text" value={form.model} onChange={s('model')} className="input-field" required placeholder="Submariner" />
              </div>
              <div>
                <label className="label-field">الرقم المرجعي</label>
                <input type="text" value={form.reference_number} onChange={s('reference_number')} className="input-field" placeholder="126610LN" />
              </div>
              <div>
                <label className="label-field">سنة الإصدار</label>
                <input type="number" min="1900" max="2030" value={form.year_introduced} onChange={s('year_introduced')} className="input-field" placeholder="2020" />
              </div>
            </div>
            <div>
              <label className="label-field">وصف الساعة</label>
              <textarea value={form.description} onChange={s('description')} rows={3} className="input-field resize-none" placeholder="وصف مختصر..." />
            </div>
          </div>

          {/* ── المواصفات ── */}
          <div className="bg-obsidian-900 border border-obsidian-800 p-6 space-y-4">
            <h2 className="font-serif text-white text-lg">المواصفات التقنية</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">الحركة</label>
                <input type="text" value={form.movement} onChange={s('movement')} className="input-field" placeholder="Automatic Cal. 3235" />
              </div>
              <div>
                <label className="label-field">مادة العلبة</label>
                <input type="text" value={form.case_material} onChange={s('case_material')} className="input-field" placeholder="Oystersteel" />
              </div>
              <div>
                <label className="label-field">قطر العلبة (مم)</label>
                <input type="number" step="0.1" value={form.case_diameter} onChange={s('case_diameter')} className="input-field" placeholder="41" />
              </div>
              <div>
                <label className="label-field">مادة السوار</label>
                <input type="text" value={form.bracelet_material} onChange={s('bracelet_material')} className="input-field" placeholder="Oyster" />
              </div>
              <div>
                <label className="label-field">لون الوجه</label>
                <input type="text" value={form.dial_color} onChange={s('dial_color')} className="input-field" placeholder="Black" />
              </div>
              <div>
                <label className="label-field">مقاومة الماء</label>
                <input type="text" value={form.water_resistance} onChange={s('water_resistance')} className="input-field" placeholder="300m" />
              </div>
              <div>
                <label className="label-field">احتياطي الطاقة</label>
                <input type="text" value={form.power_reserve} onChange={s('power_reserve')} className="input-field" placeholder="70 ساعة" />
              </div>
              <div>
                <label className="label-field">المضاعفات</label>
                <input type="text" value={form.complications} onChange={s('complications')} className="input-field" placeholder="Date, GMT" />
              </div>
            </div>
          </div>

          {/* ── السعر ── */}
          <div className="bg-obsidian-900 border border-obsidian-800 p-6 space-y-4">
            <h2 className="font-serif text-white text-lg">سعر الوكيل الرسمي</h2>
            <div className="max-w-xs">
              <label className="label-field">السعر (د.ك) *</label>
              <input type="number" min="0" step="0.001" value={form.retail_price} onChange={s('retail_price')} className="input-field" required placeholder="0" />
            </div>
          </div>

          {/* ── الحالة ── */}
          <div className="bg-obsidian-900 border border-obsidian-800 p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm">ظاهر في الكاتالوج</p>
              <p className="text-obsidian-500 text-xs mt-0.5">إذا أوقفت، لن تظهر في الصفحة العامة</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, active: !p.active }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.active ? 'bg-gold-500' : 'bg-obsidian-700'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.active ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pb-8">
            <button type="submit" disabled={saving} className="btn-gold px-10">
              {saving ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التغييرات' : 'إضافة للكاتالوج'}
            </button>
            <button type="button" onClick={() => navigate('/admin/catalog')} className="btn-outline px-6">إلغاء</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
