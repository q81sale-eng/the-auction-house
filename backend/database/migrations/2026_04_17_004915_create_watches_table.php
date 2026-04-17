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
        Schema::create('watches', function (Blueprint $table) {
            $table->id();
            $table->string('brand');
            $table->string('model');
            $table->string('reference_number')->nullable();
            $table->integer('year')->nullable();
            $table->string('movement')->nullable(); // automatic, manual, quartz
            $table->string('case_material')->nullable();
            $table->string('bracelet_material')->nullable();
            $table->decimal('case_diameter', 5, 1)->nullable();
            $table->string('dial_color')->nullable();
            $table->string('condition'); // new, excellent, good, fair
            $table->text('description')->nullable();
            $table->string('serial_number')->nullable();
            $table->boolean('has_box')->default(false);
            $table->boolean('has_papers')->default(false);
            $table->string('water_resistance')->nullable();
            $table->string('power_reserve')->nullable();
            $table->string('complications')->nullable();
            $table->string('slug')->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('watches');
    }
};
