import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAdminListings, deleteListing } from '../../api/admin';
import { formatCurrency } from '../../utils/format';
import { InvoiceModal } from '../../components/admin/InvoiceModal';

const STATUS_COLORS: Record<string, string> = {
  active:   'text-green-400 bg-green-400/10',
  sold:     'text-obsidian-400 bg-obsidian-800',
  reserved: 'text-yellow-400 bg-yellow-400/10',
  hidden:   'text-obsidian-500 bg-obsidian-800',
};

export const AdminListings: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [invoiceItem, setInvoiceItem] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'listings', page],
    queryFn: () => getAdminListings({ page }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] }),
  });

  return (
    <AdminLayout>
      {invoiceItem && (
        <InvoiceModal
          item={{
            id:               invoiceItem.id,
            brand:            invoiceItem.brand ?? '',
            model:            invoiceItem.model ?? invoiceItem.title ?? '',
            reference_number: invoiceItem.reference_number ?? null,
            condition:        invoiceItem.condition ?? null,
            price:            invoiceItem.price ?? 0,
            currency:         'د.ك',
            type:             'listing',
          }}
          onClose={() => setInvoiceItem(null)}
        />
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">السوق</h1>
          <p className="text-obsidian-400 text-sm">{data?.total ?? 0} إعلان</p>
        </div>
        <Link to="/admin/listings/new" className="btn-gold">+ إضافة ساعة</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {['الصورة', 'الماركة / الموديل', 'السعر', 'الحالة', 'الحالة الوظيفية', 'إجراءات'].map(h => (
                <th key={h} className="text-start px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-4">
                    <div className="h-4 bg-obsidian-800 rounded animate-pulse" />
                  </td></tr>
                ))
              : (data?.data ?? []).map((l: any) => (
                  <tr key={l.id} className="hover:bg-obsidian-900/50">
                    <td className="px-4 py-3">
                      {l.image_url
                        ? <img src={l.image_url} alt="" className="w-10 h-10 object-cover border border-obsidian-700" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/1a1a1a/d4af37?text=?'; }} />
                        : <div className="w-10 h-10 bg-obsidian-800 border border-obsidian-700" />}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gold-500 font-medium">{l.brand}</p>
                      <p className="text-white text-xs">{l.model || l.title}</p>
                    </td>
                    <td className="px-4 py-3 text-white font-semibold">
                      {formatCurrency(l.price, 'KWD')}
                      {l.negotiable && <span className="text-gold-500 text-xs ms-1">(قابل)</span>}
                    </td>
                    <td className="px-4 py-3 text-obsidian-300 capitalize text-xs">{l.condition}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-sm ${STATUS_COLORS[l.status] ?? 'text-obsidian-400'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link to={`/admin/listings/${l.id}/edit`} className="text-obsidian-400 hover:text-gold-500 text-xs transition-colors">
                          تعديل
                        </Link>
                        <button
                          onClick={() => setInvoiceItem(l)}
                          className="text-gold-500 hover:text-gold-400 text-xs transition-colors border border-gold-500/30 px-2 py-0.5"
                        >
                          فاتورة
                        </button>
                        <button
                          onClick={() => { if (window.confirm('حذف هذا الإعلان؟')) deleteMutation.mutate(l.id); }}
                          className="text-obsidian-400 hover:text-red-400 text-xs transition-colors"
                        >
                          حذف
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
