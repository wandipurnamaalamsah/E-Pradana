import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Settings2,
    Calendar,
    Shield,
    AlertTriangle,
    KeyRound,
    UserCheck,
    CheckCircle2,
    Lock,
    Unlock,
    RotateCcw,
    Radio,
    Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/confirmation-modal';

type SettingsData = {
    status: 'draft' | 'rehearsal' | 'open' | 'closed';
    start_at: string;
    end_at: string;
    schedule_enabled: boolean;
    manual_override: boolean;
    results_revealed: boolean;
    allow_blank: boolean;
};

type AdminUser = {
    id: number;
    name: string;
    username: string;
    email: string;
};

type Props = {
    settings: SettingsData;
    admin_user: AdminUser;
    counts: {
        voters: number;
        candidates: number;
        votes: number;
    };
};

const statusLabels: Record<
    string,
    { label: string; color: string; bg: string; border: string }
> = {
    draft: {
        label: 'Draft (Persiapan)',
        color: '#8B5A2B',
        bg: '#F5EFE6',
        border: '#E8D9C4',
    },
    rehearsal: {
        label: 'Gladi Bersih',
        color: '#8B5A2B',
        bg: '#F5EFE6',
        border: '#E8D9C4',
    },
    open: {
        label: 'Pemilihan Berlangsung (Open)',
        color: '#15803D',
        bg: '#F0FDF4',
        border: '#86EFAC',
    },
    closed: {
        label: 'Pemilihan Ditutup (Closed)',
        color: '#B91C1C',
        bg: '#FEF2F2',
        border: '#FCA5A5',
    },
};

