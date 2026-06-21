<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\CardActivity;
use Illuminate\Http\Request;

class CardActivityController extends Controller
{
    public function index(Card $card)
    {
        return $card->activities()->with('member')->get();
    }

    public function storeComment(Request $request, Card $card)
    {
        $data = $request->validate([
            'member_id' => 'required|exists:members,id',
            'content' => 'required|string',
        ]);

        $activity = CardActivity::create([
            'card_id' => $card->id,
            'member_id' => $data['member_id'],
            'type' => 'comment',
            'content' => $data['content'],
        ]);

        return $activity->load('member');
    }
}
