<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PengaturanController extends Controller
{
    public function index(): Response
    {
        $settings = DB::table('settings')->first();
        if (!$settings) {
            DB::table('settings')->insert([
                'id' => 1,
                'status' => 'draft',
                'schedule_enabled' => 0,
                'manual_override' => 0,
                'results_revealed' => 0,
                'allow_blank' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $settings = DB::table('settings')->first();
        }

        $admin = Auth::user();

        // Hitung data untuk peringatan zona bahaya
        $votersCount = DB::table('voters')->count();
        $candidatesCount = DB::table('candidates')->count();
        $votesCount = DB::table('votes')->count();

        return Inertia::render('admin/pengaturan', [
            'settings' => [
                'status' => $settings->status ?? 'draft',
                'start_at' => $settings->start_at ? date('Y-m-d\TH:i', strtotime($settings->start_at)) : '',
                'end_at' => $settings->end_at ? date('Y-m-d\TH:i', strtotime($settings->end_at)) : '',
                'schedule_enabled' => (bool) ($settings->schedule_enabled ?? false),
                'manual_override' => (bool) ($settings->manual_override ?? false),
                'results_revealed' => (bool) ($settings->results_revealed ?? false),
                'allow_blank' => (bool) ($settings->allow_blank ?? false),
            ],
            'admin_user' => [
                'id' => $admin?->id,
                'name' => $admin?->name ?? 'Admin Panitia',
                'username' => $admin?->username ?? 'admin',
                'email' => $admin?->email ?? '',
            ],
            'counts' => [
                'voters' => $votersCount,
                'candidates' => $candidatesCount,
                'votes' => $votesCount,
            ],
        ]);
    }

    public function updateSchedule(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date',
            'schedule_enabled' => 'nullable|boolean',
        ]);

        DB::table('settings')->where('id', 1)->update([
            'start_at' => $validated['start_at'] ?? null,
            'end_at' => $validated['end_at'] ?? null,
            'schedule_enabled' => $request->boolean('schedule_enabled') ? 1 : 0,
            'updated_at' => now(),
        ]);

        DB::table('audit_logs')->insert([
            'user_id' => Auth::id(),
            'action' => 'update_schedule',
            'meta' => json_encode([
                'start_at' => $validated['start_at'] ?? null,
                'end_at' => $validated['end_at'] ?? null,
                'schedule_enabled' => $request->boolean('schedule_enabled'),
                'by' => Auth::user()?->name ?? 'Admin',
            ]),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Konfigurasi jadwal pemilihan berhasil disimpan!');
    }

    public function updateStatus(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,rehearsal,open,closed',
        ]);

        $newStatus = $validated['status'];

        DB::table('settings')->where('id', 1)->update([
            'status' => $newStatus,
            'updated_at' => now(),
        ]);

        $action = match ($newStatus) {
            'open' => 'force_open',
            'closed' => 'force_close',
            default => 'update_settings',
        };

        DB::table('audit_logs')->insert([
            'user_id' => Auth::id(),
            'action' => $action,
            'meta' => json_encode([
                'new_status' => $newStatus,
                'by' => Auth::user()?->name ?? 'Admin',
            ]),
            'created_at' => now(),
        ]);

        return back()->with('success', "Master control berhasil mengubah status menjadi: " . strtoupper($newStatus));
    }

    public function updateAccount(Request $request): RedirectResponse
    {
        $admin = Auth::user();
        $adminId = $admin?->id ?? 1;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => "required|string|max:100|unique:users,username,{$adminId}",
            'password' => 'nullable|string|min:6',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'username' => $validated['username'],
            'updated_at' => now(),
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        DB::table('users')->where('id', $adminId)->update($updateData);

        DB::table('audit_logs')->insert([
            'user_id' => $adminId,
            'action' => 'update_settings',
            'meta' => json_encode([
                'note' => 'Pembaruan kredensial akun panitia',
                'username' => $validated['username'],
                'password_changed' => !empty($validated['password']),
            ]),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Profil dan kredensial akun panitia berhasil diperbarui!');
    }

    public function resetDatabase(Request $request): RedirectResponse
    {
        $request->validate([
            'confirm_text' => 'required|in:RESET',
        ]);

        $settings = DB::table('settings')->first();
        if ($settings && $settings->status === 'open') {
            return back()->with('error', 'Reset database tidak dapat dilakukan saat pemilihan sedang Open!');
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('votes')->truncate();
        DB::table('candidates')->truncate();
        DB::table('voters')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        DB::table('settings')->where('id', 1)->update([
            'status' => 'draft',
            'start_at' => null,
            'end_at' => null,
            'schedule_enabled' => 0,
            'results_revealed' => 0,
            'updated_at' => now(),
        ]);

        DB::table('audit_logs')->insert([
            'user_id' => Auth::id(),
            'action' => 'reset_database',
            'meta' => json_encode([
                'by' => Auth::user()?->name ?? 'Admin',
                'timestamp' => now()->toIso8601String(),
            ]),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Seluruh data pemilihan (suara, kandidat, DPT) berhasil direset!');
    }
}
