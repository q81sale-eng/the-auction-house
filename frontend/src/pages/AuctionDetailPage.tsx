import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuction, placeBid, buyNow } from '../api/auctions';
import { CountdownTimer } from '../components/ui/CountdownTimer';
import { Layout } from '../components/layout/Layout';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDateTime } from '../utils/format';
import { useCurrencyStore, convertFromGBP } from '../store/currencyStore';

export const AuctionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { currency } = useCurrencyStore();
  const fmt = (v: number | string) => formatCurrency(convertFromGBP(parseFloat(String(v)), currency), currency);
  const [bidAmount, setBidAmount] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction', slug],
    queryFn: () => getAuction(slug!),
    refetchInterval: 10000, // poll every 10s for live auctions
  });

  const bidMutation = useMutation({
    mutationFn: (amount: number) => placeBid(auction.id, amount),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Bid placed successfully!' });
      setBidAmount('');
      queryClient.invalidateQueries({ queryKey: ['auction', slug] });
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to place bid' });
    },
  });

  const buyNowMutation = useMutation({
    mutationFn: () => buyNow(auction.id),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Purchase successful!' });
      queryClient.invalidateQueries({ queryKey: ['auction', slug] });
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Purchase failed' });
    },
  });

  const handleBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidAmount) return;
    bidMutation.mutate(parseFloat(bidAmount));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
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

  if (!auction) return <Layout><div className="text-center py-20 text-obsidian-400">Auction not found</div></Layout>;

  const images = auction.watch?.images || [];
  const currentImage = images[activeImage];
  const currentPrice = auction.current_bid || auction.starting_price;
  const minBid = auction.current_bid
    ? parseFloat(auction.current_bid) + parseFloat(auction.bid_increment)
    : parseFloat(auction.starting_price);

  const specs = [
    ['Brand', auction.watch?.brand],
    ['Model', auction.watch?.model],
    ['Reference', auction.watch?.reference_number],
    ['Year', auction.watch?.year],
    ['Movement', auction.watch?.movement],
    ['Case Material', auction.watch?.case_material],
    ['Dial Color', auction.watch?.dial_color],
    ['Case Diameter', auction.watch?.case_diameter ? `${auction.watch.case_diameter}mm` : null],
    ['Condition', auction.watch?.condition],
    ['Box & Papers', [auction.watch?.has_box && 'Box', auction.watch?.has_papers && 'Papers'].filter(Boolean).join(' & ') || 'None'],
  ].filter(([, v]) => v);

  return (
    <Layout>
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
              <div className="flex gap-2">
                {images.map((img: any, i: number) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 bg-obsidian-800 border overflow-hidden transition-colors ${i === activeImage ? 'border-gold-500' : 'border-obsidian-700'}`}>
                    <img src={img.path.startsWith('http') ? img.path : `http://localhost:8000/storage/${img.path}`} alt={img.alt_text} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {auction.status === 'live' && <span className="badge-live"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />Live</span>}
              {auction.status === 'upcoming' && <span className="badge-upcoming">Upcoming</span>}
              {auction.status === 'sold' && <span className="badge-sold">Sold</span>}
              <span className="text-obsidian-400 text-xs">{auction.bids?.length || 0} bids</span>
            </div>

            <h1 className="font-serif text-3xl text-white mb-2">{auction.title}</h1>
            <p className="text-obsidian-400 text-sm mb-6">{auction.description}</p>

            {/* Price & Timer */}
            <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-1">
                    {auction.current_bid ? 'Current Bid' : 'Starting Price'}
                  </p>
                  <p className="text-white text-3xl font-semibold">{fmt(currentPrice)}</p>
                </div>
                {auction.buy_now_price && (
                  <div>
                    <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-1">Buy Now</p>
                    <p className="text-gold-500 text-3xl font-semibold">{fmt(auction.buy_now_price)}</p>
                  </div>
                )}
              </div>

              {auction.status === 'live' && (
                <div className="mb-6">
                  <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-2">Time Remaining</p>
                  <CountdownTimer endsAt={auction.ends_at} />
                </div>
              )}

              {/* Message */}
              {message && (
                <div className={`p-3 mb-4 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {message.text}
                </div>
              )}

              {/* Bid Form */}
              {auction.status === 'live' && isAuthenticated && (
                <>
                  <form onSubmit={handleBid} className="flex gap-3 mb-3">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-400">£</span>
                      <input
                        type="number" step="1" min={minBid}
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        placeholder={`Min ${fmt(minBid)}`}
                        className="input-field pl-8"
                      />
                    </div>
                    <button type="submit" disabled={bidMutation.isPending} className="btn-gold whitespace-nowrap">
                      {bidMutation.isPending ? 'Placing...' : 'Place Bid'}
                    </button>
                  </form>
                  {auction.buy_now_price && (
                    <button onClick={() => buyNowMutation.mutate()} disabled={buyNowMutation.isPending}
                      className="btn-outline w-full">
                      {buyNowMutation.isPending ? 'Processing...' : `Buy Now — ${fmt(auction.buy_now_price)}`}
                    </button>
                  )}
                </>
              )}

              {!isAuthenticated && auction.status === 'live' && (
                <a href="/login" className="btn-gold block text-center">Sign In to Bid</a>
              )}

              {auction.deposit_required > 0 && (
                <p className="text-obsidian-500 text-xs mt-3">* Deposit of {fmt(auction.deposit_required)} required to bid</p>
              )}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-3 text-sm text-obsidian-400">
              <div className="w-8 h-8 bg-gold-500/20 rounded-full flex items-center justify-center">
                <span className="text-gold-500 text-xs font-semibold">{auction.seller?.name?.charAt(0)}</span>
              </div>
              <span>Listed by <span className="text-white">{auction.seller?.name}</span></span>
            </div>
          </div>
        </div>

        {/* Watch Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-obsidian-900 border border-obsidian-800 p-6">
            <h2 className="font-serif text-xl text-white mb-6">Watch Specifications</h2>
            <div className="space-y-3">
              {specs.map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-obsidian-800 last:border-0">
                  <span className="text-obsidian-400 text-sm">{label}</span>
                  <span className="text-white text-sm capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bid History */}
          <div className="bg-obsidian-900 border border-obsidian-800 p-6">
            <h2 className="font-serif text-xl text-white mb-6">Bid History</h2>
            {auction.bids?.length > 0 ? (
              <div className="space-y-2">
                {auction.bids.slice(0, 10).map((bid: any, i: number) => (
                  <div key={bid.id} className={`flex justify-between items-center py-3 border-b border-obsidian-800 last:border-0 ${i === 0 ? 'text-gold-400' : 'text-white'}`}>
                    <div className="flex items-center gap-3">
                      {i === 0 && <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />}
                      <span className="text-sm">{bid.user?.name || 'Anonymous'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(bid.amount)}</p>
                      <p className="text-obsidian-500 text-xs">{formatDateTime(bid.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-obsidian-400 text-sm text-center py-8">No bids yet. Be the first!</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
