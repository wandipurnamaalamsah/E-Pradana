import { useState } from 'react';
import { Head, router, setLayoutProps } from '@inertiajs/react';
import {
    ScrollText,
    Search,
    Clock,
    User,
    Activity,
    Info,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/confirmation-modal';

type AuditLogItem = {
    id: number;
    user_id: number | null;
    action: string;
    meta: Record<string, any> | null;
    created_at: string;
    user_name: string | null;
    user_username: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    logs: {
        data: AuditLogItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLink[];
    };
    filters: {
        search: string;
        action: string;
    };
    stats: {
        total: number;
        today: number;
    };
    available_actions: Record<string, string>;
};

// Pemetaan badge aksi
const actionConfig: Record<
    string,
    { label: string; bg: string; color: string; icon: string }
> = {
    open_election: {
        label: 'Buka Pemilihan',
        bg: '#F0FDF4',
        color: '#15803D',
        icon: '🟢',
    },
    force_open: {
        label: 'Buka Paksa (Manual)',
        bg: '#F0FDF4',
        color: '#15803D',
        icon: '🟢',
    },
    auto_open: {
        label: 'Buka Otomatis',
        bg: '#F0FDF4',
        color: '#15803D',
        icon: '⏰',
    },
    close_election: {
        label: 'Tutup Pemilihan',
        bg: '#FEF2F2',
        color: '#B91C1C',
        icon: '🛑',
    },
    force_close: {
        label: 'Tutup Paksa (Manual)',
        bg: '#FEF2F2',
        color: '#B91C1C',
        icon: '🛑',
    },
    auto_close: {
        label: 'Tutup Otomatis',
        bg: '#FEF2F2',
        color: '#B91C1C',
        icon: '⏰',
    },
    reopen_emergency: {
        label: 'Buka Darurat',
        bg: '#FFFBEB',
        color: '#B45309',
        icon: '⚠️',
    },
    reveal: {
        label: 'Buka Hasil (Reveal)',
        bg: '#FEFCE8',
        color: '#A16207',
        icon: '✨',
    },
    announce_winner: {
        label: 'Umumkan Pemenang',
        bg: '#FEF3C7',
        color: '#92400E',
        icon: '🏆',
    },
    add_voter: {
        label: 'Tambah Pemilih DPT',
        bg: '#F5EFE6',
        color: '#8B5A2B',
        icon: '👤',
    },
    import_dpt: {
        label: 'Impor DPT Massal',
        bg: '#F5EFE6',
        color: '#8B5A2B',
        icon: '📥',
    },
    reset_token: {
        label: 'Reset Token Pemilih',
        bg: '#F5F3FF',
        color: '#6D28D9',
        icon: '🔑',
    },
    regenerate_token: {
        label: 'Generate Ulang Token',
        bg: '#F5F3FF',
        color: '#6D28D9',
        icon: '🔑',
    },
    update_schedule: {
        label: 'Ubah Jadwal',
        bg: '#FAF5FF',
        color: '#7E22CE',
        icon: '📅',
    },
    update_settings: {
        label: 'Ubah Pengaturan',
        bg: '#F5EFE6',
        color: '#4A2E1B',
        icon: '⚙️',
    },
    reset_database: {
        label: 'Reset Database',
        bg: '#FEF2F2',
        color: '#991B1B',
        icon: '🗑️',
    },
};

export default function AuditLogPage({
    logs,
    filters,
    stats,
    available_actions,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Audit Log', href: '/admin/audit-log' },
        ],
    });

    const [search, setSearch] = useState(filters?.search || '');
    const [selectedAction, setSelectedAction] = useState(filters?.action || '');

    // State Modal Konfirmasi Hapus Log
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        description: string;
        confirmText: string;
        variant: 'danger' | 'warning' | 'primary';
        action: () => void;
    }>({
        open: false,
        title: '',
        description: '',
        confirmText: 'Konfirmasi',
        variant: 'danger',
        action: () => {},
    });

    const applyFilters = (newSearch?: string, newAction?: string) => {
        router.get(
            '/admin/audit-log',
            {
                search: newSearch !== undefined ? newSearch : search,
                action: newAction !== undefined ? newAction : selectedAction,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Hapus satu catatan log
    const handleDeleteLog = (item: AuditLogItem) => {
        const cfg = actionConfig[item.action] || { label: item.action };
        setConfirmModal({
            open: true,
            title: 'Hapus Catatan Log?',
            description: `Apakah Anda yakin ingin menghapus catatan rekam jejak "${cfg.label}" pada ${formatDate(item.created_at)}? Tindakan ini tidak dapat dibatalkan.`,
            confirmText: 'Ya, Hapus Log',
            variant: 'danger',
            action: () => {
                router.delete(`/admin/audit-log/${item.id}`, {
                    onSuccess: () =>
                        toast.success('Catatan log berhasil dihapus.'),
                });
            },
        });
    };

    // Bersihkan seluruh audit log
    const handleClearAllLogs = () => {
        setConfirmModal({
            open: true,
            title: 'BERSIHKAN SELURUH AUDIT LOG?',
            description:
                'PERINGATAN KRUSIAL: Seluruh riwayat rekam jejak aktivitas panitia dan sistem akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Ya, Kosongkan Semua Log',
            variant: 'danger',
            action: () => {
                router.delete('/admin/audit-log', {
                    onSuccess: () =>
                        toast.success(
                            'Seluruh catatan audit log berhasil dibersihkan.',
                        ),
                });
            },
        });
    };

    // Format Tanggal
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <>
            <Head title="Audit Log · E-Pradana" />

            <div
                className="flex flex-col gap-6 p-6"
                style={{ background: '#FDFBF7', minHeight: '100%' }}
            >
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1
                                className="text-2xl font-black tracking-tight"
                                style={{ color: '#4A2E1B' }}
                            >
                                Audit Log & Rekam Jejak
                            </h1>
                            <span
                                className="rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase"
                                style={{
                                    background: '#4A2E1B15',
                                    color: '#4A2E1B',
                                }}
                            >
                                Akuntabilitas
                            </span>
                        </div>
                        <p
                            className="text-sm font-medium"
                            style={{ color: '#8B5A2B' }}
                        >
                            Rekaman kronologis aksi panitia pemilihan tersimpan
                            aman demi transparansi ambalan
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => router.reload()}
                            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all hover:bg-[#F5EFE6]"
                            style={{
                                background: '#fff',
                                border: '1px solid #E8D9C4',
                                color: '#4A2E1B',
                            }}
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Refresh Log
                        </button>

                        {stats.total > 0 && (
                            <button
                                onClick={handleClearAllLogs}
                                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 shadow-2xs transition-colors hover:bg-rose-50"
                                title="Bersihkan seluruh riwayat rekam jejak audit log"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Bersihkan Semua Log</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Info Note: Penegasan Asas Rahasia Bilik Suara */}
                <div
                    className="flex items-start gap-3.5 rounded-2xl p-4 text-xs font-medium"
                    style={{
                        background: '#F5EFE6',
                        border: '1px solid #E8D9C4',
                        color: '#4A2E1B',
                    }}
                >
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#8B5A2B]" />
                    <div className="leading-relaxed">
                        <strong>Prinsip Kerahasiaan Pemilihan:</strong> Log ini
                        hanya mencatat{' '}
                        <strong>aksi panitia dan administrator</strong> (seperti
                        jadwal, buka/tutup sistem, impor data, atau reset
                        kredensial). Pilihan suara pemilih dan token siswa{' '}
                        <strong>TIDAK PERNAH</strong> dicatat di dalam audit log
                        demi menjamin asas Luber & Jurdil.
                    </div>
                </div>

                {/* 2 Mini Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div
                        className="flex items-center justify-between rounded-2xl p-4 shadow-2xs"
                        style={{
                            background: '#fff',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <div>
                            <p className="text-xs font-bold tracking-wider text-[#8B5A2B] uppercase">
                                Total Aktivitas Tercatat
                            </p>
                            <p
                                className="mt-1 text-2xl font-black"
                                style={{ color: '#4A2E1B' }}
                            >
                                {stats.total}{' '}
                                <span className="text-xs font-normal text-[#8B5A2B]">
                                    log aktivitas
                                </span>
                            </p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4A2E1B15] text-[#4A2E1B]">
                            <ScrollText className="h-5 w-5" />
                        </div>
                    </div>

                    <div
                        className="flex items-center justify-between rounded-2xl p-4 shadow-2xs"
                        style={{
                            background: '#fff',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <div>
                            <p className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
                                Aksi Panitia Hari Ini
                            </p>
                            <p className="mt-1 text-2xl font-black text-emerald-700">
                                {stats.today}{' '}
                                <span className="text-xs font-normal text-emerald-600">
                                    aktivitas baru
                                </span>
                            </p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <Activity className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div
                    className="flex flex-col gap-3 rounded-2xl p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between"
                    style={{ background: '#fff', border: '1px solid #E8D9C4' }}
                >
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8B5A2B]" />
                        <input
                            type="text"
                            placeholder="Cari aksi, nama admin, atau detail keterangan..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                applyFilters(e.target.value, undefined);
                            }}
                            className="w-full rounded-xl py-2 pr-4 pl-9 text-xs font-medium outline-none"
                            style={{
                                background: '#FAF6F0',
                                border: '1px solid #E8D9C4',
                                color: '#4A2E1B',
                            }}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg border border-[#E8D9C4] bg-[#FAF6F0] px-2.5 py-1 text-[11px] font-semibold text-[#8B5A2B]">
                            ⚡ 10 Aktivitas Terakhir / Halaman
                        </span>
                        <select
                            value={selectedAction}
                            onChange={(e) => {
                                setSelectedAction(e.target.value);
                                applyFilters(undefined, e.target.value);
                            }}
                            className="cursor-pointer rounded-xl px-3 py-2 text-xs font-bold outline-none"
                            style={{
                                background: '#FAF6F0',
                                border: '1px solid #E8D9C4',
                                color: '#4A2E1B',
                            }}
                        >
                            <option value="">Semua Kategori Aksi</option>
                            {Object.entries(available_actions).map(
                                ([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                </div>

                {/* Tabel Audit Log */}
                <div
                    className="flex flex-col overflow-hidden rounded-2xl shadow-sm"
                    style={{ background: '#fff', border: '1px solid #E8D9C4' }}
                >
                    {/* Header Tabel */}
                    <div
                        className="grid grid-cols-12 px-5 py-3 text-xs font-black tracking-wider uppercase"
                        style={{ background: '#4A2E1B', color: '#D4AF37' }}
                    >
                        <span className="col-span-3">Waktu Eksekusi</span>
                        <span className="col-span-2">Pelaksana</span>
                        <span className="col-span-3">Aksi Terdaftar</span>
                        <span className="col-span-3">Detail Metadata</span>
                        <span className="col-span-1 text-right">Aksi</span>
                    </div>

                    {/* Baris Log */}
                    {logs.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <ScrollText className="mb-2 h-10 w-10 text-neutral-300" />
                            <p
                                className="text-sm font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                Belum Ada Log Terdata
                            </p>
                            <p className="mt-1 text-xs text-[#8B5A2B]">
                                Setiap tindakan panitia (membuka sesi, mengatur
                                kandidat, atau mengubah jadwal) akan tercatat di
                                sini secara otomatis.
                            </p>
                        </div>
                    ) : (
                        <div
                            className="divide-y"
                            style={{ borderColor: '#E8D9C4' }}
                        >
                            {logs.data.map((item) => {
                                const cfg = actionConfig[item.action] || {
                                    label: item.action,
                                    bg: '#F5EFE6',
                                    color: '#4A2E1B',
                                    icon: '📌',
                                };

                                return (
                                    <div
                                        key={item.id}
                                        className="grid grid-cols-12 items-center px-5 py-3.5 text-xs transition-colors hover:bg-[#FAF6F0]"
                                    >
                                        {/* Waktu */}
                                        <div className="col-span-3 flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 shrink-0 text-[#8B5A2B]" />
                                            <span className="font-mono font-medium text-neutral-600">
                                                {formatDate(item.created_at)}
                                            </span>
                                        </div>

                                        {/* Admin Pelaksana */}
                                        <div className="col-span-2 flex min-w-0 items-center gap-1.5 pr-2">
                                            <User className="h-3.5 w-3.5 shrink-0 text-[#8B5A2B]" />
                                            <span
                                                className="truncate font-bold"
                                                style={{ color: '#4A2E1B' }}
                                            >
                                                {item.user_name ||
                                                    item.user_username ||
                                                    'Sistem'}
                                            </span>
                                        </div>

                                        {/* Badge Aksi */}
                                        <div className="col-span-3">
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-2xs"
                                                style={{
                                                    background: cfg.bg,
                                                    color: cfg.color,
                                                }}
                                            >
                                                <span>{cfg.icon}</span>
                                                <span>{cfg.label}</span>
                                            </span>
                                        </div>

                                        {/* Detail Metadata */}
                                        <div className="col-span-3 min-w-0 text-neutral-600">
                                            {item.meta ? (
                                                <div className="truncate rounded-lg border border-[#E8D9C4] bg-[#FAF6F0] p-1.5 font-mono text-[11px]">
                                                    {Object.entries(
                                                        item.meta,
                                                    ).map(([k, v]) => (
                                                        <span
                                                            key={k}
                                                            className="mr-2"
                                                        >
                                                            <strong className="text-[#8B5A2B]">
                                                                {k}:
                                                            </strong>{' '}
                                                            {String(v)}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400 italic">
                                                    —
                                                </span>
                                            )}
                                        </div>

                                        {/* Tombol Hapus Log Individu */}
                                        <div className="col-span-1 flex items-center justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteLog(item)}
                                                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                                title="Hapus log ini"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {logs.last_page > 1 && (
                        <div
                            className="flex items-center justify-between border-t px-5 py-3 text-xs"
                            style={{
                                borderColor: '#E8D9C4',
                                background: '#FAF6F0',
                            }}
                        >
                            <span className="font-medium text-[#8B5A2B]">
                                Menampilkan {logs.data.length} dari {logs.total}{' '}
                                log
                            </span>

                            <div className="flex items-center gap-1">
                                {logs.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url &&
                                            router.visit(link.url, {
                                                preserveScroll: true,
                                            })
                                        }
                                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                            link.active
                                                ? 'bg-[#4A2E1B] text-[#D4AF37]'
                                                : 'text-[#4A2E1B] hover:bg-[#F5EFE6]'
                                        } ${!link.url ? 'cursor-not-allowed opacity-40' : ''}`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Konfirmasi */}
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
