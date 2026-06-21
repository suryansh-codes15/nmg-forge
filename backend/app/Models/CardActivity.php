<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CardActivity extends Model
{
    protected $fillable = ['card_id', 'member_id', 'type', 'content'];

    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
