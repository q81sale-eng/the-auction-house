import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuctions } from '../api/auctions';
import { AuctionCard } from '../components/auction/AuctionCard';
import { Layout } from '../components/layout/Layout';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useT } from '../i18n/useLanguage';
import { SEOHead } from '../components/seo/SEOHead';

const BRANDS = ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'A. Lange & Söhne', 'F.P. Journe', 'Vacheron Constantin', 'Jaeger-LeCoultre'];

const h = (n: number) => n * 60 * 60 * 1000;
const d = (n: number) => n * 24 * h(1);

const DEMO_AUCTIONS = [
  {
    id: 1001,
    slug: 'rolex-daytona-paul-newman-6239',
    title: 'Rolex Daytona "Paul Newman" — Ref. 6239',
    status: 'live',
    starting_price: '45000',
    current_bid: '65000',
    buy_now_price: undefined as string | undefined,
    ends_at: new Date(Date.now() + h(2)).toISOString(),
    starts_at: new Date(Date.now() - d(3)).toISOString(),
    bids_count: 14,
    watch: {
      brand: 'Rolex', model: 'Daytona', condition: 'excellent', year: 1969,
      primary_image: { path: 'https://placehold.co/600x600/0d0d0d/d4af37?text=Rolex%0ADaytona', alt_text: 'Rolex Daytona Paul Newman Ref. 6239' },
    },
  },
  {
    id: 1002,
    slug: 'patek-philippe-nautilus-5711-1a',
    title: 'Patek Philippe Nautilus — Ref. 5711/1A-010',
    status: 'live',
    starting_price: '70000',
    current_bid: '86000',
    buy_now_price: undefined as string | undefined,
    ends_at: new Date(Date.now() + h(6)).toISOString(),
    starts_at: new Date(Date.now() - d(2)).toISOString(),
    bids_count: 8,
    watch: {
      brand: 'Patek Philippe', model: 'Nautilus', condition: 'excellent', year: 2019,
      primary_image: { path: 'https://placehold.co/600x600/0d0d0d/d4af37?text=Patek%0ANautilus', alt_text: 'Patek Philippe Nautilus 5711' },
    },
  },
  {
    id: 1003,
    slug: 'audemars-piguet-royal-oak-15500st',
    title: 'Audemars Piguet Royal Oak — Ref. 15500ST.OO.1220ST.01',
    status: 'live',
    starting_price: '28000',
    current_bid: '34500',
    buy_now_price: undefined as string | undefined,
    ends_at: new Date(Date.now() + d(1) + h(4)).toISOString(),
    starts_at: new Date(Date.now() - d(1)).toISOString(),
    bids_count: 5,
    watch: {
      brand: 'Audemars Piguet', model: 'Royal Oak', condition: 'new', year: 2022,
      primary_image: { path: 'https://placehold.co/600x600/0d0d0d/d4af37?text=AP%0ARoyal+Oak', alt_text: 'Audemars Piguet Royal Oak 15500ST' },
    },
  },
  {
    id: 1004,
    slug: 'lange-sohne-datograph-perpetual-tourbillon-740032',
    title: 'A. Lange & Söhne Datograph Perpetual Tourbillon — Ref. 740.032',
    status: 'live',
    starting_price: '55000',
    current_bid: '72000',
    buy_now_price: '95000',
    ends_at: new Date(Date.now() + d(3)).toISOString(),
    starts_at: new Date(Date.now() - d(4)).toISOString(),
    bids_count: 11,
    watch: {
      brand: 'A. Lange & Söhne', model: 'Datograph Perpetual', condition: 'excellent', year: 2018,
      primary_image: { path: 'https://placehold.co/600x600/0d0d0d/d4af37?text=Lange%0ADateograph', alt_text: 'A. Lange & Söhne Datograph Perpetual Tourbillon' },
    },
  },
  {
    id: 1005,
    slug: 'fp-journe-chronometre-bleu-titanium',
    title: 'F.P. Journe Chronomètre Bleu — Titanium Case',
    status: 'upcoming',
    starting_price: '48000',
    current_bid: undefined as string | undefined,
    buy_now_price: undefined as string | undefined,
    ends_at: new Date(Date.now() + d(5)).toISOString(),
    starts_at: new Date(Date.now() + d(2)).toISOString(),
    bids_count: 0,
    watch: {
      brand: 'F.P. Journe', model: 'Chronomètre Bleu', condition: 'new', year: 2020,
      primary_image: { path: 'https://placehold.co/600x600/0d0d0d/d4af37?text=F.P.+Journe%0ABleu', alt_text: 'F.P. Journe Chronomètre Bleu' },
    },
  },
  {
    id: 1006,
    slug: 'vacheron-constantin-historiques-american-1921',
    title: 'Vacheron Constantin Historiques American 1921 — Ref. 82035/000R',
    status: 'upcoming',
    starting_price: '32000',
    current_bid: undefined as string | undefined,
    buy_now_price: undefined as string | undefined,
    ends_at: new Date(Date.now() + d(7)).toISOString(),
    starts_at: new Date(Date.now() + d(4)).toISOString(),
    bids_count: 0,
    watch: {
      brand: 'Vacheron Constantin', model: 'Historiques American 1921', condition: 'excellent', year: 2021,
      primary_image: { path: 'https://placehold.co/600x600/0d0d0d/d4af37?text=Vacheron%0AHistoriques', alt_text: 'Vacheron Constantin Historiques American 1921' },
    },
  },
];

