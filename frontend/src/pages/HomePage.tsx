import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAuctions } from '../api/auctions';
import { AuctionCard } from '../components/auction/AuctionCard';
import { Layout } from '../components/layout/Layout';

export const HomePage: React.FC = () => {
  const { data: auctionsData } = useQuery({
    queryKey: ['auctions', 'live'],
    queryFn: () => getAuctions({ status: 'live', per_page: 4 }),
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-obsidian-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950 via-obsidian-900/50 to-obsidian-950" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #d4af37 0%, transparent 70%)' }} />
        <div className="relative text-center px-4 max-w-4xl mx-auto">
          <p className="text-gold-500 text-xs uppercase tracking-[0.4em] mb-6">Est. 2024 · London</p>
          <h1 className="font-serif text-5xl sm:text-7xl text-white mb-6 leading-tight">
            Where Collectors Meet<br />
            <span className="text-gold-500">Extraordinary</span> Timepieces
          </h1>
          <p className="text-obsidian-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Curated auctions and private sales of the world's most coveted watches.
            Authenticated, verified, and delivered with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auctions" className="btn-gold">View Live Auctions</Link>
            <Link to="/marketplace" className="btn-outline">Browse Marketplace</Link>
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
            {[['500+', 'Watches Sold'], ['£2M+', 'In Sales'], ['100%', 'Authenticated']].map(([val, label]) => (
              <div key={label} className="py-4">
                <p className="font-serif text-gold-500 text-3xl mb-1">{val}</p>
                <p className="text-obsidian-400 text-xs uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-subtitle">Ending Soon</p>
            <h2 className="section-title">Live Auctions</h2>
          </div>
          <Link to="/auctions" className="text-gold-500 text-sm hover:text-gold-400 uppercase tracking-wider transition-colors">
            View All →
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
            <p className="text-lg">No live auctions at the moment.</p>
            <Link to="/auctions" className="text-gold-500 hover:text-gold-400 text-sm mt-2 inline-block">Check upcoming auctions →</Link>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-obsidian-900 border-y border-obsidian-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="section-subtitle">Simple Process</p>
            <h2 className="section-title">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Register and verify your identity. Our team reviews all members to ensure a trusted community.' },
              { step: '02', title: 'Place a Deposit', desc: 'Add funds to participate in auctions. Your deposit is secure and refundable if you don\'t win.' },
              { step: '03', title: 'Bid & Win', desc: 'Bid with confidence on authenticated timepieces. Win the auction and complete your purchase.' },
            ].map(({ step, title, desc }) => (
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
        <p className="section-subtitle">Immediate Purchase</p>
        <h2 className="section-title mb-4">Buy Now Marketplace</h2>
        <p className="text-obsidian-400 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
          Browse our curated selection of pre-owned luxury watches available for immediate purchase.
          No waiting, no bidding — just exceptional timepieces.
        </p>
        <Link to="/marketplace" className="btn-gold">Explore Marketplace</Link>
      </section>
    </Layout>
  );
};
