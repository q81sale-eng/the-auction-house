import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAdminBids } from '../../api/admin';
import { useT } from '../../i18n/useLanguage';
import { formatCurrency, formatDateTime } from '../../utils/format';

export const AdminBids: React.FC = () => {
  const { tr } = useT();
  const t = tr.admin;
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'bids', page],
    queryFn: () => getAdminBids({ page }),
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">{t.bids}</h1>
        <p className="text-obsidian-400 text-sm">{data?.total ?? 0} {t.total}</p>
      </div>

      <div className="bg-obsidian-900 border border-obsidian-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {[t.table.auction, t.table.bidder, t.table.amount, t.table.time].map(h => (
                <th key={h} className="text-left px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-4">
                      <div className="h-4 bg-obsidian-800 animate-pulse" />
                    </td>
                  </tr>
                ))
              : data?.data?.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-obsidian-500">{t.table.noData}</td>
                </tr>
              )
              : data?.data?.map((b: any) => (
                <tr key={b.id} className="hover:bg-obsidian-800/30">
                  <td className="px-4 py-3">
                    <p className="text-white text-sm truncate max-w-[220px]">
                      {(b.auctions as any)?.title ?? '—'}
                    </p>
                    <p className="text-obsidian-500 text-xs">{(b.auctions as any)?.brand ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{(b.profiles as any)?.name ?? '—'}</p>
                    <p className="text-obsidian-500 text-xs">{(b.profiles as any)?.email ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gold-500 font-medium whitespace-nowrap">
                    {formatCurrency(parseFloat(b.amount))}
                  </td>
                  <td className="px-4 py-3 text-obsidian-400 text-xs whitespace-nowrap">
                    {b.created_at ? formatDateTime(b.created_at) : '—'}
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
