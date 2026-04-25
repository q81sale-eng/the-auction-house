import React, { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { submitWatchRequest, uploadWatchRequestImage } from '../api/watchRequests';
import { useT } from '../i18n/useLanguage';

interface Props {
  onClose: () => void;
}

const CONDITIONS = ['unworn', 'used', 'used_marks', 'unworn_storage'] as const;

export const WatchRequestModal: React.FC<Props> = ({ onClose }) => {
  const { tr, lang } = useT();
  const t = tr.watchRequest;
  const conditionLabels = tr.vault.conditions;
  const { user, isAuthenticated } = useAuthStore();
  const isRtl = lang === 'ar';

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    brand: '',
    model: '',
    reference_number: '',
    condition: '',
    year: '',
    notes: '',
    name:  isAuthenticated ? (user?.name  ?? '') : '',
    phone: isAuthenticated ? (user?.phone ?? '') : '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let image_url: string | undefined;
      if (imageFile) {
        try { image_url = await uploadWatchRequestImage(imageFile); }
        catch (imgErr) { console.warn('[WatchRequest] image upload skipped:', imgErr); }
      }

      const payload = {
        name:             form.name.trim(),
        phone:            form.phone.trim(),
        email:            form.email.trim() || undefined,
        user_id:          isAuthenticated ? String(user?.id) : undefined,
        brand:            form.brand.trim(),
        model:            form.model.trim() || undefined,
        reference_number: form.reference_number.trim() || undefined,
        condition:        form.condition || undefined,
        year:             form.year ? Number(form.year) : undefined,
        notes:            form.notes.trim() || undefined,
        image_url,
      };

      await submitWatchRequest(payload);

      // WhatsApp notification — best-effort, never blocks submission
      try {
        await fetch('/api/notify-watch-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch { /* ignore */ }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t.errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-obsidian-900 border border-obsidian-700 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-obsidian-900 border-b border-obsidian-700 flex items-center justify-between px-6 py-5">
          <div>
            <h2 className="font-serif text-xl text-white">{t.title}</h2>
            <p className="text-obsidian-400 text-xs mt-0.5">{t.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-obsidian-500 hover:text-white text-xl leading-none ms-4 transition-colors">✕</button>
        </div>

        {success ? (
          <div className="p-8 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="w-14 h-14 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-serif text-lg text-white mb-3">{t.successTitle}</h3>
            <p className="text-obsidian-300 text-sm leading-relaxed mb-6">{t.successMessage}</p>
            <button onClick={onClose} className="btn-gold">{t.close}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Image upload */}
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.imageLabel}</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="" className="w-full h-40 object-cover bg-obsidian-800 rounded" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 end-2 bg-black/60 hover:bg-black/80 text-white w-6 h-6 flex items-center justify-center text-sm transition-colors"
                  >✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-32 border border-dashed border-obsidian-600 hover:border-gold-500/50 flex flex-col items-center justify-center gap-2 text-obsidian-500 hover:text-obsidian-300 transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">{t.imageHint}</span>
                </button>
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.brand}</label>
              <input
                type="text"
                required
                className="input-field text-sm"
                value={form.brand}
                onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                placeholder="Rolex, Patek Philippe..."
              />
            </div>

            {/* Model */}
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.model}</label>
              <input
                type="text"
                className="input-field text-sm"
                value={form.model}
                onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
                placeholder="Submariner, Nautilus..."
              />
            </div>

            {/* Ref + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.referenceNumber}</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  value={form.reference_number}
                  onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))}
                  placeholder="126610LN"
                />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.year}</label>
                <input
                  type="number"
                  className="input-field text-sm"
                  value={form.year}
                  onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.condition}</label>
              <select
                className="input-field text-sm"
                value={form.condition}
                onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}
              >
                <option value="">—</option>
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{(conditionLabels as any)[c] ?? c}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.notes}</label>
              <textarea
                className="input-field text-sm h-20 resize-none"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>

            {/* Contact info */}
            <div className="border-t border-obsidian-700 pt-5 space-y-4">
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.name}</label>
                <input
                  type="text"
                  required
                  className="input-field text-sm"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.phone}</label>
                <input
                  type="tel"
                  required
                  className="input-field text-sm"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>

              {!isAuthenticated && (
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.email}</label>
                  <input
                    type="email"
                    className="input-field text-sm"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-gold w-full">
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
