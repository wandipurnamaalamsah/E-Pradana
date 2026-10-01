<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Buat atau perbarui akun Administrator
        $username = env('ADMIN_USERNAME', 'admin');
        $password = env('ADMIN_PASSWORD', 'admin123');
        $email = env('ADMIN_EMAIL', 'admin@epradana.com');
        $name = env('ADMIN_NAME', 'Administrator');

        User::updateOrCreate(
            ['username' => $username],
            [
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
            ]
        );

        // 2. Inisialisasi pengaturan default jika belum ada
        if (!DB::table('settings')->where('id', 1)->exists()) {
            DB::table('settings')->insert([
                'id' => 1,
                'status' => 'draft',
                'schedule_enabled' => 0,
                'manual_override' => 0,
                'results_revealed' => 0,
                'allow_blank' => 0,
                'updated_at' => now(),
            ]);
        }
    }
}
