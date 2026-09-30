<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DptController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $selectedClass = $request->input('class');
        $statusFilter = $request->input('status'); // 'all', 'voted', 'not_voted'

        $query = DB::table('voters')->orderBy('name', 'asc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if (!empty($selectedClass)) {
            // Filter by grade level prefix (X, XI, XII) using LIKE to match e.g. "XI DKV 1"
            $query->where(function ($q) use ($selectedClass) {
                $q->where('class', $selectedClass)
                  ->orWhere('class', 'like', $selectedClass . ' %');
            });
        }

        if ($statusFilter === 'voted') {
            $query->where('has_voted', 1);
        } elseif ($statusFilter === 'not_voted') {
            $query->where('has_voted', 0);
        }

        $voters = $query->paginate(20)->withQueryString();

        // Statistik DPT
        $totalDpt = DB::table('voters')->count();
        $sudahMemilih = DB::table('voters')->where('has_voted', 1)->count();
        $belumMemilih = max(0, $totalDpt - $sudahMemilih);

        // Daftar kelas unik untuk dropdown filter
        $classes = DB::table('voters')
            ->whereNotNull('class')
            ->where('class', '!=', '')
            ->distinct()
            ->pluck('class')
            ->sort()
            ->values()
            ->all();

        return Inertia::render('admin/dpt', [
            'voters' => $voters,
            'stats' => [
                'total' => $totalDpt,
                'sudah_memilih' => $sudahMemilih,
                'belum_memilih' => $belumMemilih,
            ],
            'classes' => $classes,
            'filters' => [
                'search' => $search ?? '',
                'class' => $selectedClass ?? '',
                'status' => $statusFilter ?? 'all',
            ],
            'flash_token' => session('flash_token'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'class' => 'required|string|max:50',
            'username' => 'nullable|string|max:100|unique:voters,username',
            'token' => 'nullable|string|min:4|max:20',
        ]);

        // Auto-generate username jika kosong
        $username = $validated['username'];
        if (empty($username)) {
            $username = self::generateUniqueUsername();
        }

        // Auto-generate token 6 karakter uppercase jika kosong
        $plainToken = !empty($validated['token'])
            ? strtoupper(trim($validated['token']))
            : strtoupper(Str::random(6));

        $tokenHash = hash('sha256', $plainToken);

        $voterId = DB::table('voters')->insertGetId([
            'name' => $validated['name'],
            'class' => $validated['class'],
            'username' => $username,
            'token' => $plainToken,
            'token_hash' => $tokenHash,
            'has_voted' => 0,
            'created_at' => now(),
        ]);

        return back()
            ->with('success', "Pemilih \"{$validated['name']}\" berhasil ditambahkan!")
            ->with('flash_token', [
                'id' => $voterId,
                'name' => $validated['name'],
                'username' => $username,
                'token' => $plainToken,
            ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $voter = DB::table('voters')->where('id', $id)->first();
        if (!$voter) {
            return back()->with('error', 'Data pemilih tidak ditemukan!');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'class' => 'required|string|max:50',
            'username' => "required|string|max:100|unique:voters,username,{$id}",
        ]);

        DB::table('voters')->where('id', $id)->update([
            'name' => $validated['name'],
            'class' => $validated['class'],
            'username' => $validated['username'],
        ]);

        return back()->with('success', "Data pemilih {$validated['name']} berhasil diperbarui!");
    }

    public function resetToken(int $id): RedirectResponse
    {
        $voter = DB::table('voters')->where('id', $id)->first();
        if (!$voter) {
            return back()->with('error', 'Data pemilih tidak ditemukan!');
        }

        $newToken = strtoupper(Str::random(6));
        $tokenHash = hash('sha256', $newToken);

        DB::table('voters')->where('id', $id)->update([
            'token' => $newToken,
            'token_hash' => $tokenHash,
        ]);

        return back()
            ->with('success', "Token untuk {$voter->name} ({$voter->username}) berhasil di-reset!")
            ->with('flash_token', [
                'id' => $id,
                'name' => $voter->name,
                'username' => $voter->username,
                'token' => $newToken,
            ]);
    }

    public function destroy(int $id): RedirectResponse
    {
        $voter = DB::table('voters')->where('id', $id)->first();
        if (!$voter) {
            return back()->with('error', 'Data pemilih tidak ditemukan!');
        }

        DB::table('voters')->where('id', $id)->delete();

        return back()->with('success', "Pemilih {$voter->name} berhasil dihapus!");
    }

    public function destroyAll(): RedirectResponse
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('voters')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        return back()->with('success', 'Seluruh data DPT berhasil dikosongkan!');
    }

    /**
     * Generate a unique random 8-digit numeric username.
     *
     * @param array<string,bool> $usedInBatch  usernames already assigned in the current batch
     */
    private static function generateUniqueUsername(array $usedInBatch = []): string
    {
        do {
            $username = (string) random_int(10_000_000, 99_999_999);
        } while (
            isset($usedInBatch[$username]) ||
            DB::table('voters')->where('username', $username)->exists()
        );

        return $username;
    }

    /**
     * Resolve name and class values from a parsed CSV row.
     *
     * If header-based column indices are provided, use them directly.
     * Otherwise auto-detect: skip a leading numeric index column (e.g. row number),
     * then treat the next two columns as name and class.
     */
    private static function extractNameClass(array $cols, ?int $nameIdx, ?int $classIdx): array
    {
        if ($nameIdx !== null && $classIdx !== null) {
            return [
                isset($cols[$nameIdx])  ? trim($cols[$nameIdx])  : null,
                isset($cols[$classIdx]) ? trim($cols[$classIdx]) : null,
            ];
        }

        // Auto-detect: skip a leading numeric column (row number / index)
        $offset = (count($cols) >= 3 && is_numeric(trim($cols[0]))) ? 1 : 0;

        return [
            isset($cols[$offset])     ? trim($cols[$offset])     : null,
            isset($cols[$offset + 1]) ? trim($cols[$offset + 1]) : null,
        ];
    }

    public function importCsv(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'nullable|file|mimes:csv,txt|max:5120',
            'raw_text' => 'nullable|string',
        ]);

        $rows = [];

        if ($request->hasFile('file')) {
            $handle = fopen($request->file('file')->getRealPath(), 'r');
            if ($handle !== false) {
                $header = fgetcsv($handle);

                // Resolve column positions from header keywords
                $nameIdx = $classIdx = null;
                if ($header) {
                    foreach ($header as $i => $col) {
                        $col = strtolower(trim($col));
                        if (in_array($col, ['nama', 'name', 'nama siswa'])) $nameIdx = $i;
                        if (in_array($col, ['kelas', 'class']))              $classIdx = $i;
                    }
                }

                while (($data = fgetcsv($handle)) !== false) {
                    [$name, $class] = self::extractNameClass($data, $nameIdx, $classIdx);
                    if ($name && $class) {
                        $rows[] = ['name' => $name, 'class' => $class];
                    }
                }
                fclose($handle);
            }
        } elseif (!empty($request->input('raw_text'))) {
            $lines = explode("\n", str_replace("\r", "", $request->input('raw_text')));
            $nameIdx = $classIdx = null;
            $headerParsed = false;

            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) continue;

                $parts = str_getcsv($line);

                if (!$headerParsed) {
                    $headerParsed = true;
                    // Check if this line is a header
                    foreach ($parts as $i => $col) {
                        $col = strtolower(trim($col));
                        if (in_array($col, ['nama', 'name', 'nama siswa'])) $nameIdx = $i;
                        if (in_array($col, ['kelas', 'class']))              $classIdx = $i;
                    }
                    // Skip this line if it resolved as a header
                    if ($nameIdx !== null || $classIdx !== null) continue;
                }

                [$name, $class] = self::extractNameClass($parts, $nameIdx, $classIdx);
                if ($name && $class) {
                    $rows[] = ['name' => $name, 'class' => $class];
                }
            }
        }

        if (empty($rows)) {
            return back()->with('error', 'Tidak ada baris data valid. Format CSV: Nama, Kelas (header opsional, nomor urut diabaikan otomatis).');
        }

        $insertedCount = 0;

        // Track usernames used in this batch to prevent intra-batch duplicates
        $usedUsernames = [];

        $insertBatch = [];
        foreach ($rows as $row) {
            $name  = $row['name'];
            $class = $row['class'];

            if (empty($name) || empty($class)) continue;

            // Always auto-generate a unique 8-digit username
            $username = self::generateUniqueUsername($usedUsernames);
            $usedUsernames[$username] = true;

            $plainToken = strtoupper(Str::random(6));
            $tokenHash  = hash('sha256', $plainToken);

            $insertBatch[] = [
                'name'       => $name,
                'class'      => $class,
                'username'   => $username,
                'token'      => $plainToken,
                'token_hash' => $tokenHash,
                'has_voted'  => 0,
                'created_at' => now(),
            ];

            $insertedCount++;

            if (count($insertBatch) >= 100) {
                DB::table('voters')->insert($insertBatch);
                $insertBatch = [];
            }
        }

        if (!empty($insertBatch)) {
            DB::table('voters')->insert($insertBatch);
        }

        return back()->with('success', "Berhasil mengimpor {$insertedCount} data pemilih (DPT)!");
    }
}
