# PROJECT RULES: E-Voting "E-Pradana"

Sistem pemilihan Ketua Pradana Putra & Putri (Ambalan Pramuka) berbasis web.
Dokumen ini adalah acuan utama. Semua kode yang dibuat (oleh manusia maupun AI) HARUS mengikuti aturan di sini. Jika ada konflik antara dokumen ini dan permintaan sesaat, tanyakan dulu sebelum melanggar aturan.

---

## 1. Ringkasan Proyek

- **Tujuan**: pemilihan Pradana Putra dan Pradana Putri secara elektronik, rahasia, dan tidak bisa dicurangi.
- **Pemilih**: siswa yang terdaftar di DPT, memilih lewat HP dengan Username + Token sekali pakai.
- **Pengelola**: panitia (Admin) lewat panel web.
- **Asas**: Luber Jurdil. Rahasia pilihan adalah prioritas tertinggi.
- **Skala**: satu sekolah/ambalan (ratusan pemilih, voting serentak di satu waktu).

## 2. Tech Stack

| Lapisan         | Teknologi                                                        |
| --------------- | ---------------------------------------------------------------- |
| Backend / API   | Laravel (PHP)                                                    |
| Frontend        | React.js (mobile-first untuk voter), Tailwind CSS, Framer Motion |
| Database        | MySQL (InnoDB)                                                   |
| PDF kartu akun  | barryvdh/laravel-dompdf                                          |
| Server produksi | Nginx + PHP-FPM, HTTPS wajib                                     |

## 3. Tema Warna (Pramuka)

Daftarkan di `tailwind.config.js` atau CSS variables:

| Nama            | Hex       | Pemakaian                                              |
| --------------- | --------- | ------------------------------------------------------ |
| `pramuka-dark`  | `#4A2E1B` | Sidebar admin, header, tombol utama, teks di atas emas |
| `pramuka-light` | `#8B5A2B` | Aksen sekunder, border kartu                           |
| `pramuka-green` | `#2D5A27` | Status aktif, tombol sukses, kandidat terpilih         |
| `pramuka-bg`    | `#FDFBF7` | Background utama                                       |
| `pramuka-gold`  | `#D4AF37` | Piala, mahkota pemenang, badge penting                 |

Aturan warna:

- Jangan pakai teks emas di atas krem (kontras rendah). Emas hanya untuk ikon/latar badge, teks di atasnya `pramuka-dark`.
- Label status DPT: Kuning = Belum Memilih, Hijau = Sudah Memilih, Merah = Golput/Hangus.

---

## 4. Aturan Mutlak (Non-Negotiable)

1. **Hanya 2 role**: `Admin` dan `Voter`. Dilarang membuat role perantara.
2. **Satu token = satu suara.** Setelah suara tersimpan, token mati permanen.
3. **Tabel `votes` tidak boleh punya relasi ke `voters`**, dan tidak boleh menyimpan timestamp, IP, atau apa pun yang bisa mengaitkan suara dengan pemilih.
4. **Validasi selalu di backend.** Jangan percaya data dari frontend.
5. **Suara wajib lengkap**: tepat 1 kandidat Putra DAN 1 kandidat Putri. Jika tidak, tolak.
6. **Pilihan tidak bisa diubah** setelah dikirim.
7. **Hasil per kandidat tidak boleh dikirim ke klien mana pun** selama pemilihan berlangsung (termasuk Proyektor View).
8. **Jangan pernah mencatat pilihan pemilih di log** (application log, audit log, query log, error tracker).
9. **Token tidak disimpan plaintext.**

---

## 5. Status Pemilihan (State Machine)

Tabel `settings` menyimpan status global:

| Status      | Arti                            | Voter bisa login?             |
| ----------- | ------------------------------- | ----------------------------- |
| `draft`     | Persiapan (DPT, kandidat diisi) | Tidak                         |
| `rehearsal` | Gladi bersih                    | Ya (data uji, boleh di-reset) |
| `open`      | Pemilihan resmi berlangsung     | Ya                            |
| `closed`    | Pemilihan ditutup               | Tidak                         |

Aturan transisi:

- `draft → rehearsal → draft` (reset diperbolehkan hanya di dua status ini).
- `draft/rehearsal → open → closed`. Setelah `closed`, tidak bisa dibuka kembali tanpa tindakan darurat yang tercatat di audit log.
- Status juga dikontrol jadwal (`start_at`, `end_at`) dan tombol master control darurat (buka/tutup paksa).
- Setiap request voter (login dan submit) wajib melewati middleware `EnsureElectionOpen`.

