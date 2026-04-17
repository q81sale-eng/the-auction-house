<?php
namespace App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Controller;
use App\Models\Auction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuctionController extends Controller
{
    public function index()
    {
        return response()->json(Auction::with(['watch.primaryImage', 'seller'])->withCount('bids')->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'watch_id' => 'required|exists:watches,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'starting_price' => 'required|numeric|min:0',
            'reserve_price' => 'nullable|numeric|min:0',
            'buy_now_price' => 'nullable|numeric|min:0',
            'bid_increment' => 'required|numeric|min:1',
            'deposit_required' => 'required|numeric|min:0',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
            'auto_extend' => 'boolean',
            'extend_minutes' => 'integer|min:1',
        ]);

        $validated['seller_id'] = $request->user()->id;
        $validated['status'] = now()->lt($validated['starts_at']) ? 'upcoming' : 'live';
        $validated['slug'] = Str::slug($validated['title'] . '-' . uniqid());

        $auction = Auction::create($validated);
        return response()->json($auction->load('watch'), 201);
    }

    public function show(Auction $auction)
    {
        return response()->json($auction->load(['watch.images', 'seller', 'bids.user'])->loadCount('bids'));
    }

    public function update(Request $request, Auction $auction)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:upcoming,live,ended,cancelled,sold',
            'ends_at' => 'sometimes|date',
            'reserve_price' => 'sometimes|nullable|numeric|min:0',
            'buy_now_price' => 'sometimes|nullable|numeric|min:0',
        ]);
        $auction->update($validated);
        return response()->json($auction->fresh());
    }

    public function destroy(Auction $auction)
    {
        $auction->delete();
        return response()->json(['message' => 'Auction deleted']);
    }
}
