import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAllWatchRequests, updateWatchRequestStatus, deleteWatchRequest, type WatchRequestStatus } from '../../api/watchRequests';
import { formatDate } from '../../utils/format';
import { useT } from '../../i18n/useLanguage';

const STATUS_COLORS: Record<WatchRequestStatus, string> = {
  new:       'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  contacted: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/15 text-green-400 border-green-500/30',
};

export const AdminWatchRequests: React.FC = () => {
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.admin.watchRequests;
  const conditionLabels = tr.admin.condition;

  const [selected, setSelected] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<WatchRequestStatus>('new');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin', 'watch-requests'],
    queryFn: getAllWatchRequests,
  });

  const updateMutation = useMutation({
    mutationFn: () => updateWatchRequestStatus(selected.id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'watch-requests'] });
      setSelected(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWatchRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'watch-requests'] }),
    onError: (err: any) => alert('خطأ في الحذف: ' + err.message),
  });

  const openRequest = (req: any) => {
    setSelected(req);
    setNewStatus(req.status ?? 'new');
  };

  const statusOptions: Array<{ value: WatchRequestStatus; label: string; color: string }> = [
    { value: 'new',       label: t.statuses.new,       color: 'border-yellow-500/50 text-yellow-400 data-[active=true]:bg-yellow-500/20' },
    { value: 'contacted', label: t.statuses.contacted, color: 'border-blue-500/50 text-blue-400 data-[active=true]:bg-blue-500/20' },
    { value: 'completed', label: t.statuses.completed, color: 'border-green-500/50 text-green-400 data-[active=true]:bg-green-500/20' },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">{t.title}</h1>
          <p className="text-obsidian-400 text-sm">{t.subtitle}</p>
        </div>
        <span className="text-obsidian-400 text-sm">{requests.length} {t.total}</span>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="card p-6 mb-8 border-gold-500/30">
          <div className="flex justify-between items-start mb-5">
            <h2 className="font-serif text-xl text-white">{selected.brand} {selected.model}</h2>
            <button onClick={() => setSelected(null)} className="text-obsidian-400 hover:text-white text-lg leading-none">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Image */}
            <div>
              {selected.image_url ? (
                <img
                  src={selected.image_url}
                  alt=""
                  className="w-full max-h-64 object-contain bg-obsidian-800 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-48 bg-obsidian-800 flex items-center justify-center text-obsidian-500 text-sm rounded">
                  لا توجد صورة
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              {selected.reference_number && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">Ref.</span>
                  <p className="text-white font-mono">{selected.reference_number}</p>
                </div>
              )}
              {selected.condition && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">{t.condition}</span>
                  <p className="text-white">{(conditionLabels as any)[selected.condition] ?? selected.condition}</p>
                </div>
              )}
              {selected.year && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">{t.year}</span>
                  <p className="text-white">{selected.year}</p>
                </div>
              )}
              {selected.notes && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">{t.notes}</span>
                  <p className="text-obsidian-300 mt-1">{selected.notes}</p>
                </div>
              )}
              <div className="border-t border-obsidian-700 pt-3">
                <span className="text-obsidian-400 text-xs uppercase tracking-wider">{t.name}</span>
                <p className="text-white">{selected.name}</p>
              </div>
              <div>
                <span className="text-obsidian-400 text-xs uppercase tracking-wider">{t.phone}</span>
                <p className="text-white">{selected.phone}</p>
              </div>
              {selected.email && (
                <div>
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">{t.email}</span>
                  <p className="text-white">{selected.email}</p>
                </div>
              )}
              <p className="text-obsidian-500 text-xs">{formatDate(selected.created_at)}</p>
            </div>
          </div>

          {/* Status update */}
          <div className="border-t border-obsidian-700 pt-5">
            <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-3">{t.statusLabel}</label>
            <div className="flex gap-3 flex-wrap mb-5">
              {statusOptions.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  data-active={newStatus === value}
                  onClick={() => setNewStatus(value)}
                  className={`px-4 py-2 text-sm border transition-colors ${color} ${newStatus === value ? 'ring-1 ring-current' : 'opacity-50 hover:opacity-80'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="btn-gold"
              >
                {updateMutation.isPending ? t.saving : t.save}
              </button>
              <button onClick={() => setSelected(null)} className="btn-outline">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {[t.watch, t.name, t.phone, t.requested, t.status, t.action].map(h => (
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
                      {req.image_url && (
                        <img src={req.image_url} alt="" className="w-10 h-10 object-cover bg-obsidian-800 flex-shrink-0 rounded" />
                      )}
                      <div>
                        <p className="text-white text-xs font-medium">{req.brand} {req.model}</p>
                        {req.reference_number && (
                          <p className="text-obsidian-500 text-xs font-mono">{req.reference_number}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-obsidian-300 text-xs">{req.name}</td>
                  <td className="px-4 py-3 text-obsidian-300 text-xs">{req.phone}</td>
                  <td className="px-4 py-3 text-obsidian-400 text-xs">{formatDate(req.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs uppercase tracking-wider px-2 py-1 border ${STATUS_COLORS[req.status as WatchRequestStatus] ?? 'text-obsidian-400'}`}>
                      {t.statuses[req.status as WatchRequestStatus] ?? req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openRequest(req)}
                        className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors"
                      >
                        {t.view}
                      </button>
                      <button
                        onClick={() => { if (window.confirm('حذف هذا الطلب؟')) deleteMutation.mutate(req.id); }}
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
