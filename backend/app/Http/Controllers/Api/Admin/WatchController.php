<?php
namespace App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Controller;
use App\Models\Watch;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WatchController extends Controller
{
    public function index()
    {
        return response()->json(Watch::with(['primaryImage', 'latestValuation'])->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'reference_number' => 'nullable|string',
            'year' => 'nullable|integer',
            'movement' => 'nullable|string',
            'case_material' => 'nullable|string',
            'bracelet_material' => 'nullable|string',
            'case_diameter' => 'nullable|numeric',
            'dial_color' => 'nullable|string',
            'condition' => 'required|in:new,excellent,good,fair',
            'description' => 'nullable|string',
            'serial_number' => 'nullable|string',
            'has_box' => 'boolean',
            'has_papers' => 'boolean',
            'water_resistance' => 'nullable|string',
            'power_reserve' => 'nullable|string',
            'complications' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['brand'] . '-' . $validated['model'] . '-' . uniqid());
        $watch = Watch::create($validated);
        return response()->json($watch, 201);
    }

    public function show(Watch $watch)
    {
        return response()->json($watch->load(['images', 'valuations', 'auctions', 'marketplaceListings']));
    }

    public function update(Request $request, Watch $watch)
    {
        $validated = $request->validate([
            'brand' => 'sometimes|string|max:255',
            'model' => 'sometimes|string|max:255',
            'reference_number' => 'nullable|string',
            'year' => 'nullable|integer',
            'movement' => 'nullable|string',
            'case_material' => 'nullable|string',
            'bracelet_material' => 'nullable|string',
            'case_diameter' => 'nullable|numeric',
            'dial_color' => 'nullable|string',
            'condition' => 'sometimes|in:new,excellent,good,fair',
            'description' => 'nullable|string',
            'serial_number' => 'nullable|string',
            'has_box' => 'boolean',
            'has_papers' => 'boolean',
        ]);
        $watch->update($validated);
        return response()->json($watch->fresh());
    }

    public function destroy(Watch $watch)
    {
        $watch->delete();
        return response()->json(['message' => 'Watch deleted']);
    }
}
