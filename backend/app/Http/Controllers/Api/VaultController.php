<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\VaultWatch;
use App\Models\Watch;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VaultController extends Controller
{
    public function index(Request $request)
    {
        $vaultWatches = VaultWatch::with(['watch.primaryImage', 'watch.latestValuation'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(function ($vw) {
                return array_merge($vw->toArray(), [
                    'profit_loss' => $vw->profit_loss,
                    'profit_loss_percent' => $vw->profit_loss_percent,
                ]);
            });

        $totalValue = $vaultWatches->sum('current_value');
        $totalCost = $vaultWatches->sum('purchase_price');

        return response()->json([
            'watches' => $vaultWatches,
            'summary' => [
                'total_watches' => $vaultWatches->count(),
                'total_cost' => $totalCost,
                'total_value' => $totalValue,
                'total_profit_loss' => $totalValue - $totalCost,
                'total_profit_loss_percent' => $totalCost > 0 ? (($totalValue - $totalCost) / $totalCost) * 100 : 0,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'reference_number' => 'nullable|string',
            'year' => 'nullable|integer',
            'condition' => 'required|in:new,excellent,good,fair',
            'purchase_price' => 'required|numeric|min:0',
            'purchased_at' => 'required|date',
            'purchase_source' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_private' => 'boolean',
        ]);

        $watch = Watch::create([
            'brand' => $validated['brand'],
            'model' => $validated['model'],
            'reference_number' => $validated['reference_number'] ?? null,
            'year' => $validated['year'] ?? null,
            'condition' => $validated['condition'],
            'slug' => Str::slug($validated['brand'] . '-' . $validated['model'] . '-' . uniqid()),
        ]);

        $vaultWatch = VaultWatch::create([
            'user_id' => $request->user()->id,
            'watch_id' => $watch->id,
            'purchase_price' => $validated['purchase_price'],
            'purchased_at' => $validated['purchased_at'],
            'purchase_source' => $validated['purchase_source'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'is_private' => $validated['is_private'] ?? true,
        ]);

        return response()->json($vaultWatch->load('watch'), 201);
    }

    public function show(Request $request, VaultWatch $vaultWatch)
    {
        if ($vaultWatch->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json(array_merge($vaultWatch->load(['watch.images', 'watch.valuations'])->toArray(), [
            'profit_loss' => $vaultWatch->profit_loss,
            'profit_loss_percent' => $vaultWatch->profit_loss_percent,
        ]));
    }

    public function update(Request $request, VaultWatch $vaultWatch)
    {
        if ($vaultWatch->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'purchase_price' => 'sometimes|numeric|min:0',
            'current_value' => 'sometimes|nullable|numeric|min:0',
            'purchased_at' => 'sometimes|date',
            'notes' => 'sometimes|nullable|string',
            'is_private' => 'sometimes|boolean',
        ]);

        $vaultWatch->update($validated);
        return response()->json($vaultWatch->fresh());
    }

    public function destroy(Request $request, VaultWatch $vaultWatch)
    {
        if ($vaultWatch->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $vaultWatch->delete();
        return response()->json(['message' => 'Removed from vault']);
    }
}
