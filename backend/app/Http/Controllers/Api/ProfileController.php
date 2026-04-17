<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->load(['bids' => fn($q) => $q->latest()->limit(5), 'wonAuctions']));
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'country' => 'sometimes|nullable|string|max:100',
            'bio' => 'sometimes|nullable|string|max:1000',
        ]);

        $request->user()->update($validated);
        return response()->json($request->user()->fresh());
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $request->user()->update(['password' => Hash::make($request->password)]);
        return response()->json(['message' => 'Password updated successfully']);
    }

    public function favorites(Request $request)
    {
        $favorites = $request->user()->favorites()->with('favorable')->latest()->get();
        return response()->json($favorites);
    }

    public function bids(Request $request)
    {
        $bids = $request->user()->bids()->with(['auction.watch.primaryImage'])->latest()->paginate(10);
        return response()->json($bids);
    }
}
