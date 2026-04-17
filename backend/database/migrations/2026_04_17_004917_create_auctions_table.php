<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('auctions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('watch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('starting_price', 12, 2);
            $table->decimal('reserve_price', 12, 2)->nullable();
            $table->decimal('current_bid', 12, 2)->nullable();
            $table->decimal('buy_now_price', 12, 2)->nullable();
            $table->decimal('bid_increment', 10, 2)->default(50);
            $table->decimal('deposit_required', 10, 2)->default(0);
            $table->foreignId('winning_bidder_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->boolean('auto_extend')->default(true);
            $table->integer('extend_minutes')->default(5);
            $table->string('status')->default('upcoming'); // upcoming, live, ended, cancelled, sold
            $table->string('slug')->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auctions');
    }
};
