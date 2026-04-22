import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useQuery } from '@tanstack/react-query';
import { getListing } from '../api/marketplace';
import { Layout } from '../components/layout/Layout';
import { formatCurrency } from '../utils/format';
import { useCurrencyStore, convertFromGBP } from '../store/currencyStore';
import { useT } from '../i18n/useLanguage';

export const MarketplaceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activeImage, setActiveImage] = useState(0);
  const { currency } = useCurrencyStore();
  const { tr } = useT();
  const t = tr.marketplace;
  const ws = tr.watchSpecs;
  const fmt = (v: string | number) => formatCurrency(convertFromGBP(parseFloat(String(v)), currency), currency);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', slug],
    queryFn: () => getListing(slug!),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-obsidian-800" />
            <div className="space-y-4">
              <div className="h-4 bg-obsidian-800 rounded w-1/4" />
              <div className="h-8 bg-obsidian-800 rounded" />
              <div className="h-16 bg-obsidian-800 rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) return <Layout><div className="text-center py-20 text-obsidian-400">{t.notFound}</div></Layout>;

  const images = listing.watch?.images || [];
  const currentImage = images[activeImage];

  const conditionLabel: Record<string, string> = {
    new: tr.vault.conditions.new,
    excellent: tr.vault.conditions.excellent,
    good: tr.vault.conditions.good,
    fair: tr.vault.conditions.fair,
  };
  const conditionColor: Record<string, string> = {
    new: 'text-green-400', excellent: 'text-blue-400', good: 'text-yellow-400', fair: 'text-orange-400',
  };

  const boxPapers = [
    listing.watch?.has_box && ws.box,
    listing.watch?.has_papers && ws.papers,
  ].filter(Boolean).join(' & ') || ws.none;

  const specs: [string, string | null | undefined][] = [
    [ws.brand,           listing.watch?.brand],
    [ws.model,           listing.watch?.model],
    [ws.reference,       listing.watch?.reference_number],
    [ws.year,            listing.watch?.year],
    [ws.movement,        listing.watch?.movement],
    [ws.caseMaterial,    listing.watch?.case_material],
    [ws.bracelet,        listing.watch?.bracelet_material],
    [ws.dialColor,       listing.watch?.dial_color],
    [ws.caseDiameter,    listing.watch?.case_diameter ? `${listing.watch.case_diameter}${ws.mm}` : null],
    [ws.waterResistance, listing.watch?.water_resistance],
    [ws.powerReserve,    listing.watch?.power_reserve],
    [ws.complications,   listing.watch?.complications],
    [ws.serialNumber,    listing.watch?.serial_number],
    [ws.boxPapers,       boxPapers],
    [ws.condition,       listing.watch?.condition ? conditionLabel[listing.watch.condition] : null],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <Layout>
      <Breadcrumb items={[
        { label: t.title, href: '/marketplace' },
        { label: listing.title },
      ]} />
      <div className="max-w-7xl mx-auto px-4 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <div>
            <div className="aspect-square bg-obsidian-900 border border-obsidian-800 overflow-hidden mb-4">
              {currentImage ? (
                <img
                  src={currentImage.path.startsWith('http') ? currentImage.path : `http://localhost:8000/storage/${currentImage.path}`}
                  alt={currentImage.alt_text}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/1a1a1a/d4af37?text=Watch'; }}
                />
              ) : (
                <img src="https://placehold.co/600x600/1a1a1a/d4af37?text=Watch" alt="Watch" className="w-full h-full object-cover" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img: any, i: number) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 bg-obsidian-800 border overflow-hidden transition-colors ${i === activeImage ? 'border-gold-500' : 'border-obsidian-700'}`}>
                    <img src={img.path.startsWith('http') ? img.path : `http://localhost:8000/storage/${img.path}`}
                      alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-gold-500 text-xs uppercase tracking-widest mb-2">{listing.watch?.brand}</p>
            <h1 className="font-serif text-3xl text-white mb-2">{listing.title}</h1>

            <div className="flex items-center gap-4 mb-6">
              <span className={`text-sm font-medium ${conditionColor[listing.watch?.condition] || 'text-obsidian-400'}`}>
                {conditionLabel[listing.watch?.condition] || listing.watch?.condition}
              </span>
              {listing.watch?.year && <span className="text-obsidian-400 text-sm">{listing.watch.year}</span>}
              {listing.watch?.case_diameter && <span className="text-obsidian-400 text-sm">{listing.watch.case_diameter}{ws.mm}</span>}
            </div>

            {listing.description && (
              <p className="text-obsidian-300 text-sm leading-relaxed mb-8">{listing.description}</p>
            )}

            {/* Price */}
            <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-1">{t.askingPrice}</p>
                  <p className="text-white text-4xl font-semibold">{fmt(listing.price)}</p>
                  {listing.negotiable && (
                    <p className="text-gold-500 text-xs mt-1 uppercase tracking-wider">{t.priceNegotiable}</p>
                  )}
                  {listing.retail_price && (() => {
                    const saving = Math.round(((parseFloat(listing.retail_price) - parseFloat(String(listing.price))) / parseFloat(listing.retail_price)) * 100);
                    return saving > 0 ? (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-obsidian-800">
                        <div>
                          <p className="text-obsidian-500 text-[10px] uppercase tracking-wider">سعر الوكيل</p>
                          <p className="text-obsidian-500 text-sm line-through">{fmt(listing.retail_price)}</p>
                        </div>
                        <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-3 py-1 uppercase tracking-wider">
                          وفّر {saving}%
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              {listing.status === 'active' ? (
                <div className="space-y-3">
                  <button className="btn-gold w-full">{t.enquire}</button>
                  <p className="text-obsidian-500 text-xs text-center">{t.enquireDesc}</p>
                </div>
              ) : (
                <div className="bg-obsidian-800 text-obsidian-400 text-center py-3 text-sm uppercase tracking-wider">
                  {listing.status === 'sold' ? t.sold : t.unavailable}
                </div>
              )}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-3 text-sm text-obsidian-400">
              <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center">
                <span className="text-gold-500 font-semibold">{listing.seller?.name?.charAt(0)}</span>
              </div>
              <div>
                <p className="text-white text-sm">{listing.seller?.name}</p>
                <p className="text-obsidian-500 text-xs">{t.verifiedSeller}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-8">
          <h2 className="font-serif text-2xl text-white mb-6">{t.specifications}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-3 border-b border-obsidian-800 last:border-0">
                <span className="text-obsidian-400 text-sm">{label}</span>
                <span className="text-white text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
