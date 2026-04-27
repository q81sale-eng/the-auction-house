import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { getAllPriceIndex, type PriceIndexEntry } from '../api/priceIndex';
import { formatCurrency, formatDate } from '../utils/format';
import { useT } from '../i18n/useLanguage';

const fmt = (v: number) => formatCurrency(v, 'KWD');

function Lightbox({ entry, onClose, onPrev, onNext, hasPrev, hasNext, conditionLabels }: {
  entry: PriceIndexEntry;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  conditionLabels: any;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 end-4 text-white/60 hover:text-white text-2xl leading-none z-10"
        onClick={onClose}
      >✕</button>

      {/* Prev */}
      {hasPrev && (
        <button
          className="absolute start-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 p-2"
          onClick={e => { e.stopPropagation(); onPrev(); }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          className="absolute end-16 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10 p-2"
          onClick={e => { e.stopPropagation(); onNext(); }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Content */}
      <div
        className="flex flex-col md:flex-row gap-0 max-w-4xl w-full max-h-[90vh] overflow-hidden bg-obsidian-900 border border-obsidian-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="md:w-2/3 bg-obsidian-950 flex items-center justify-center">
          <img
            src={entry.image_url!}
            alt={`${entry.brand} ${entry.model ?? ''}`}
            className="w-full max-h-[60vh] md:max-h-[90vh] object-contain"
          />
        </div>
        <div className="md:w-1/3 p-6 flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-s border-obsidian-700">
          <div>
            <p className="text-gold-500 font-mono text-xs mb-1 uppercase tracking-wider">{entry.reference_number ?? '—'}</p>
            <p className="text-white font-serif text-xl leading-tight">{entry.brand}</p>
            {entry.model && <p className="text-obsidian-400 text-sm mt-1">{entry.model}</p>}
          </div>
          <div className="border-t border-obsidian-700 pt-4 space-y-2">
            {entry.condition && (
              <div className="flex justify-between text-xs">
                <span className="text-obsidian-500">الحالة</span>
                <span className="text-obsidian-300">{conditionLabels[entry.condition] ?? entry.condition}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-obsidian-500">تاريخ البيع</span>
              <span className="text-obsidian-300">{formatDate(entry.sale_date)}</span>
            </div>
          </div>
          <p className="text-gold-500 font-serif text-2xl font-semibold">{fmt(Number(entry.sale_price))}</p>
        </div>
      </div>
    </div>
  );
}

export const PriceIndexGalleryPage: React.FC = () => {
  const { tr, lang } = useT();
  const conditionLabels = tr.admin.condition;
  const isRtl = lang === 'ar';

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: allEntries = [], isLoading } = useQuery({
    queryKey: ['price-index', 'all'],
    queryFn: getAllPriceIndex,
    staleTime: 60_000,
  });

  const entries = allEntries.filter(e => !!e.image_url);

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i));
  const goNext = () => setLightboxIndex(i => (i !== null && i < entries.length - 1 ? i + 1 : i));

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-obsidian-950 border-b border-obsidian-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-2">The Auction House</p>
              <h1 className="font-serif text-4xl text-white">معرض المبيعات</h1>
            </div>
            <Link
              to="/price-index"
              className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
              </svg>
              مؤشر الساعات
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-obsidian-800 animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-obsidian-500 text-center py-20">لا توجد صور مضافة بعد</p>
        ) : (
          <>
            <p className="text-obsidian-500 text-xs mb-6">{entries.length} ساعة</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {entries.map((entry, i) => (
                <button
                  key={entry.id}
                  onClick={() => openLightbox(i)}
                  className="group relative aspect-square overflow-hidden bg-obsidian-800 focus:outline-none"
                >
                  <img
                    src={entry.image_url!}
                    alt={`${entry.brand} ${entry.model ?? ''}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
                    <p className="text-white text-xs font-medium leading-tight">{entry.brand}</p>
                    {entry.model && <p className="text-obsidian-300 text-xs">{entry.model}</p>}
                    <p className="text-gold-400 text-sm font-semibold mt-1">{fmt(Number(entry.sale_price))}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && entries[lightboxIndex] && (
        <Lightbox
          entry={entries[lightboxIndex]}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < entries.length - 1}
          conditionLabels={conditionLabels}
        />
      )}
    </Layout>
  );
};
