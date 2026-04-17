<?php
namespace App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\MarketplaceListing;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'stats' => [
                'total_users' => User::count(),
                'total_auctions' => Auction::count(),
                'live_auctions' => Auction::where('status', 'live')->count(),
                'total_listings' => MarketplaceListing::count(),
                'total_bids' => Bid::count(),
                'total_revenue' => Auction::where('status', 'sold')->sum('current_bid'),
            ],
            'recent_auctions' => Auction::with(['watch', 'seller'])->latest()->limit(5)->get(),
            'recent_users' => User::latest()->limit(5)->get(),
        ]);
    }
}