const DEFAULT_FILTERS = { status: '', brand: '', min_price: '', max_price: '' };

export const AuctionsPage: React.FC = () => {
  const { tr } = useT();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auctions', filters, page],
    queryFn: () => getAuctions({ ...filters, page }),
    retry: 1,
  });

  const handleFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const filtersActive = !!(filters.brand || filters.min_price || filters.max_price || filters.status !== DEFAULT_FILTERS.status);
  // Only show demo when there's a connection error AND no filters are active (i.e. Supabase not configured yet)
  const showDemo = !isLoading && !filtersActive && isError;
  const items: any[] = showDemo ? DEMO_AUCTIONS : (data?.data || []);
  const total: number = showDemo ? DEMO_AUCTIONS.length : (data?.total || 0);

  return (
    <Layout>
      <SEOHead
        titleEn="Live Watch Auctions | The Auction House Kuwait"
        titleAr="مزادات الساعات المباشرة | The Auction House الكويت"
        descEn="Bid on live and upcoming luxury watch auctions. Rolex, Patek Philippe, AP and more — authenticated and verified."
        descAr="شارك في مزادات ساعات فاخرة مباشرة وقادمة. رولكس وباتيك فيليب وأودمار بيغيه والمزيد — موثقة ومعتمدة."
        path="/auctions"
      />
      <Breadcrumb items={[{ label: tr.nav.home, href: '/' }, { label: tr.nav.auctions }]} />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-subtitle">{tr.auctions.eyebrow}</p>
            <h1 className="section-title">{tr.auctions.title}</h1>
          </div>
          {showDemo && (
            <span className="text-obsidian-500 text-xs uppercase tracking-widest border border-obsidian-700 px-3 py-1.5">
              {tr.auctions.previewMode}
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{tr.auctions.filters.status}</label>
              <select className="input-field text-sm" value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
                {Object.entries(tr.auctions.filters.statuses).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{tr.auctions.filters.brand}</label>
              <select className="input-field text-sm" value={filters.brand} onChange={e => handleFilter('brand', e.target.value)}>
                <option value="">{tr.auctions.filters.allBrands}</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{tr.auctions.filters.minPrice}</label>
              <input type="number" placeholder={tr.auctions.filters.minPlaceholder} className="input-field text-sm" value={filters.min_price} onChange={e => handleFilter('min_price', e.target.value)} />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{tr.auctions.filters.maxPrice}</label>
              <input type="number" placeholder={tr.auctions.filters.maxPlaceholder} className="input-field text-sm" value={filters.max_price} onChange={e => handleFilter('max_price', e.target.value)} />
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
        ) : items.length > 0 ? (
          <>
            <p className="text-obsidian-400 text-sm mb-6">{tr.auctions.found(total)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((auction: any) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
            {!showDemo && (data?.last_page ?? 0) > 1 && (
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
            <p className="text-lg mb-2">{tr.auctions.empty}</p>
            <button onClick={() => { setFilters(DEFAULT_FILTERS); setPage(1); }} className="text-gold-500 text-sm hover:text-gold-400">{tr.auctions.clearFilters}</button>
          </div>
        )}
      </div>
    </Layout>
  );
};
