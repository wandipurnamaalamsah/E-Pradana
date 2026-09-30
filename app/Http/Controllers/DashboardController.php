<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
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

        $status = $settings->status ?? 'draft';
        $resultsRevealed = (bool) ($settings->results_revealed ?? false);

        // 1. Elemen Angka & Persentase (Statistik Cepat)
        $totalDpt = DB::table('voters')->count();
        $sudahMemilih = DB::table('voters')->where('has_voted', 1)->count();
        $belumMemilih = max(0, $totalDpt - $sudahMemilih);
        $golput = $status === 'closed' ? $belumMemilih : 0;

        $pctPartisipasi = $totalDpt > 0 ? round(($sudahMemilih / $totalDpt) * 100, 1) : 0.0;
        $pctBelum = $totalDpt > 0 ? round(($belumMemilih / $totalDpt) * 100, 1) : 0.0;
        $pctGolput = $totalDpt > 0 ? round(($golput / $totalDpt) * 100, 1) : 0.0;

        // Suara per kategori
        $suaraPutra = DB::table('votes')->whereNotNull('candidate_putra_id')->count();
        $suaraPutri = DB::table('votes')->whereNotNull('candidate_putri_id')->count();

        $pctPutra = $totalDpt > 0 ? round(($suaraPutra / $totalDpt) * 100, 1) : 0.0;
        $pctPutri = $totalDpt > 0 ? round(($suaraPutri / $totalDpt) * 100, 1) : 0.0;

        // 2. Query Kandidat Putra dengan jumlah suara
        $candidatesPutraRows = DB::table('candidates')
            ->where('category', 'putra')
            ->where('is_blank', 0)
            ->leftJoin('votes', 'candidates.id', '=', 'votes.candidate_putra_id')
            ->select(
                'candidates.id',
                'candidates.candidate_number',
                'candidates.name',
                'candidates.class',
                'candidates.photo_url',
                'candidates.vision',
                'candidates.mission',
                DB::raw('COUNT(votes.id) as vote_count')
            )
            ->groupBy(
                'candidates.id',
                'candidates.candidate_number',
                'candidates.name',
                'candidates.class',
                'candidates.photo_url',
                'candidates.vision',
                'candidates.mission'
            )
            ->orderBy('candidates.candidate_number', 'asc')
            ->get();

        $candidatesPutra = $candidatesPutraRows->map(function ($c) use ($suaraPutra) {
            $pct = $suaraPutra > 0 ? round(((int) $c->vote_count / $suaraPutra) * 100, 1) : 0.0;
            return [
                'id' => (int) $c->id,
                'candidate_number' => (int) $c->candidate_number,
                'name' => $c->name,
                'class' => $c->class ?? '',
                'photo_url' => $c->photo_url,
                'vision' => $c->vision,
                'mission' => $c->mission,
                'vote_count' => (int) $c->vote_count,
                'percentage' => $pct,
            ];
        });

        // Query Kandidat Putri dengan jumlah suara
        $candidatesPutriRows = DB::table('candidates')
            ->where('category', 'putri')
            ->where('is_blank', 0)
            ->leftJoin('votes', 'candidates.id', '=', 'votes.candidate_putri_id')
            ->select(
                'candidates.id',
                'candidates.candidate_number',
                'candidates.name',
                'candidates.class',
                'candidates.photo_url',
                'candidates.vision',
                'candidates.mission',
                DB::raw('COUNT(votes.id) as vote_count')
            )
            ->groupBy(
                'candidates.id',
                'candidates.candidate_number',
                'candidates.name',
                'candidates.class',
                'candidates.photo_url',
                'candidates.vision',
                'candidates.mission'
            )
            ->orderBy('candidates.candidate_number', 'asc')
            ->get();

        $candidatesPutri = $candidatesPutriRows->map(function ($c) use ($suaraPutri) {
            $pct = $suaraPutri > 0 ? round(((int) $c->vote_count / $suaraPutri) * 100, 1) : 0.0;
            return [
                'id' => (int) $c->id,
                'candidate_number' => (int) $c->candidate_number,
                'name' => $c->name,
                'class' => $c->class ?? '',
                'photo_url' => $c->photo_url,
                'vision' => $c->vision,
                'mission' => $c->mission,
                'vote_count' => (int) $c->vote_count,
                'percentage' => $pct,
            ];
        });

        // Juara 1 Putra & Putri (Pengumpul suara terbanyak)
        $topPutra = $candidatesPutra->sortByDesc('vote_count')->first() ?: null;
        $topPutri = $candidatesPutri->sortByDesc('vote_count')->first() ?: null;

        return Inertia::render('dashboard', [
            'stats' => [
                'total_dpt' => $totalDpt,
                'sudah_memilih' => $sudahMemilih,
                'belum_memilih' => $belumMemilih,
                'golput' => $golput,
                'pct_partisipasi' => $pctPartisipasi,
                'pct_belum' => $pctBelum,
                'pct_golput' => $pctGolput,
                'suara_putra' => $suaraPutra,
                'suara_putri' => $suaraPutri,
                'pct_putra' => $pctPutra,
                'pct_putri' => $pctPutri,
            ],
            'election_status' => $status,
            'results_revealed' => $resultsRevealed,
            'candidates_putra' => $candidatesPutra->values()->all(),
            'candidates_putri' => $candidatesPutri->values()->all(),
            'top_putra' => $topPutra,
            'top_putri' => $topPutri,
        ]);
    }

    /**
     * Ubah status pemilihan (misal: open -> closed)
     */
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

        // Catat ke audit_logs
        $action = $newStatus === 'open' ? 'open_election' : ($newStatus === 'closed' ? 'close_election' : 'update_settings');
        DB::table('audit_logs')->insert([
            'user_id' => Auth::id(),
            'action' => $action,
            'meta' => json_encode(['status' => $newStatus, 'by' => Auth::user()?->name ?? 'Admin']),
            'created_at' => now(),
        ]);

        return back()->with('success', "Status pemilihan berhasil diubah menjadi: " . strtoupper($newStatus));
    }

    /**
     * Buka / Sembunyikan hasil (Reveal Mode)
     */
    public function toggleReveal(Request $request): RedirectResponse
    {
        $settings = DB::table('settings')->first();
        $current = (bool) ($settings->results_revealed ?? false);
        $newReveal = $request->has('revealed') ? (bool) $request->input('revealed') : !$current;

        DB::table('settings')->where('id', 1)->update([
            'results_revealed' => $newReveal ? 1 : 0,
            'updated_at' => now(),
        ]);

        if ($newReveal) {
            DB::table('audit_logs')->insert([
                'user_id' => Auth::id(),
                'action' => 'reveal',
                'meta' => json_encode(['by' => Auth::user()?->name ?? 'Admin', 'timestamp' => now()->toIso8601String()]),
                'created_at' => now(),
            ]);
        }

        return back()->with('success', $newReveal ? 'Hasil pemilihan resmi dibuka (Reveal Mode aktif)!' : 'Hasil pemilihan disembunyikan (Mode Anti-FOMO).');
    }

    /**
     * Umumkan Pemenang (catat ke audit log)
     */
    public function announceWinner(Request $request): RedirectResponse
    {
        DB::table('audit_logs')->insert([
            'user_id' => Auth::id(),
            'action' => 'announce_winner',
            'meta' => json_encode(['by' => Auth::user()?->name ?? 'Admin', 'timestamp' => now()->toIso8601String()]),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Pemenang resmi diumumkan ke seluruh ambalan!');
    }

    /**
     * Reset seluruh sesi pemilihan ke kondisi awal (seperti belum pernah dibuat/dimulai):
     * - Mengosongkan seluruh rekaman suara (votes)
     * - Mengembalikan status seluruh DPT menjadi belum memilih (has_voted = 0)
     * - Mengembalikan status pemilihan ke 'draft'
     * - Mereset status reveal hasil dan penetapan pemenang
     * - Data DPT siswa dan data paslon tetap aman
     */
    public function resetElection(Request $request): RedirectResponse
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('votes')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Reset status pemilih
        DB::table('voters')->update([
            'has_voted' => 0,
        ]);

        // Kembalikan settings ke kondisi draft & reset hasil
        DB::table('settings')->where('id', 1)->update([
            'status' => 'draft',
            'results_revealed' => 0,
            'decided_putra_id' => null,
            'decided_putri_id' => null,
            'updated_at' => now(),
        ]);

        // Catat ke audit log
        DB::table('audit_logs')->insert([
            'user_id' => Auth::id(),
            'action' => 'reset_election',
            'meta' => json_encode([
                'by' => Auth::user()?->name ?? 'Admin',
                'note' => 'Reset total sesi pemilihan ke kondisi awal (draft, 0 suara masuk, DPT siap memilih ulang)',
                'timestamp' => now()->toIso8601String(),
            ]),
            'created_at' => now(),
        ]);

        return back()->with('success', 'Sesi pemilihan berhasil direset total ke kondisi awal (Draft). Seluruh suara dikosongkan dan DPT siap memilih kembali.');
    }
}
