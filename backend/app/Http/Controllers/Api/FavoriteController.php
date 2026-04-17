<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Favorite;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function toggle(Request $request)
    {
        $request->validate([
            'favorable_id' => 'required|integer',
            'favorable_type' => 'required|in:auction,listing,watch',
        ]);

        $typeMap = [
            'auction' => \App\Models\Auction::class,
            'listing' => \App\Models\MarketplaceListing::class,
            'watch' => \App\Models\Watch::class,
        ];

        $existing = Favorite::where([
            'user_id' => $request->user()->id,
            'favorable_id' => $request->favorable_id,
            'favorable_type' => $typeMap[$request->favorable_type],
        ])->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['favorited' => false]);
        }

        Favorite::create([
            'user_id' => $request->user()->id,
            'favorable_id' => $request->favorable_id,
            'favorable_type' => $typeMap[$request->favorable_type],
        ]);

        return response()->json(['favorited' => true]);
    }
}
