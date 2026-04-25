import React, { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVaultWatch, updateVaultWatch, removeFromVault,
  addImagesToWatch, setCoverImage, removeWatchImage, markAsSold,
} from '../api/vault';
import { requestValuation, getWatchValuationRequest } from '../api/valuations';
import { Layout } from '../components/layout/Layout';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import WatchGallery from '../components/vault/WatchGallery';
import { formatCurrency, formatDate } from '../utils/format';
import { useT } from '../i18n/useLanguage';
import { useAuthStore } from '../store/authStore';
import { useCurrencyStore, convertFromGBP } from '../store/currencyStore';

const CONDITIONS = ['new', 'excellent', 'good', 'fair'] as const;
const SOURCES = ['auction', 'marketplace', 'external', 'gift', 'other'] as const;

export const VaultDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.vault;
  const td = t.detail;
  const tv = t.valuation;
  const { user } = useAuthStore();
  const { currency } = useCurrencyStore();
  const fmtCurrency = (amount: number | null | undefined) =>
    formatCurrency(amount != null ? convertFromGBP(amount, currency) : amount, currency);

  const [activeImg, setActiveImg] = useState(0);
  const [editing, setEditing] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [valuationMessage, setValuationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showSoldForm, setShowSoldForm] = useState(false);
  const [soldPriceInput, setSoldPriceInput] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const watchId = Number(id);

  const { data: watch, isLoading, error } = useQuery({
    queryKey: ['vault-watch', watchId],
    queryFn: () => getVaultWatch(watchId),
    enabled: !!watchId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, any>) => updateVaultWatch(watchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-watch', watchId] });
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeFromVault(watchId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vault'] }); navigate('/vault'); },
  });

  const soldMutation = useMutation({
    mutationFn: (price: number) => markAsSold(watchId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-watch', watchId] });
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      setShowSoldForm(false);
      setSoldPriceInput('');
    },
  });

  const addImagesMutation = useMutation({
    mutationFn: (files: File[]) => addImagesToWatch(watchId, user!.id as string, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-watch', watchId] });
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      setUploadError('');
    },
    onError: (e: Error) => setUploadError(e.message),
  });

  const setCoverMutation = useMutation({
    mutationFn: ({ imageId, url }: { imageId: number; url: string }) => setCoverImage(watchId, imageId, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-watch', watchId] });
      queryClient.invalidateQueries({ queryKey: ['vault'] });
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: (imageId: number) => removeWatchImage(imageId, watchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-watch', watchId] });
      queryClient.invalidateQueries({ queryKey: ['vault'] });
    },
  });

  const { data: valuationRequest, refetch: refetchValuation } = useQuery({
    queryKey: ['valuation-request', watchId],
    queryFn: () => getWatchValuationRequest(watchId),
    enabled: !!watchId,
    refetchInterval: 30_000, // auto-refresh every 30s to pick up admin updates
  });

  const valuationMutation = useMutation({
    mutationFn: () => requestValuation(watchId),
    onSuccess: () => {
      setShowValuationModal(false);
      setValuationMessage({ type: 'success', text: tv.requestSent });
      refetchValuation();
    },
    onError: (e: Error) => {
      setShowValuationModal(false);
      setValuationMessage({
        type: 'error',
        text: e.message === 'duplicate' ? tv.alreadyPending : tv.requestError,
      });
    },
  });

  const handleEditOpen = () => {
    if (!watch) return;
    setEditForm({
      brand: watch.brand,
      model: watch.model,
      reference_number: watch.reference_number ?? '',
      serial_number: watch.serial_number ?? '',
      year: watch.year ?? '',
      condition: watch.condition,
      purchase_price: watch.purchase_price,
      current_value: watch.current_value ?? '',
      purchased_at: watch.purchased_at,
      purchase_source: watch.purchase_source,
      notes: watch.notes ?? '',
    });
    setEditing(true);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...editForm, year: editForm.year ? parseInt(editForm.year) : null };
    updateMutation.mutate(payload);
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadError('');
    addImagesMutation.mutate(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const plColor = (v: number | null) => v == null ? 'text-obsidian-400' : v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-obsidian-400';

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-obsidian-800 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-96 bg-obsidian-800" />
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-obsidian-800 rounded" />)}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !watch) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-obsidian-400">Watch not found.</p>
          <Link to="/vault" className="text-gold-500 text-sm mt-4 inline-block">{td.backToVault}</Link>
        </div>
      </Layout>
    );
  }

  const images: any[] = watch.images ?? [];
  const displayImages = images.length > 0
    ? images
    : watch.image_url
      ? [{ id: -1, url: watch.image_url, is_cover: true }]
      : [];

  const field = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between items-start py-3 border-b border-obsidian-800 last:border-0">
      <span className="text-obsidian-400 text-xs uppercase tracking-wider">{label}</span>
      <span className="text-white text-sm text-right max-w-[55%]">{value || '—'}</span>
    </div>
  );

  return (
    <Layout>
      <Breadcrumb items={[
        { label: tr.nav.vault, href: '/vault' },
        { label: watch.brand ? `${watch.brand} ${watch.model}` : watch.model },
      ]} />
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Edit form */}
        {editing && (
          <div className="bg-obsidian-900 border border-gold-500/30 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-xl text-white">{td.editWatch}</h2>
              <button onClick={() => setEditing(false)} className="text-obsidian-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleEditSave}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {[
                  { key: 'brand', label: t.fields.brand, required: true },
                  { key: 'model', label: t.fields.model, required: true },
                  { key: 'reference_number', label: t.fields.reference },
                  { key: 'serial_number', label: t.fields.serialNumber },
                  { key: 'year', label: t.fields.year, type: 'number' },
                ].map(({ key, label, required, type }) => (
                  <div key={key}>
                    <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{label}</label>
                    <input type={type ?? 'text'} className="input-field" required={required}
                      value={editForm[key] ?? ''}
                      onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.condition}</label>
                  <select className="input-field" value={editForm.condition ?? 'excellent'}
                    onChange={e => setEditForm(p => ({ ...p, condition: e.target.value }))}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{t.conditions[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.purchasePrice}</label>
                  <input type="number" className="input-field" required value={editForm.purchase_price ?? ''}
                    onChange={e => setEditForm(p => ({ ...p, purchase_price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{td.currentValue}</label>
                  <input type="number" className="input-field" value={editForm.current_value ?? ''}
                    onChange={e => setEditForm(p => ({ ...p, current_value: e.target.value }))} />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.purchaseDate}</label>
                  <input type="date" className="input-field" required value={editForm.purchased_at ?? ''}
                    onChange={e => setEditForm(p => ({ ...p, purchased_at: e.target.value }))} />
                </div>
                <div>
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.source}</label>
                  <select className="input-field" value={editForm.purchase_source ?? 'external'}
                    onChange={e => setEditForm(p => ({ ...p, purchase_source: e.target.value }))}>
                    {SOURCES.map(s => <option key={s} value={s}>{t.sources[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.fields.notes}</label>
                <textarea className="input-field h-20 resize-none" value={editForm.notes ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={updateMutation.isPending} className="btn-gold">
                  {updateMutation.isPending ? td.saving : td.saveChanges}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-outline">{t.actions.cancel}</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Gallery */}
          <div>
            <WatchGallery
              images={displayImages.map((img: any) => ({ id: img.id, url: img.url }))}
              title={watch.model}
              selectedIndex={activeImg}
              onSelect={setActiveImg}
              showThumbs={false}
            />

            {/* Single thumbnail row: click to select + management controls + add button */}
            <div className="flex gap-2 flex-wrap mt-4">
              {displayImages.map((img: any, idx: number) => (
                <div key={img.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => setActiveImg(idx)}
                    style={{
                      width: 64, height: 64, padding: 0,
                      border: activeImg === idx ? '2px solid #d4af37' : '1px solid #444',
                      background: '#111', cursor: 'pointer',
                      boxShadow: activeImg === idx ? '0 0 0 1px rgba(212,175,55,0.35)' : 'none',
                    }}
                  >
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                  {img.id !== -1 && (
                    <div className="absolute inset-0 bg-obsidian-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pointer-events-none group-hover:pointer-events-auto">
                      {!img.is_cover && (
                        <button type="button"
                          onClick={() => setCoverMutation.mutate({ imageId: img.id, url: img.url })}
                          className="text-gold-500 text-[10px] uppercase tracking-wider px-1 hover:text-gold-400">
                          {td.setCover}
                        </button>
                      )}
                      <button type="button"
                        onClick={() => { if (window.confirm(td.deletePhoto + '?')) removeImageMutation.mutate(img.id); }}
                        className="text-red-400 text-[10px] uppercase tracking-wider hover:text-red-300">
                        {td.deletePhoto}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()}
                disabled={addImagesMutation.isPending}
                className="w-16 h-16 border border-dashed border-obsidian-700 hover:border-gold-500/50 flex flex-col items-center justify-center transition-colors">
                {addImagesMutation.isPending ? (
                  <span className="text-obsidian-400 text-[10px]">{td.uploading}</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-obsidian-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-obsidian-500 text-[10px] mt-1">{td.addPhotos}</span>
                  </>
                )}
              </button>
            </div>

            <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={handleFilePick} />
            {uploadError && <p className="text-red-400 text-xs mt-1">{uploadError}</p>}
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <p className="text-gold-500 text-xs uppercase tracking-widest mb-1">{watch.brand}</p>
              <h1 className="font-serif text-3xl text-white mb-1">{watch.model}</h1>
              {watch.reference_number && (
                <p className="text-obsidian-400 text-sm">Ref. {watch.reference_number}</p>
              )}
            </div>

            {/* Financial cards */}
            {(() => {
              const isValuationDone = valuationRequest?.status === 'completed' && valuationRequest?.valuation_amount;
              const valAmount = isValuationDone ? Number(valuationRequest.valuation_amount) : null;
              const cost = Number(watch.purchase_price ?? 0);
              const pl = valAmount != null ? valAmount - cost : watch.profit_loss;
              const plPct = pl != null && cost > 0 ? (pl / cost) * 100 : watch.profit_loss_percent;
              return (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-obsidian-900 border border-obsidian-800 p-4">
                      <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-1">{t.table.cost}</p>
                      <p className="text-white font-semibold">{fmtCurrency(watch.purchase_price)}</p>
                    </div>
                    <div className={`bg-obsidian-900 border p-4 ${isValuationDone ? 'border-gold-500/40' : 'border-obsidian-800'}`}>
                      <p className={`text-xs uppercase tracking-wider mb-1 ${isValuationDone ? 'text-gold-500' : 'text-obsidian-400'}`}>
                        {tv.statusLabel}
                      </p>
                      <p className="text-white font-semibold">
                        {valAmount != null ? fmtCurrency(valAmount) : '—'}
                      </p>
                      {!isValuationDone && valuationRequest && (
                        <ValuationBadge status={valuationRequest.status} labels={tv} />
                      )}
                    </div>
                    <div className="bg-obsidian-900 border border-obsidian-800 p-4">
                      <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-1">{t.table.pl}</p>
                      <p className={`font-semibold ${plColor(pl ?? null)}`}>
                        {pl != null ? `${pl > 0 ? '+' : ''}${fmtCurrency(pl)}` : '—'}
                      </p>
                      {plPct != null && (
                        <p className={`text-xs ${plColor(plPct)}`}>
                          {plPct > 0 ? '+' : ''}{Number(plPct).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Valuation notes */}
                  {isValuationDone && (
                    <div className="bg-obsidian-900 border border-gold-500/20 px-5 py-4">
                      {valuationRequest.valuation_notes && (
                        <>
                          <p className="text-gold-500 text-xs uppercase tracking-widest mb-2">{tv.notes}</p>
                          <p className="text-obsidian-200 text-sm leading-relaxed">{valuationRequest.valuation_notes}</p>
                          <div className="border-t border-obsidian-800 mt-3 pt-3" />
                        </>
                      )}
                      <p className="text-obsidian-500 text-xs leading-relaxed">
                        هذا التقييم استرشادي ويعكس القيمة السوقية الحالية، ولا يُعد عرضاً أو التزاماً ملزماً من الشركة
                      </p>
                      <p className="text-obsidian-600 text-xs mt-2">
                        {new Date(valuationRequest.updated_at ?? valuationRequest.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  )}

                  {/* Pending/in-review banner */}
                  {valuationRequest && valuationRequest.status !== 'completed' && (
                    <div className="bg-obsidian-900 border border-obsidian-800 px-5 py-3 flex items-center gap-3">
                      <ValuationBadge status={valuationRequest.status} labels={tv} />
                      <span className="text-obsidian-500 text-xs">
                        {new Date(valuationRequest.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Watch details */}
            <div className="bg-obsidian-900 border border-obsidian-800 px-5 py-1">
              {field(t.fields.brand, watch.brand)}
              {field(t.fields.model, watch.model)}
              {field(t.fields.reference, watch.reference_number)}
              {watch.serial_number && field(t.fields.serialNumber, watch.serial_number)}
              {field(t.fields.year, watch.year)}
              {field(t.fields.condition, watch.condition ? t.conditions[watch.condition as keyof typeof t.conditions] : null)}
              {field(t.fields.purchaseDate, watch.purchased_at ? formatDate(watch.purchased_at) : null)}
              {field(t.fields.source, watch.purchase_source ? t.sources[watch.purchase_source as keyof typeof t.sources] : null)}
              {watch.notes && field(t.fields.notes, watch.notes)}
            </div>

            {/* Feedback message */}
            {valuationMessage && (
              <p className={`text-sm ${valuationMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {valuationMessage.text}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleEditOpen} className="btn-gold">{td.editWatch}</button>
              {(!valuationRequest || !['pending', 'in_review'].includes(valuationRequest.status)) && (
                <button
                  onClick={() => { setValuationMessage(null); setShowValuationModal(true); }}
                  className="border border-gold-500/40 text-gold-500 hover:bg-gold-500/10 px-4 py-2 text-xs uppercase tracking-wider transition-colors">
                  {tv.request}
                </button>
              )}
              {watch?.status !== 'sold' && (
                <button
                  onClick={() => { setShowSoldForm(s => !s); setSoldPriceInput(''); }}
                  className="border border-obsidian-600 text-obsidian-300 hover:border-gold-500/50 hover:text-gold-500 px-4 py-2 text-xs uppercase tracking-wider transition-colors">
                  تم البيع
                </button>
              )}
              <button
                onClick={() => { if (window.confirm(td.confirmDelete)) deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
                className="border border-red-500/40 text-red-400 hover:bg-red-500/10 px-4 py-2 text-xs uppercase tracking-wider transition-colors">
                {deleteMutation.isPending ? '...' : td.deleteWatch}
              </button>
            </div>

            {/* Sold price form */}
            {showSoldForm && watch?.status !== 'sold' && (
              <div className="mt-4 p-4 bg-obsidian-800 border border-obsidian-700">
                <p className="text-obsidian-300 text-sm mb-3">أدخل سعر البيع لحساب الربح / الخسارة:</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    autoFocus
                    value={soldPriceInput}
                    onChange={e => setSoldPriceInput(e.target.value)}
                    placeholder="0.000 د.ك"
                    className="input-field w-44 text-sm"
                  />
                  <button
                    onClick={() => soldMutation.mutate(parseFloat(soldPriceInput) || 0)}
                    disabled={soldMutation.isPending}
                    className="btn-gold text-sm py-2 px-5">
                    {soldMutation.isPending ? 'جارٍ...' : 'تأكيد البيع'}
                  </button>
                  <button
                    onClick={() => setShowSoldForm(false)}
                    className="btn-outline text-sm py-2 px-4">
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Sold badge */}
            {watch?.status === 'sold' && (
              <div className="mt-4 p-4 bg-obsidian-800 border border-obsidian-700 flex items-center gap-4">
                <span className="text-xs uppercase tracking-wider px-3 py-1 border border-obsidian-600 text-obsidian-400">
                  مباعة
                </span>
                {watch.sold_price != null && (
                  <p className="text-obsidian-300 text-sm">
                    سعر البيع: <span className="text-white font-semibold">{fmtCurrency(watch.sold_price)}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Valuation request modal */}
      {showValuationModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-obsidian-900 border border-obsidian-700 max-w-md w-full p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-serif text-xl text-white">{tv.modalTitle}</h2>
              <button onClick={() => setShowValuationModal(false)} className="text-obsidian-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="space-y-4 mb-8">
              <p className="text-obsidian-300 text-sm leading-relaxed">{tv.terms}</p>
              <div className="border-t border-obsidian-800 pt-4 space-y-2">
                <p className="text-gold-500 text-sm font-semibold">{tv.fee}</p>
                <p className="text-obsidian-400 text-sm">{tv.turnaround}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => valuationMutation.mutate()}
                disabled={valuationMutation.isPending}
                className="btn-gold flex-1">
                {valuationMutation.isPending ? '...' : tv.confirm}
              </button>
              <button onClick={() => setShowValuationModal(false)} className="btn-outline">{tv.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  in_review: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/15 text-green-400 border-green-500/30',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/30',
};

function ValuationBadge({ status, labels }: { status: string; labels: any }) {
  const label = labels[status as keyof typeof labels] ?? status;
  return (
    <span className={`text-xs uppercase tracking-wider px-2 py-1 border ${STATUS_COLORS[status] ?? 'text-obsidian-400 border-obsidian-700'}`}>
      {label}
    </span>
  );
}
