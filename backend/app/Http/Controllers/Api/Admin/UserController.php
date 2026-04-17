<?php
namespace App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::withCount(['bids', 'auctions'])->latest()->paginate(20));
    }

    public function show(User $user)
    {
        return response()->json($user->load(['bids', 'auctions', 'deposits', 'vaultWatches'])->loadCount(['bids', 'auctions']));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'is_admin' => 'sometimes|boolean',
            'is_verified' => 'sometimes|boolean',
            'deposit_balance' => 'sometimes|numeric|min:0',
        ]);
        $user->update($validated);
        return response()->json($user->fresh());
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }
}
