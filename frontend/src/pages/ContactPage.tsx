import React from 'react';
import { Layout } from '../components/layout/Layout';
import { useT } from '../i18n/useLanguage';

const contacts = [
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.531 5.845L.057 23.5l5.817-1.452A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.661-.5-5.194-1.374l-.371-.218-3.854.962.98-3.77-.24-.387A10 10 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    ),
    label: 'واتساب',
    value: '+965 98933393',
    href: 'https://wa.me/96598933393',
    color: 'text-green-400',
    border: 'hover:border-green-500/40',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
      </svg>
    ),
    label: 'هاتف',
    value: '22406626',
    href: 'tel:+96522406626',
    color: 'text-gold-500',
    border: 'hover:border-gold-500/40',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.166.5C5.34.5 0 5.84 0 12.667c0 4.47 2.4 8.383 5.983 10.54V24l5.433-2.998c.49.134 1.01.205 1.55.205 6.826 0 12.166-5.34 12.166-12.167C25.133 5.84 19.793.5 12.166.5zM13.6 16.1l-3.1-3.3-6.05 3.3L11.333 9l3.167 3.3L20.467 9 13.6 16.1z"/>
      </svg>
    ),
    label: 'سناب شات',
    value: 'saadalkaaldy1',
    href: 'https://snapchat.com/add/saadalkaaldy1',
    color: 'text-yellow-400',
    border: 'hover:border-yellow-500/40',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    label: 'إنستقرام',
    value: 'saadalkaaldy_',
    href: 'https://instagram.com/saadalkaaldy_',
    color: 'text-pink-400',
    border: 'hover:border-pink-500/40',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    label: 'إنستقرام',
    value: 'saadalkaaldy_1',
    href: 'https://instagram.com/saadalkaaldy_1',
    color: 'text-pink-400',
    border: 'hover:border-pink-500/40',
  },
];

export const ContactPage: React.FC = () => {
  const { lang } = useT();

  return (
    <Layout>

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section className="relative bg-obsidian-950 overflow-hidden py-28 px-4 flex items-center justify-center text-center">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        <div className="absolute top-10 start-10 w-14 h-14 border-t border-s border-gold-500/20" />
        <div className="absolute top-10 end-10 w-14 h-14 border-t border-e border-gold-500/20" />
        <div className="absolute bottom-10 start-10 w-14 h-14 border-b border-s border-gold-500/20" />
        <div className="absolute bottom-10 end-10 w-14 h-14 border-b border-e border-gold-500/20" />

        <div className="relative max-w-xl">
          <p className="text-gold-500 text-[10px] uppercase tracking-[0.5em] mb-6">The Auction House</p>
          <div className="w-16 h-px bg-gold-500/40 mx-auto mb-8" />
          <h1 className="font-serif text-5xl sm:text-6xl text-white leading-none mb-8">
            {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <div className="w-16 h-px bg-gold-500/40 mx-auto mb-8" />
          <p className="text-obsidian-400 text-sm leading-loose">
            {lang === 'ar'
              ? 'نحن هنا للإجابة على استفساراتك ومساعدتك في كل ما يخص الساعات الفاخرة.'
              : 'We are here to answer your questions about luxury timepieces.'}
          </p>
        </div>
      </section>

      {/* ── Contact cards ──────────────────────────────────────────────────────── */}
      <section className="bg-obsidian-900 border-y border-obsidian-800 py-20 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {contacts.map((c, i) => (
            <a
              key={i}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-5 bg-obsidian-950 border border-obsidian-800 ${c.border} px-6 py-5 transition-all duration-200 group`}
            >
              <span className={`${c.color} flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity`}>
                {c.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-obsidian-500 text-[10px] uppercase tracking-[0.3em] mb-1">{c.label}</p>
                <p className="text-white font-medium tracking-wide" dir="ltr">{c.value}</p>
              </div>
              <svg className="w-4 h-4 text-obsidian-700 group-hover:text-obsidian-400 transition-colors rtl:rotate-180 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      </section>

      {/* ── Closing note ───────────────────────────────────────────────────────── */}
      <section className="bg-obsidian-950 py-16 px-4 text-center">
        <div className="w-10 h-px bg-gold-500/30 mx-auto mb-6" />
        <p className="text-obsidian-500 text-xs uppercase tracking-[0.3em]">
          {lang === 'ar' ? 'سعد الخالدي · The Auction House' : 'Saad Al-Khalidy · The Auction House'}
        </p>
      </section>

    </Layout>
  );
};