---

## 6. Skema Database

### `users` (Admin/Panitia)

`id`, `name`, `email` (unique), `password` (hash), `timestamps`

### `voters` (DPT)

`id`, `name`, `class`, `username` (unique), `token_hash`, `has_voted` (boolean, default false), `timestamps`

- `token_hash` = `hash_hmac('sha256', $token, config('app.key'))`. Token asli hanya tampil sekali saat generate/cetak.
- Jangan pakai `Eloquent::save()` untuk mengubah `has_voted` (lihat aturan atomik di bagian 9).

### `candidates`

`id`, `category` (enum `putra`/`putri`), `candidate_number`, `name`, `class`, `vision` (text), `mission` (text), `photo_url`, `timestamps`

- Unique constraint: `(category, candidate_number)`.

### `votes` (anonim, tanpa timestamps)

`id`, `candidate_putra_id` (FK → candidates), `candidate_putri_id` (FK → candidates)

- **Sengaja tanpa `timestamps()`**.
- Backend wajib memvalidasi bahwa `candidate_putra_id` berkategori `putra` dan `candidate_putri_id` berkategori `putri`.

### `settings`

`id`, `status` (enum draft/rehearsal/open/closed), `start_at`, `end_at`, `results_revealed` (boolean), `allow_blank` (boolean, opsional)

### `audit_logs`

`id`, `user_id` (FK → users), `action`, `meta` (json, nullable), `created_at`

- Isi hanya aksi panitia: `open_election`, `close_election`, `reveal`, `import_dpt`, `regenerate_token`, `reset_database`, `announce_winner`.
- DILARANG menyimpan data pilihan atau token.

---

## 7. Sisi Admin (Panitia)

Panel admin punya 4 menu utama.

### 7.1 Dashboard Utama

- **Kartu statistik real-time** (auto-refresh 10 detik, di-cache di backend 10 detik):
    - Total DPT
    - Sudah Memilih
    - Belum Memilih
    - Golput (lihat bagian 9)
- **Grafik perolehan suara** (batang/lingkaran, terpisah Putra dan Putri). Hanya tampil untuk admin dan hanya terisi setelah status `closed`.
- **Proyektor View (Anti-FOMO)**: mode layar besar untuk aula.
    - Selama `open`: grafik abu-abu polos tanpa identitas kandidat. Endpoint hanya boleh mengirim jumlah total yang sudah memilih, bukan data per kandidat.
    - Setelah `closed` dan `results_revealed = true`: tampilkan hasil asli.
- **Panel Kontrol Panitia**:
    - Tombol **Tutup Pemilihan**: mengubah status menjadi `closed`, semua akses voter ditolak.
    - Tombol **Reveal**: mengubah `results_revealed = true` (hanya bisa setelah `closed`).
    - Tombol **🏆 Umumkan Pemenang**: popup berisi foto, nama, kelas, dan ucapan selamat. Jika terjadi seri, tampilkan "Seri, menunggu keputusan panitia" dan jangan munculkan popup pemenang.

### 7.2 Manajemen DPT

- Dimulai dari database kosong.
- **Import CSV**: validasi header dan tiap baris (nama dan kelas wajib), tampilkan pratinjau sebelum commit, commit dalam satu transaksi, laporkan baris bermasalah tanpa menggagalkan seluruhnya. Username dibuat unik otomatis (contoh: `wandi.12rpl1`, jika bentrok tambah akhiran angka).
- **Token**: 8 karakter acak dari alfabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (tanpa O/0/I/l). Dihasilkan dengan `random_int`.
- **Cetak Kartu Akun**: PDF per kelas, 8 kartu per halaman A4 (nama, kelas, username, token, URL aplikasi). PDF dibuat dari token yang baru di-generate, bukan dibaca dari database.
- **Reset Token**: tombol per siswa, hanya aktif jika `has_voted = false` dan status bukan `closed`. Catat di audit log tanpa menyimpan token.
- **Tabel status DPT**: Belum Memilih (kuning), Sudah Memilih (hijau), Golput/Hangus (merah, hanya setelah `closed`).

### 7.3 Manajemen Kandidat

- Dua tab: Calon Pradana Putra dan Calon Pradana Putri.
- Form tambah/ubah/hapus: nomor urut, nama, kelas, visi, misi, foto resmi berseragam pramuka.
- Upload foto: `image|mimes:jpg,jpeg,png,webp|max:2048`, simpan dengan nama acak di storage.
- Kandidat tidak boleh diubah atau dihapus saat status `open`.
- Jika `allow_blank` aktif, sediakan kandidat "Kotak Kosong" per kategori.

