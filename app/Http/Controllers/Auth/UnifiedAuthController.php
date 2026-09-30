<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class UnifiedAuthController extends Controller
{
    /**
     * Tampilkan halaman login terpadu.
     * Jika Admin sudah login → redirect ke dashboard admin.
     * Jika Voter sudah punya sesi aktif → redirect ke dashboard voter.
     */
    public function showLogin(Request $request): Response|RedirectResponse
    {
        // ── Guard: Admin sudah terautentikasi ──
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        // ── Guard: Voter sudah punya sesi aktif ──
        $vt = $request->query('vt') ?? $request->session()->get('active_voter_session');
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
            $voter = DB::table('voters')->where('id', $voterId)->first();
            if ($voter && (!$voter->has_voted || $justVoted)) {
                return redirect()->route('voter.dashboard', $vt ? ['vt' => $vt] : []);
            }

            // Jika akun tidak valid atau sudah memilih, bersihkan sesi agar tidak terjadi redirect loop
            if ($vt && isset($voterSessions[$vt])) {
                unset($voterSessions[$vt]);
                $request->session()->put('voter_sessions', $voterSessions);
            }
            $request->session()->forget(['voter_id', 'voter_username', 'voter_name', 'voter_class', 'just_voted', 'active_voter_session']);
        }

        $settings = DB::table('settings')->first();
        $status = $settings->status ?? 'draft';

        return Inertia::render('auth/login', [
            'election_status' => $status,
            'status' => session('status') ?? session('success'),
        ]);
    }

    /**
     * Proses autentikasi otomatis dari SATU form tunggal:
     * - Jika password admin yang cocok → Redirect ke Dashboard Admin
     * - Jika token voter yang cocok → Redirect ke Dashboard Voter
     */
    public function login(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ], [
            'username.required' => 'Silakan masukkan username Anda.',
            'password.required' => 'Silakan masukkan token akses Anda.',
        ]);

        $username = trim($validated['username']);
        $secret = trim($validated['password']);
        $remember = $request->boolean('remember');

        // ── 1. CEK AUTENTIKASI ADMIN TERLEBIH DAHULU (Silent redirect) ──
        $adminUser = DB::table('users')->where('username', $username)->first();
        if ($adminUser && Hash::check($secret, $adminUser->password)) {
            Auth::guard('web')->loginUsingId($adminUser->id, $remember);
            $request->session()->regenerate();

            return redirect()->intended('/dashboard')->with('success', 'Selamat datang kembali di Panel Admin!');
        }

        // ── 2. CEK AUTENTIKASI VOTER (DPT) DENGAN TOKEN ──
        $voter = DB::table('voters')->where('username', $username)->first();
        if ($voter) {
            $inputToken = strtoupper($secret);
            $tokenHash = hash('sha256', $inputToken);

            $isTokenValid = (!empty($voter->token) && strtoupper($voter->token) === $inputToken) 
                         || (!empty($voter->token_hash) && $voter->token_hash === $tokenHash);

            if ($isTokenValid) {
                // Cek apakah token sudah digunakan
                if ($voter->has_voted) {
                    return back()
                        ->withErrors(['password' => 'Maaf, token ini sudah digunakan dan sudah kedaluwarsa.'])
                        ->withInput($request->only('username'));
                }

                // Generate token unik sesi pemilih per tab / per login
                $voterSessionKey = 'vtok_' . Str::random(24);
                $voterSessions = $request->session()->get('voter_sessions', []);
                $voterSessions[$voterSessionKey] = [
                    'voter_id' => $voter->id,
                    'voter_username' => $voter->username,
                    'voter_name' => $voter->name,
                    'voter_class' => $voter->class,
                    'just_voted' => false,
                ];
                $request->session()->put('voter_sessions', $voterSessions);

                // Fallback default sesi pemilih
                $request->session()->put('voter_id', $voter->id);
                $request->session()->put('voter_username', $voter->username);
                $request->session()->put('voter_name', $voter->name);
                $request->session()->put('voter_class', $voter->class);
                $request->session()->put('active_voter_session', $voterSessionKey);

                return redirect()->route('voter.dashboard', ['vt' => $voterSessionKey])
                    ->with('success', "Selamat datang di Bilik Suara, {$voter->name}!");
            }
        }

        // ── 3. JIKA DUA-DUANYA TIDAK COCOK (Pesan ramah & rahasia bagi pemilih) ──
        if ($adminUser && !$voter) {
            return back()
                ->withErrors(['password' => 'Kata sandi / token akses salah. Silakan periksa kembali.'])
                ->withInput($request->only('username'));
        }

        if (!$adminUser && $voter) {
            return back()
                ->withErrors(['password' => 'Token akses salah atau tidak cocok dengan username Anda.'])
                ->withInput($request->only('username'));
        }

        return back()
            ->withErrors(['password' => 'Username tidak ditemukan atau token akses tidak sesuai.'])
            ->withInput($request->only('username'));
    }
}
