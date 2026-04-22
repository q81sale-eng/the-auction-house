import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getListings } from '../api/marketplace';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Layout } from '../components/layout/Layout';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useT } from '../i18n/useLanguage';

const BRANDS = ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'A. Lange & Söhne', 'F.P. Journe', 'Vacheron Constantin', 'Jaeger-LeCoultre', 'Richard Mille', 'Omega'];
const DEFAULT_FILTERS = { brand: '', condition: '', min_price: '', max_price: '', search: '', sort: 'latest' };

export const MarketplacePage: React.FC = () => {
  const { tr } = useT();
  const t = tr.marketplace;
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', filters, page],
    queryFn: () => getListings({ ...filters, page }),
  });

  const handleFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const conditions = [
    { value: '', label: t.filters.allConditions },
    { value: 'new',       label: tr.vault.conditions.new       },
    { value: 'excellent', label: tr.vault.conditions.excellent },
    { value: 'good',      label: tr.vault.conditions.good      },
    { value: 'fair',      label: tr.vault.conditions.fair      },
  ];

  const sorts = [
    { value: 'latest',     label: t.filters.sorts.latest     },
    { value: 'price_asc',  label: t.filters.sorts.price_asc  },
    { value: 'price_desc', label: t.filters.sorts.price_desc },
  ];

  return (
    <Layout>
      <Breadcrumb items={[{ label: tr.nav.home, href: '/' }, { label: tr.nav.marketplace }]} />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10">
          <p className="section-subtitle">{t.eyebrow}</p>
          <h1 className="section-title">{t.title}</h1>
          <p className="text-obsidian-400 text-sm max-w-xl">{t.subtitle}</p>
        </div>

        {/* Search + Filters */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-8">
          <div className="mb-4">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="input-field"
              value={filters.search}
              onChange={e => handleFilter('search', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.filters.brand}</label>
              <select className="input-field text-sm" value={filters.brand} onChange={e => handleFilter('brand', e.target.value)}>
                <option value="">{t.filters.allBrands}</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.filters.condition}</label>
              <select className="input-field text-sm" value={filters.condition} onChange={e => handleFilter('condition', e.target.value)}>
                {conditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.filters.minPrice}</label>
              <input type="number" placeholder="0" className="input-field text-sm" value={filters.min_price} onChange={e => handleFilter('min_price', e.target.value)} />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.filters.maxPrice}</label>
              <input type="number" className="input-field text-sm" value={filters.max_price} onChange={e => handleFilter('max_price', e.target.value)} />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.filters.sortBy}</label>
              <select className="input-field text-sm" value={filters.sort} onChange={e => handleFilter('sort', e.target.value)}>
                {sorts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-obsidian-800" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-obsidian-800 rounded w-1/3" />
                  <div className="h-4 bg-obsidian-800 rounded" />
                  <div className="h-6 bg-obsidian-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (data?.data?.length ?? 0) > 0 ? (
          <>
            <p className="text-obsidian-400 text-sm mb-6">{t.found(data!.total)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data!.data.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {(data!.last_page ?? 0) > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: data!.last_page }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-10 h-10 text-sm transition-colors ${p === page ? 'bg-gold-500 text-obsidian-950' : 'border border-obsidian-700 text-obsidian-400 hover:border-gold-500'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-obsidian-400">
            <p className="text-lg mb-2">{t.empty}</p>
            <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-gold-500 text-sm hover:text-gold-400">
              {t.clearFilters}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};