### 7.4 Pengaturan (Settings)

- Jadwal buka/tutup otomatis.
- **Master Control**: buka/tutup paksa untuk kondisi darurat (wajib tercatat di audit log).
- **Reset Database (gladi bersih)**: hanya di status `draft`/`rehearsal`. Wajib konfirmasi sandi admin dan mengetik kata `RESET`. Backup (`mysqldump`) otomatis sebelum reset. Terkunci begitu pemilihan resmi dibuka.
- Manajemen akun panitia (password minimal 12 karakter).

---

## 8. Sisi Voter (Siswa)

Diakses lewat HP. Konsep **One-Page Scroll** dengan animasi transisi halus (Framer Motion).

### 8.1 Login

- Input Username + Token sekali pakai.
- Ditolak dengan pesan jelas jika: token salah, `has_voted = true`, atau pemilihan belum dibuka/sudah ditutup.
- Rate limit ketat (lihat bagian 10).

### 8.2 Alur Halaman (dari atas ke bawah)

1. **Bagian 1: Sapaan & Panduan**
    - Animasi masuk: Fade-In.
    - Sapaan personal "Halo, [Nama] ([Kelas])" dan panduan singkat cara mencoblos.
2. **Bagian 2: Profil & Visi-Misi Kandidat (preview bersih)**
    - Saat scroll: bagian 1 Slide-Up + Fade-Out, kartu kandidat Staggered Slide-In dari bawah.
    - Daftar paslon Putra dan Putri lengkap dengan foto, kelas, visi, misi. **Tanpa tombol pilih.**
3. **Bagian 3: Bilik Suara**
    - Latar belakang berubah halus menandakan area steril.
    - Tab Putra / Tab Putri.
    - Tiap kartu: foto, nama, tombol `[ ✅ Pilih Kandidat Ini ]`. Saat dipilih, kartu bergetar/membesar sedikit dan berubah hijau pramuka.
4. **Bagian 4: Kirim & Verifikasi Akhir**
    - Sticky Bottom Bar dengan tombol `[ 🚀 Kirim Suara Saya ]`. Abu-abu dan tidak bisa diklik sampai tepat 1 Putra + 1 Putri terpilih.
    - Popup konfirmasi: "Apakah kamu yakin dengan pilihanmu? Pradana Putra: [Nama] | Pradana Putri: [Nama]. Pilihan tidak dapat diubah!" dengan opsi `[ Batal / Cek Lagi ]` dan `[ Ya, Saya Yakin & Kirim ]`.
5. **Selesai**
    - Suara tersimpan, `has_voted = true`, token mati, sesi dihapus, tampil pesan sukses, perangkat siap dipakai pemilih berikutnya.

### 8.3 Aturan UI Voter

- Mobile-first, tombol minimal 44px, mudah dijangkau satu tangan.
- Pilihan sementara disimpan di state React agar tidak hilang saat pindah tab.
- Hormati `prefers-reduced-motion` (matikan animasi jika diminta).
- Tombol kirim harus dinonaktifkan setelah klik pertama (cegah double submit dari sisi klien, tetapi keamanan sebenarnya tetap di backend).

---

## 9. Logika Submit Suara & Golput

### 9.1 Submit suara (WAJIB atomik)

```php
DB::transaction(function () use ($voterId, $putraId, $putriId) {
    $ok = DB::table('voters')
        ->where('id', $voterId)
        ->where('has_voted', false)
        ->update(['has_voted' => true]);   // query builder, bukan Eloquent

    if ($ok !== 1) abort(409, 'Token sudah digunakan.');

    DB::table('votes')->insert([
        'candidate_putra_id' => $putraId,
        'candidate_putri_id' => $putriId,
    ]);
});
```

Setelah sukses: `Auth::guard('voter')->logout()`, `session()->invalidate()`, `session()->regenerateToken()`.

Validasi request:

```php
$request->validate([
    'putra_id' => ['required', Rule::exists('candidates', 'id')->where('category', 'putra')],
    'putri_id' => ['required', Rule::exists('candidates', 'id')->where('category', 'putri')],
]);
```

### 9.2 Golput (Tidak Hadir / Tidak Memakai Hak Pilih)

