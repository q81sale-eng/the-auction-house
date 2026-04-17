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
        Schema::create('vault_watches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('watch_id')->constrained()->cascadeOnDelete();
            $table->decimal('purchase_price', 12, 2);
            $table->decimal('current_value', 12, 2)->nullable();
            $table->date('purchased_at');
            $table->string('purchase_source')->nullable(); // auction, marketplace, external
            $table->text('notes')->nullable();
            $table->boolean('is_private')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vault_watches');
    }
};
