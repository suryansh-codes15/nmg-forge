<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BoardList;
use App\Models\Card;
use Illuminate\Http\Request;

class CardController extends Controller
{
    public function store(Request $request, BoardList $list)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);
        $position = $list->cards()->max('position') + 1;

        return $list->cards()->create([...$data, 'position' => $position])
            ->load('tags', 'members');
    }

    public function update(Request $request, Card $card)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'position' => 'sometimes|integer',
        ]);
        
        $changes = [];
        if (isset($data['title']) && $data['title'] !== $card->title) {
            $changes[] = "updated title to \"{$data['title']}\"";
        }
        if (array_key_exists('description', $data) && $data['description'] !== $card->description) {
            $changes[] = "updated description";
        }
        if (array_key_exists('due_date', $data) && $data['due_date'] !== ($card->due_date ? $card->due_date->format('Y-m-d') : null)) {
            $dueStr = $data['due_date'] ? $data['due_date'] : 'none';
            $changes[] = "updated due date to {$dueStr}";
        }
        
        $card->update($data);
        
        foreach ($changes as $change) {
            $this->logActivity($card->id, $change);
        }
        
        return $card->load('tags', 'members');
    }

    public function move(Request $request, Card $card)
    {
        $data = $request->validate([
            'list_id' => 'required|exists:lists,id',
            'position' => 'sometimes|integer',
        ]);
        $oldListId = $card->list_id;
        $card->update([
            'list_id' => $data['list_id'],
            'position' => $data['position'] ?? $card->position,
        ]);
        
        if ($oldListId != $card->list_id) {
            $listName = $card->list->name;
            $this->logActivity($card->id, "moved card to list: {$listName}");
        }
        
        return $card->load('tags', 'members');
    }

    public function destroy(Card $card)
    {
        $card->delete();
        return response()->noContent();
    }

    // Tags
    public function attachTag(Request $request, Card $card)
    {
        $data = $request->validate(['tag_id' => 'required|exists:tags,id']);
        $card->tags()->syncWithoutDetaching([$data['tag_id']]);
        return $card->load('tags');
    }

    public function detachTag(Card $card, int $tagId)
    {
        $card->tags()->detach($tagId);
        return $card->load('tags');
    }

    // Members
    public function assignMember(Request $request, Card $card)
    {
        $data = $request->validate(['member_id' => 'required|exists:members,id']);
        $card->members()->syncWithoutDetaching([$data['member_id']]);
        
        $member = \App\Models\Member::find($data['member_id']);
        if ($member) {
            $this->logActivity($card->id, "assigned member: {$member->name}", $member->id);
            if ($member->email) {
                try {
                    \Illuminate\Support\Facades\Mail::to($member->email)->send(new \App\Mail\CardAssigned($card, $member));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send mail: " . $e->getMessage());
                }
            }
        }
        
        return $card->load('members');
    }

    public function unassignMember(Card $card, int $memberId)
    {
        $card->members()->detach($memberId);
        
        $member = \App\Models\Member::find($memberId);
        if ($member) {
            $this->logActivity($card->id, "unassigned member: {$member->name}", $memberId);
        }
        
        return $card->load('members');
    }

    protected function logActivity($cardId, $content, $memberId = null, $type = 'activity')
    {
        \App\Models\CardActivity::create([
            'card_id' => $cardId,
            'member_id' => $memberId,
            'type' => $type,
            'content' => $content,
        ]);
    }
}
