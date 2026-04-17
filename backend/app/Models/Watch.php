<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Watch extends Model
{
    use HasFactory;

    protected $fillable = [
        'brand', 'model', 'reference_number', 'year', 'movement',
        'case_material', 'bracelet_material', 'case_diameter', 'dial_color',
        'condition', 'description', 'serial_number', 'has_box', 'has_papers',
        'water_resistance', 'power_reserve', 'complications', 'slug',
    ];

    protected function casts(): array
    {
        return [
            'has_box' => 'boolean',
            'has_papers' => 'boolean',
            'case_diameter' => 'decimal:1',
        ];
    }

    public function images()
    {
        return $this->hasMany(WatchImage::class)->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(WatchImage::class)->where('is_primary', true);
    }

    public function auctions()
    {
        return $this->hasMany(Auction::class);
    }

    public function marketplaceListings()
    {
        return $this->hasMany(MarketplaceListing::class);
    }

    public function vaultEntries()
    {
        return $this->hasMany(VaultWatch::class);
    }

    public function valuations()
    {
        return $this->hasMany(Valuation::class)->latest();
    }

    public function latestValuation()
    {
        return $this->hasOne(Valuation::class)->latest();
    }

    public function favorites()
    {
        return $this->morphMany(Favorite::class, 'favorable');
    }
}
