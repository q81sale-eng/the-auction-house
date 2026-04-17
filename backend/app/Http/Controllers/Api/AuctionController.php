<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuctionController extends Controller
{
    public function index(Request $request)
    {
        $query = Auction::with(['watch.primaryImage', 'seller'])
            ->withCount('bids');

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->brand) {
            $query->whereHas('watch', fn($q) => $q->where('brand', $request->brand));
        }
        if ($request->min_price) {
            $query->where(fn($q) => $q->where('current_bid', '>=', $request->min_price)
                ->orWhere('starting_price', '>=', $request->min_price));
        }
        if ($request->max_price) {
            $query->where(fn($q) => $q->where('current_bid', '<=', $request->max_price)
                ->orWhere('starting_price', '<=', $request->max_price));
        }

        $auctions = $query->orderByRaw("FIELD(status, 'live', 'upcoming', 'ended', 'sold', 'cancelled')")
            ->orderBy('ends_at')
            ->paginate(12);

        return response()->json($auctions);
    }

    public function show(string $slug)
    {
        $auction = Auction::with([
            'watch.images', 'seller', 'winningBidder',
            'bids' => fn($q) => $q->with('user:id,name')->latest()->limit(20),
        ])->where('slug', $slug)->firstOrFail();

        return response()->json($auction);
    }

    public function bid(Request $request, Auction $auction)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        if (!$auction->isLive()) {
            return response()->json(['message' => 'Auction is not live'], 422);
        }

        $minBid = $auction->current_bid
            ? $auction->current_bid + $auction->bid_increment
            : $auction->starting_price;

        if ($request->amount < $minBid) {
            return response()->json(['message' => "Minimum bid is $$minBid"], 422);
        }

        DB::transaction(function () use ($request, $auction) {
            $auction->bids()->where('is_winning', true)->update(['is_winning' => false, 'status' => 'outbid']);

            $bid = Bid::create([
                'auction_id' => $auction->id,
                'user_id' => $request->user()->id,
                'amount' => $request->amount,
                'is_winning' => true,
                'status' => 'active',
                'ip_address' => $request->ip(),
            ]);

            $auction->update([
                'current_bid' => $request->amount,
                'winning_bidder_id' => $request->user()->id,
            ]);

            // Auto-extend if bid placed in last N minutes
            if ($auction->auto_extend) {
                $extendThreshold = now()->addMinutes($auction->extend_minutes);
                if ($auction->ends_at->lessThan($extendThreshold)) {
                    $auction->update(['ends_at' => now()->addMinutes($auction->extend_minutes)]);
                }
            }
        });

        return response()->json(['message' => 'Bid placed successfully', 'auction' => $auction->fresh()]);
    }

    public function bidHistory(Auction $auction)
    {
        $bids = $auction->bids()->with('user:id,name')->latest()->paginate(20);
        return response()->json($bids);
    }

    public function buyNow(Request $request, Auction $auction)
    {
        if (!$auction->buy_now_price) {
            return response()->json(['message' => 'No buy now price available'], 422);
        }
        if (!$auction->isLive()) {
            return response()->json(['message' => 'Auction is not live'], 422);
        }

        DB::transaction(function () use ($request, $auction) {
            $auction->update([
                'status' => 'sold',
                'winning_bidder_id' => $request->user()->id,
                'current_bid' => $auction->buy_now_price,
                'ends_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Purchase successful', 'auction' => $auction->fresh()]);
    }
}

