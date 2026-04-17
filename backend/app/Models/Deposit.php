<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deposit extends Model
{
    protected $fillable = ['user_id', 'auction_id', 'amount', 'type', 'status', 'reference', 'notes'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }
}
