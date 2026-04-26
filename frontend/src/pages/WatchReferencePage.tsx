import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { useT } from '../i18n/useLanguage';
import {
  getWatchBrands,
  getWatchModels,
  getWatchReferences,
  type WatchRefEntry,
} from '../api/watchReference';

const SpecRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-baseline gap-2 text-xs border-b border-obsidian-800 pb-2 last:border-0 last:pb-0">
    <span className="text-obsidian-500 shrink-0">{label}</span>
    <span className="text-obsidian-200 text-end">{value}</span>
  </div>
);

function RefCard({ entry, t }: { entry: WatchRefEntry; t: any }) {
  const yearStr = entry.year_from
    ? entry.year_to && entry.year_to !== entry.year_from
      ? `${entry.year_from}–${entry.year_to}`
      : String(entry.year_from)
    : null;

  return (
    <div className="border border-obsidian-800 hover:border-obsidian-600 bg-obsidian-900 overflow-hidden transition-colors flex flex-col">
      <div className="h-48 bg-obsidian-800 flex items-center justify-center overflow-hidden flex-shrink-0">
        {entry.image_url ? (
          <img
            src={entry.image_url}
            alt={entry.reference}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <svg className="w-10 h-10 text-obsidian-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <p className="text-gold-500 font-mono text-sm font-semibold leading-tight">{entry.reference}</p>
            <p className="text-obsidian-400 text-xs mt-1">{entry.brand} · {entry.model}</p>
          </div>
          {yearStr && (
            <span className="text-obsidian-500 text-xs shrink-0 border border-obsidian-700 px-2 py-0.5">{yearStr}</span>
          )}
        </div>
        <div className="space-y-2 flex-1">
          {entry.material && <SpecRow label={t.specs.material} value={entry.material} />}
          {entry.case_size && <SpecRow label={t.specs.caseSize} value={`${entry.case_size} mm`} />}
          {entry.bracelet && <SpecRow label={t.specs.bracelet} value={entry.bracelet} />}
          {entry.dial_color && <SpecRow label={t.specs.dialColor} value={entry.dial_color} />}
          {entry.movement && <SpecRow label={t.specs.movement} value={entry.movement} />}
          {entry.water_resistance && <SpecRow label={t.specs.waterResistance} value={entry.water_resistance} />}
        </div>
        {entry.notes && (
          <p className="text-obsidian-500 text-xs mt-4 pt-3 border-t border-obsidian-800 leading-relaxed">{entry.notes}</p>
        )}
      </div>
    </div>
  );
}

export const WatchReferencePage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const brandSlug = params.get('brand') ?? '';
  const modelSlug = params.get('model') ?? '';
  const { tr, lang } = useT();
  const t = tr.watchRef;
  const isRtl = lang === 'ar';

  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['watch-ref-brands'],
    queryFn: getWatchBrands,
    staleTime: 60_000,
  });

  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['watch-ref-models', brandSlug],
    queryFn: () => getWatchModels(brandSlug),
    enabled: !!brandSlug && !modelSlug,
    staleTime: 60_000,
  });

  const { data: refs = [], isLoading: refsLoading } = useQuery({
    queryKey: ['watch-ref-entries', brandSlug, modelSlug],
    queryFn: () => getWatchReferences(brandSlug, modelSlug),
    enabled: !!brandSlug && !!modelSlug,
    staleTime: 60_000,
  });

  const currentBrand = brands.find(b => b.brand_slug === brandSlug)?.brand ?? brandSlug;
  const currentModel = refs[0]?.model ?? models.find(m => m.model_slug === modelSlug)?.model ?? modelSlug;

  const level = !brandSlug ? 1 : !modelSlug ? 2 : 3;

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-obsidian-950 border-b border-obsidian-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir={isRtl ? 'rtl' : 'ltr'}>
          <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-3">{t.eyebrow}</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-4">{t.title}</h1>
          <p className="text-obsidian-400 text-sm max-w-2xl leading-relaxed">{t.subtitle}</p>
        </div>
      </section>

      {/* Breadcrumb */}
      {level > 1 && (
        <div className="border-b border-obsidian-800 bg-obsidian-900/50" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-obsidian-500 flex-wrap">
            <button onClick={() => setParams({})} className="hover:text-gold-500 transition-colors">{t.title}</button>
            <span>/</span>
            {level === 2 ? (
              <span className="text-obsidian-300">{currentBrand}</span>
            ) : (
              <button onClick={() => setParams({ brand: brandSlug })} className="hover:text-gold-500 transition-colors">{currentBrand}</button>
            )}
            {level === 3 && (
              <>
                <span>/</span>
                <span className="text-obsidian-300">{currentModel}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Level 1: Brand grid */}
        {level === 1 && (
          <div>
            <p className="text-obsidian-500 text-sm mb-8">{t.selectBrand}</p>
            {brandsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-28 bg-obsidian-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {brands.map(b => (
                  <button
                    key={b.brand_slug}
                    onClick={() => setParams({ brand: b.brand_slug })}
                    className="border border-obsidian-800 hover:border-gold-500/50 bg-obsidian-900 hover:bg-obsidian-800 p-6 text-center transition-all group cursor-pointer"
                  >
                    <div className="font-serif text-obsidian-300 group-hover:text-gold-500 transition-colors text-sm leading-snug mb-2 min-h-[2.5rem] flex items-center justify-center">
                      {b.brand}
                    </div>
                    <p className="text-obsidian-600 text-xs group-hover:text-obsidian-400 transition-colors">
                      {b.count} {t.references}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Level 2: Model grid */}
        {level === 2 && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setParams({})}
                className="text-obsidian-500 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                {isRtl ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                )}
                {t.backToBrands}
              </button>
              <h2 className="font-serif text-white text-2xl">{currentBrand}</h2>
            </div>

            <p className="text-obsidian-500 text-sm mb-6">{t.selectModel}</p>

            {modelsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-24 bg-obsidian-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {models.map(m => (
                  <button
                    key={m.model_slug}
                    onClick={() => setParams({ brand: brandSlug, model: m.model_slug })}
                    className="border border-obsidian-800 hover:border-gold-500/50 bg-obsidian-900 hover:bg-obsidian-800 p-5 text-start transition-all group cursor-pointer"
                  >
                    <p className="text-white text-sm font-medium group-hover:text-gold-500 transition-colors leading-tight">{m.model}</p>
                    <p className="text-obsidian-500 text-xs mt-2 group-hover:text-obsidian-400 transition-colors">
                      {m.count} {t.references}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Level 3: Reference cards */}
        {level === 3 && (
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => setParams({ brand: brandSlug })}
                className="text-obsidian-500 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                {isRtl ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                )}
                {currentBrand}
              </button>
            </div>
            <h2 className="font-serif text-white text-3xl mb-1">{currentModel}</h2>
            <p className="text-obsidian-500 text-sm mb-8">{currentBrand}</p>

            {refsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-obsidian-800 animate-pulse" />
                ))}
              </div>
            ) : refs.length === 0 ? (
              <p className="text-obsidian-500 py-10 text-center">{t.noRefs}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {refs.map(r => (
                  <RefCard key={r.id} entry={r} t={t} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
