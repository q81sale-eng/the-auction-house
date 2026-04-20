import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAuction, createAuction, updateAuction, uploadAuctionImage } from '../../api/admin';
import { useT } from '../../i18n/useLanguage';

const STATUSES = ['upcoming', 'live', 'ended', 'sold', 'cancelled'] as const;
const CONDITIONS = ['new', 'excellent', 'good', 'fair'] as const;

const blank = {
  title: '', brand: '', reference: '', description: '',
  condition: 'excellent', status: 'upcoming',
  starting_price: '', current_bid: '', buy_now_price: '',
  bid_increment: '100', deposit_required: '0',
  starts_at: '', ends_at: '', image_url: '',
};

export const AdminAuctionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.admin;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(blank);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { data: existing } = useQuery({
    queryKey: ['admin', 'auction', id],
    queryFn: () => getAuction(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title:          existing.title ?? '',
        brand:          existing.brand ?? '',
        reference:      existing.reference ?? '',
        description:    existing.description ?? '',
        condition:      existing.condition ?? 'excellent',
        status:         existing.status ?? 'upcoming',
        starting_price:   existing.starting_price   != null ? String(existing.starting_price)   : '',
        current_bid:      existing.current_bid       != null ? String(existing.current_bid)       : '',
        buy_now_price:    existing.buy_now_price     != null ? String(existing.buy_now_price)     : '',
        bid_increment:    existing.bid_increment     != null ? String(existing.bid_increment)     : '100',
        deposit_required: existing.deposit_required  != null ? String(existing.deposit_required)  : '0',
        starts_at:        existing.starts_at ? existing.starts_at.slice(0, 16) : '',
        ends_at:          existing.ends_at   ? existing.ends_at.slice(0, 16)   : '',
        image_url:        existing.image_url ?? '',
      });
      if (existing.image_url) setImagePreview(existing.image_url);
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      if (isEdit) return updateAuction(id!, payload);
      return createAuction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] });
      navigate('/admin/auctions');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Save failed. Please try again.');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let imageUrl = form.image_url;

    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadAuctionImage(imageFile);
      } catch (err: any) {
        setError(err?.message || 'Image upload failed.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const payload: Record<string, any> = {
      title:       form.title,
      brand:       form.brand,
      reference:   form.reference || null,
      description: form.description || null,
      condition:   form.condition,
      status:      form.status,
      image_url:   imageUrl || null,
    };
    if (!form.ends_at) { setError('End date/time is required.'); return; }
    if (form.starting_price)   payload.starting_price   = parseFloat(form.starting_price);
    if (form.current_bid)      payload.current_bid      = parseFloat(form.current_bid);
    if (form.buy_now_price)    payload.buy_now_price    = parseFloat(form.buy_now_price);
    payload.bid_increment    = parseFloat(form.bid_increment || '100');
    payload.deposit_required = parseFloat(form.deposit_required || '0');
    if (form.starts_at) payload.starts_at = new Date(form.starts_at).toISOString();
    payload.ends_at = new Date(form.ends_at).toISOString();

    saveMutation.mutate(payload);
  };

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [k]: e.target.value }));

  const isPending = saveMutation.isPending || uploading;

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

        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6 space-y-4">
          {/* Title */}
          <div>
            <label className="label-field">{t.form.title} *</label>
            <input type="text" value={form.title} onChange={set('title')} className="input-field" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Brand */}
            <div>
              <label className="label-field">{t.form.brand} *</label>
              <input type="text" value={form.brand} onChange={set('brand')} className="input-field" required />
            </div>
            {/* Reference */}
            <div>
              <label className="label-field">{t.form.reference}</label>
              <input type="text" value={form.reference} onChange={set('reference')} className="input-field" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label-field">{t.form.description}</label>
            <textarea value={form.description} onChange={set('description')}
              className="input-field h-24 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Condition */}
            <div>
              <label className="label-field">{t.form.condition}</label>
              <select value={form.condition} onChange={set('condition')} className="input-field">
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{t.condition[c]}</option>
                ))}
              </select>
            </div>
            {/* Status */}
            <div>
              <label className="label-field">{t.form.status}</label>
              <select value={form.status} onChange={set('status')} className="input-field">
                {STATUSES.map(s => (
                  <option key={s} value={s}>{t.status[s]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
          <h2 className="font-serif text-white text-lg mb-4">Pricing</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="label-field">{t.form.startingPrice} *</label>
              <input type="number" min="0" step="0.01" value={form.starting_price} onChange={set('starting_price')}
                className="input-field" required />
            </div>
            <div>
              <label className="label-field">{t.form.currentBid}</label>
              <input type="number" min="0" step="0.01" value={form.current_bid} onChange={set('current_bid')}
                className="input-field" />
            </div>
            <div>
              <label className="label-field">{t.form.buyNowPrice}</label>
              <input type="number" min="0" step="0.01" value={form.buy_now_price} onChange={set('buy_now_price')}
                className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">{t.form.bidIncrement}</label>
              <input type="number" min="1" step="0.01" value={form.bid_increment} onChange={set('bid_increment')}
                className="input-field" required />
            </div>
            <div>
              <label className="label-field">{t.form.depositRequired}</label>
              <input type="number" min="0" step="0.01" value={form.deposit_required} onChange={set('deposit_required')}
                className="input-field" />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
          <h2 className="font-serif text-white text-lg mb-4">Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">{t.form.startsAt}</label>
              <input type="datetime-local" value={form.starts_at} onChange={set('starts_at')} className="input-field" />
            </div>
            <div>
              <label className="label-field">{t.form.endsAt}</label>
              <input type="datetime-local" value={form.ends_at} onChange={set('ends_at')} className="input-field" />
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
          <label className="label-field">{t.form.image}</label>
          <p className="text-obsidian-500 text-xs mb-3">{t.form.imageNote}</p>

          <div className="flex items-start gap-4">
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="w-24 h-20 object-cover bg-obsidian-800 flex-shrink-0" />
            )}
            <div className="flex-1 space-y-3">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="btn-outline text-sm w-full">
                {uploading ? t.form.uploading : t.form.selectImage}
              </button>
              <div>
                <label className="label-field">{t.form.orUrl}</label>
                <input type="url" value={form.image_url} onChange={set('image_url')}
                  placeholder="https://..." className="input-field text-sm"
                  onBlur={e => { if (e.target.value) setImagePreview(e.target.value); }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isPending} className="btn-gold">
            {isPending
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
