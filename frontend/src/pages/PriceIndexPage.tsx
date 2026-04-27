import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { searchPriceIndex, getLatestPriceIndex, type PriceIndexEntry } from '../api/priceIndex';
import { formatCurrency, formatDate } from '../utils/format';
import { useT } from '../i18n/useLanguage';

const fmt = (v: number) => formatCurrency(v, 'KWD');

function PriceCard({ entry, conditionLabels, t }: { entry: PriceIndexEntry; conditionLabels: any; t: any }) {
  return (
    <div className="card overflow-hidden flex flex-col hover:border-obsidian-600 transition-colors">
      <div className="h-44 bg-obsidian-800 flex items-center justify-center overflow-hidden flex-shrink-0">
        {entry.image_url ? (
          <img
            src={entry.image_url}
            alt={`${entry.brand} ${entry.model ?? ''}`}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <svg className="w-10 h-10 text-obsidian-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-white font-medium text-sm leading-tight">{entry.brand}</p>
        {entry.model && <p className="text-obsidian-300 text-xs mt-0.5">{entry.model}</p>}
        {entry.reference_number && (
          <p className="text-obsidian-500 text-xs font-mono mt-1">{t.card.ref} {entry.reference_number}</p>
        )}
        {entry.condition && (
          <p className="text-obsidian-500 text-xs mt-1">{conditionLabels[entry.condition] ?? entry.condition}</p>
        )}

        <div className="border-t border-obsidian-700 mt-auto pt-3 flex items-end justify-between">
          <div>
            <p className="text-obsidian-500 text-[10px] uppercase tracking-wider">{t.card.sold}</p>
            <p className="text-obsidian-400 text-xs">{formatDate(entry.sale_date)}</p>
          </div>
          <p className="text-gold-500 font-semibold font-serif text-lg">{fmt(Number(entry.sale_price))}</p>
        </div>
      </div>
    </div>
  );
}

type SortMode = 'newest' | 'highest_price';

export const PriceIndexPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tr, lang } = useT();
  const t = tr.priceIndex;
  const conditionLabels = tr.admin.condition;
  const isRtl = lang === 'ar';

  const qParam = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(qParam);
  const [sort, setSort] = useState<SortMode>('highest_price');

  useEffect(() => { setInputValue(qParam); }, [qParam]);

  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['price-index', 'search', qParam],
    queryFn: () => searchPriceIndex(qParam),
    enabled: !!qParam,
    staleTime: 30_000,
  });

  const { data: latestEntries = [], isLoading: latestLoading } = useQuery({
    queryKey: ['price-index', 'latest', sort],
    queryFn: () => getLatestPriceIndex(12, sort),
    enabled: !qParam,
    staleTime: 60_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) setSearchParams({ q: inputValue.trim() });
  };

  const handleClear = () => {
    setInputValue('');
    setSearchParams({});
  };

  const sortedSearch = [...searchResults].sort((a, b) =>
    sort === 'highest_price'
      ? Number(b.sale_price) - Number(a.sale_price)
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const displayEntries = qParam ? sortedSearch : latestEntries;
  const isLoading = qParam ? searchLoading : latestLoading;

  const prices = searchResults.map(r => Number(r.sale_price));
  const stats = qParam && prices.length > 0 ? {
    count: prices.length,
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    high: Math.max(...prices),
    low: Math.min(...prices),
  } : null;

  return (
    <Layout>
      {/* Hero / Search */}
      <section className="bg-obsidian-950 border-b border-obsidian-800 py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-4 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
          <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-3">{t.eyebrow}</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-5">{t.title}</h1>
          <p className="text-obsidian-400 text-sm leading-relaxed mb-8 max-w-lg mx-auto">{t.subtitle}</p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="input-field flex-1 text-sm"
            />
            <button type="submit" className="btn-gold shrink-0 px-6 py-2.5">{t.search}</button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-4">
            {qParam && (
              <button
                onClick={handleClear}
                className="text-obsidian-500 hover:text-obsidian-300 text-xs transition-colors"
              >
                {t.clear}
              </button>
            )}
            <Link
              to="/price-index/gallery"
              className="text-obsidian-500 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {t.gallery ?? 'معرض الصور'}
            </Link>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 py-10" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          {qParam ? (
            <p className="text-obsidian-400 text-sm">
              {t.resultsFor}: <span className="text-white font-medium">"{qParam}"</span>
            </p>
          ) : (
            <p className="text-obsidian-500 text-xs uppercase tracking-wider">{t.latest}</p>
          )}

          {/* Sort toggle */}
          <div className="flex items-center gap-1 border border-obsidian-700 p-0.5">
            {(['newest', 'highest_price'] as SortMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSort(mode)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  sort === mode
                    ? 'bg-gold-500 text-obsidian-950 font-semibold'
                    : 'text-obsidian-400 hover:text-white'
                }`}
              >
                {mode === 'newest' ? t.sortNewest : t.sortHighest}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-64 animate-pulse" />
            ))}
          </div>
        ) : displayEntries.length === 0 ? (
          qParam ? (
            <div className="text-center py-20">
              <p className="font-serif text-white text-xl mb-2">{t.noResults}</p>
              <p className="text-obsidian-500 text-sm">{t.noResultsHint}</p>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-obsidian-500 text-sm">{t.noResultsHint}</p>
            </div>
          )
        ) : (
          <>
            {/* Stats bar — search only */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {([
                  { label: t.stats.sales, value: String(stats.count), gold: false },
                  { label: t.stats.avg,   value: fmt(stats.avg),      gold: true  },
                  { label: t.stats.high,  value: fmt(stats.high),     gold: false },
                  { label: t.stats.low,   value: fmt(stats.low),      gold: false },
                ] as const).map(({ label, value, gold }) => (
                  <div key={label} className="card p-4 text-center">
                    <p className="text-obsidian-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
                    <p className={`font-serif text-lg font-semibold ${gold ? 'text-gold-500' : 'text-white'}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayEntries.map(entry => (
                <PriceCard key={entry.id} entry={entry} conditionLabels={conditionLabels} t={t} />
              ))}
            </div>
          </>
        )}
      </section>
    </Layout>
  );
};
