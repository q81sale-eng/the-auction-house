<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuctionController;
use App\Http\Controllers\Api\MarketplaceController;
use App\Http\Controllers\Api\VaultController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\DepositController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\WatchController as AdminWatchController;
use App\Http\Controllers\Api\Admin\AuctionController as AdminAuctionController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Admin\ValuationController as AdminValuationController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Public auction browse
Route::get('/auctions', [AuctionController::class, 'index']);
Route::get('/auctions/{slug}', [AuctionController::class, 'show']);
Route::get('/auctions/{auction}/bids', [AuctionController::class, 'bidHistory']);

// Public marketplace browse
Route::get('/marketplace', [MarketplaceController::class, 'index']);
Route::get('/marketplace/{slug}', [MarketplaceController::class, 'show']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Bidding
    Route::post('/auctions/{auction}/bid', [AuctionController::class, 'bid']);
    Route::post('/auctions/{auction}/buy-now', [AuctionController::class, 'buyNow']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::get('/profile/favorites', [ProfileController::class, 'favorites']);
    Route::get('/profile/bids', [ProfileController::class, 'bids']);

    // Favorites
    Route::post('/favorites/toggle', [FavoriteController::class, 'toggle']);

    // Deposits
    Route::get('/deposits', [DepositController::class, 'index']);
    Route::post('/deposits/deposit', [DepositController::class, 'deposit']);
    Route::post('/deposits/withdraw', [DepositController::class, 'withdraw']);

    // Watch Vault
    Route::apiResource('/vault', VaultController::class);
});

// Admin routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::apiResource('/watches', AdminWatchController::class);
    Route::apiResource('/auctions', AdminAuctionController::class);
    Route::apiResource('/users', AdminUserController::class);
    Route::apiResource('/valuations', AdminValuationController::class);
});

