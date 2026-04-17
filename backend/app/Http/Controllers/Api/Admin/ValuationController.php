<?php
namespace App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Controller;
use App\Models\Valuation;
use App\Models\Watch;
use Illuminate\Http\Request;

class ValuationController extends Controller
{
    public function index()
    {
        return response()->json(Valuation::with(['watch', 'admin:id,name'])->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'watch_id' => 'required|exists:watches,id',
            'estimated_value' => 'required|numeric|min:0',
            'low_estimate' => 'nullable|numeric|min:0',
            'high_estimate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'valuation_date' => 'required|date',
        ]);

        $validated['admin_id'] = $request->user()->id;
        $valuation = Valuation::create($validated);

        // Update vault current values for this watch
        $watch = Watch::find($validated['watch_id']);
        $watch->vaultEntries()->whereNull('current_value')->update(['current_value' => $validated['estimated_value']]);

        return response()->json($valuation->load('watch'), 201);
    }

    public function update(Request $request, Valuation $valuation)
    {
        $validated = $request->validate([
            'estimated_value' => 'sometimes|numeric|min:0',
            'low_estimate' => 'nullable|numeric|min:0',
            'high_estimate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'valuation_date' => 'sometimes|date',
        ]);
        $valuation->update($validated);
        return response()->json($valuation->fresh());
    }

    public function destroy(Valuation $valuation)
    {
        $valuation->delete();
        return response()->json(['message' => 'Valuation deleted']);
    }
}
