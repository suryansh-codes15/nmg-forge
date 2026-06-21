<h3>Hello {{ $member->name }},</h3>
<p>You have been assigned to the card: <strong>{{ $card->title }}</strong></p>
@if($card->description)
<p>Description: {{ $card->description }}</p>
@endif