export default function PengaturanPage({
    settings = {
        status: 'draft',
        start_at: '',
        end_at: '',
        schedule_enabled: false,
        manual_override: false,
        results_revealed: false,
        allow_blank: false,
    },
    admin_user = { id: 1, name: 'Admin', username: 'admin', email: '' },
    counts = { voters: 0, candidates: 0, votes: 0 },
}: Props) {
    // State Jadwal
    const [startAt, setStartAt] = useState(settings.start_at || '');
    const [endAt, setEndAt] = useState(settings.end_at || '');
    const [scheduleEnabled, setScheduleEnabled] = useState(
        settings.schedule_enabled,
    );

    // State Akun Admin
    const [adminName, setAdminName] = useState(admin_user.name || '');
    const [adminUsername, setAdminUsername] = useState(
        admin_user.username || '',
    );
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // State Reset DB
    const [resetConfirmation, setResetConfirmation] = useState('');

    // State Modal Konfirmasi Pengaturan
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        description: React.ReactNode;
        confirmText: string;
        variant: 'danger' | 'warning' | 'primary';
        action: () => void;
    }>({
        open: false,
        title: '',
        description: '',
        confirmText: 'Konfirmasi',
        variant: 'primary',
        action: () => {},
    });

    // Submit Jadwal
    const handleScheduleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            '/admin/pengaturan/schedule',
            {
                start_at: startAt || null,
                end_at: endAt || null,
                schedule_enabled: scheduleEnabled,
            },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Jadwal pemilihan berhasil diperbarui!'),
            },
        );
    };

    // Submit Master Control Status
    const handleStatusChange = (
        newStatus: 'draft' | 'rehearsal' | 'open' | 'closed',
    ) => {
        if (newStatus === settings.status) return;

        let confirmTitle = 'Ubah Status Pemilihan?';
        let confirmMsg = `Status pemilihan akan dialihkan menjadi ${newStatus.toUpperCase()}.`;
        let variant: 'danger' | 'warning' | 'primary' = 'primary';
        let confirmText = 'Ubah Status';

        if (newStatus === 'open') {
            confirmTitle = 'Buka Sesi Pemilihan?';
            confirmMsg =
                'Apakah Anda yakin ingin MEMBUKA pemilihan? Seluruh pemilih dengan token aktif dapat mulai mencoblos.';
            confirmText = 'Ya, Buka Pemilihan';
            variant = 'primary';
        } else if (newStatus === 'closed') {
            confirmTitle = 'Tutup Sesi Pemilihan?';
            confirmMsg =
                'Apakah Anda yakin ingin MENUTUP pemilihan? Bilik suara akan langsung dikunci dari pemilih.';
            confirmText = 'Ya, Tutup Pemilihan';
            variant = 'danger';
        }

        setConfirmModal({
            open: true,
            title: confirmTitle,
            description: confirmMsg,
            confirmText: confirmText,
            variant: variant,
            action: () => {
                router.post(
                    '/admin/pengaturan/status',
                    { status: newStatus },
                    {
                        preserveScroll: true,
                        onSuccess: () =>
                            toast.success(
                                `Status berhasil diubah menjadi ${newStatus.toUpperCase()}`,
                            ),
                    },
                );
            },
        });
    };

    // Submit Reset Sesi Pemilihan (Kembali ke Draft, 0 suara, DPT utuh)
    const handleResetElectionSession = () => {
        setConfirmModal({
            open: true,
            title: 'Reset Sesi Pemilihan ke Kondisi Awal?',
            description: (
                <div className="space-y-2 text-left text-xs text-neutral-600">
                    <p>
                        Tindakan ini akan mengembalikan proses pemilihan
                        seakan-akan <strong>belum pernah dimulai</strong>:
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-neutral-700">
                        <li>
                            Seluruh rekaman suara masuk akan{' '}
                            <strong>dihapus total (0 suara)</strong>.
                        </li>
                        <li>
                            Hak suara seluruh DPT dikembalikan menjadi{' '}
                            <strong>&ldquo;Belum Memilih&rdquo;</strong> (token
                            tetap aktif & dapat dipakai ulang).
                        </li>
                        <li>
                            Status sistem dikembalikan ke{' '}
                            <strong>DRAFT (Persiapan)</strong>.
                        </li>
                        <li>
                            Hasil buka suara / reveal mode akan dinonaktifkan
                            kembali.
                        </li>
                    </ul>
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 font-semibold text-emerald-800">
                        🛡️ Data master DPT siswa dan data kandidat tetap aman
                        dan tidak akan terhapus.
                    </p>
                </div>
            ),
            confirmText: 'Ya, Reset Sesi Pemilihan',
            variant: 'danger',
            action: () => {
                router.post(
                    '/admin/election/reset',
                    {},
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success(
                                'Sesi pemilihan berhasil direset total ke kondisi awal (Draft)!',
                            );
                            router.reload();
                        },
                    },
                );
            },
        });
    };

    // Submit Akun Panitia
    const handleAccountSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword && newPassword !== confirmPassword) {
            toast.error('Konfirmasi kata sandi tidak cocok!');
            return;
        }

        router.post(
            '/admin/pengaturan/account',
            {
                name: adminName,
                username: adminUsername,
                password: newPassword || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewPassword('');
                    setConfirmPassword('');
                    toast.success(
                        'Pengaturan profil panitia berhasil disimpan!',
                    );
                },
            },
        );
    };

    // Submit Reset Database
    const handleResetSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (resetConfirmation !== 'RESET') {
            toast.warning('Ketik kata "RESET" secara persis untuk konfirmasi.');
            return;
        }

        setConfirmModal({
            open: true,
            title: 'PERINGATAN TERAKHIR: Reset Seluruh Data?',
            description:
                'Seluruh data suara yang masuk, data kandidat, dan pemilih akan dihapus permanen dari database. Tindakan ini TIDAK DAPAT dibatalkan.',
            confirmText: 'Ya, Reset Seluruh Sistem',
            variant: 'danger',
            action: () => {
                router.post(
                    '/admin/pengaturan/reset',
                    { confirm_text: 'RESET' },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setResetConfirmation('');
                            toast.success(
                                'Sistem telah berhasil direset ke kondisi awal.',
                            );
                        },
                    },
                );
            },
        });
    };

    const currentStatusCfg =
        statusLabels[settings.status] || statusLabels.draft;

    return (
        <>
            <Head title="Pengaturan · E-Pradana" />

            <div
                className="flex flex-col gap-6 p-6"
                style={{ background: '#FDFBF7', minHeight: '100%' }}
            >
                {/* Header */}
                <div>
                    <h1
                        className="text-2xl font-black tracking-tight"
                        style={{ color: '#4A2E1B' }}
                    >
                        Pengaturan Sistem Pemilihan
                    </h1>
                    <p
                        className="text-sm font-medium"
                        style={{ color: '#8B5A2B' }}
                    >
                        Jadwal otomatis, master control bilik suara, kredensial
                        panitia, dan zona bahaya
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* ── KARTU 1: JADWAL PEMILIHAN OTOMATIS ── */}
                    <div
                        className="flex flex-col justify-between rounded-2xl p-6 shadow-sm"
                        style={{
                            background: '#fff',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <div>
                            <div
                                className="mb-4 flex items-center gap-3 border-b pb-4"
                                style={{ borderColor: '#E8D9C4' }}
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4A2E1B15] text-[#4A2E1B]">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3
                                        className="text-base font-extrabold"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        Jadwal Pemilihan Otomatis
                                    </h3>
                                    <p className="text-xs text-[#8B5A2B]">
                                        Tentukan jam buka dan jam tutup
                                        pemungutan suara
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={handleScheduleSubmit}
                                className="space-y-4"
                            >
                                <div>
                                    <label
                                        className="block text-xs font-bold"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        Waktu Buka Pemilihan (Mulai)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={startAt}
                                        onChange={(e) =>
                                            setStartAt(e.target.value)
                                        }
                                        className="mt-1 w-full rounded-xl px-3 py-2 text-xs font-medium outline-none"
                                        style={{
                                            background: '#FAF6F0',
                                            border: '1px solid #E8D9C4',
                                            color: '#4A2E1B',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label
                                        className="block text-xs font-bold"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        Waktu Tutup Pemilihan (Selesai)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={endAt}
                                        onChange={(e) =>
                                            setEndAt(e.target.value)
                                        }
                                        className="mt-1 w-full rounded-xl px-3 py-2 text-xs font-medium outline-none"
                                        style={{
                                            background: '#FAF6F0',
                                            border: '1px solid #E8D9C4',
                                            color: '#4A2E1B',
                                        }}
                                    />
                                </div>

                                <div className="flex items-center gap-2.5 rounded-xl border border-[#E8D9C4] bg-[#FAF6F0] p-3">
                                    <input
                                        type="checkbox"
                                        id="scheduleToggle"
                                        checked={scheduleEnabled}
                                        onChange={(e) =>
                                            setScheduleEnabled(e.target.checked)
                                        }
                                        className="h-4 w-4 cursor-pointer rounded accent-[#4A2E1B]"
                                    />
                                    <label
                                        htmlFor="scheduleToggle"
                                        className="cursor-pointer text-xs font-bold"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        Aktifkan Buka/Tutup Otomatis Berdasarkan
                                        Jadwal di Atas
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:scale-[1.01] active:scale-95"
                                    style={{ background: '#4A2E1B' }}
                                >
                                    <Save className="h-4 w-4" />
                                    Simpan Konfigurasi Jadwal
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ── KARTU 2: MASTER CONTROL (KONTROL STATUS) ── */}
                    <div
                        className="flex flex-col justify-between rounded-2xl p-6 shadow-sm"
                        style={{
                            background: '#fff',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <div>
                            <div
                                className="mb-4 flex items-center gap-3 border-b pb-4"
                                style={{ borderColor: '#E8D9C4' }}
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#8B5A2B]">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3
                                        className="text-base font-extrabold"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        Master Control Pemilihan
                                    </h3>
                                    <p className="text-xs text-[#8B5A2B]">
                                        Ubah status pemilihan secara instan /
                                        darurat
                                    </p>
                                </div>
                            </div>

                            {/* Badge Status Saat Ini */}
                            <div
                                className="mb-5 rounded-2xl p-4 text-center"
                                style={{
                                    background: currentStatusCfg.bg,
                                    border: `1.5px solid ${currentStatusCfg.border}`,
                                }}
                            >
                                <p className="text-xs font-bold tracking-wider text-neutral-500 uppercase">
                                    Status Sesi Saat Ini
                                </p>
                                <p
                                    className="mt-1 text-2xl font-black"
                                    style={{ color: currentStatusCfg.color }}
                                >
                                    {currentStatusCfg.label}
                                </p>
                            </div>

                            {/* 4 Tombol Pilihan Status */}
                            <div className="space-y-2.5">
                                <button
                                    type="button"
                                    onClick={() => handleStatusChange('open')}
                                    disabled={settings.status === 'open'}
                                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold text-white shadow-xs transition-all ${
                                        settings.status === 'open'
                                            ? 'cursor-not-allowed bg-emerald-800 opacity-40'
                                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Unlock className="h-4 w-4" />
                                        Buka Pemilihan (Open)
                                    </span>
                                    <span>Bilik Suara Aktif</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleStatusChange('closed')}
                                    disabled={settings.status === 'closed'}
                                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold text-white shadow-xs transition-all ${
                                        settings.status === 'closed'
                                            ? 'cursor-not-allowed bg-rose-800 opacity-40'
                                            : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Tutup Pemilihan (Closed)
                                    </span>
                                    <span>Voting Dikunci</span>
                                </button>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleStatusChange('rehearsal')
                                        }
                                        disabled={
                                            settings.status === 'rehearsal'
                                        }
                                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                                            settings.status === 'rehearsal'
                                                ? 'border-[#8B5A2B] bg-[#F5EFE6] text-[#4A2E1B]'
                                                : 'border-[#E8D9C4] bg-white text-[#8B5A2B] hover:bg-[#F5EFE6]'
                                        }`}
                                    >
                                        Gladi Bersih
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleStatusChange('draft')
                                        }
                                        disabled={settings.status === 'draft'}
                                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                                            settings.status === 'draft'
                                                ? 'border-[#E8D9C4] bg-[#F5EFE6] text-[#4A2E1B]'
                                                : 'border-[#E8D9C4] bg-[#FAF6F0] text-[#8B5A2B] hover:bg-[#F5EFE6]'
                                        }`}
                                    >
                                        Draft (Persiapan)
                                    </button>
                                </div>

                                <div
                                    className="border-t pt-2.5"
                                    style={{ borderColor: '#E8D9C4' }}
                                >
                                    <button
                                        type="button"
                                        onClick={handleResetElectionSession}
                                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 shadow-2xs transition-all hover:bg-rose-100 active:scale-95"
                                        title="Reset seluruh sesi pemilihan ke kondisi awal (Draft, 0 suara, DPT siap memilih ulang)"
                                    >
                                        <RotateCcw className="h-4 w-4 text-rose-600" />
                                        <span>
                                            Reset Sesi Pemilihan (Kembali ke
                                            Kondisi Awal)
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── KARTU 3: AKUN PANITIA / ADMINISTRATOR ── */}
                    <div
                        className="flex flex-col justify-between rounded-2xl p-6 shadow-sm"
                        style={{
                            background: '#fff',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <div>
                            <div
                                className="mb-4 flex items-center gap-3 border-b pb-4"
                                style={{ borderColor: '#E8D9C4' }}
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3
                                        className="text-base font-extrabold"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        Kredensial Akun Panitia
                                    </h3>
                                    <p className="text-xs text-[#8B5A2B]">
                                        Ubah nama, username, dan password login
                                        administrator
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={handleAccountSubmit}
                                className="space-y-3.5"
                            >
                                <div>
                                    <label
                                        className="block text-xs font-bold"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        Nama Lengkap Panitia
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={adminName}
                                        onChange={(e) =>
                                            setAdminName(e.target.value)
                                        }
                                        className="mt-1 w-full rounded-xl px-3 py-2 text-xs font-medium outline-none"
                                        style={{
                                            background: '#FAF6F0',
                                            border: '1px solid #E8D9C4',
                                            color: '#4A2E1B',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label
                                        className="block text-xs font-bold"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        Username Login Admin
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={adminUsername}
                                        onChange={(e) =>
                                            setAdminUsername(e.target.value)
                                        }
                                        className="mt-1 w-full rounded-xl px-3 py-2 font-mono text-xs font-bold outline-none"
                                        style={{
                                            background: '#FAF6F0',
                                            border: '1px solid #E8D9C4',
                                            color: '#4A2E1B',
                                        }}
                                    />
                                </div>

                                <div
                                    className="grid grid-cols-2 gap-2 border-t pt-1"
                                    style={{ borderColor: '#E8D9C4' }}
                                >
                                    <div>
                                        <label
                                            className="block text-[11px] font-bold"
                                            style={{ color: '#4A2E1B' }}
                                        >
                                            Password Baru (Opsional)
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Kosongkan jika tetap"
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(e.target.value)
                                            }
                                            className="mt-1 w-full rounded-xl px-3 py-2 text-xs outline-none"
                                            style={{
                                                background: '#FAF6F0',
                                                border: '1px solid #E8D9C4',
                                                color: '#4A2E1B',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className="block text-[11px] font-bold"
                                            style={{ color: '#4A2E1B' }}
                                        >
                                            Ulangi Password Baru
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Ulangi password"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 w-full rounded-xl px-3 py-2 text-xs outline-none"
                                            style={{
                                                background: '#FAF6F0',
                                                border: '1px solid #E8D9C4',
                                                color: '#4A2E1B',
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:scale-[1.01] active:scale-95"
                                    style={{ background: '#4A2E1B' }}
                                >
                                    <UserCheck className="h-4 w-4" />
                                    Perbarui Akun Panitia
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ── KARTU 4: ZONA BAHAYA (RESET DATABASE) ── */}
                    <div
                        className="flex flex-col justify-between rounded-2xl p-6 shadow-sm"
                        style={{
                            background: '#FEF2F2',
                            border: '1.5px solid #FCA5A5',
                        }}
                    >
                        <div>
                            <div className="mb-4 flex items-center gap-3 border-b border-rose-200 pb-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-rose-900">
                                        Zona Bahaya: Reset Database
                                    </h3>
                                    <p className="text-xs text-rose-700">
                                        Kosongkan seluruh data suara, kandidat,
                                        dan pemilih
                                    </p>
                                </div>
                            </div>

                            {/* Ringkasan Data yang Akan Dihapus */}
                            <div className="mb-4 space-y-1 rounded-xl border border-rose-200 bg-white/70 p-3 text-xs">
                                <p className="font-bold text-rose-900">
                                    Data yang tersimpan saat ini:
                                </p>
                                <ul className="list-disc space-y-0.5 pl-4 text-rose-800">
                                    <li>
                                        Total DPT:{' '}
                                        <strong>{counts.voters} pemilih</strong>
                                    </li>
                                    <li>
                                        Kandidat:{' '}
                                        <strong>
                                            {counts.candidates} kandidat
                                        </strong>
                                    </li>
                                    <li>
                                        Suara Masuk:{' '}
                                        <strong>{counts.votes} suara</strong>
                                    </li>
                                </ul>
                            </div>

                            <form
                                onSubmit={handleResetSubmit}
                                className="space-y-3"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-rose-900">
                                        Ketik kata{' '}
                                        <code className="rounded bg-rose-200 px-1 font-black text-rose-950">
                                            RESET
                                        </code>{' '}
                                        untuk konfirmasi:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ketik RESET"
                                        value={resetConfirmation}
                                        onChange={(e) =>
                                            setResetConfirmation(e.target.value)
                                        }
                                        className="mt-1 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-black tracking-widest text-rose-900 outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        resetConfirmation !== 'RESET' ||
                                        settings.status === 'open'
                                    }
                                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-sm transition-all ${
                                        resetConfirmation === 'RESET' &&
                                        settings.status !== 'open'
                                            ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                                            : 'cursor-not-allowed bg-rose-400 opacity-40'
                                    }`}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Hapus & Reset Database Sekarang
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Modal Konfirmasi Pengaturan */}
            <ConfirmationModal
                open={confirmModal.open}
                onOpenChange={(open) =>
                    setConfirmModal((prev) => ({ ...prev, open }))
                }
                title={confirmModal.title}
                description={confirmModal.description}
                confirmText={confirmModal.confirmText}
                cancelText="Batal"
                variant={confirmModal.variant}
                onConfirm={() => {
                    confirmModal.action();
                    setConfirmModal((prev) => ({ ...prev, open: false }));
                }}
            />
        </>
    );
}

PengaturanPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pengaturan', href: '/admin/pengaturan' },
    ],
};
