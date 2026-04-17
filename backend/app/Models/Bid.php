<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bid extends Model
{
    protected $fillable = ['auction_id', 'user_id', 'amount', 'is_winning', 'status', 'ip_address'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'is_winning' => 'boolean',
        ];
    }

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
