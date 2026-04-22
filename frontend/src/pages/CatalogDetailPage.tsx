import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCatalogWatch } from '../api/catalog';
import { Layout } from '../components/layout/Layout';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { formatCurrency } from '../utils/format';
import { useCurrencyStore, convertFromGBP } from '../store/currencyStore';
import { useT } from '../i18n/useLanguage';

export const CatalogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currency } = useCurrencyStore();
  const { lang, tr } = useT();
  const fmt = (v: number) => formatCurrency(convertFromGBP(v, currency), currency);
  const ws = tr.watchSpecs;

  const { data: watch, isLoading } = useQuery({
    queryKey: ['catalog', slug],
    queryFn: () => getCatalogWatch(slug!),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-obsidian-800" />
            <div className="space-y-4">
              <div className="h-4 bg-obsidian-800 w-1/4" />
              <div className="h-8 bg-obsidian-800" />
              <div className="h-24 bg-obsidian-800" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!watch) return (
    <Layout>
      <div className="text-center py-24 text-obsidian-400">
        {lang === 'ar' ? 'الساعة غير موجودة' : 'Watch not found'}
      </div>
    </Layout>
  );

  const specs: [string, string | number | undefined][] = [
    [ws.movement,        watch.movement],
    [ws.caseMaterial,    watch.case_material],
    [ws.caseDiameter,    watch.case_diameter ? `${watch.case_diameter}mm` : undefined],
    [ws.bracelet,        watch.bracelet_material],
    [ws.dialColor,       watch.dial_color],
    [ws.waterResistance, watch.water_resistance],
    [ws.powerReserve,    watch.power_reserve],
    [ws.complications,   watch.complications],
    [lang === 'ar' ? 'سنة الإصدار' : 'Year Introduced', watch.year_introduced],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <Layout>
      <Breadcrumb items={[
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', href: '/' },
        { label: lang === 'ar' ? 'كاتالوج الأسعار' : 'Catalog', href: '/catalog' },
        { label: `${watch.brand} ${watch.model}` },
      ]} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Image */}
          <div className="bg-obsidian-900 border border-obsidian-800 aspect-square flex items-center justify-center overflow-hidden">
            {watch.image_url
              ? <img src={watch.image_url} alt={watch.model} className="w-full h-full object-contain p-8" />
              : <p className="font-serif text-obsidian-700 text-6xl">{watch.brand[0]}</p>}
          </div>

          {/* Info */}
          <div>
            <p className="text-gold-500 text-xs uppercase tracking-[0.4em] mb-2">{watch.brand}</p>
            <h1 className="font-serif text-3xl sm:text-4xl text-white mb-2 leading-tight">{watch.model}</h1>
            {watch.reference_number && (
              <p className="text-obsidian-400 text-sm mb-6" dir="ltr">{watch.reference_number}</p>
            )}
            {watch.description && (
              <p className="text-obsidian-300 text-sm leading-loose mb-6">{watch.description}</p>
            )}

            {/* Price box */}
            <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
              <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-1">
                {lang === 'ar' ? 'سعر الوكيل الرسمي' : 'Official Retail Price'}
              </p>
              <p className="text-gold-500 text-4xl font-semibold">{fmt(watch.retail_price)}</p>
              <p className="text-obsidian-600 text-xs mt-2 uppercase tracking-wider">
                {lang === 'ar' ? 'سعر الوكيل المعتمد · غير ملزم' : 'Authorized dealer price · indicative'}
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/auctions" className="btn-gold text-center flex-1">
                {lang === 'ar' ? 'تصفح المزادات' : 'Browse Auctions'}
              </Link>
              <Link to="/marketplace" className="btn-outline text-center flex-1">
                {lang === 'ar' ? 'السوق' : 'Marketplace'}
              </Link>
            </div>
          </div>
        </div>

        {/* Specs table */}
        {specs.length > 0 && (
          <div className="mt-12 border-t border-obsidian-800 pt-10">
            <h2 className="font-serif text-2xl text-white mb-6">
              {lang === 'ar' ? 'المواصفات الكاملة' : 'Full Specifications'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-obsidian-800">
              {specs.map(([label, value]) => (
                <div key={label} className="bg-obsidian-950 px-5 py-4 flex justify-between items-center">
                  <span className="text-obsidian-400 text-xs uppercase tracking-wider">{label}</span>
                  <span className="text-white text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
