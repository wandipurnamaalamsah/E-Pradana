<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EnsureVoterSession
{
    /**
     * Handle an incoming request.
     * Pastikan hanya voter dengan sesi aktif dan valid di database yang bisa mengakses bilik suara.
     * Jika tidak ada sesi atau hak suara sudah digunakan, cegah penerobosan dan direct ke halaman login.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $vt = $request->query('vt') ?? $request->input('vt') ?? $request->header('X-Voter-Token');
        $voterSessions = $request->session()->get('voter_sessions', []);

        $hasSpecificSession = $vt && isset($voterSessions[$vt]);
        $hasDefaultSession = $request->session()->has('voter_id');

        if (!$hasSpecificSession && !$hasDefaultSession) {
            return redirect()->route('login')
                ->with('error', 'Akses ditolak. Silakan masukkan username dan token di halaman login terlebih dahulu.');
        }

        // Tentukan ID voter dan status just_voted
        if ($hasSpecificSession) {
            $voterId = $voterSessions[$vt]['voter_id'] ?? null;
            $justVoted = (bool) ($voterSessions[$vt]['just_voted'] ?? false);
        } else {
            $voterId = $request->session()->get('voter_id');
            $justVoted = (bool) $request->session()->get('just_voted', false);
        }

        if (!$voterId) {
            return redirect()->route('login')
                ->with('error', 'Sesi bilik suara Anda tidak valid. Silakan login kembali.');
        }

        // Validasi ke database untuk memastikan akun masih ada & belum digunakan
        $voter = DB::table('voters')->where('id', $voterId)->first();

        if (!$voter) {
            if ($vt && isset($voterSessions[$vt])) {
                unset($voterSessions[$vt]);
                $request->session()->put('voter_sessions', $voterSessions);
            }
            $request->session()->forget(['voter_id', 'voter_username', 'voter_name', 'voter_class', 'just_voted', 'active_voter_session']);

            return redirect()->route('login')
                ->with('error', 'Data akun pemilih tidak ditemukan atau telah dihapus oleh panitia.');
        }

        // Jika pemilih sudah mencoblos dan bukan dalam sesi konfirmasi sesaat setelah submit (just_voted)
        if ($voter->has_voted && !$justVoted) {
            if ($vt && isset($voterSessions[$vt])) {
                unset($voterSessions[$vt]);
                $request->session()->put('voter_sessions', $voterSessions);
            }
            $request->session()->forget(['voter_id', 'voter_username', 'voter_name', 'voter_class', 'just_voted', 'active_voter_session']);

            return redirect()->route('login')
                ->with('error', 'Hak suara akun ini sudah digunakan. Sesi bilik suara telah berakhir.');
        }

        return $next($request);
    }
}