- **Definisi**: pemilih dengan `has_voted = false` setelah status `closed`.
- **Dihitung, bukan disimpan**: status Golput diturunkan dari `has_voted = false` + status `closed`. Tidak perlu kolom baru dan tidak perlu update massal.
- **Penguncian token**: begitu status `closed`, `EnsureElectionOpen` menolak semua login/submit. Dengan begitu token milik yang Golput otomatis tidak bisa disalahgunakan.
- **Dashboard**: tampilkan angka Golput, persentase yang memilih vs Golput (partisipasi), dan label merah "Golput/Hangus" di tabel DPT.
- Golput hanya memakai data tabel `voters`, jadi tidak mengancam anonimitas.
- Selama status `open`, siswa yang belum memilih tetap berlabel "Belum Memilih" (kuning), bukan Golput.

### 9.3 Seri

Jika suara tertinggi sama, pemenang tidak ditentukan otomatis. Tampilkan status seri dan biarkan panitia memutuskan.

---

## 10. Keamanan

- **Guard terpisah**: `admin` (tabel `users`) dan `voter` (tabel `voters`, provider custom yang mencocokkan HMAC token). Route dikelompokkan dengan `auth:admin` atau `auth:voter`.
- **Rate limiting**:
    - Voter login: 5 percobaan/menit per kombinasi IP + username.
    - Admin login: 3 percobaan/menit, password minimal 12 karakter.
- **Session**: `SESSION_LIFETIME=30`, HTTPS wajib, cookie `secure` dan `httpOnly`.
- **Anonimitas**: `votes` tanpa timestamps; matikan logging body request di route submit; jangan aktifkan query log di produksi.
- **Proyektor View** disamarkan di backend, bukan hanya di CSS/JS.
- **Upload file**: validasi MIME dan ukuran, nama file acak.
- **CORS & CSRF**: batasi ke domain aplikasi sendiri.
- **Audit log** untuk seluruh aksi penting panitia (tanpa data pilihan).
- **Backup** database otomatis sebelum reset dan sebelum hari-H.

---

## 11. Konvensi Kode

- **Backend**: ikuti PSR-12; logika bisnis di Service/Action class, bukan di controller; validasi lewat FormRequest; response API konsisten (`{ data, message }`).
- **Frontend**: komponen fungsional + hooks; state global seperlunya (Context/Zustand); style hanya lewat Tailwind dengan token warna `pramuka-*`.
- **Penamaan**: kolom/tabel `snake_case` (bahasa Inggris), teks UI bahasa Indonesia.
- **Env**: rahasia hanya di `.env`, jangan di-commit.
- **Git**: commit kecil dan deskriptif; jangan commit `.env`, `storage`, `vendor`, `node_modules`.

---

## 12. Yang DILARANG

- Menambah role selain Admin dan Voter.
- Menambah `created_at`/`updated_at`/IP/user agent di tabel `votes`.
- Menyimpan token plaintext atau mencatat token/pilihan ke log.
- Mengirim hasil per kandidat ke endpoint mana pun sebelum status `closed` dan `results_revealed = true`.
- Mengubah `has_voted` atau menyimpan suara di luar transaksi atomik.
- Membuka kembali pemilihan yang sudah `closed` tanpa audit log.
- Memakai `localStorage` untuk data sensitif (token, pilihan final).
- Mempercayai validasi frontend saja.

---

## 13. Checklist Sebelum Hari-H

- [ ] Migration final dijalankan (termasuk `settings` dan `audit_logs`).
- [ ] DPT sudah di-import, kartu akun tercetak, jumlahnya dicek dengan daftar sekolah.
- [ ] Kandidat lengkap (foto, visi, misi, nomor urut).
- [ ] Gladi bersih di status `rehearsal` dengan beberapa akun uji, lalu reset dan kembali ke `draft`.
- [ ] Load test submit suara (contoh: 300 submit dalam 1 menit).
- [ ] Uji double submit dengan dua request bersamaan (harus hanya satu yang lolos).
- [ ] Uji Proyektor View: cek di DevTools bahwa tidak ada data per kandidat yang bocor.
- [ ] Uji akses setelah `closed`: login dan submit harus ditolak.
- [ ] Jaringan cadangan tersedia (hotspot).
- [ ] Backup database dibuat.
- [ ] HTTPS aktif, `APP_DEBUG=false`, `config:cache` dan `route:cache` dijalankan.

---

## 14. Keputusan yang Perlu Disepakati Panitia

- Apakah suara kosong/abstain diperbolehkan (`allow_blank`)?
- Aturan jika terjadi seri (pemilihan ulang, undian, atau keputusan pembina)?
- Siapa yang memegang akun admin dan siapa yang boleh menekan tombol Tutup, Reveal, dan Umumkan Pemenang?
- Prosedur di lokasi jika siswa lupa/menghilangkan token.
