<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WatchImage extends Model
{
    protected $fillable = ['watch_id', 'path', 'alt_text', 'is_primary', 'sort_order'];

    protected function casts(): array
    {
        return ['is_primary' => 'boolean'];
    }

    public function watch()
    {
        return $this->belongsTo(Watch::class);
    }
}
