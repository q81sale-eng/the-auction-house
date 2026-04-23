import React, { useState, useEffect, useRef } from 'react';
import { applyWatermark } from '../../utils/watermark';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { createListing, updateListing, uploadAuctionImages } from '../../api/admin';
import { supabase } from '../../lib/supabase';

const CONDITIONS = ['new', 'excellent', 'good', 'fair'] as const;
const STATUSES   = ['active', 'reserved', 'sold', 'hidden'] as const;
const STATUS_LABELS: Record<string, string> = {
  active: 'نشط', reserved: 'محجوز', sold: 'مُباع', hidden: 'مخفي',
};
const CONDITION_LABELS: Record<string, string> = {
  new: 'جديد', excellent: 'ممتاز', good: 'جيد', fair: 'مقبول',
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const blank = {
  title: '', brand: '', model: '', reference_number: '', year: '',
  condition: 'excellent' as string, status: 'active' as string,
  price: '', retail_price: '', negotiable: false as boolean,
  description: '',
  movement: '', case_material: '', bracelet_material: '',
  dial_color: '', case_diameter: '', water_resistance: '',
  power_reserve: '', complications: '', serial_number: '',
  has_box: false as boolean, has_papers: false as boolean,
  seller_name: '',
};

export const AdminListingForm: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const isEdit   = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [form,    setForm]    = useState(blank);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const { data: existing } = useQuery({
    queryKey: ['admin', 'listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_listings').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      title:             existing.title             ?? '',
      brand:             existing.brand             ?? '',
      model:             existing.model             ?? '',
      reference_number:  existing.reference_number  ?? '',
      year:              existing.year              != null ? String(existing.year)           : '',
      condition:         existing.condition         ?? 'excellent',
      status:            existing.status            ?? 'active',
      price:             existing.price             != null ? String(existing.price)          : '',
      retail_price:      existing.retail_price      != null ? String(existing.retail_price)   : '',
      negotiable:        existing.negotiable        ?? false,
      description:       existing.description       ?? '',
      movement:          existing.movement          ?? '',
      case_material:     existing.case_material     ?? '',
      bracelet_material: existing.bracelet_material ?? '',
      dial_color:        existing.dial_color        ?? '',
      case_diameter:     existing.case_diameter     != null ? String(existing.case_diameter) : '',
      water_resistance:  existing.water_resistance  ?? '',
      power_reserve:     existing.power_reserve     ?? '',
      complications:     existing.complications     ?? '',
      serial_number:     existing.serial_number     ?? '',
      has_box:           existing.has_box           ?? false,
      has_papers:        existing.has_papers        ?? false,
      seller_name:       existing.seller_name       ?? '',
    });
    if (existing.image_url) setImgPreview(existing.image_url);
  }, [existing]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const watermarked = await applyWatermark(file);
    const watermarkedFile = new File([watermarked], file.name, { type: watermarked.type });
    setImgFile(watermarkedFile);
    setImgPreview(URL.createObjectURL(watermarked));
    e.target.value = '';
  };

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.price) { setError('السعر مطلوب.'); return; }

    setSaving(true);
    try {
      let imageUrl = isEdit ? existing?.image_url ?? null : null;
      if (imgFile) {
        const [url] = await uploadAuctionImages([imgFile]);
        imageUrl = url;
      }

      const payload: Record<string, any> = {
        title:             form.title || `${form.brand} ${form.model}`.trim(),
        brand:             form.brand,
        model:             form.model             || null,
        reference_number:  form.reference_number  || null,
        year:              form.year              ? parseInt(form.year)           : null,
        condition:         form.condition,
        status:            form.status,
        price:             parseFloat(form.price),
        retail_price:      form.retail_price ? parseFloat(form.retail_price) : null,
        negotiable:        form.negotiable,
        description:       form.description       || null,
        movement:          form.movement          || null,
        case_material:     form.case_material     || null,
        bracelet_material: form.bracelet_material || null,
        dial_color:        form.dial_color        || null,
        case_diameter:     form.case_diameter     ? parseFloat(form.case_diameter) : null,
        water_resistance:  form.water_resistance  || null,
        power_reserve:     form.power_reserve     || null,
        complications:     form.complications     || null,
        serial_number:     form.serial_number     || null,
        has_box:           form.has_box,
        has_papers:        form.has_papers,
        seller_name:       form.seller_name       || null,
        image_url:         imageUrl,
      };

      if (!isEdit) {
        const base = slugify(`${form.brand}-${form.model || form.title}`);
        payload.slug = `${base}-${Date.now().toString(36)}`;
      }

      if (isEdit) {
        await updateListing(id!, payload);
      } else {
        await createListing(payload);
      }

      queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] });
      navigate('/admin/listings');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'حدث خطأ. حاول مجدداً.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">
          {isEdit ? 'تعديل إعلان' : 'إضافة ساعة للسوق'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 mb-6">{error}</div>
        )}

        {/* ── صورة ── */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
          <label className="label-field mb-3 block">الصورة الرئيسية</label>
          <div className="flex items-start gap-4">
            <div
              className="w-32 h-32 bg-obsidian-800 border border-obsidian-700 overflow-hidden flex-shrink-0 cursor-pointer hover:border-gold-500/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {imgPreview
                ? <img src={imgPreview} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-obsidian-600 text-3xl">+</div>}
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline text-xs py-2 px-4 mb-2">
                {imgPreview ? 'تغيير الصورة' : 'رفع صورة'}
              </button>
              <p className="text-obsidian-500 text-xs">JPEG أو PNG · الحد الأقصى 5 MB</p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
        </div>

        {/* ── تفاصيل ── */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">الماركة *</label>
              <input type="text" value={form.brand} onChange={set('brand')} className="input-field" required />
            </div>
            <div>
              <label className="label-field">الموديل</label>
              <input type="text" value={form.model} onChange={set('model')} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">الرقم المرجعي</label>
              <input type="text" value={form.reference_number} onChange={set('reference_number')} className="input-field" />
            </div>
            <div>
              <label className="label-field">السنة</label>
              <input type="number" min={1900} max={2099} value={form.year} onChange={set('year')} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">الحالة</label>
              <select value={form.condition} onChange={set('condition')} className="input-field">
                {CONDITIONS.map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">حالة الإعلان</label>
              <select value={form.status} onChange={set('status')} className="input-field">
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">الوصف</label>
            <textarea value={form.description} onChange={set('description')} className="input-field h-24 resize-none" />
          </div>
        </div>

        {/* ── السعر ── */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6 space-y-4">
          <h2 className="font-serif text-white text-lg">السعر</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">السعر (د.ك) *</label>
              <input type="number" min="0" step="0.001" value={form.price} onChange={set('price')} className="input-field" required />
            </div>
            <div>
              <label className="label-field">سعر الوكيل الرسمي (اختياري)</label>
              <input type="number" min="0" step="0.001" value={form.retail_price} onChange={set('retail_price')} className="input-field" placeholder="0" />
              <p className="text-obsidian-600 text-xs mt-1">يُظهر نسبة التوفير للعميل</p>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.negotiable} onChange={e => setForm(p => ({ ...p, negotiable: e.target.checked }))} className="accent-gold-500 w-4 h-4" />
            <span className="text-obsidian-300 text-sm">قابل للتفاوض</span>
          </label>
        </div>

        {/* ── مواصفات ── */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6 space-y-4">
          <h2 className="font-serif text-white text-lg">مواصفات الساعة</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">الحركة</label>
              <input type="text" placeholder="أوتوماتيك / يدوي / كوارتز" value={form.movement} onChange={set('movement')} className="input-field" />
            </div>
            <div>
              <label className="label-field">مادة الغلاف</label>
              <input type="text" placeholder="ستانلس ستيل / ذهب..." value={form.case_material} onChange={set('case_material')} className="input-field" />
            </div>
            <div>
              <label className="label-field">مادة الأساور</label>
              <input type="text" value={form.bracelet_material} onChange={set('bracelet_material')} className="input-field" />
            </div>
            <div>
              <label className="label-field">لون الوجه</label>
              <input type="text" value={form.dial_color} onChange={set('dial_color')} className="input-field" />
            </div>
            <div>
              <label className="label-field">قطر الغلاف (mm)</label>
              <input type="number" step="0.1" value={form.case_diameter} onChange={set('case_diameter')} className="input-field" />
            </div>
            <div>
              <label className="label-field">مقاومة الماء</label>
              <input type="text" placeholder="مثال: 100m" value={form.water_resistance} onChange={set('water_resistance')} className="input-field" />
            </div>
            <div>
              <label className="label-field">الرقم التسلسلي</label>
              <input type="text" value={form.serial_number} onChange={set('serial_number')} className="input-field" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.has_box} onChange={e => setForm(p => ({ ...p, has_box: e.target.checked }))} className="accent-gold-500 w-4 h-4" />
              <span className="text-obsidian-300 text-sm">مع الصندوق</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.has_papers} onChange={e => setForm(p => ({ ...p, has_papers: e.target.checked }))} className="accent-gold-500 w-4 h-4" />
              <span className="text-obsidian-300 text-sm">مع الأوراق</span>
            </label>
          </div>
        </div>

        {/* ── إجراءات ── */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-gold">
            {saving ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التغييرات' : 'نشر الإعلان'}
          </button>
          <button type="button" onClick={() => navigate('/admin/listings')} className="btn-outline">
            إلغاء
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};
