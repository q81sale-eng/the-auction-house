import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useT } from '../i18n/useLanguage';

export const PavePage: React.FC = () => {
  const { tr } = useT();
  const t = tr.pave;
  const [form, setForm] = useState({ name: '', email: '', collection: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSubmitted(true); }, 900);
  };

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center bg-obsidian-950 relative overflow-hidden px-4">
        {/* Decorative corner lines */}
        <div className="absolute top-12 start-12 w-16 h-16 border-t border-s border-gold-500/20" />
        <div className="absolute top-12 end-12 w-16 h-16 border-t border-e border-gold-500/20" />
        <div className="absolute bottom-12 start-12 w-16 h-16 border-b border-s border-gold-500/20" />
        <div className="absolute bottom-12 end-12 w-16 h-16 border-b border-e border-gold-500/20" />

        <div className="text-center max-w-3xl">
          <p className="text-gold-500 text-xs uppercase tracking-[0.4em] mb-8">{t.hero.eyebrow}</p>
          <div className="w-24 h-px bg-gold-500/40 mx-auto mb-8" />
          <h1 className="font-serif text-[clamp(5rem,18vw,12rem)] text-white leading-none tracking-tight mb-8">
            {t.hero.title}
          </h1>
          <div className="w-24 h-px bg-gold-500/40 mx-auto mb-8" />
          <p className="text-obsidian-300 text-sm leading-relaxed max-w-lg mx-auto mb-12">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#collections" className="btn-gold px-10">{t.hero.explore}</a>
            <a href="#inquiry" className="btn-outline px-10">{t.hero.inquire}</a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 start-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-gold-500/60" />
        </div>
      </section>

      {/* ── Brand Story ──────────────────────────────────────────────────── */}
      <section className="bg-obsidian-900 border-y border-obsidian-800 py-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-4">{t.story.eyebrow}</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-white mb-8 leading-tight">{t.story.title}</h2>
            <p className="text-obsidian-300 text-sm leading-loose mb-5">{t.story.body1}</p>
            <p className="text-obsidian-300 text-sm leading-loose mb-10">{t.story.body2}</p>
            <p className="text-obsidian-500 text-xs uppercase tracking-[0.3em]">{t.story.since}</p>
          </div>
          <div className="relative">
            {/* Editorial typographic element */}
            <div className="border border-obsidian-700 p-12 relative">
              <div className="absolute top-4 start-4 w-8 h-8 border-t border-s border-gold-500/40" />
              <div className="absolute bottom-4 end-4 w-8 h-8 border-b border-e border-gold-500/40" />
              <p className="font-serif text-gold-500/20 text-[6rem] leading-none text-center select-none">P</p>
              <div className="text-center mt-4 space-y-2">
                <p className="text-obsidian-500 text-xs uppercase tracking-[0.3em]">Atelier</p>
                <div className="w-8 h-px bg-gold-500/30 mx-auto" />
                <p className="text-obsidian-500 text-xs uppercase tracking-[0.3em]">Geneva</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Collections ──────────────────────────────────────────────────── */}
      <section id="collections" className="bg-obsidian-950 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-3">{t.collections.eyebrow}</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-white">
              {t.collections.title1}<br />{t.collections.title2}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Regent */}
            <Link to="/pave/regent" className="group block border border-obsidian-800 hover:border-gold-500/40 transition-colors duration-500 p-10 relative overflow-hidden">
              <div className="absolute top-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
              <p className="text-obsidian-500 text-xs uppercase tracking-[0.3em] mb-6">{t.collections.regent.tagline}</p>
              <h3 className="font-serif text-5xl sm:text-6xl text-white mb-6 group-hover:text-gold-500/90 transition-colors duration-500">
                {t.collections.regent.name}
              </h3>
              <p className="text-obsidian-400 text-sm leading-loose mb-10 max-w-sm">{t.collections.regent.desc}</p>
              <span className="text-gold-500 text-xs uppercase tracking-[0.3em] group-hover:tracking-[0.5em] transition-all duration-500">
                {t.collections.regent.discover}
              </span>
            </Link>

            {/* Artisana */}
            <Link to="/pave/artisana" className="group block border border-obsidian-800 hover:border-gold-500/40 transition-colors duration-500 p-10 relative overflow-hidden bg-obsidian-900/50">
              <div className="absolute top-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
              <p className="text-obsidian-500 text-xs uppercase tracking-[0.3em] mb-6">{t.collections.artisana.tagline}</p>
              <h3 className="font-serif text-5xl sm:text-6xl text-white mb-6 group-hover:text-gold-500/90 transition-colors duration-500">
                {t.collections.artisana.name}
              </h3>
              <p className="text-obsidian-400 text-sm leading-loose mb-10 max-w-sm">{t.collections.artisana.desc}</p>
              <span className="text-gold-500 text-xs uppercase tracking-[0.3em] group-hover:tracking-[0.5em] transition-all duration-500">
                {t.collections.artisana.discover}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Pieces ───────────────────────────────────────────────── */}
      <section className="bg-obsidian-900 border-y border-obsidian-800 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-3">{t.featured.eyebrow}</p>
              <h2 className="font-serif text-4xl text-white">{t.featured.title}</h2>
            </div>
            <Link to="#inquiry" className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors hidden sm:block">
              {t.featured.inquire} →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-obsidian-800">
            {t.featured.pieces.map((piece) => (
              <div key={piece.ref} className="bg-obsidian-900 p-8 group hover:bg-obsidian-800/50 transition-colors">
                <p className="font-mono text-obsidian-600 text-xs tracking-[0.2em] mb-6">{piece.ref}</p>
                <h3 className="font-serif text-2xl text-white mb-4">{piece.name}</h3>
                <div className="w-8 h-px bg-gold-500/40 mb-4" />
                <p className="text-obsidian-400 text-xs leading-loose mb-8">{piece.desc}</p>
                <p className="text-gold-500 text-lg font-semibold mb-6">{piece.price}</p>
                <a href="#inquiry" className="text-obsidian-500 hover:text-gold-500 text-xs uppercase tracking-[0.2em] transition-colors">
                  {t.featured.inquire} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Craftsmanship ─────────────────────────────────────────────────── */}
      <section className="bg-obsidian-950 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-4">{t.craftsmanship.eyebrow}</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-white">
              {t.craftsmanship.title1}<br />
              {t.craftsmanship.title2}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-obsidian-800">
            {t.craftsmanship.pillars.map((pillar, i) => (
              <div key={i} className="bg-obsidian-950 p-10">
                <div className="w-8 h-px bg-gold-500/60 mb-6" />
                <h3 className="font-serif text-xl text-white mb-4">{pillar.title}</h3>
                <p className="text-obsidian-400 text-sm leading-loose">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inquiry ───────────────────────────────────────────────────────── */}
      <section id="inquiry" className="bg-obsidian-900 border-t border-obsidian-800 py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-4">{t.inquiry.eyebrow}</p>
            <h2 className="font-serif text-4xl text-white mb-6">{t.inquiry.title}</h2>
            <p className="text-obsidian-400 text-sm leading-loose">{t.inquiry.body}</p>
          </div>

          {submitted ? (
            <div className="border border-gold-500/30 bg-gold-500/5 p-12 text-center">
              <div className="w-8 h-px bg-gold-500/60 mx-auto mb-6" />
              <p className="font-serif text-xl text-white mb-2">{t.inquiry.submitted}</p>
              <div className="w-8 h-px bg-gold-500/60 mx-auto mt-6" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="label-field">{t.inquiry.name}</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-field">{t.inquiry.email}</label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label-field">{t.inquiry.collection}</label>
                <select
                  className="input-field"
                  value={form.collection}
                  onChange={e => setForm(f => ({ ...f, collection: e.target.value }))}
                >
                  <option value="">—</option>
                  {t.inquiry.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">{t.inquiry.message}</label>
                <textarea
                  rows={5}
                  className="input-field resize-none"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>
              <button type="submit" disabled={sending} className="btn-gold w-full">
                {sending ? t.inquiry.sending : t.inquiry.submit}
              </button>
            </form>
          )}
        </div>
      </section>
    </Layout>
  );
};
