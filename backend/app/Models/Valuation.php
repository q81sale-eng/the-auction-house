<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Valuation extends Model
{
    protected $fillable = [
        'watch_id', 'admin_id', 'estimated_value', 'low_estimate',
        'high_estimate', 'notes', 'valuation_date',
    ];

    protected function casts(): array
    {
        return [
            'estimated_value' => 'decimal:2',
            'low_estimate' => 'decimal:2',
            'high_estimate' => 'decimal:2',
            'valuation_date' => 'date',
        ];
    }

    public function watch()
    {
        return $this->belongsTo(Watch::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
