import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import {
  getAuction, createAuction, updateAuction,
  uploadAuctionImages, insertAuctionImages, deleteAllAuctionImages, getAuctionImages,
} from '../../api/admin';
import { useT } from '../../i18n/useLanguage';

const STATUSES   = ['upcoming', 'live', 'ended', 'sold', 'cancelled'] as const;
const CONDITIONS = ['new', 'excellent', 'good', 'fair'] as const;
const MAX_IMAGES = 10;

type ImageItem =
  | { type: 'existing'; id: string; url: string }
  | { type: 'new';      file: File; preview: string };

const blank = {
  title: '', brand: '', reference: '', description: '',
  condition: 'excellent', status: 'upcoming',
  starting_price: '', current_bid: '', buy_now_price: '', retail_price: '',
  bid_increment: '100', deposit_required: '0',
  starts_at: '', ends_at: '',
  buy_now_active: false as boolean,
};

export const AdminAuctionForm: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const isEdit   = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tr }   = useT();
  const t        = tr.admin;
  const fileRef  = useRef<HTMLInputElement>(null);

  const [form,   setForm]   = useState(blank);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const { data: existing } = useQuery({
    queryKey: ['admin', 'auction', id],
    queryFn:  () => getAuction(id!),
    enabled:  isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      title:            existing.title            ?? '',
      brand:            existing.brand            ?? '',
      reference:        existing.reference        ?? '',
      description:      existing.description      ?? '',
      condition:        existing.condition        ?? 'excellent',
      status:           existing.status           ?? 'upcoming',
      starting_price:   existing.starting_price   != null ? String(existing.starting_price)   : '',
      current_bid:      existing.current_bid      != null ? String(existing.current_bid)       : '',
      buy_now_price:    existing.buy_now_price    != null ? String(existing.buy_now_price)     : '',
      buy_now_active:   existing.buy_now_price    != null,
      retail_price:     existing.retail_price     != null ? String(existing.retail_price)      : '',
      bid_increment:    existing.bid_increment    != null ? String(existing.bid_increment)     : '100',
      deposit_required: existing.deposit_required != null ? String(existing.deposit_required)  : '0',
      starts_at:        existing.starts_at ? existing.starts_at.slice(0, 16) : '',
      ends_at:          existing.ends_at   ? existing.ends_at.slice(0, 16)   : '',
    });

    // Load existing images
    getAuctionImages(existing.id).then(imgs => {
      setImages(imgs.map(img => ({ type: 'existing', id: img.id, url: img.image_url })));
    }).catch(() => {
      // Fallback: if auction_images table doesn't exist yet, show legacy image_url
      if (existing.image_url) {
        setImages([{ type: 'existing', id: '__legacy__', url: existing.image_url }]);
      }
    });
  }, [existing]);

  // ── File input handler ──────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);
    const newItems: ImageItem[] = toAdd.map(file => ({
      type:    'new',
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newItems]);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      const updated = [...prev];
      const item = updated[idx];
      if (item.type === 'new') URL.revokeObjectURL(item.preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.ends_at) { setError('End date/time (Ends At) is required.'); return; }
    if (!form.starting_price) { setError('Starting price is required.'); return; }

    setSaving(true);
    try {
      // 1. Upload new image files to storage, get back public URLs
      const newItems = images.filter((img): img is { type: 'new'; file: File; preview: string } => img.type === 'new');
      const uploadedUrls: string[] = newItems.length
        ? await uploadAuctionImages(newItems.map(i => i.file))
        : [];

      // 2. Build ordered URL list — existing items keep their URL, new items get the uploaded public URL
      let uploadIdx = 0;
      const orderedUrls: string[] = images.map(img =>
        img.type === 'existing' ? img.url : uploadedUrls[uploadIdx++]
      ).filter(Boolean);

      // 3. Build auction payload
      const payload: Record<string, any> = {
        title:            form.title,
        brand:            form.brand,
        reference:        form.reference        || null,
        description:      form.description      || null,
        condition:        form.condition,
        status:           form.status,
        starting_price:   parseFloat(form.starting_price),
        bid_increment:    parseFloat(form.bid_increment    || '100'),
        deposit_required: parseFloat(form.deposit_required || '0'),
        ends_at:          new Date(form.ends_at).toISOString(),
        image_url:        orderedUrls[0] ?? null,
      };
      if (form.current_bid)                          payload.current_bid   = parseFloat(form.current_bid);
      if (form.buy_now_active && form.buy_now_price) payload.buy_now_price = parseFloat(form.buy_now_price);
      else                                           payload.buy_now_price = null;
      payload.retail_price = form.retail_price ? parseFloat(form.retail_price) : null;
      if (form.starts_at)     payload.starts_at      = new Date(form.starts_at).toISOString();

      // 4. Create or update auction row
      let auctionId: string;
      if (isEdit) {
        await updateAuction(id!, payload);
        auctionId = id!;
      } else {
        const created = await createAuction(payload);
        auctionId = created.id;
      }

      // 5. Replace image records (delete all, re-insert in current order)
      // Errors here are non-fatal (table may not exist in older deployments)
      try {
        await deleteAllAuctionImages(auctionId);
        if (orderedUrls.length > 0) await insertAuctionImages(auctionId, orderedUrls);
      } catch (imgErr: any) {
        console.warn('auction_images save failed (non-fatal):', imgErr?.message);
      }

      queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] });
      navigate('/admin/auctions');
    } catch (err: any) {
      console.error('Auction save error:', err);
      const msg = err?.response?.data?.message ?? err?.message ?? 'Save failed. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">
          {isEdit ? t.actions.editAuction : t.actions.createAuction}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 mb-6">
            {error}
          </div>
        )}

        {/* ── Details ─────────────────────────────────────────────────────── */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6 space-y-4">
          <div>
            <label className="label-field">{t.form.title} *</label>
            <input type="text" value={form.title} onChange={set('title')} className="input-field" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">{t.form.brand} *</label>
              <input type="text" value={form.brand} onChange={set('brand')} className="input-field" required />
            </div>
            <div>
              <label className="label-field">{t.form.reference}</label>
              <input type="text" value={form.reference} onChange={set('reference')} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label-field">{t.form.description}</label>
            <textarea value={form.description} onChange={set('description')} className="input-field h-24 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">{t.form.condition}</label>
              <select value={form.condition} onChange={set('condition')} className="input-field">
                {CONDITIONS.map(c => <option key={c} value={c}>{t.condition[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">{t.form.status}</label>
              <select value={form.status} onChange={set('status')} className="input-field">
                {STATUSES.map(s => <option key={s} value={s}>{t.status[s]}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Pricing ─────────────────────────────────────────────────────── */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6 space-y-4">
          <h2 className="font-serif text-white text-lg">{t.form.pricing}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-field">{t.form.startingPrice} *</label>
              <input type="number" min="0" step="0.01" value={form.starting_price} onChange={set('starting_price')} className="input-field" required />
            </div>
            <div>
              <label className="label-field">{t.form.currentBid}</label>
              <input type="number" min="0" step="0.01" value={form.current_bid} onChange={set('current_bid')} className="input-field" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, buy_now_active: !p.buy_now_active }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.buy_now_active ? 'bg-gold-500' : 'bg-obsidian-700'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.buy_now_active ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
                <label className="label-field mb-0">{t.form.buyNowPrice}</label>
              </div>
              {form.buy_now_active && (
                <input type="number" min="0" step="0.01" value={form.buy_now_price} onChange={set('buy_now_price')} className="input-field" placeholder="0" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">سعر الوكيل الرسمي (اختياري)</label>
              <input type="number" min="0" step="0.01" value={form.retail_price} onChange={set('retail_price')} className="input-field" placeholder="0" />
              <p className="text-obsidian-600 text-xs mt-1">يُستخدم لحساب نسبة التوفير في صفحة المزاد</p>
            </div>
            <div />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">{t.form.bidIncrement}</label>
              <input type="number" min="1" step="0.01" value={form.bid_increment} onChange={set('bid_increment')} className="input-field" required />
            </div>
            <div>
              <label className="label-field">{t.form.depositRequired}</label>
              <input type="number" min="0" step="0.01" value={form.deposit_required} onChange={set('deposit_required')} className="input-field" />
            </div>
          </div>
        </div>

        {/* ── Schedule ────────────────────────────────────────────────────── */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
          <h2 className="font-serif text-white text-lg mb-4">Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">{t.form.startsAt}</label>
              <input type="datetime-local" value={form.starts_at} onChange={set('starts_at')} className="input-field" />
            </div>
            <div>
              <label className="label-field">{t.form.endsAt}</label>
              <input type="datetime-local" value={form.ends_at} onChange={set('ends_at')} className="input-field" required />
            </div>
          </div>
        </div>

        {/* ── Images ──────────────────────────────────────────────────────── */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="label-field mb-0">{t.form.image}</p>
              <p className="text-obsidian-500 text-xs mt-0.5">
                {images.length}/{MAX_IMAGES} · First image is the main thumbnail
              </p>
            </div>
            {images.length < MAX_IMAGES && (
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline text-xs py-2 px-4">
                + Add Images
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {images.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {images.map((img, i) => {
                // 'new' items use blob object URLs directly; 'existing' items use the stored URL
                const src = img.type === 'new'
                  ? img.preview
                  : (img.url.startsWith('http') ? img.url : `https://localhost:8000/storage/${img.url}`);
                return (
                  <div key={i} className="relative group aspect-square">
                    <div className={`w-full h-full overflow-hidden border ${i === 0 ? 'border-gold-500' : 'border-obsidian-700'}`}>
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/120x120/1a1a1a/d4af37?text=?'; }}
                      />
                    </div>
                    {i === 0 && (
                      <span className="absolute top-0 start-0 bg-gold-500 text-obsidian-950 text-[9px] px-1.5 py-0.5 uppercase tracking-wider leading-none">
                        Main
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 end-1 w-5 h-5 bg-obsidian-900/90 border border-obsidian-700 text-obsidian-400 hover:text-red-400 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* Add more slot */}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-obsidian-700 hover:border-gold-500/50 flex items-center justify-center text-obsidian-600 hover:text-gold-500 transition-colors text-xl"
                  title="Add more images"
                >
                  +
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-obsidian-700 hover:border-gold-500/50 p-8 text-center text-obsidian-500 hover:text-gold-500 transition-colors"
            >
              <p className="text-2xl mb-2">+</p>
              <p className="text-sm">{t.form.imageNote}</p>
            </button>
          )}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-gold">
            {saving
              ? (isEdit ? t.actions.saving : t.actions.creating)
              : (isEdit ? t.actions.saveChanges : t.actions.createAuction)
            }
          </button>
          <button type="button" onClick={() => navigate('/admin/auctions')} className="btn-outline">
            {t.actions.cancel}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};
