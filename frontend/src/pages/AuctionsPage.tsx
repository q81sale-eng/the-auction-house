import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuctions } from '../api/auctions';
import { AuctionCard } from '../components/auction/AuctionCard';
import { Layout } from '../components/layout/Layout';

const BRANDS = ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'A. Lange & Söhne', 'F.P. Journe', 'Vacheron Constantin', 'Jaeger-LeCoultre'];
const STATUSES = [{ value: '', label: 'All' }, { value: 'live', label: 'Live' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'ended', label: 'Ended' }];

export const AuctionsPage: React.FC = () => {
  const [filters, setFilters] = useState({ status: 'live', brand: '', min_price: '', max_price: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['auctions', filters, page],
    queryFn: () => getAuctions({ ...filters, page }),
  });

  const handleFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10">
          <p className="section-subtitle">Discover</p>
          <h1 className="section-title">Auctions</h1>
        </div>

        {/* Filters */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Status</label>
              <select className="input-field text-sm" value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Brand</label>
              <select className="input-field text-sm" value={filters.brand} onChange={e => handleFilter('brand', e.target.value)}>
                <option value="">All Brands</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
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
                  <div className="h-4 bg-obsidian-800 rounded w-full" />
                  <div className="h-6 bg-obsidian-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data?.length > 0 ? (
          <>
            <p className="text-obsidian-400 text-sm mb-6">{data.total} auction{data.total !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.data.map((auction: any) => (
                <AuctionCard key={auction.id} auction={auction} />
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
            <p className="text-lg mb-2">No auctions found</p>
            <button onClick={() => setFilters({ status: '', brand: '', min_price: '', max_price: '' })} className="text-gold-500 text-sm hover:text-gold-400">Clear filters</button>
          </div>
        )}
      </div>
    </Layout>
  );
};
