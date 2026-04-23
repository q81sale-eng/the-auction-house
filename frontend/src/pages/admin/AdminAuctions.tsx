import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { getAdminAuctions, deleteAuction, updateAuctionStatus } from '../../api/admin';
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

export const AdminAuctions: React.FC = () => {
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.admin;
  const { currency } = useCurrencyStore();
  const fmt = (v: number) => formatCurrency(convertFromGBP(v, currency), currency);
  const [page, setPage] = useState(1);
  const [invoiceItem, setInvoiceItem] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'auctions', page],
    queryFn: () => getAdminAuctions({ page }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAuction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] }),
    onError: (err: any) => alert('خطأ في الحذف: ' + err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAuctionStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] }),
  });

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
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">{t.auctions}</h1>
          <p className="text-obsidian-400 text-sm">{data?.total ?? 0} {t.total}</p>
        </div>
        <Link to="/admin/auctions/new" className="btn-gold flex-shrink-0">
          {t.actions.newAuction}
        </Link>
      </div>

      <div className="bg-obsidian-900 border border-obsidian-800 overflow-x-auto">
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
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-obsidian-800 animate-pulse" />
                    </td>
                  </tr>
                ))
              : data?.data?.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-obsidian-500">{t.table.noData}</td>
                </tr>
              )
              : data?.data?.map((a: any) => (
                <tr key={a.id} className="hover:bg-obsidian-800/30">
                  <td className="px-4 py-3">
                    {a.image_url
                      ? <img src={a.image_url} alt={a.title} className="w-12 h-10 object-cover bg-obsidian-800" />
                      : <div className="w-12 h-10 bg-obsidian-800 flex items-center justify-center text-obsidian-600 text-xs">—</div>
                    }
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
                  <td className="px-4 py-3 text-white whitespace-nowrap">
                    {fmt(parseFloat(a.current_bid ?? a.starting_price ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-obsidian-300 whitespace-nowrap text-xs">
                    {a.ends_at ? formatDateTime(a.ends_at) : '—'}
                  </td>
                  <td className="px-4 py-3 text-obsidian-300 text-center">{a.bids_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3 items-center">
                      <Link to={`/admin/auctions/${a.id}/edit`}
                        className="text-obsidian-400 hover:text-gold-500 text-xs transition-colors">
                        {t.actions.edit}
                      </Link>
                      {a.status === 'upcoming' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: a.id, status: 'live' })}
                          disabled={statusMutation.isPending}
                          className="text-green-500 hover:text-green-400 text-xs transition-colors disabled:opacity-50">
                          Go Live
                        </button>
                      )}
                      {a.status === 'live' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: a.id, status: 'ended' })}
                          disabled={statusMutation.isPending}
                          className="text-obsidian-400 hover:text-orange-400 text-xs transition-colors disabled:opacity-50">
                          End
                        </button>
                      )}
                      {(a.status === 'sold' || a.status === 'ended') && (
                        <button
                          onClick={() => setInvoiceItem(a)}
                          className="text-gold-500 hover:text-gold-400 text-xs transition-colors border border-gold-500/30 px-2 py-0.5">
                          فاتورة
                        </button>
                      )}
                      <button
                        onClick={() => { if (window.confirm(t.actions.confirmDelete)) deleteMutation.mutate(a.id); }}
                        className="text-obsidian-400 hover:text-red-400 text-xs transition-colors">
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
    </AdminLayout>
  );
};
