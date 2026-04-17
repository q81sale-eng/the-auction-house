import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAuctions } from '../api/auctions';
import { AuctionCard } from '../components/auction/AuctionCard';
import { Layout } from '../components/layout/Layout';
import { useT } from '../i18n/useLanguage';

export const HomePage: React.FC = () => {
  const { tr } = useT();
  const { data: auctionsData } = useQuery({
    queryKey: ['auctions', 'live'],
    queryFn: () => getAuctions({ status: 'live', per_page: 4 }),
  });

  const statsValues = ['500+', '£2M+', '100%'];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-obsidian-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950 via-obsidian-900/50 to-obsidian-950" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #d4af37 0%, transparent 70%)' }} />
        <div className="relative text-center px-4 max-w-4xl mx-auto">
          <p className="text-gold-500 text-xs uppercase tracking-[0.4em] mb-6">{tr.home.hero.eyebrow}</p>
          <h1 className="font-serif text-5xl sm:text-7xl text-white mb-6 leading-tight">
            {tr.home.hero.line1}<br />
            <span className="text-gold-500">{tr.home.hero.line2}</span>
          </h1>
          <p className="text-obsidian-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            {tr.home.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auctions" className="btn-gold">{tr.home.hero.cta1}</Link>
            <Link to="/marketplace" className="btn-outline">{tr.home.hero.cta2}</Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-obsidian-900 border-y border-obsidian-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 divide-x divide-obsidian-800 text-center">
            {statsValues.map((val, i) => (
              <div key={i} className="py-4">
                <p className="font-serif text-gold-500 text-3xl mb-1">{val}</p>
                <p className="text-obsidian-400 text-xs uppercase tracking-wider">{tr.home.stats[i]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-subtitle">{tr.home.liveAuctions.eyebrow}</p>
            <h2 className="section-title">{tr.home.liveAuctions.title}</h2>
          </div>
          <Link to="/auctions" className="text-gold-500 text-sm hover:text-gold-400 uppercase tracking-wider transition-colors">
            {tr.home.liveAuctions.viewAll}
          </Link>
        </div>
        {auctionsData?.data?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {auctionsData.data.map((auction: any) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-obsidian-400">
            <p className="text-lg">{tr.home.liveAuctions.empty}</p>
            <Link to="/auctions" className="text-gold-500 hover:text-gold-400 text-sm mt-2 inline-block">
              {tr.home.liveAuctions.emptyLink}
            </Link>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-obsidian-900 border-y border-obsidian-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="section-subtitle">{tr.home.howItWorks.eyebrow}</p>
            <h2 className="section-title">{tr.home.howItWorks.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tr.home.howItWorks.steps.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 border border-gold-500/30 flex items-center justify-center mx-auto mb-6">
                  <span className="font-serif text-gold-500 text-2xl">{step}</span>
                </div>
                <h3 className="font-serif text-white text-xl mb-3">{title}</h3>
                <p className="text-obsidian-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="section-subtitle">{tr.home.marketplaceCta.eyebrow}</p>
        <h2 className="section-title mb-4">{tr.home.marketplaceCta.title}</h2>
        <p className="text-obsidian-400 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
          {tr.home.marketplaceCta.desc}
        </p>
        <Link to="/marketplace" className="btn-gold">{tr.home.marketplaceCta.cta}</Link>
      </section>
    </Layout>
  );
};
