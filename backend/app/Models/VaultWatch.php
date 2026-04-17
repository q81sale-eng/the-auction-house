<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VaultWatch extends Model
{
    protected $fillable = [
        'user_id', 'watch_id', 'purchase_price', 'current_value',
        'purchased_at', 'purchase_source', 'notes', 'is_private',
    ];

    protected function casts(): array
    {
        return [
            'purchase_price' => 'decimal:2',
            'current_value' => 'decimal:2',
            'purchased_at' => 'date',
            'is_private' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function watch()
    {
        return $this->belongsTo(Watch::class);
    }

    public function getProfitLossAttribute(): float
    {
        if ($this->current_value === null) {
            return 0;
        }
        return $this->current_value - $this->purchase_price;
    }

    public function getProfitLossPercentAttribute(): float
    {
        if ($this->current_value === null || $this->purchase_price == 0) {
            return 0;
        }
        return (($this->current_value - $this->purchase_price) / $this->purchase_price) * 100;
    }
}
