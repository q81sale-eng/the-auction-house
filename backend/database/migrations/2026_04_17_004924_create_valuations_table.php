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
        Schema::create('valuations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('watch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('estimated_value', 12, 2);
            $table->decimal('low_estimate', 12, 2)->nullable();
            $table->decimal('high_estimate', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->date('valuation_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('valuations');
    }
};
