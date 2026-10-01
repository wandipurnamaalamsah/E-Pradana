<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $actionFilter = $request->input('action');

        $query = DB::table('audit_logs')
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
            ->select(
                'audit_logs.id',
                'audit_logs.user_id',
                'audit_logs.action',
                'audit_logs.meta',
                'audit_logs.created_at',
                'users.name as user_name',
                'users.username as user_username'
            )
            ->orderBy('audit_logs.created_at', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('audit_logs.action', 'like', "%{$search}%")
                  ->orWhere('audit_logs.meta', 'like', "%{$search}%")
                  ->orWhere('users.name', 'like', "%{$search}%")
                  ->orWhere('users.username', 'like', "%{$search}%");
            });
        }

        if (!empty($actionFilter)) {
            $query->where('audit_logs.action', $actionFilter);
        }

        // Tampilkan 10 aktivitas terakhir per halaman
        $logs = $query->paginate(10)->withQueryString();

        // Transform meta JSON to array if string
        $logs->getCollection()->transform(function ($item) {
            if (is_string($item->meta)) {
                $item->meta = json_decode($item->meta, true);
            }
            return $item;
        });

        // Daftar aksi yang umum untuk filter
        $availableActions = [
            'open_election' => 'Buka Pemilihan',
            'force_open' => 'Buka Paksa (Manual)',
            'close_election' => 'Tutup Pemilihan',
            'force_close' => 'Tutup Paksa (Manual)',
            'reveal' => 'Buka Hasil (Reveal)',
            'announce_winner' => 'Umumkan Pemenang',
            'add_voter' => 'Tambah Pemilih DPT',
            'import_dpt' => 'Impor DPT Massal',
            'reset_token' => 'Reset Token Pemilih',
            'reset_voter_status' => 'Reset Status Pemilih',
            'reset_dpt_status' => 'Reset Status DPT Massal',
            'reset_all_tokens' => 'Acak Ulang Seluruh Token',
            'update_schedule' => 'Ubah Jadwal',
            'update_settings' => 'Ubah Pengaturan',
            'reset_database' => 'Reset Database',
            'reset_election' => 'Reset Sesi Pemilihan',
        ];

        $totalLogs = DB::table('audit_logs')->count();
        $todayLogs = DB::table('audit_logs')->whereDate('created_at', today())->count();

        return Inertia::render('admin/audit-log', [
            'logs' => $logs,
            'filters' => [
                'search' => $search ?? '',
                'action' => $actionFilter ?? '',
            ],
            'stats' => [
                'total' => $totalLogs,
                'today' => $todayLogs,
            ],
            'available_actions' => $availableActions,
        ]);
    }

    public function destroy(int $id): RedirectResponse
    {
        $log = DB::table('audit_logs')->where('id', $id)->first();
        if (!$log) {
            return back()->with('error', 'Log aktivitas tidak ditemukan!');
        }

        DB::table('audit_logs')->where('id', $id)->delete();

        return back()->with('success', 'Catatan rekam jejak audit log berhasil dihapus!');
    }

    public function destroyAll(): RedirectResponse
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('audit_logs')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        return back()->with('success', 'Seluruh rekam jejak audit log berhasil dibersihkan!');
    }
}
