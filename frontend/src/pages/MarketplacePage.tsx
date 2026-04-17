import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getListings } from '../api/marketplace';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Layout } from '../components/layout/Layout';

const BRANDS = ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'A. Lange & Söhne', 'F.P. Journe', 'Vacheron Constantin', 'Jaeger-LeCoultre', 'Richard Mille', 'Omega'];
const CONDITIONS = [{ value: '', label: 'All Conditions' }, { value: 'new', label: 'New' }, { value: 'excellent', label: 'Excellent' }, { value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }];
const SORTS = [{ value: 'latest', label: 'Latest' }, { value: 'price_asc', label: 'Price: Low to High' }, { value: 'price_desc', label: 'Price: High to Low' }];

export const MarketplacePage: React.FC = () => {
  const [filters, setFilters] = useState({ brand: '', condition: '', min_price: '', max_price: '', search: '', sort: 'latest' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', filters, page],
    queryFn: () => getListings({ ...filters, page }),
  });

  const handleFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10">
          <p className="section-subtitle">Buy Now</p>
          <h1 className="section-title">Marketplace</h1>
          <p className="text-obsidian-400 text-sm max-w-xl">
            Authenticated pre-owned luxury watches available for immediate purchase.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-8">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by brand, model, reference..."
              className="input-field"
              value={filters.search}
              onChange={e => handleFilter('search', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Brand</label>
              <select className="input-field text-sm" value={filters.brand} onChange={e => handleFilter('brand', e.target.value)}>
                <option value="">All Brands</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Condition</label>
              <select className="input-field text-sm" value={filters.condition} onChange={e => handleFilter('condition', e.target.value)}>
                {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Min Price</label>
              <input type="number" placeholder="£0" className="input-field text-sm" value={filters.min_price} onChange={e => handleFilter('min_price', e.target.value)} />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Max Price</label>
              <input type="number" placeholder="Any" className="input-field text-sm" value={filters.max_price} onChange={e => handleFilter('max_price', e.target.value)} />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Sort By</label>
              <select className="input-field text-sm" value={filters.sort} onChange={e => handleFilter('sort', e.target.value)}>
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
        ) : data?.data?.length > 0 ? (
          <>
            <p className="text-obsidian-400 text-sm mb-6">{data.total} listing{data.total !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.data.map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {data.last_page > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: data.last_page }, (_, i) => i + 1).map(p => (
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
            <p className="text-lg mb-2">No listings found</p>
            <button onClick={() => setFilters({ brand: '', condition: '', min_price: '', max_price: '', search: '', sort: 'latest' })}
              className="text-gold-500 text-sm hover:text-gold-400">Clear filters</button>
          </div>
        )}
      </div>
    </Layout>
  );
};
