import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { getAdminAuctions, deleteAuction, updateAuctionStatus, renewAuction } from '../../api/admin';
import { useT } from '../../i18n/useLanguage';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useCurrencyStore, convertFromGBP } from '../../store/currencyStore';
import { InvoiceModal } from '../../components/admin/InvoiceModal';

const STATUS_COLORS: Record<string, string> = {
  live:      'bg-red-500/20 text-red-400',
  upcoming:  'bg-blue-500/20 text-blue-400',
  ended:     'bg-obsidian-800 text-obsidian-400',
  sold:      'bg-green-500/20 text-green-400',
  cancelled: 'bg-orange-500/20 text-orange-400',
};

// Default new end date: 7 days from now, rounded to the hour
function defaultEndsAt() {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

interface RenewModalProps {
  auction: any;
  onClose: () => void;
  onConfirm: (endsAt: string) => void;
  isPending: boolean;
  t: any;
}

const RenewModal: React.FC<RenewModalProps> = ({ auction, onClose, onConfirm, isPending, t }) => {
  const [endsAt, setEndsAt] = useState(defaultEndsAt());
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-obsidian-900 border border-obsidian-700 w-full max-w-sm p-6">
        <h2 className="font-serif text-xl text-white mb-1">{t.renewAuction}</h2>
        <p className="text-obsidian-400 text-sm mb-6 truncate">{auction.title}</p>

        <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.renewEndsAt}</label>
        <input
          type="datetime-local"
          value={endsAt}
          onChange={e => setEndsAt(e.target.value)}
          className="input-field w-full mb-6"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-outline text-sm">{t.cancel}</button>
          <button
            onClick={() => onConfirm(new Date(endsAt).toISOString())}
            disabled={isPending || !endsAt}
            className="flex-1 btn-gold text-sm disabled:opacity-50"
          >
            {isPending ? t.renewing : t.renewConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminAuctions: React.FC = () => {
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.admin;
  const { currency } = useCurrencyStore();
  const fmt = (v: number) => formatCurrency(convertFromGBP(v, currency), currency);
  const [page, setPage] = useState(1);
  const [invoiceItem, setInvoiceItem] = useState<any | null>(null);
  const [renewTarget, setRenewTarget] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'auctions', page],
    queryFn: () => getAdminAuctions({ page }),
    refetchInterval: 60_000,
  });

  // Auto-close auctions whose ends_at has passed
  useEffect(() => {
    const closeExpired = async () => {
      const liveAuctions = (data?.data ?? []).filter(
        (a: any) => a.status === 'live' && a.ends_at && new Date(a.ends_at) < new Date()
      );
      for (const a of liveAuctions) {
        await updateAuctionStatus(a.id, 'ended');
      }
      if (liveAuctions.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] });
      }
    };
    closeExpired();
    const id = setInterval(closeExpired, 60_000);
    return () => clearInterval(id);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteMutation = useMutation({
    mutationFn: deleteAuction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] }),
    onError: (err: any) => alert('خطأ في الحذف: ' + err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAuctionStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] }),
  });

  const renewMutation = useMutation({
    mutationFn: ({ id, endsAt }: { id: string; endsAt: string }) => renewAuction(id, endsAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['auction'] });
      setRenewTarget(null);
    },
    onError: (err: any) => alert('خطأ في التجديد: ' + err.message),
  });

  const auctions = data?.data ?? [];

  return (
    <AdminLayout>
      {invoiceItem && (
        <InvoiceModal
          item={{
            id:               invoiceItem.id,
            brand:            invoiceItem.brand ?? '',
            model:            invoiceItem.title ?? '',
            reference_number: invoiceItem.reference ?? null,
            condition:        invoiceItem.condition ?? null,
            price:            invoiceItem.current_bid ?? invoiceItem.starting_price ?? 0,
            currency:         'د.ك',
            type:             'auction',
          }}
          onClose={() => setInvoiceItem(null)}
        />
      )}

      {renewTarget && (
        <RenewModal
          auction={renewTarget}
          onClose={() => setRenewTarget(null)}
          onConfirm={(endsAt) => renewMutation.mutate({ id: renewTarget.id, endsAt })}
          isPending={renewMutation.isPending}
          t={t.actions}
        />
      )}

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">{t.auctions}</h1>
          <p className="text-obsidian-400 text-sm">{data?.total ?? 0} {t.total}</p>
        </div>
        <Link to="/admin/auctions/new" className="btn-gold flex-shrink-0">
          {t.actions.newAuction}
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-obsidian-900 border border-obsidian-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {[t.table.image, t.table.watch, t.table.status, t.table.currentBid, t.table.endsAt, t.table.bidCount, t.table.actions].map(h => (
                <th key={h} className="text-left px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-obsidian-800 animate-pulse" /></td></tr>
                ))
              : auctions.length === 0
              ? <tr><td colSpan={7} className="px-4 py-8 text-center text-obsidian-500">{t.table.noData}</td></tr>
              : auctions.map((a: any) => (
                <tr key={a.id} className="hover:bg-obsidian-800/30">
                  <td className="px-4 py-3">
                    {a.image_url
                      ? <img src={a.image_url} alt={a.title} className="w-12 h-10 object-cover bg-obsidian-800" />
                      : <div className="w-12 h-10 bg-obsidian-800 flex items-center justify-center text-obsidian-600 text-xs">—</div>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium truncate max-w-[180px]">{a.title}</p>
                    <p className="text-obsidian-500 text-xs">{a.brand}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 uppercase tracking-wider ${STATUS_COLORS[a.status] ?? 'bg-obsidian-800 text-obsidian-400'}`}>
                      {t.status[a.status as keyof typeof t.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white whitespace-nowrap">{fmt(parseFloat(a.current_bid ?? a.starting_price ?? 0))}</td>
                  <td className="px-4 py-3 text-obsidian-300 whitespace-nowrap text-xs">{a.ends_at ? formatDateTime(a.ends_at) : '—'}</td>
                  <td className="px-4 py-3 text-obsidian-300 text-center">{a.bids_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3 items-center">
                      <Link to={`/admin/auctions/${a.id}/edit`} className="text-obsidian-400 hover:text-gold-500 text-xs transition-colors">{t.actions.edit}</Link>
                      {a.status === 'upcoming' && (
                        <button onClick={() => statusMutation.mutate({ id: a.id, status: 'live' })} disabled={statusMutation.isPending} className="text-green-500 hover:text-green-400 text-xs transition-colors disabled:opacity-50">Go Live</button>
                      )}
                      {a.status === 'live' && (
                        <button onClick={() => statusMutation.mutate({ id: a.id, status: 'ended' })} disabled={statusMutation.isPending} className="text-obsidian-400 hover:text-orange-400 text-xs transition-colors disabled:opacity-50">End</button>
                      )}
                      {a.status === 'ended' && (
                        <button onClick={() => setRenewTarget(a)} className="text-blue-400 hover:text-blue-300 text-xs transition-colors">{t.actions.renew}</button>
                      )}
                      <button onClick={() => setInvoiceItem(a)} className="text-gold-500 hover:text-gold-400 text-xs border border-gold-500/30 px-2 py-0.5 transition-colors">فاتورة</button>
                      <button onClick={() => { if (window.confirm(t.actions.confirmDelete)) deleteMutation.mutate(a.id); }} className="text-obsidian-400 hover:text-red-400 text-xs transition-colors">
                        {deleteMutation.isPending ? t.actions.deleting : t.actions.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {(data?.last_page ?? 0) > 1 && (
          <div className="flex gap-2 p-4">
            {Array.from({ length: data!.last_page }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs transition-colors ${p === page ? 'bg-gold-500 text-obsidian-950' : 'border border-obsidian-700 text-obsidian-400 hover:border-gold-500'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-obsidian-800 animate-pulse" />)
          : auctions.length === 0
          ? <p className="text-center py-12 text-obsidian-500 text-sm">{t.table.noData}</p>
          : auctions.map((a: any) => (
              <div key={a.id} className="bg-obsidian-900 border border-obsidian-800 p-4">
                <div className="flex gap-3 mb-3">
                  {a.image_url
                    ? <img src={a.image_url} alt={a.title} className="w-14 h-14 object-cover bg-obsidian-800 flex-shrink-0" />
                    : <div className="w-14 h-14 bg-obsidian-800 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{a.title}</p>
                    <p className="text-obsidian-500 text-xs">{a.brand}</p>
                    <p className="text-white font-semibold text-sm mt-0.5">{fmt(parseFloat(a.current_bid ?? a.starting_price ?? 0))}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 h-fit flex-shrink-0 ${STATUS_COLORS[a.status] ?? 'bg-obsidian-800 text-obsidian-400'}`}>
                    {t.status[a.status as keyof typeof t.status] ?? a.status}
                  </span>
                </div>
                <div className="flex gap-2 pt-3 border-t border-obsidian-800 flex-wrap">
                  <Link to={`/admin/auctions/${a.id}/edit`} className="flex-1 text-center text-obsidian-400 hover:text-gold-500 text-xs py-2 border border-obsidian-700 hover:border-gold-500/30 transition-colors">{t.actions.edit}</Link>
                  {a.status === 'upcoming' && (
                    <button onClick={() => statusMutation.mutate({ id: a.id, status: 'live' })} className="flex-1 text-center text-green-500 text-xs py-2 border border-green-500/30 transition-colors">Go Live</button>
                  )}
                  {a.status === 'live' && (
                    <button onClick={() => statusMutation.mutate({ id: a.id, status: 'ended' })} className="flex-1 text-center text-obsidian-400 text-xs py-2 border border-obsidian-700 transition-colors">End</button>
                  )}
                  {a.status === 'ended' && (
                    <button onClick={() => setRenewTarget(a)} className="flex-1 text-center text-blue-400 text-xs py-2 border border-blue-500/30 transition-colors">{t.actions.renew}</button>
                  )}
                  <button onClick={() => setInvoiceItem(a)} className="flex-1 text-center text-gold-500 hover:text-gold-400 text-xs py-2 border border-gold-500/40 hover:border-gold-500 transition-colors">فاتورة</button>
                  <button onClick={() => { if (window.confirm(t.actions.confirmDelete)) deleteMutation.mutate(a.id); }} className="flex-1 text-center text-obsidian-400 hover:text-red-400 text-xs py-2 border border-obsidian-700 hover:border-red-500/30 transition-colors">
                    {t.actions.delete}
                  </button>
                </div>
              </div>
            ))
        }
        {(data?.last_page ?? 0) > 1 && (
          <div className="flex gap-2 mt-2">
            {Array.from({ length: data!.last_page }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs transition-colors ${p === page ? 'bg-gold-500 text-obsidian-950' : 'border border-obsidian-700 text-obsidian-400'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
