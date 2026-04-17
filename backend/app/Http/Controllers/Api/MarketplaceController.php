<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\MarketplaceListing;
use Illuminate\Http\Request;

class MarketplaceController extends Controller
{
    public function index(Request $request)
    {
        $query = MarketplaceListing::with(['watch.primaryImage', 'watch.images', 'seller'])
            ->where('status', 'active');

        if ($request->brand) $query->whereHas('watch', fn($q) => $q->where('brand', $request->brand));
        if ($request->condition) $query->whereHas('watch', fn($q) => $q->where('condition', $request->condition));
        if ($request->min_price) $query->where('price', '>=', $request->min_price);
        if ($request->max_price) $query->where('price', '<=', $request->max_price);
        if ($request->search) {
            $q = $request->search;
            $query->where(fn($sq) => $sq->where('title', 'like', "%$q%")
                ->orWhereHas('watch', fn($wq) => $wq->where('brand', 'like', "%$q%")->orWhere('model', 'like', "%$q%")));
        }

        $sort = $request->sort ?? 'latest';
        match($sort) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            default => $query->latest(),
        };

        return response()->json($query->paginate(12));
    }

    public function show(string $slug)
    {
        $listing = MarketplaceListing::with(['watch.images', 'seller'])->where('slug', $slug)->firstOrFail();
        return response()->json($listing);
    }
}
