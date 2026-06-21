<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Card extends Model
{
    protected $fillable = ['list_id', 'title', 'description', 'due_date', 'position'];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
    ];

    public function list(): BelongsTo
    {
        return $this->belongsTo(BoardList::class, 'list_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'card_tag');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Member::class, 'card_member');
    }

    public function activities(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CardActivity::class)->orderBy('created_at', 'desc');
    }
}
