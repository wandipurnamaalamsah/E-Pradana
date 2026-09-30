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
        if (!Schema::hasColumn('voters', 'token')) {
            Schema::table('voters', function (Blueprint $table) {
                $table->string('token', 20)->nullable()->after('username');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('voters', 'token')) {
            Schema::table('voters', function (Blueprint $table) {
                $table->dropColumn('token');
            });
        }
    }
};
