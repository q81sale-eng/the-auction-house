<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Deposit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DepositController extends Controller
{
    public function index(Request $request)
    {
        $deposits = Deposit::where('user_id', $request->user()->id)->latest()->paginate(20);
        return response()->json($deposits);
    }

    public function deposit(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:100']);

        $deposit = Deposit::create([
            'user_id' => $request->user()->id,
            'amount' => $request->amount,
            'type' => 'deposit',
            'status' => 'completed',
            'reference' => 'DEP-' . strtoupper(Str::random(10)),
        ]);

        $request->user()->increment('deposit_balance', $request->amount);

        return response()->json(['message' => 'Deposit successful', 'balance' => $request->user()->fresh()->deposit_balance]);
    }

    public function withdraw(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:100']);

        if ($request->user()->deposit_balance < $request->amount) {
            return response()->json(['message' => 'Insufficient balance'], 422);
        }

        $deposit = Deposit::create([
            'user_id' => $request->user()->id,
            'amount' => $request->amount,
            'type' => 'withdrawal',
            'status' => 'completed',
            'reference' => 'WIT-' . strtoupper(Str::random(10)),
        ]);

        $request->user()->decrement('deposit_balance', $request->amount);

        return response()->json(['message' => 'Withdrawal successful', 'balance' => $request->user()->fresh()->deposit_balance]);
    }
}
