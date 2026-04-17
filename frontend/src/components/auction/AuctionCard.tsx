import React from 'react';
import { Link } from 'react-router-dom';
import { CountdownTimer } from '../ui/CountdownTimer';
import { formatCurrency } from '../../utils/format';

interface AuctionCardProps {
  auction: {
    id: number;
    slug: string;
    title: string;
    status: string;
    starting_price: string;
    current_bid?: string;
    buy_now_price?: string;
    ends_at: string;
    starts_at: string;
    bids_count?: number;
    watch: {
      brand: string;
      model: string;
      condition: string;
      primary_image?: { path: string; alt_text: string };
    };
  };
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction }) => {
  const currentPrice = auction.current_bid || auction.starting_price;
  const imgSrc = auction.watch.primary_image?.path || '/placeholder-watch.jpg';

  return (
    <Link to={`/auctions/${auction.slug}`} className="card group block hover:border-gold-500/50 transition-colors">
      <div className="relative overflow-hidden aspect-square bg-obsidian-800">
        <img
          src={imgSrc.startsWith('http') ? imgSrc : `http://localhost:8000/storage/${imgSrc}`}
          alt={auction.watch.primary_image?.alt_text || auction.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/1a1a1a/d4af37?text=Watch'; }}
        />
        <div className="absolute top-3 left-3">
          {auction.status === 'live' && (
            <span className="badge-live">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Live
            </span>
          )}
          {auction.status === 'upcoming' && <span className="badge-upcoming">Upcoming</span>}
          {auction.status === 'sold' && <span className="badge-sold">Sold</span>}
        </div>
        {auction.buy_now_price && (
          <div className="absolute top-3 right-3 bg-gold-500/90 text-obsidian-950 text-xs font-bold px-2 py-1">
            Buy Now
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-gold-500 text-xs uppercase tracking-widest mb-1">{auction.watch.brand}</p>
        <h3 className="text-white font-serif text-lg leading-tight mb-3 line-clamp-2">{auction.title}</h3>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-1">
              {auction.current_bid ? 'Current Bid' : 'Starting Price'}
            </p>
            <p className="text-white text-xl font-semibold">{formatCurrency(parseFloat(currentPrice))}</p>
          </div>
          {auction.bids_count !== undefined && (
            <p className="text-obsidian-400 text-xs">{auction.bids_count} bid{auction.bids_count !== 1 ? 's' : ''}</p>
          )}
        </div>

        {auction.status === 'live' && (
          <div className="border-t border-obsidian-800 pt-3">
            <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-1">Ends In</p>
            <CountdownTimer endsAt={auction.ends_at} />
          </div>
        )}

        {auction.status === 'upcoming' && (
          <div className="border-t border-obsidian-800 pt-3">
            <p className="text-obsidian-400 text-xs">Starts {new Date(auction.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
          </div>
        )}
      </div>
    </Link>
  );
};
