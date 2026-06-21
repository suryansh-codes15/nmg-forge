<?php

namespace App\Mail;

use App\Models\Card;
use App\Models\Member;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CardAssigned extends Mailable
{
    use Queueable, SerializesModels;

    public Card $card;
    public Member $member;

    public function __construct(Card $card, Member $member)
    {
        $this->card = $card;
        $this->member = $member;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You have been assigned to card: {$this->card->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.card_assigned',
        );
    }
}
