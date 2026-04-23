import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAdminCatalog, deleteCatalogWatch, updateCatalogWatch } from '../../api/admin';
import { formatCurrency } from '../../utils/format';
import { useCurrencyStore, convertFromGBP } from '../../store/currencyStore';

export const AdminCatalog: React.FC = () => {
  const queryClient = useQueryClient();
  const { currency } = useCurrencyStore();
  const fmt = (v: number) => formatCurrency(convertFromGBP(v, currency), currency);
  const [search, setSearch] = useState('');

  const { data: watches = [], isLoading } = useQuery({
    queryKey: ['admin', 'catalog'],
    queryFn: getAdminCatalog,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'catalog'] });

  const deleteMutation = useMutation({
    mutationFn: deleteCatalogWatch,
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateCatalogWatch(id, { active }),
    onSuccess: invalidate,
  });

  const filtered = watches.filter((w: any) =>
    !search || `${w.brand} ${w.model} ${w.reference_number ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const brands = Array.from(new Set(watches.map((w: any) => w.brand as string))).sort();

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white mb-1">أسعار الساعات لدى الوكيل</h1>
          <p className="text-obsidian-400 text-sm">{watches.length} قطعة · {brands.length} ماركة</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/catalog/import" className="btn-outline text-sm px-4">↑ استيراد Excel</Link>
          <Link to="/admin/catalog/new" className="btn-gold">+ إضافة ساعة</Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="ابحث بالماركة أو الموديل أو الرقم المرجعي..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field w-full max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-obsidian-800 bg-obsidian-900">
          <p className="text-obsidian-400 text-sm">لا توجد نتائج</p>
          <Link to="/admin/catalog/new" className="btn-gold mt-4 inline-block">أضف أول ساعة</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((w: any) => (
            <div key={w.id} className={`card flex items-center gap-4 p-4 ${!w.active ? 'opacity-50' : ''}`}>
              {/* Image */}
              <div className="w-16 h-16 shrink-0 bg-obsidian-800 border border-obsidian-700 overflow-hidden">
                {w.image_url
                  ? <img src={w.image_url} alt="" className="w-full h-full object-contain p-1" />
                  : <div className="w-full h-full flex items-center justify-center text-obsidian-600 text-xs">—</div>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-gold-500 text-[10px] uppercase tracking-wider mb-0.5">{w.brand}</p>
                <p className="text-white font-medium truncate">{w.model}</p>
                <p className="text-obsidian-500 text-xs">{w.reference_number ?? '—'}</p>
              </div>

              {/* Price */}
              <div className="text-end shrink-0">
                <p className="text-obsidian-500 text-[10px] uppercase tracking-wider mb-0.5">سعر الوكيل</p>
                <p className="text-white font-semibold">{fmt(w.retail_price)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleMutation.mutate({ id: w.id, active: !w.active })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${w.active ? 'bg-gold-500' : 'bg-obsidian-700'}`}
                  title={w.active ? 'إيقاف' : 'تفعيل'}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${w.active ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
                <Link to={`/admin/catalog/${w.id}/edit`} className="text-obsidian-400 hover:text-gold-500 text-xs transition-colors px-2">تعديل</Link>
                <button
                  onClick={() => { if (window.confirm('حذف هذه الساعة من الكاتالوج؟')) deleteMutation.mutate(w.id); }}
                  className="text-obsidian-400 hover:text-red-400 text-xs transition-colors px-2"
                >حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};
