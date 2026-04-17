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
        Schema::create('marketplace_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('watch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->string('status')->default('active'); // active, sold, withdrawn
            $table->boolean('negotiable')->default(false);
            $table->string('slug')->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_listings');
    }
};
