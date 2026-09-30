# ⚜️ E-Pradana · Sistem E-Voting Pemilihan Pradana Ambalan Pramuka

> **Aplikasi Pemilihan Suara Elektronik (E-Voting) Modern, Terenkripsi, Transparan, dan Menjunjung Tinggi Asas LUBER JURDIL (Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil) untuk Ambalan Penegak Pramuka.**

---

## 📌 Daftar Isi
1. [Tentang Sistem](#-tentang-sistem)
2. [Prinsip & Keamanan Utama](#-prinsip--keamanan-utama)
3. [Teknologi yang Digunakan (Tech Stack)](#-teknologi-yang-digunakan-tech-stack)
4. [Arsitektur & Alur Autentikasi](#-arsitektur--alur-autentikasi)
5. [Fitur-Fitur Sistem](#-fitur-fitur-sistem)
   - [Panel Pemilih (Bilik Suara Siswa)](#1-panel-pemilih-bilik-suara-siswa)
   - [Panel Panitia (Administrator)](#2-panel-panitia-administrator)
6. [Struktur Basis Data](#-struktur-basis-data)
7. [Mekanisme Rahasia Kotak Suara](#-mekanisme-rahasia-kotak-suara)
8. [Panduan Instalasi & Menjalankan Proyek](#-panduan-instalasi--menjalankan-proyek)
9. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
10. [Lisensi & Pengembang](#-lisensi--pengembang)

---

## 📖 Tentang Sistem

**E-Pradana** adalah platform pemungutan suara berbasis web yang dirancang khusus untuk memfasilitasi musyawarah ambalan dan suksesi kepemimpinan **Pradana Putra** & **Pradana Putri** pada Gugus Depan Gerakan Pramuka Penegak.

Sistem ini menggantikan proses coblos manual kertas yang rentan manipulasi, boros biaya, dan memakan waktu rekapitulasi, dengan pengalaman digital yang intuitif, cepat, responsif, dan aman.

---

## 🛡️ Prinsip & Keamanan Utama

1. **Rahasia Mutlak (*Secret Ballot*)**: Pilihan suara pemilih tidak menyimpan identitas siapa yang memilih di tabel suara (`votes`). Tabel `votes` menggunakan UUID acak dan terpisah dari identitas pemilih (`voters`).
2. **Token Sekali Pakai (*Single-Use Token*)**: Setiap pemilih dalam Daftar Pemilih Tetap (DPT) diberikan kombinasi Username & Token Akses acak (6-8 karakter). Token otomatis kedaluwarsa seketika setelah suara tersimpan.
3. **Anti-Penerobosan (*Strict Session Guard*)**: 
   - Tamu / pengguna yang belum login tidak dapat mengakses panel admin (`/dashboard`, `/admin/*`) atau bilik suara (`/voter/*`). Sistem otomatis melempar (*redirect*) ke halaman login.
   - Sesi voter divalidasi ganda di database. Voter yang sudah memilih (`has_voted = 1`) dilarang masuk kembali ke bilik suara.
4. **Pencegahan Multi-Tab & Balapan Suara (*Race Condition Prevention*)**: Menggunakan database transaction dan `lockForUpdate()` saat pencatatan surat suara untuk mencegah token dipakai lebih dari sekali secara bersamaan.
5. **Keamanan Akun Panitia Tingkat Tinggi**: Mendukung autentikasi dua faktor (**2FA / TOTP** via Authenticator App) dan **Passkeys (FIDO2 / WebAuthn / Biometrik)**.
6. **Audit Trail Lengkap**: Semua aksi vital panitia (buka/tutup sesi, reset database, reset token DPT, pengumuman hasil) tercatat secara terperinci di Audit Log.

---

## 💻 Teknologi yang Digunakan (Tech Stack)

### Backend
- **Framework**: [Laravel 11.x](https://laravel.com/) (PHP 8.2+)
- **Autentikasi**: Laravel Fortify + Custom Unified Auth Controller
- **Database**: MySQL / MariaDB (Didukung Eloquent ORM & Query Builder)
- **Session Driver**: Database / File-based session management

### Frontend
- **SPA Bridge**: [Inertia.js v2 (React)](https://inertiajs.com/)
- **UI Library**: React 19 + TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animasi & Transisi**: [Framer Motion](https://www.framer.com/motion/)
- **Ikonografi**: [Lucide React](https://lucide.dev/)
- **Notifikasi**: [Sonner Toaster](https://sonner.emilkowal.ski/)
- **Bundler & Tooling**: [Vite 8](https://vitejs.dev/) + Vite Plus (`vp`)

---

## 🔄 Arsitektur & Alur Autentikasi

E-Pradana menggunakan arsitektur **Form Login Terpadu (Unified Single Form)** di `/login`:

```
               [ Halaman /login ]
                       │
       Masukkan Kredensial & Submit
                       │
             UnifiedAuthController
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
   Cek Akun Admin?            Cek Akun Pemilih (DPT)?
 (Hash::check Password)       (Cocokkan Token Akses SHA-256)
        │                             │
   [Berhasil]                    [Berhasil]
        ▼                             ▼
Auth::guard('web')->login()   Buat Token Sesi Voter Unik
Redirect ke /dashboard        Redirect ke /voter/dashboard?vt=...
```

- **Jika Admin Login**: Otomatis diarahkan ke Dashboard Panitia.
- **Jika Pemilih Login**: Otomatis diarahkan ke Bilik Suara Siswa dengan token sesi terproteksi.
- **Jika Pengunjung Mencoba Menerobos Tanpa Login**:
  - Mengakses rute admin: Langsung ditolak oleh `redirectGuestsTo` dan diredirect ke `/login`.
  - Mengakses bilik suara: Langsung ditolak oleh middleware `EnsureVoterSession` dan diredirect ke `/login`.

---

## ✨ Fitur-Fitur Sistem

### 1. Panel Pemilih (Bilik Suara Siswa)
- **Fixed Top Header**: Navbar atas menempel (*fixed*) di layar saat pemilih membaca profil panjang atau menggulir layar.
- **Sidebar Navigasi & Scroll-Spy**: Menavigasi dengan halus (*smooth scroll*) ke 4 bagian utama:
  1. *Tata Cara Pemilihan*
  2. *Profil Calon Pradana Putra*
  3. *Profil Calon Pradana Putri*
  4. *Bilik Suara Digital (Pencoblosan)*
- **Profil Lengkap Kandidat**: Foto resmi kandidat berseragam pramuka, nomor urut, biodata kelas, visi, misi, dan program kerja unggulan.
- **Bilik Suara 2 Kategori**:
  - Tab Calon Pradana Putra
  - Tab Calon Pradana Putri
  - Pilihan bebas diganti sebelum menekan tombol konfirmasi final.
  - Dukungan opsi **Kotak Kosong / Abstain** (jika diizinkan oleh panitia).
- **Modal Konfirmasi Suara**: Memunculkan pratinjau kartu calon yang dipilih sebelum suara dicatat secara permanen.
- **Struk / Tanda Bukti Pemilihan**: Sesi ucapan terima kasih dan validasi bahwa suara telah berhasil dimasukkan ke kotak suara digital.
- **Tombol Keluar Bersih**: Mengosongkan sesi voter tanpa memutus sesi admin yang mungkin terbuka di bilik terpisah.

---

### 2. Panel Panitia (Administrator)
- **Dashboard Monitoring Real-Time**:
  - Widget statistik: Total DPT, Suara Masuk, Belum Memilih, dan Golput/Abstain.
  - Persentase partisipasi pemilih diperbarui secara instan.
  - Diagram suara per kandidat terkunci (*hidden*) selama proses pemilihan untuk menjaga netralitas dan kerahasiaan.
- **Kontrol Status Pemilihan**:
  - `Draft`: Tahap persiapan, bilik suara belum bisa digunakan untuk memilih.
  - `Rehearsal`: Mode gladi bersih / simulasi uji coba sistem.
  - `Open`: Pemilihan resmi dibuka, pemilih di bilik suara dapat mencoblos.
  - `Closed`: Pemilihan ditutup, suara tidak dapat diubah lagi.
- **Fitur Buka Kunci Hasil (*Reveal Results*)**: Tombol interaktif untuk membuka tabulasi suara secara dramatis dan transparan setelah pemilihan ditutup.
- **Penetapan Pemenang (*Announce Winner*)**: Otomatis mengidentifikasi perolehan suara terbanyak untuk Pradana Putra & Putri terpilih.
- **Manajemen DPT (Daftar Pemilih Tetap)**:
  - Tambah, ubah, dan hapus pemilih.
  - **Import Data CSV massal** dengan format sederhana (`Nama, Kelas, Username`).
  - **Cetak Kartu Pemilih**: Siap cetak / export ke format printer tiket/kartu suara berisi Username & Token Akses.
  - **Reset Token**: Generate token baru jika pemilih lupa token sebelum mencoblos.
  - Hapus seluruh DPT sekaligus.
- **Manajemen Kandidat**:
  - Kelola calon Pradana Putra dan Pradana Putri.
  - Upload foto kandidat, nomor urut, visi, misi, dan kelas.
- **Audit Log Terperinci**:
  - Rekam jejak seluruh aktivitas krusial sistem dengan waktu, pelaku, dan payload metadata JSON.
  - Pencarian log dan filter kategori aksi.
- **Pengaturan & Keamanan Sistem**:
  - Jadwal otomatis buka dan tutup pemilihan berdasarkan tanggal & jam.
  - Toggle izin suara kotak kosong (*allow blank vote*).
  - Manajemen keamanan akun panitia (Ubah Password, Setup 2FA OTP, Manajemen Passkeys).
  - Fitur Reset Pemilihan / Database dengan modal konfirmasi keamanan ganda.

---

## 🗄️ Struktur Basis Data

| Nama Tabel | Fungsi Utama |
|---|---|
| `users` | Akun Administrator / Panitia pemilihan (Username, Password hash, 2FA secret). |
| `voters` | Data pemilih DPT (Nama, Kelas, Username, Token Akses unik, status `has_voted`). |
| `candidates` | Data pasangan calon Pradana Putra & Putri (Nomor Urut, Kategori, Foto, Visi, Misi). |
| `votes` | **Kotak Suara Rahasia**: Menyimpan ID kandidat putra & putri dengan UUID acak. **Tidak ada relasi ke ID pemilih**. |
| `settings` | Konfigurasi global sistem (Status pemilihan, jadwal waktu, opsi blank vote, reveal status). |
| `audit_logs` | Jejak rekam aktivitas admin (Action, Meta payload, User ID, Timestamp). |
| `passkeys` | Penyimpanan kredensial WebAuthn / Passkey biometrik admin. |

---

## 🔒 Mekanisme Rahasia Kotak Suara

Untuk menjamin asas **Rahasia**, pencatatan suara dilakukan secara independen:

1. Saat pemilih menekan **"Kirim Suara"**, sistem menjalankan *Database Transaction*:
   ```php
   // 1. Simpan surat suara secara anonim tanpa identitas pemilih
   DB::table('votes')->insert([
       'id'                 => (string) Str::uuid(),
       'candidate_putra_id' => $putraId,
       'candidate_putri_id' => $putriId,
   ]);

   // 2. Tandai akun pemilih bahwa hak suaranya telah digunakan
   DB::table('voters')->where('id', $voterId)->update([
       'has_voted' => 1,
   ]);
   ```
2. Dari struktur di atas, **tidak ada kunci asing (*foreign key*)** antara tabel `votes` dan tabel `voters`.
3. Panitia maupun pengembang database tidak dapat melacak suara kandidat mana yang dicoblos oleh siswa tertentu.

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### Persyaratan Lingkungan
- PHP `>= 8.2` (dengan ekstensi `pdo`, `mbstring`, `openssl`, `curl`)
- [Composer](https://getcomposer.org/)
- [Node.js](https://nodejs.org/) `>= 20.x` & NPM
- MySQL / MariaDB

### Langkah-Langkah Pemasangan

1. **Clone atau Buka Direktori Proyek**:
   ```bash
   cd e-pradana
   ```

2. **Pasang Dependensi Backend (PHP)**:
   ```bash
   composer install
   ```

3. **Pasang Dependensi Frontend (JavaScript/React)**:
   ```bash
   npm install
   ```

4. **Konfigurasi Environment**:
   Salin file konfigurasi `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```
   Atur koneksi database di file `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=e_pradana
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. **Generate Application Key**:
   ```bash
   php artisan key:generate
   ```

6. **Jalankan Migrasi Database & Seeder**:
   ```bash
   php artisan migrate --seed
   ```

7. **Buat Tautan Storage Asset (Foto Kandidat)**:
   ```bash
   php artisan storage:link
   ```

8. **Menjalankan Server Pengembangan (Dev Server)**:
   - Terminal 1 (Backend Laravel):
     ```bash
     php artisan serve
     ```
   - Terminal 2 (Frontend Vite):
     ```bash
     npm run dev
     ```

9. **Buka Aplikasi**:
   Akses di browser melalui: `http://localhost:8000` atau via Laravel Herd `http://e-pradana.test`.

---

## 📁 Struktur Direktori Proyek

```plaintext
e-pradana/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/              # Dashboard, DPT, Kandidat, Audit, Pengaturan
│   │   │   ├── Auth/               # UnifiedAuthController (Login terpadu)
│   │   │   └── Voter/              # VoterDashboardController (Bilik suara)
│   │   └── Middleware/             # EnsureVoterSession, HandleInertiaRequests, dll
│   └── Models/                     # User, Voter, Candidate, Vote, Setting, AuditLog
├── database/
│   ├── migrations/                 # Skema tabel database
│   └── seeders/                    # Data awal kandidat, admin, dan pengaturan
├── resources/
│   ├── css/
│   │   └── app.css                 # Style global & Tailwind CSS v4 setup
│   └── js/
│       ├── components/             # Reusable UI (Dialog, Table, Modal, Button, dll)
│       ├── layouts/                # AppLayout, AuthLayout, SettingsLayout
│       ├── pages/
│       │   ├── admin/              # Halaman DPT, Kandidat, Audit Log, Pengaturan
│       │   ├── auth/               # Login, Two-Factor Challenge, Confirm Password
│       │   ├── voter/              # Dashboard Bilik Suara Siswa
│       │   └── dashboard.tsx       # Dashboard Utama Admin (Statistik & Hasil)
│       ├── routes/                 # Wayfinder generated route helpers
│       ├── types/                  # TypeScript interface & global definitions
│       └── app.tsx                 # Entrypoint Inertia React App
├── routes/
│   ├── web.php                     # Definisi rute web utama
│   └── settings.php                # Rute profil, keamanan & pengaturan akun
└── package.json
```

---

## 📄 Lisensi & Kredit

- **Aplikasi**: E-Pradana E-Voting Engine
- **Peruntukan**: Ambalan Penegak Gerakan Pramuka
- **Pengembang**: Wandi Purnama Alamsah ([wandipurnamaalamsah@gmail.com](mailto:wandipurnamaalamsah@gmail.com))
- **Lisensi**: Proyek ini dilisensikan di bawah lisensi terbuka untuk kemajuan organisasi kepanduan.
