<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class KandidatController extends Controller
{
    public function index(): Response
    {
        $settings = DB::table('settings')->first();
        $electionStatus = $settings->status ?? 'draft';

        $kandidatPutra = DB::table('candidates')
            ->where('category', 'putra')
            ->where('is_blank', 0)
            ->leftJoin('votes', 'candidates.id', '=', 'votes.candidate_putra_id')
            ->select(
                'candidates.id',
                'candidates.category',
                'candidates.candidate_number',
                'candidates.name',
                'candidates.class',
                'candidates.vision',
                'candidates.mission',
                'candidates.photo_url',
                DB::raw('COUNT(votes.id) as vote_count')
            )
            ->groupBy(
                'candidates.id',
                'candidates.category',
                'candidates.candidate_number',
                'candidates.name',
                'candidates.class',
                'candidates.vision',
                'candidates.mission',
                'candidates.photo_url'
            )
            ->orderBy('candidates.candidate_number', 'asc')
            ->get();

        $kandidatPutri = DB::table('candidates')
            ->where('category', 'putri')
            ->where('is_blank', 0)
            ->leftJoin('votes', 'candidates.id', '=', 'votes.candidate_putri_id')
            ->select(
                'candidates.id',
                'candidates.category',
                'candidates.candidate_number',
                'candidates.name',
                'candidates.class',
                'candidates.vision',
                'candidates.mission',
                'candidates.photo_url',
                DB::raw('COUNT(votes.id) as vote_count')
            )
            ->groupBy(
                'candidates.id',
                'candidates.category',
                'candidates.candidate_number',
                'candidates.name',
                'candidates.class',
                'candidates.vision',
                'candidates.mission',
                'candidates.photo_url'
            )
            ->orderBy('candidates.candidate_number', 'asc')
            ->get();

        return Inertia::render('admin/kandidat', [
            'kandidat_putra' => $kandidatPutra,
            'kandidat_putri' => $kandidatPutri,
            'election_status' => $electionStatus,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $settings = DB::table('settings')->first();
        if ($settings && $settings->status === 'open') {
            return back()->with('error', 'Kandidat tidak dapat ditambahkan saat pemilihan sedang berlangsung (Open)!');
        }

        $validated = $request->validate([
            'category' => 'required|in:putra,putri',
            'candidate_number' => 'required|integer|min:1|max:99',
            'name' => 'required|string|max:255',
            'class' => 'nullable|string|max:50',
            'vision' => 'nullable|string',
            'mission' => 'nullable|string',
            'photo' => 'nullable|image|max:2048',
        ]);

        // Cek apakah nomor urut sudah ada di kategori ini
        $exists = DB::table('candidates')
            ->where('category', $validated['category'])
            ->where('candidate_number', $validated['candidate_number'])
            ->exists();

        if ($exists) {
            return back()->with('error', "Nomor urut {$validated['candidate_number']} sudah digunakan untuk Calon Pradana " . ucfirst($validated['category']) . "!");
        }

        $photoUrl = null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('candidates', 'public');
            $photoUrl = Storage::url($path);
        }

        DB::table('candidates')->insert([
            'category' => $validated['category'],
            'candidate_number' => $validated['candidate_number'],
            'name' => $validated['name'],
            'class' => $validated['class'] ?? '',
            'vision' => $validated['vision'] ?? null,
            'mission' => $validated['mission'] ?? null,
            'photo_url' => $photoUrl,
            'is_blank' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Kandidat berhasil didaftarkan!');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $settings = DB::table('settings')->first();
        if ($settings && $settings->status === 'open') {
            return back()->with('error', 'Kandidat tidak dapat diubah saat pemilihan sedang berlangsung (Open)!');
        }

        $candidate = DB::table('candidates')->where('id', $id)->first();
        if (!$candidate) {
            return back()->with('error', 'Kandidat tidak ditemukan!');
        }

        $validated = $request->validate([
            'candidate_number' => 'required|integer|min:1|max:99',
            'name' => 'required|string|max:255',
            'class' => 'nullable|string|max:50',
            'vision' => 'nullable|string',
            'mission' => 'nullable|string',
            'photo' => 'nullable|image|max:2048',
        ]);

        // Cek duplikasi nomor jika nomor urut diubah
        if ($candidate->candidate_number != $validated['candidate_number']) {
            $exists = DB::table('candidates')
                ->where('category', $candidate->category)
                ->where('candidate_number', $validated['candidate_number'])
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                return back()->with('error', "Nomor urut {$validated['candidate_number']} sudah digunakan!");
            }
        }

        $photoUrl = $candidate->photo_url;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('candidates', 'public');
            $photoUrl = Storage::url($path);
        }

        DB::table('candidates')->where('id', $id)->update([
            'candidate_number' => $validated['candidate_number'],
            'name' => $validated['name'],
            'class' => $validated['class'] ?? '',
            'vision' => $validated['vision'] ?? null,
            'mission' => $validated['mission'] ?? null,
            'photo_url' => $photoUrl,
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Data kandidat berhasil diperbarui!');
    }

    public function destroy(int $id): RedirectResponse
    {
        $settings = DB::table('settings')->first();
        if ($settings && $settings->status === 'open') {
            return back()->with('error', 'Kandidat tidak dapat dihapus saat pemilihan sedang berlangsung (Open)!');
        }

        $candidate = DB::table('candidates')->where('id', $id)->first();
        if (!$candidate) {
            return back()->with('error', 'Kandidat tidak ditemukan!');
        }

        // Cek jika sudah ada suara
        $hasVotes = DB::table('votes')
            ->where('candidate_putra_id', $id)
            ->orWhere('candidate_putri_id', $id)
            ->exists();

        if ($hasVotes) {
            return back()->with('error', 'Kandidat tidak dapat dihapus karena sudah memiliki suara tercatat. Reset database jika ingin mengulang.');
        }

        DB::table('candidates')->where('id', $id)->delete();

        return back()->with('success', 'Kandidat berhasil dihapus!');
    }
}
