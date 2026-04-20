import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useT } from '../i18n/useLanguage';

export const PaveArtisanaPage: React.FC = () => {
  const { tr } = useT();
  const t = tr.pave.artisana;
  const tInquiry = tr.pave.inquiry;
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSubmitted(true); }, 900);
  };

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col justify-end bg-obsidian-950 relative overflow-hidden px-4 pb-20">
        {/* Large background letter with warm gold tint */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="font-serif text-[clamp(18rem,50vw,36rem)] text-gold-500/5 leading-none">A</span>
        </div>

        {/* Warm gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-transparent" />

        <div className="absolute top-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          {/* Back link */}
          <Link to="/pave" className="inline-flex items-center gap-2 text-obsidian-500 hover:text-gold-500 text-xs uppercase tracking-[0.2em] transition-colors mb-16">
            <svg className="w-3 h-3 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            {t.back}
          </Link>

          <p className="text-gold-500 text-xs uppercase tracking-[0.4em] mb-4">{t.eyebrow}</p>
          <h1 className="font-serif text-[clamp(3rem,10vw,8rem)] text-white leading-none mb-6">
            {t.title1}<br />
            <span className="text-gold-500/80">{t.title2}</span>
          </h1>
          <p className="text-obsidian-300 text-sm leading-loose max-w-lg">{t.subtitle}</p>
        </div>
      </section>

      {/* ── Philosophy ───────────────────────────────────────────────────── */}
      <section className="bg-obsidian-900 border-y border-obsidian-800 py-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4">
            <p className="text-gold-500 text-xs uppercase tracking-[0.3em]">{t.philosophy.eyebrow}</p>
          </div>
          <div className="lg:col-span-8">
            <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6">{t.philosophy.title}</h2>
            <p className="text-obsidian-300 text-sm leading-loose">{t.philosophy.body}</p>
          </div>
        </div>
      </section>

      {/* ── Watches ──────────────────────────────────────────────────────── */}
      <section className="bg-obsidian-950 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {t.pieces.map((piece) => (
              <article key={piece.ref} className="border border-obsidian-800 hover:border-gold-500/30 transition-colors duration-500">
                {/* Watch visual placeholder — warm gold for Artisana */}
                <div className="aspect-square bg-obsidian-900 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-900/20 to-obsidian-950" />
                  <div className="relative z-10 text-center">
                    <p className="font-serif text-5xl text-gold-500/10 select-none">PAVÉ</p>
                    <p className="font-mono text-gold-500/40 text-xs mt-2 tracking-[0.3em]">{piece.ref}</p>
                  </div>
                  <div className="absolute top-4 start-4 w-6 h-6 border-t border-s border-gold-500/40" />
                  <div className="absolute bottom-4 end-4 w-6 h-6 border-b border-e border-gold-500/40" />
                </div>

                <div className="p-8">
                  <p className="font-mono text-obsidian-600 text-xs tracking-[0.2em] mb-3">{piece.ref}</p>
                  <h3 className="font-serif text-2xl text-white mb-6">{piece.name}</h3>

                  <div className="space-y-2 mb-8">
                    {([
                      [t.specs.movement, piece.movement],
                      [t.specs.material, piece.material],
                      [t.specs.dial, piece.dial],
                      [t.specs.water, piece.water],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} className="flex justify-between items-start py-2 border-b border-obsidian-800 last:border-0 gap-4">
                        <span className="text-obsidian-500 text-xs uppercase tracking-wider shrink-0">{label}</span>
                        <span className="text-obsidian-300 text-xs text-end">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-end justify-between">
                    <p className="text-gold-500 font-semibold">{piece.price}</p>
                    <a href="#artisana-inquiry" className="text-obsidian-500 hover:text-gold-500 text-xs uppercase tracking-[0.2em] transition-colors">
                      {t.inquire} →
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Craft Detail ──────────────────────────────────────────────────── */}
      <section className="bg-obsidian-900 border-y border-obsidian-800 py-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-px bg-obsidian-800">
          {[
            { num: '3–6', label: tr.pave.craftsmanship.pillars[0].title, sub: tr.pave.craftsmanship.pillars[0].desc.slice(0, 60) + '…' },
            { num: '200', label: tr.pave.craftsmanship.pillars[3].title, sub: tr.pave.craftsmanship.pillars[3].desc.slice(0, 60) + '…' },
            { num: '∞', label: tr.pave.craftsmanship.pillars[2].title, sub: tr.pave.craftsmanship.pillars[2].desc.slice(0, 60) + '…' },
          ].map(({ num, label, sub }) => (
            <div key={num} className="bg-obsidian-900 p-10 text-center">
              <p className="font-serif text-4xl text-gold-500 mb-3">{num}</p>
              <p className="text-white text-sm uppercase tracking-wider mb-2">{label}</p>
              <p className="text-obsidian-500 text-xs">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Inquiry ───────────────────────────────────────────────────────── */}
      <section id="artisana-inquiry" className="bg-obsidian-950 border-t border-obsidian-800 py-24 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold-500 text-xs uppercase tracking-[0.3em] mb-3">{tInquiry.eyebrow}</p>
            <h2 className="font-serif text-3xl text-white">{t.inquire}</h2>
          </div>
          {submitted ? (
            <div className="border border-gold-500/30 bg-gold-500/5 p-10 text-center">
              <p className="font-serif text-lg text-white">{tInquiry.submitted}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-field">{tInquiry.name}</label>
                <input type="text" required className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label-field">{tInquiry.email}</label>
                <input type="email" required className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label-field">{tInquiry.message}</label>
                <textarea rows={4} className="input-field resize-none" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              <button type="submit" disabled={sending} className="btn-gold w-full">
                {sending ? tInquiry.sending : tInquiry.submit}
              </button>
            </form>
          )}
        </div>
      </section>
    </Layout>
  );
};
