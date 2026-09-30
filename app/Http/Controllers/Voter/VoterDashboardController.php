<?php

namespace App\Http\Controllers\Voter;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class VoterDashboardController extends Controller
{
    /**
     * Dashboard / Bilik Suara Pemilih.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $vt = $request->query('vt') ?? $request->input('vt') ?? $request->header('X-Voter-Token');
        $voterSessions = $request->session()->get('voter_sessions', []);

        if ($vt && isset($voterSessions[$vt])) {
            $sessionData = $voterSessions[$vt];
            $voterId = $sessionData['voter_id'];
            $justVoted = (bool) ($sessionData['just_voted'] ?? false);
        } elseif ($request->session()->has('voter_id')) {
            $voterId = $request->session()->get('voter_id');
            $justVoted = (bool) $request->session()->get('just_voted', false);
            $vt = $request->session()->get('active_voter_session');
        } else {
            return redirect()->route('login')->with('error', 'Sesi bilik suara tidak ditemukan atau telah kedaluwarsa. Silakan masuk kembali.');
        }

        $voter = DB::table('voters')->where('id', $voterId)->first();

        if (!$voter) {
            if ($vt && isset($voterSessions[$vt])) {
                unset($voterSessions[$vt]);
                $request->session()->put('voter_sessions', $voterSessions);
            }
            $request->session()->forget(['voter_id', 'voter_username', 'voter_name', 'voter_class', 'just_voted', 'active_voter_session']);
            return redirect()->route('login')->with('error', 'Sesi Anda telah kedaluwarsa atau akun tidak ditemukan. Silakan masuk kembali.');
        }

        // Jika pemilih sudah memilih dan bukan dalam status baru saja submit di sesi ini
        if ($voter->has_voted && !$justVoted) {
            if ($vt && isset($voterSessions[$vt])) {
                unset($voterSessions[$vt]);
                $request->session()->put('voter_sessions', $voterSessions);
            }
            $request->session()->forget(['voter_id', 'voter_username', 'voter_name', 'voter_class', 'just_voted', 'active_voter_session']);
            return redirect()->route('login')->with('error', 'Maaf, token dan hak suara Anda sudah digunakan.');
        }

        $settings = DB::table('settings')->first();
        if (!$settings) {
            $status = 'draft';
            $allowBlank = false;
        } else {
            $status = $settings->status ?? 'draft';
            $allowBlank = (bool) ($settings->allow_blank ?? false);
        }

        // Ambil Kandidat Putra
        $candidatesPutra = DB::table('candidates')
            ->where('category', 'putra')
            ->where('is_blank', 0)
            ->orderBy('candidate_number', 'asc')
            ->select('id', 'candidate_number', 'name', 'class', 'vision', 'mission', 'photo_url')
            ->get();

        // Ambil Kandidat Putri
        $candidatesPutri = DB::table('candidates')
            ->where('category', 'putri')
            ->where('is_blank', 0)
            ->orderBy('candidate_number', 'asc')
            ->select('id', 'candidate_number', 'name', 'class', 'vision', 'mission', 'photo_url')
            ->get();

        return Inertia::render('voter/dashboard', [
            'voter' => [
                'id' => (int) $voter->id,
                'name' => $voter->name,
                'class' => $voter->class,
                'username' => $voter->username,
                'has_voted' => (bool) $voter->has_voted,
            ],
            'election_status' => $status,
            'allow_blank' => $allowBlank,
            'candidates_putra' => $candidatesPutra,
            'candidates_putri' => $candidatesPutri,
            'just_voted' => $justVoted,
            'voter_token' => $vt,
        ]);
    }

    /**
     * Kirim Suara Pemilih ke Kotak Suara Digital.
     */
    public function vote(Request $request): RedirectResponse
    {
        $vt = $request->input('vt') ?? $request->query('vt') ?? $request->header('X-Voter-Token');
        $voterSessions = $request->session()->get('voter_sessions', []);

        if ($vt && isset($voterSessions[$vt])) {
            $voterId = $voterSessions[$vt]['voter_id'];
        } else {
            $voterId = $request->session()->get('voter_id');
            $vt = $request->session()->get('active_voter_session');
        }

        $voter = DB::table('voters')->where('id', $voterId)->first();

        if (!$voter) {
            return redirect()->route('login')->with('error', 'Sesi bilik suara tidak ditemukan. Silakan masuk kembali.');
        }

        if ($voter->has_voted) {
            return back()->with('error', 'Anda telah menggunakan hak suara Anda sebelumnya. Setiap pemilih hanya dapat memilih satu kali.');
        }

        $settings = DB::table('settings')->first();
        $status = $settings->status ?? 'draft';
        if ($status !== 'open') {
            return back()->with('error', 'Pemilihan belum dibuka atau saat ini sedang ditutup oleh panitia.');
        }

        $allowBlank = (bool) ($settings->allow_blank ?? false);

        $rules = [
            'candidate_putra_id' => $allowBlank ? 'nullable|integer' : 'required|integer',
            'candidate_putri_id' => $allowBlank ? 'nullable|integer' : 'required|integer',
        ];

        $validated = $request->validate($rules, [
            'candidate_putra_id.required' => 'Silakan pilih salah satu calon Pradana Putra.',
            'candidate_putri_id.required' => 'Silakan pilih salah satu calon Pradana Putri.',
        ]);

        $putraId = $validated['candidate_putra_id'] ?? null;
        $putriId = $validated['candidate_putri_id'] ?? null;

        // Validasi kebenaran ID kandidat jika diisi
        if ($putraId) {
            $validPutra = DB::table('candidates')
                ->where('id', $putraId)
                ->where('category', 'putra')
                ->exists();
            if (!$validPutra) {
                return back()->with('error', 'Pilihan calon Pradana Putra tidak valid.');
            }
        }

        if ($putriId) {
            $validPutri = DB::table('candidates')
                ->where('id', $putriId)
                ->where('category', 'putri')
                ->exists();
            if (!$validPutri) {
                return back()->with('error', 'Pilihan calon Pradana Putri tidak valid.');
            }
        }

        try {
            DB::transaction(function () use ($voterId, $putraId, $putriId) {
                $lockedVoter = DB::table('voters')
                    ->where('id', $voterId)
                    ->lockForUpdate()
                    ->first();

                if ($lockedVoter->has_voted) {
                    throw new \RuntimeException('Hak suara sudah digunakan!');
                }

                // Masukkan surat suara secara rahasia (tanpa menyimpan ID pemilih di tabel votes)
                DB::table('votes')->insert([
                    'id' => (string) Str::uuid(),
                    'candidate_putra_id' => $putraId,
                    'candidate_putri_id' => $putriId,
                ]);

                // Tandai pemilih telah selesai memilih
                DB::table('voters')->where('id', $voterId)->update([
                    'has_voted' => 1,
                ]);
            });

            // Set session just_voted agar pemilih melihat notifikasi & tombol simpan dan logout
            if ($vt && isset($voterSessions[$vt])) {
                $voterSessions[$vt]['just_voted'] = true;
                $request->session()->put('voter_sessions', $voterSessions);
            }
            $request->session()->put('just_voted', true);

            return redirect()->route('voter.dashboard', $vt ? ['vt' => $vt] : [])
                ->with('success', 'Jawaban Anda telah berhasil masuk dan disimpan ke kotak suara!');
        } catch (\Throwable $e) {
            return back()->with('error', 'Terjadi kesalahan saat memproses suara: ' . $e->getMessage());
        }
    }
}
