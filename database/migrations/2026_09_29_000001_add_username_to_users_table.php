<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tambah kolom username ke tabel users dan isi dengan nilai dari email.
     */
    public function up(): void
    {
        // Tambah kolom jika belum ada
        if (!Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('username')->nullable()->after('name');
            });
        }

        // Isi username dari nilai email yang sudah ada
        DB::table('users')->whereNull('username')->update([
            'username' => DB::raw('`email`'),
        ]);

        // Pastikan username tidak null
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable(false)->change();
        });

        // Tambah unique index jika belum ada
        $indexes = DB::select("SHOW INDEX FROM `users` WHERE Key_name = 'users_username_unique'");
        if (empty($indexes)) {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('username');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('username');
        });
    }
};
