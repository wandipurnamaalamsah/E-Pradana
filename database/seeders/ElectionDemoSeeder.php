<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ElectionDemoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Reset tabel pemilihan
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('votes')->truncate();
        DB::table('candidates')->truncate();
        DB::table('voters')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Buat Kandidat Putra
        $kandidatPutra = [
            [
                'category' => 'putra',
                'candidate_number' => 1,
                'name' => 'M. Farhan Al-Fatih',
                'class' => 'XI RPL 1',
                'vision' => 'Mewujudkan Ambalan yang berintegritas, mandiri, dan berjiwa kepemimpinan tinggi.',
                'mission' => "1. Meningkatkan kedisiplinan dan keterampilan kepramukaan.\n2. Mengadakan giat prestasi ambalan secara berkala.",
                'photo_url' => null,
                'is_blank' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category' => 'putra',
                'candidate_number' => 2,
                'name' => 'Ahmad Rizky Pratama',
                'class' => 'XI TKJ 2',
                'vision' => 'Menjadikan Pramuka Penegak yang tangkas, inovatif, dan berwawasan lingkungan.',
                'mission' => "1. Pelatihan survival dan navigasi darat modern.\n2. Optimalisasi media digital ambalan.",
                'photo_url' => null,
                'is_blank' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category' => 'putra',
                'candidate_number' => 3,
                'name' => 'Dimas Bagas Wicaksono',
                'class' => 'XI DKV 1',
                'vision' => 'Membangun generasi Pramuka kreatif, bersaudara, dan berdaya saing global.',
                'mission' => "1. Revitalisasi kegiatan kemah bhakti masyarakat.\n2. Kolaborasi lintas gugus depan.",
                'photo_url' => null,
                'is_blank' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // 3. Buat Kandidat Putri
        $kandidatPutri = [
            [
                'category' => 'putri',
                'candidate_number' => 1,
                'name' => 'Siti Nur Azizah',
                'class' => 'XI RPL 2',
                'vision' => 'Terwujudnya Pradana Putri yang tangguh, cerdas, bersahaja, dan mengayomi.',
                'mission' => "1. Mempererat persaudaraan dan solidaritas antar penegak putri.\n2. Pelatihan manajemen kepemimpinan ambalan.",
                'photo_url' => null,
                'is_blank' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category' => 'putri',
                'candidate_number' => 2,
                'name' => 'Annisa Rahmawati',
                'class' => 'XI AKL 1',
                'vision' => 'Mewujudkan Penegak Putri yang unggul dalam bakti sosial dan kesamaptaan.',
                'mission' => "1. Aksi peduli lingkungan dan bakti sosial masyarakat.\n2. Pengembangan ketangkasan pionering.",
                'photo_url' => null,
                'is_blank' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category' => 'putri',
                'candidate_number' => 3,
                'name' => 'Zahra Putri Lestari',
                'class' => 'XI MP 2',
                'vision' => 'Pramuka putri yang berbudaya, inovatif, dan siap memimpin di era transformasi.',
                'mission' => "1. Pembinaan berkala keterampilan penegak bantara & laksana.\n2. Program keputrian kepramukaan terintegrasi.",
                'photo_url' => null,
                'is_blank' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('candidates')->insert($kandidatPutra);
        DB::table('candidates')->insert($kandidatPutri);

        $putraIds = DB::table('candidates')->where('category', 'putra')->pluck('id')->toArray();
        $putriIds = DB::table('candidates')->where('category', 'putri')->pluck('id')->toArray();

        // 4. Buat 350 Pemilih (DPT)
        // Sesuai contoh deskripsi: 285 sudah memilih (81.4%), 65 belum memilih (18.6%)
        $totalDpt = 350;
        $sudahMemilihCount = 285;

        $voters = [];
        $kelasOptions = ['X RPL 1', 'X RPL 2', 'XI TKJ 1', 'XI TKJ 2', 'XII DKV 1', 'XII AKL 2'];

        for ($i = 1; $i <= $totalDpt; $i++) {
            $hasVoted = $i <= $sudahMemilihCount ? 1 : 0;
            $username = 'VOTE' . str_pad((string) $i, 4, '0', STR_PAD_LEFT);

            $voters[] = [
                'name' => 'Siswa ' . $i,
                'class' => $kelasOptions[$i % count($kelasOptions)],
                'username' => $username,
                'token_hash' => hash('sha256', 'TOK' . $i),
                'has_voted' => $hasVoted,
                'created_at' => now(),
            ];
        }

        // Insert in chunks of 100
        foreach (array_chunk($voters, 100) as $chunk) {
            DB::table('voters')->insert($chunk);
        }

        // 5. Buat 285 Suara (Votes)
        // Distribusi suara realistis (Juara 1 Putra Paslon 1, Juara 1 Putri Paslon 2)
        // Putra: Paslon 1 = 142 suara, Paslon 2 = 88 suara, Paslon 3 = 55 suara
        // Putri: Paslon 2 = 138 suara, Paslon 1 = 92 suara, Paslon 3 = 55 suara
        $votes = [];

        for ($i = 0; $i < $sudahMemilihCount; $i++) {
            // Tentukan pilihan putra
            if ($i < 142) {
                $pId = $putraIds[0]; // Paslon 1
            } elseif ($i < 142 + 88) {
                $pId = $putraIds[1]; // Paslon 2
            } else {
                $pId = $putraIds[2]; // Paslon 3
            }

            // Tentukan pilihan putri
            if ($i < 138) {
                $piId = $putriIds[1]; // Paslon 2
            } elseif ($i < 138 + 92) {
                $piId = $putriIds[0]; // Paslon 1
            } else {
                $piId = $putriIds[2]; // Paslon 3
            }

            $votes[] = [
                'id' => (string) Str::uuid(),
                'candidate_putra_id' => $pId,
                'candidate_putri_id' => $piId,
            ];
        }

        foreach (array_chunk($votes, 100) as $chunk) {
            DB::table('votes')->insert($chunk);
        }

        // 6. Update Settings status menjadi 'open', results_revealed = 0 (Anti-FOMO siap pakai)
        DB::table('settings')->updateOrInsert(
            ['id' => 1],
            [
                'status' => 'open',
                'schedule_enabled' => 0,
                'manual_override' => 1,
                'results_revealed' => 0,
                'allow_blank' => 0,
                'updated_at' => now(),
            ]
        );

        // 7. Catat ke audit_logs
        DB::table('audit_logs')->insert([
            'user_id' => 1,
            'action' => 'open_election',
            'meta' => json_encode(['note' => 'Pemilihan dibuka melalui ElectionDemoSeeder']),
            'created_at' => now(),
        ]);
    }
}
