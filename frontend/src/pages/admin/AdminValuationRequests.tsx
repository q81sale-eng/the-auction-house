import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAllValuationRequests, updateValuationRequest, type ValuationStatus } from '../../api/valuations';
import { formatCurrency, formatDate } from '../../utils/format';
import { useT } from '../../i18n/useLanguage';

const fmt = (v: number) => formatCurrency(v, 'KWD');


const STATUS_COLORS: Record<ValuationStatus, string> = {
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  in_review: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/15 text-green-400 border-green-500/30',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/30',
};

export const AdminValuationRequests: React.FC = () => {
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.admin.valuations;
  const conditionLabels = tr.admin.condition;

  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState({ status: 'in_review' as ValuationStatus, valuation_amount: '', valuation_notes: '' });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin', 'valuation-requests'],
    queryFn: getAllValuationRequests,
  });

  const updateMutation = useMutation({
    mutationFn: () => updateValuationRequest(selected.id, {
      status: form.status,
      valuation_amount: form.status === 'completed' && form.valuation_amount ? Number(form.valuation_amount) : null,
      valuation_notes: form.status === 'completed' ? (form.valuation_notes || null) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'valuation-requests'] });
      setSelected(null);
    },
  });

  const openRequest = (req: any) => {
    setSelected(req);
    setForm({
      status: (req.status === 'completed' || req.status === 'rejected') ? req.status : 'in_review',
      valuation_amount: req.valuation_amount ?? '',
      valuation_notes: req.valuation_notes ?? '',
    });
  };

  const w = selected?.vault_watches;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">{t.title}</h1>
          <p className="text-obsidian-400 text-sm">{t.subtitle}</p>
        </div>
        <span className="text-obsidian-400 text-sm">{requests.length} {t.total}</span>
      </div>

      {/* Edit panel */}
      {selected && (
        <div className="card p-6 mb-8 border-gold-500/30">
          <div className="flex justify-between items-start mb-5">
            <button onClick={() => setSelected(null)} className="text-obsidian-400 hover:text-white text-lg leading-none">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Watch image */}
            <div className="flex flex-col gap-3">
              {w?.image_url ? (
                <img
                  src={w.image_url}
                  alt={`${w.brand} ${w.model}`}
                  className="w-full max-h-64 object-contain bg-obsidian-800 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-48 bg-obsidian-800 flex items-center justify-center text-obsidian-500 text-sm rounded">
                  لا توجد صورة
                </div>
              )}
            </div>

            {/* Watch details */}
            <div className="space-y-3">
              <div>
                <h2 className="font-serif text-2xl text-white">{w?.brand}</h2>
                <p className="text-gold-500 text-lg">{w?.model}</p>
              </div>
              {w?.reference_number && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">Ref.</span>
                  <p className="text-white font-mono">{w.reference_number}</p>
                </div>
              )}
              {w?.condition && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">{t.condition}</span>
                  <p className="text-white">{(conditionLabels as any)[w.condition] ?? w.condition}</p>
                </div>
              )}
              {w?.year && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">{t.year}</span>
                  <p className="text-white">{w.year}</p>
                </div>
              )}
              {w?.purchase_price && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">سعر الشراء</span>
                  <p className="text-white">{fmt(Number(w.purchase_price))}</p>
                </div>
              )}
              {w?.current_value && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">القيمة الحالية</span>
                  <p className="text-white">{fmt(Number(w.current_value))}</p>
                </div>
              )}
              {w?.notes && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">{t.watchNotes}</span>
                  <p className="text-obsidian-300 text-sm mt-1">{w.notes}</p>
                </div>
              )}
              <div>
                <span className="text-obsidian-400 text-xs uppercase tracking-wider">المستخدم</span>
                <p className="text-white">{selected.profiles?.name || '—'}</p>
                <p className="text-obsidian-500 text-xs">{selected.user_id?.slice(0, 8)}...</p>
              </div>
              <p className="text-obsidian-500 text-xs">{formatDate(selected.created_at)}</p>
            </div>
          </div>

          {/* Edit form */}
          <div className="border-t border-obsidian-700 pt-5">
            {/* Status buttons */}
            <div className="mb-5">
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-3">{t.statusLabel}</label>
              <div className="flex gap-3 flex-wrap">
                {[
                  { value: 'in_review', label: t.statuses.in_review, color: 'border-blue-500/50 text-blue-400 data-[active=true]:bg-blue-500/20' },
                  { value: 'completed', label: t.statuses.completed, color: 'border-green-500/50 text-green-400 data-[active=true]:bg-green-500/20' },
                  { value: 'rejected',  label: t.statuses.rejected,  color: 'border-red-500/50 text-red-400 data-[active=true]:bg-red-500/20' },
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    data-active={form.status === value}
                    onClick={() => setForm(p => ({ ...p, status: value as ValuationStatus }))}
                    className={`px-4 py-2 text-sm border transition-colors ${color} ${form.status === value ? 'ring-1 ring-current' : 'opacity-50 hover:opacity-80'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Valuation fields — only shown when completed */}
            {form.status === 'completed' && (
              <>
                <div className="mb-4">
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.valuationAmount}</label>
                  <input
                    type="number"
                    className="input-field text-sm"
                    value={form.valuation_amount}
                    onChange={e => setForm(p => ({ ...p, valuation_amount: e.target.value }))}
                    placeholder="0.000"
                  />
                </div>
                <div className="mb-5">
                  <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-1">{t.notes}</label>
                  <textarea
                    className="input-field text-sm h-24 resize-none"
                    value={form.valuation_notes}
                    onChange={e => setForm(p => ({ ...p, valuation_notes: e.target.value }))}
                    placeholder={t.notesPlaceholder}
                  />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="btn-gold">
                {updateMutation.isPending ? t.saving : t.save}
              </button>
              <button onClick={() => setSelected(null)} className="btn-outline">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Requests table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {[t.watch, t.user, t.requested, t.status, t.amount, t.action].map(h => (
                <th key={h} className="text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-obsidian-800 rounded animate-pulse" /></td></tr>
              ))
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-obsidian-500">{t.noData}</td></tr>
            ) : (
              requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-obsidian-900/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {req.vault_watches?.image_url && (
                        <img src={req.vault_watches.image_url} alt="" className="w-10 h-10 object-cover bg-obsidian-800 flex-shrink-0 rounded" />
                      )}
                      <div>
                        <p className="text-white text-xs font-medium">
                          {req.vault_watches?.brand} {req.vault_watches?.model}
                        </p>
                        {req.vault_watches?.reference_number && (
                          <p className="text-obsidian-500 text-xs font-mono">{req.vault_watches.reference_number}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-obsidian-300 text-xs">
                    <p>{req.profiles?.name || '—'}</p>
                    <p className="text-obsidian-500">{req.user_id?.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 text-obsidian-400 text-xs">{formatDate(req.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs uppercase tracking-wider px-2 py-1 border ${STATUS_COLORS[req.status as ValuationStatus] ?? 'text-obsidian-400'}`}>
                      {t.statuses[req.status as ValuationStatus] ?? req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gold-500 text-xs font-semibold">
                    {req.valuation_amount ? fmt(Number(req.valuation_amount)) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openRequest(req)}
                      className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors">
                      {t.review}
                    </button>
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
// Sat Apr 25 03:20:06 UTC 2026
