<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\DptController;
use App\Http\Controllers\Admin\KandidatController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\PengaturanController;

use App\Http\Controllers\Auth\UnifiedAuthController;
use App\Http\Controllers\Voter\VoterDashboardController;

// Root redirect
Route::get('/', function (\Illuminate\Http\Request $request) {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    
    $vt = $request->session()->get('active_voter_session');
    $voterSessions = $request->session()->get('voter_sessions', []);
    $voterId = null;
    $justVoted = false;

    if ($vt && isset($voterSessions[$vt])) {
        $voterId = $voterSessions[$vt]['voter_id'] ?? null;
        $justVoted = (bool) ($voterSessions[$vt]['just_voted'] ?? false);
    } elseif ($request->session()->has('voter_id')) {
        $voterId = $request->session()->get('voter_id');
        $justVoted = (bool) $request->session()->get('just_voted', false);
    }

    if ($voterId) {
        $voter = \Illuminate\Support\Facades\DB::table('voters')->where('id', $voterId)->first();
        if ($voter && (!$voter->has_voted || $justVoted)) {
            return redirect()->route('voter.dashboard', $vt ? ['vt' => $vt] : []);
        }
    }

    return redirect()->route('login');
})->name('home');

// Form Login Terpadu (Satu form dengan deteksi otomatis role Voter / Admin)
Route::get('/login', [UnifiedAuthController::class, 'showLogin'])->name('login');
Route::post('/login', [UnifiedAuthController::class, 'login'])->name('login.store');

// Logout khusus Admin
Route::post('/logout', function (\Illuminate\Http\Request $request) {
    Auth::guard('web')->logout();
    return redirect()->route('login')->with('success', 'Anda telah berhasil keluar dari akun Admin.');
})->name('logout');

// Alias / Redirect untuk voter login & logout khusus Voter (hanya hapus session voter tanpa logout admin)
Route::get('/voter/login', fn() => redirect()->route('login', ['voter' => 1]))->name('voter.login');
Route::post('/voter/login', [UnifiedAuthController::class, 'login']);
Route::post('/voter/logout', function (\Illuminate\Http\Request $request) {
    $vt = $request->input('vt') ?? $request->query('vt');
    $voterSessions = $request->session()->get('voter_sessions', []);

    if ($vt && isset($voterSessions[$vt])) {
        unset($voterSessions[$vt]);
        $request->session()->put('voter_sessions', $voterSessions);
    }

    // Jika yang logout adalah active_voter_session, atau tidak ada token spesifik, atau sudah kosong
    if (!$vt || $request->session()->get('active_voter_session') === $vt || empty($voterSessions)) {
        $request->session()->forget(['voter_id', 'voter_username', 'voter_name', 'voter_class', 'just_voted', 'active_voter_session']);
    }

    // Jangan panggil $request->session()->invalidate() agar sesi Admin tidak ikut terhapus!
    return redirect()->route('login', ['voter' => 1])->with('status', 'Anda telah berhasil keluar dari bilik suara.');
})->name('voter.logout');

// Bilik Suara / Dashboard Pemilih (Memerlukan Sesi Pemilih Aktif)
Route::middleware(['voter.session'])->group(function () {
    Route::get('/voter/dashboard', [VoterDashboardController::class, 'index'])->name('voter.dashboard');
    Route::post('/voter/vote', [VoterDashboardController::class, 'vote'])->name('voter.vote');
});

Route::middleware(['auth'])->group(function () {
    // Dashboard & Election Control
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/admin/election/status', [DashboardController::class, 'updateStatus'])->name('admin.election.status');
    Route::post('/admin/election/reveal', [DashboardController::class, 'toggleReveal'])->name('admin.election.reveal');
    Route::post('/admin/election/announce', [DashboardController::class, 'announceWinner'])->name('admin.election.announce');
    Route::post('/admin/election/reset', [DashboardController::class, 'resetElection'])->name('admin.election.reset');

    // Manajemen DPT
    Route::get('/admin/dpt', [DptController::class, 'index'])->name('admin.dpt');
    Route::post('/admin/dpt', [DptController::class, 'store'])->name('admin.dpt.store');
    Route::put('/admin/dpt/{id}', [DptController::class, 'update'])->name('admin.dpt.update');
    Route::post('/admin/dpt/{id}/reset-token', [DptController::class, 'resetToken'])->name('admin.dpt.reset-token');
    Route::delete('/admin/dpt/{id}', [DptController::class, 'destroy'])->name('admin.dpt.destroy');
    Route::delete('/admin/dpt', [DptController::class, 'destroyAll'])->name('admin.dpt.destroy-all');
    Route::post('/admin/dpt/import', [DptController::class, 'importCsv'])->name('admin.dpt.import');

    // Manajemen Kandidat
    Route::get('/admin/kandidat', [KandidatController::class, 'index'])->name('admin.kandidat');
    Route::post('/admin/kandidat', [KandidatController::class, 'store'])->name('admin.kandidat.store');
    Route::post('/admin/kandidat/{id}', [KandidatController::class, 'update'])->name('admin.kandidat.update');
    Route::delete('/admin/kandidat/{id}', [KandidatController::class, 'destroy'])->name('admin.kandidat.destroy');

    // Audit Log
    Route::get('/admin/audit-log', [AuditLogController::class, 'index'])->name('admin.audit-log');

    // Pengaturan
    Route::get('/admin/pengaturan', [PengaturanController::class, 'index'])->name('admin.pengaturan');
    Route::post('/admin/pengaturan/schedule', [PengaturanController::class, 'updateSchedule'])->name('admin.pengaturan.schedule');
    Route::post('/admin/pengaturan/status', [PengaturanController::class, 'updateStatus'])->name('admin.pengaturan.status');
    Route::post('/admin/pengaturan/account', [PengaturanController::class, 'updateAccount'])->name('admin.pengaturan.account');
    Route::post('/admin/pengaturan/reset', [PengaturanController::class, 'resetDatabase'])->name('admin.pengaturan.reset');
});

require __DIR__.'/settings.php';
