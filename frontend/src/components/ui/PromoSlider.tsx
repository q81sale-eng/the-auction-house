import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useT } from '../../i18n/useLanguage';

const INTERVAL = 5000;

async function getActiveBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error || !data?.length) return null;
  return data;
}

export const PromoSlider: React.FC = () => {
  const { tr } = useT();
  const fallbackSlides = tr.home.slider;

  const { data: dbBanners } = useQuery({
    queryKey: ['banners'],
    queryFn: getActiveBanners,
    staleTime: 60_000,
  });

  const slides = dbBanners
    ? dbBanners.map((b: any) => ({
        eyebrow:      b.eyebrow      ?? '',
        title:        b.title,
        subtitle:     b.subtitle     ?? '',
        cta:          b.cta_text     ?? '',
        href:         b.cta_url      ?? '/',
        imageUrl:     b.image_url    ?? null,
        bg:           b.bg_color     ?? 'linear-gradient(135deg,#0d0d0d 0%,#1c1508 50%,#0d0d0d 100%)',
        showOverlay:  b.show_overlay ?? true,
      }))
    : fallbackSlides.map((s: any, i: number) => ({
        eyebrow:     s.eyebrow,
        title:       s.title,
        subtitle:    s.subtitle,
        cta:         s.cta,
        href:        ['/', '/auctions', '/marketplace'][i % 3],
        imageUrl:    null,
        bg: [
          'linear-gradient(135deg,#0d0d0d 0%,#1c1508 45%,#251c0a 55%,#0d0d0d 100%)',
          'linear-gradient(135deg,#0d0d0d 0%,#08090f 45%,#0b0c16 55%,#0d0d0d 100%)',
          'linear-gradient(135deg,#0d0d0d 0%,#0e1210 45%,#111410 55%,#0d0d0d 100%)',
        ][i % 3],
        showOverlay: true,
      }));

  const total = slides.length;
  const [current, setCurrent] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const isPaused = useRef(false);
  const touchStartX = useRef(0);

  useEffect(() => { setCurrent(0); }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      if (!isPaused.current) setCurrent(c => (c + 1) % total);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [timerKey, total]);

  const go = (idx: number) => {
    setCurrent(((idx % total) + total) % total);
    setTimerKey(k => k + 1);
  };

  const active = slides[current];

  return (
    <div
      onMouseEnter={() => { isPaused.current = true; }}
      onMouseLeave={() => { isPaused.current = false; }}
    >
      {/* ── Image area ───────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden h-52 sm:h-80 md:h-96 lg:h-[480px] xl:h-[560px]"
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const delta = touchStartX.current - e.changedTouches[0].clientX;
          if (delta > 50) go(current + 1);
          else if (delta < -50) go(current - 1);
        }}
      >
        {slides.map((slide: any, i: number) => (
          <div
            key={i}
            aria-hidden={i !== current}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            style={slide.imageUrl
              ? { backgroundImage: `url(${slide.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: slide.bg }}
          >
            {/* Decorative lines */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
            <div className="absolute top-5 start-6 w-5 h-5 border-t border-s border-gold-500/25" />
            <div className="absolute top-5 end-6 w-5 h-5 border-t border-e border-gold-500/25" />
            <div className="absolute bottom-5 start-6 w-5 h-5 border-b border-s border-gold-500/25" />
            <div className="absolute bottom-5 end-6 w-5 h-5 border-b border-e border-gold-500/25" />

            {/* Text overlay — only when showOverlay is true; no background dim */}
            {slide.showOverlay && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center px-10 sm:px-24 max-w-2xl">
                  {slide.eyebrow && (
                    <p className="text-gold-500 text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-2 sm:mb-3">
                      {slide.eyebrow}
                    </p>
                  )}
                  <h2 className="font-serif text-xl sm:text-3xl text-white leading-tight drop-shadow-lg">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="text-obsidian-300 text-xs sm:text-sm leading-relaxed mt-2 drop-shadow">
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Arrows */}
        {total > 1 && (
          <>
            <button onClick={() => go(current - 1)}
              className="hidden sm:flex absolute start-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 border border-obsidian-700 hover:border-gold-500/50 bg-obsidian-950/80 items-center justify-center text-obsidian-500 hover:text-gold-500 transition-colors">
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => go(current + 1)}
              className="hidden sm:flex absolute end-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 border border-obsidian-700 hover:border-gold-500/50 bg-obsidian-950/80 items-center justify-center text-obsidian-500 hover:text-gold-500 transition-colors">
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        {/* Dot indicators — inside image, above the gold line */}
        {total > 1 && (
          <div className="absolute bottom-10 inset-x-0 flex justify-center gap-2 z-20">
            {Array.from({ length: total }).map((_, i) => (
              <button key={i} onClick={() => go(i)}
                className={`transition-all duration-300 ${
                  i === current ? 'w-6 h-1 bg-gold-500' : 'w-1 h-1 rounded-full bg-white/30 hover:bg-white/60'
                }`} />
            ))}
          </div>
        )}

        {/* CTA button — sits on the gold progress line */}
        {active.cta && (
          <div className="absolute bottom-1 inset-x-0 flex justify-center z-30">
            <Link
              to={active.href}
              className="border border-gold-500 text-gold-500 bg-transparent hover:bg-gold-500/15 text-[10px] sm:text-xs uppercase tracking-[0.3em] px-8 py-2.5 transition-colors duration-200 whitespace-nowrap"
            >
              {active.cta}
            </Link>
          </div>
        )}

        {/* Progress bar (gold line) */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-obsidian-800 z-20">
          <div
            key={`${current}-${timerKey}`}
            className="h-full bg-gold-500/50 origin-start"
            style={{ animation: `slideProgress ${INTERVAL}ms linear forwards` }}
          />
        </div>
      </div>

      <style>{`@keyframes slideProgress { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
};
