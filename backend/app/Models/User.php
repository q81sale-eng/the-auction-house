<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'avatar', 'country',
        'bio', 'is_admin', 'is_verified', 'deposit_balance', 'last_login_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_verified' => 'boolean',
            'deposit_balance' => 'decimal:2',
        ];
    }

    public function auctions()
    {
        return $this->hasMany(Auction::class, 'seller_id');
    }

    public function bids()
    {
        return $this->hasMany(Bid::class);
    }

    public function deposits()
    {
        return $this->hasMany(Deposit::class);
    }

    public function marketplaceListings()
    {
        return $this->hasMany(MarketplaceListing::class, 'seller_id');
    }

    public function vaultWatches()
    {
        return $this->hasMany(VaultWatch::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function wonAuctions()
    {
        return $this->hasMany(Auction::class, 'winning_bidder_id');
    }
}
