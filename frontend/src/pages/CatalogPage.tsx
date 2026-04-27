import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCatalog, getCatalogBrands } from '../api/catalog';
import { Layout } from '../components/layout/Layout';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { formatCurrency } from '../utils/format';
import { useCurrencyStore, convertFromGBP } from '../store/currencyStore';
import { useT } from '../i18n/useLanguage';

export const CatalogPage: React.FC = () => {
  const { currency } = useCurrencyStore();
  const { lang } = useT();
  const fmt = (v: number) => formatCurrency(convertFromGBP(v, currency), currency);

  const [brand, setBrand] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data: brands = [] } = useQuery({
    queryKey: ['catalog-brands'],
    queryFn: getCatalogBrands,
    staleTime: 60_000,
  });

  const { data: watches = [], isLoading } = useQuery({
    queryKey: ['catalog', brand, search],
    queryFn: () => getCatalog(brand || undefined, search || undefined),
    staleTime: 30_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setBrand('');
  };

  return (
    <Layout>
      <Breadcrumb items={[
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', href: '/' },
        { label: lang === 'ar' ? 'أسعار الساعات لدى الوكيل' : 'Dealer Prices' },
      ]} />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-obsidian-950 border-b border-obsidian-800 py-16 px-4 text-center overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
        <div className="absolute top-6 start-6 w-10 h-10 border-t border-s border-gold-500/15" />
        <div className="absolute top-6 end-6 w-10 h-10 border-t border-e border-gold-500/15" />

        <p className="text-gold-500 text-[10px] uppercase tracking-[0.5em] mb-4">
          {lang === 'ar' ? 'The Auction House' : 'The Auction House'}
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl text-white mb-3">
          {lang === 'ar' ? 'أسعار الساعات لدى الوكيل' : 'Official Dealer Prices'}
        </h1>
        <p className="text-obsidian-400 text-sm max-w-lg mx-auto">
          {lang === 'ar'
            ? 'أسعار الساعات الفاخرة لدى الوكلاء الرسميين — مرجعك للمقارنة والمعرفة'
            : 'Official retail prices from authorized dealers — your reference for comparison'}
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ── Search & Filters ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث بالماركة أو الموديل أو الرقع المرجعي...' : 'Search brand, model, reference...'}
              className="input-field flex-1"
            />
            <button type="submit" className="btn-gold px-6 shrink-0">
              {lang === 'ar' ? 'بحث' : 'Search'}
            </button>
            {(search || brand) && (
              <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setBrand(''); }} className="btn-outline px-4 shrink-0">
                ✕
              </button>
            )}
          </form>
        </div>

        {/* ── Brand tabs ───────────────────────────────────────────────────── */}
        {brands.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => { setBrand(''); setSearch(''); setSearchInput(''); }}
              className={`px-4 py-1.5 text-xs uppercase tracking-wider border transition-colors ${!brand && !search ? 'border-gold-500 text-gold-500 bg-gold-500/10' : 'border-obsidian-700 text-obsidian-400 hover:border-obsidian-500 hover:text-obsidian-300'}`}
            >
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            {brands.map(b => (
              <button
                key={b}
                onClick={() => { setBrand(b); setSearch(''); setSearchInput(''); }}
                className={`px-4 py-1.5 text-xs uppercase tracking-wider border transition-colors ${brand === b ? 'border-gold-500 text-gold-500 bg-gold-500/10' : 'border-obsidian-700 text-obsidian-400 hover:border-obsidian-500 hover:text-obsidian-300'}`}
              >
                {b}
              </button>
            ))}
          </div>
        )}

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="card h-72 animate-pulse" />)}
          </div>
        ) : watches.length === 0 ? (
          <div className="text-center py-24 border border-obsidian-800">
            <p className="text-obsidian-500 text-sm">
              {lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {watches.map(w => (
              <Link
                key={w.id}
                to={`/catalog/${w.slug}`}
                className="card group flex flex-col hover:border-obsidian-700 transition-colors"
              >
                {/* Image */}
                <div className="aspect-square bg-white overflow-hidden relative">
                  {w.image_url
                    ? <img src={w.image_url} alt={w.model} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <p className="font-serif text-obsidian-700 text-2xl">{w.brand[0]}</p>
                      </div>}
                  <div className="absolute top-2 start-2">
                    <span className="bg-obsidian-950/80 text-gold-500 text-[9px] uppercase tracking-wider px-2 py-0.5">{w.brand}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-white font-medium text-sm leading-tight mb-1 flex-1">{w.model}</p>
                  {w.reference_number && (
                    <p className="text-obsidian-500 text-xs mb-3" dir="ltr">{w.reference_number}</p>
                  )}
                  <div className="border-t border-obsidian-800 pt-3 mt-auto">
                    <p className="text-obsidian-500 text-[9px] uppercase tracking-wider mb-0.5">
                      {lang === 'ar' ? 'سعر الوكيل' : 'Retail Price'}
                    </p>
                    <p className="text-gold-500 font-semibold text-sm">{fmt(w.retail_price)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Count ────────────────────────────────────────────────────────── */}
        {!isLoading && watches.length > 0 && (
          <p className="text-obsidian-600 text-xs text-center mt-8 uppercase tracking-wider">
            {watches.length} {lang === 'ar' ? 'ساعة' : 'timepiece(s)'}
          </p>
        )}
      </div>
    </Layout>
  );
};
