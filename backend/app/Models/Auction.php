<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Auction extends Model
{
    use HasFactory;

    protected $fillable = [
        'watch_id', 'seller_id', 'title', 'description', 'starting_price',
        'reserve_price', 'current_bid', 'buy_now_price', 'bid_increment',
        'deposit_required', 'winning_bidder_id', 'starts_at', 'ends_at',
        'auto_extend', 'extend_minutes', 'status', 'slug',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'auto_extend' => 'boolean',
            'starting_price' => 'decimal:2',
            'reserve_price' => 'decimal:2',
            'current_bid' => 'decimal:2',
            'buy_now_price' => 'decimal:2',
            'bid_increment' => 'decimal:2',
            'deposit_required' => 'decimal:2',
        ];
    }

    public function watch()
    {
        return $this->belongsTo(Watch::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function winningBidder()
    {
        return $this->belongsTo(User::class, 'winning_bidder_id');
    }

    public function bids()
    {
        return $this->hasMany(Bid::class)->latest();
    }

    public function deposits()
    {
        return $this->hasMany(Deposit::class);
    }

    public function favorites()
    {
        return $this->morphMany(Favorite::class, 'favorable');
    }

    public function isLive(): bool
    {
        return $this->status === 'live';
    }

    public function getNextMinimumBidAttribute(): float
    {
        $current = $this->current_bid ?? $this->starting_price;
        return $current + $this->bid_increment;
    }
}
