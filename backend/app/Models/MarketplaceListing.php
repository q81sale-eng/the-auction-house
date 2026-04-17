<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MarketplaceListing extends Model
{
    use HasFactory;

    protected $fillable = ['watch_id', 'seller_id', 'title', 'description', 'price', 'status', 'negotiable', 'slug'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'negotiable' => 'boolean',
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

    public function favorites()
    {
        return $this->morphMany(Favorite::class, 'favorable');
    }
}
