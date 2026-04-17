import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';

interface ListingCardProps {
  listing: {
    id: number;
    slug: string;
    title: string;
    price: string;
    negotiable: boolean;
    watch: {
      brand: string;
      model: string;
      condition: string;
      year?: number;
      case_diameter?: string;
      primary_image?: { path: string; alt_text: string };
    };
    seller: { name: string };
  };
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const imgSrc = listing.watch.primary_image?.path || '/placeholder-watch.jpg';
  const conditionColors: Record<string, string> = {
    new: 'text-green-400', excellent: 'text-blue-400', good: 'text-yellow-400', fair: 'text-orange-400',
  };

  return (
    <Link to={`/marketplace/${listing.slug}`} className="card group block hover:border-gold-500/50 transition-colors">
      <div className="relative overflow-hidden aspect-square bg-obsidian-800">
        <img
          src={imgSrc.startsWith('http') ? imgSrc : `http://localhost:8000/storage/${imgSrc}`}
          alt={listing.watch.primary_image?.alt_text || listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/1a1a1a/d4af37?text=Watch'; }}
        />
        {listing.negotiable && (
          <div className="absolute top-3 right-3 bg-obsidian-900/90 border border-gold-500/50 text-gold-500 text-xs px-2 py-1">
            Negotiable
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-gold-500 text-xs uppercase tracking-widest mb-1">{listing.watch.brand}</p>
        <h3 className="text-white font-serif text-lg leading-tight mb-1 line-clamp-2">{listing.title}</h3>
        <p className="text-obsidian-400 text-xs mb-3">
          <span className={conditionColors[listing.watch.condition] || 'text-obsidian-400'}>
            {listing.watch.condition.charAt(0).toUpperCase() + listing.watch.condition.slice(1)}
          </span>
          {listing.watch.year && ` · ${listing.watch.year}`}
          {listing.watch.case_diameter && ` · ${listing.watch.case_diameter}mm`}
        </p>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-1">Price</p>
            <p className="text-white text-xl font-semibold">{formatCurrency(parseFloat(listing.price))}</p>
          </div>
          <p className="text-obsidian-500 text-xs">{listing.seller.name}</p>
        </div>
      </div>
    </Link>
  );
};
