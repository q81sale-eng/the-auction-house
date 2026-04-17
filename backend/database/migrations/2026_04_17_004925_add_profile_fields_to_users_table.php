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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('avatar')->nullable()->after('phone');
            $table->string('country')->nullable()->after('avatar');
            $table->text('bio')->nullable()->after('country');
            $table->boolean('is_admin')->default(false)->after('bio');
            $table->boolean('is_verified')->default(false)->after('is_admin');
            $table->decimal('deposit_balance', 12, 2)->default(0)->after('is_verified');
            $table->timestamp('last_login_at')->nullable()->after('deposit_balance');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'avatar', 'country', 'bio', 'is_admin', 'is_verified', 'deposit_balance', 'last_login_at']);
        });
    }
};
