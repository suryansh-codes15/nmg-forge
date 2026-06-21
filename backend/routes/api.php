<?php

use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\ListController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\TagController;
use Illuminate\Support\Facades\Route;

// Boards
Route::get('/boards', [BoardController::class, 'index']);
Route::post('/boards', [BoardController::class, 'store']);
Route::get('/boards/{board}', [BoardController::class, 'show']);
Route::delete('/boards/{board}', [BoardController::class, 'destroy']);

// Lists (nested under a board for creation)
Route::post('/boards/{board}/lists', [ListController::class, 'store']);
Route::put('/lists/{list}', [ListController::class, 'update']);
Route::delete('/lists/{list}', [ListController::class, 'destroy']);

// Cards (nested under a list for creation)
Route::post('/lists/{list}/cards', [CardController::class, 'store']);
Route::put('/cards/{card}', [CardController::class, 'update']);
Route::patch('/cards/{card}/move', [CardController::class, 'move']);
Route::delete('/cards/{card}', [CardController::class, 'destroy']);

// Comments & Activities
Route::get('/cards/{card}/activities', [\App\Http\Controllers\Api\CardActivityController::class, 'index']);
Route::post('/cards/{card}/comments', [\App\Http\Controllers\Api\CardActivityController::class, 'storeComment']);

// Card <-> Tag
Route::post('/cards/{card}/tags', [CardController::class, 'attachTag']);
Route::delete('/cards/{card}/tags/{tagId}', [CardController::class, 'detachTag']);

// Card <-> Member
Route::post('/cards/{card}/members', [CardController::class, 'assignMember']);
Route::delete('/cards/{card}/members/{memberId}', [CardController::class, 'unassignMember']);

// Tags & Members (top-level)
Route::get('/tags', [TagController::class, 'index']);
Route::post('/tags', [TagController::class, 'store']);
Route::get('/members', [MemberController::class, 'index']);
Route::post('/members', [MemberController::class, 'store']);
