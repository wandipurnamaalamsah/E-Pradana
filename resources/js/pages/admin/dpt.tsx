import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Users,
    Upload,
    Printer,
    Search,
    Plus,
    KeyRound,
    Edit2,
    Trash2,
    AlertCircle,
    X,
    FileSpreadsheet,
    RotateCcw,
    ShieldAlert,
    CheckCircle2,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/confirmation-modal';

type Voter = {
    id: number;
    name: string;
    class: string;
    username: string;
    token?: string | null;
    has_voted: number;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    voters: {
        data: Voter[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLink[];
    };
    stats: {
        total: number;
        sudah_memilih: number;
        belum_memilih: number;
    };
    classes: string[];
    filters: {
        search: string;
        class: string;
        status: string;
    };
    flash_token?: {
        id: number;
        name: string;
        username: string;
        token: string;
    } | null;
};

export default function DptPage({
    voters = {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        links: [],
    },
    stats = { total: 0, sudah_memilih: 0, belum_memilih: 0 },
    classes = [],
    filters = { search: '', class: '', status: 'all' },
    flash_token = null,
}: Props) {
    // Search & Filter State
    const [search, setSearch] = useState(filters.search || '');
    const [selectedClass, setSelectedClass] = useState(filters.class || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    // State Modal Single Voter (Add/Edit)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
    const [name, setName] = useState('');
    const [className, setClassName] = useState('');
    const [username, setUsername] = useState('');
    const [customToken, setCustomToken] = useState('');

    // State Modal Import CSV
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);

    // State Modal Reset Manajemen DPT
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetType, setResetType] = useState<'status' | 'tokens' | 'clear'>('status');
    const [resetClassScope, setResetClassScope] = useState<string>('all');

    // State Modal Konfirmasi DPT
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
        variant: 'primary',
        action: () => {},
    });

    // Search submit
    const applyFilters = (
        newSearch?: string,
        newClass?: string,
        newStatus?: string,
    ) => {
        router.get(
            '/admin/dpt',
            {
                search: newSearch !== undefined ? newSearch : search,
                class: newClass !== undefined ? newClass : selectedClass,
                status: newStatus !== undefined ? newStatus : statusFilter,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Open Add Form
    const handleOpenAdd = () => {
        setEditingVoter(null);
        setName('');
        setClassName(classes[0] || '');
        setUsername('');
        setCustomToken('');
        setIsFormOpen(true);
    };

    // Open Edit Form
    const handleOpenEdit = (voter: Voter) => {
        setEditingVoter(voter);
        setName(voter.name);
        setClassName(voter.class);
        setUsername(voter.username);
        setCustomToken('');
        setIsFormOpen(true);
    };

    // Submit Add/Edit Form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingVoter) {
            router.put(
                `/admin/dpt/${editingVoter.id}`,
                {
                    name,
                    class: className,
                    username,
                },
                {
                    onSuccess: () => setIsFormOpen(false),
                },
            );
        } else {
            router.post(
                '/admin/dpt',
                {
                    name,
                    class: className,
                    username: username.trim() || undefined,
                    token: customToken.trim() || undefined,
                },
                {
                    onSuccess: () => setIsFormOpen(false),
                },
            );
        }
    };

    // Reset Token
    const handleResetToken = (voter: Voter) => {
        setConfirmModal({
            open: true,
            title: 'Reset Token Akses?',
            description: `Token login untuk "${voter.name}" (${voter.username}) akan digantikan dengan token acak baru. Token lama otomatis tidak berlaku lagi.`,
            confirmText: 'Ya, Reset Token',
            variant: 'warning',
            action: () => {
                router.post(
                    `/admin/dpt/${voter.id}/reset-token`,
                    {},
                    {
                        onSuccess: () =>
                            toast.success(
                                `Token untuk ${voter.name} berhasil direset!`,
                            ),
                    },
                );
            },
        });
    };

    // Reset Status Hak Suara Individu (Kembalikan ke 'Belum Memilih')
    const handleResetStatusIndividual = (voter: Voter) => {
        setConfirmModal({
            open: true,
            title: 'Reset Status Hak Suara?',
            description: `Status hak suara untuk "${voter.name}" (${voter.username}) akan dikembalikan menjadi "Belum Memilih". Pemilih dapat kembali login dan menyalurkan hak suaranya di bilik suara.`,
            confirmText: 'Ya, Reset Status',
            variant: 'warning',
            action: () => {
                router.post(
                    `/admin/dpt/${voter.id}/reset-status`,
                    {},
                    {
                        onSuccess: () =>
                            toast.success(
                                `Status hak suara untuk ${voter.name} berhasil direset!`,
                            ),
                    },
                );
            },
        });
    };

    // Eksekusi dari Modal Pusat Reset DPT
    const handleExecuteReset = () => {
        if (resetType === 'status') {
            const scopeText =
                resetClassScope === 'all'
                    ? 'seluruh siswa DPT'
                    : `siswa Kelas ${resetClassScope}`;
            setConfirmModal({
                open: true,
                title: 'Reset Status Hak Suara DPT?',
                description: `PERHATIAN: Status hak suara pemilih (${scopeText}) yang telah tercatat "Sudah Memilih" akan dikembalikan menjadi "Belum Memilih". Siswa dapat kembali menggunakan hak suara di bilik suara.`,
                confirmText: 'Ya, Reset Hak Suara',
                variant: 'warning',
                action: () => {
                    router.post(
                        '/admin/dpt/reset-status',
                        { class: resetClassScope },
                        {
                            onSuccess: () => {
                                setIsResetModalOpen(false);
                                toast.success(
                                    `Status hak suara ${scopeText} berhasil direset!`,
                                );
                            },
                        },
                    );
                },
            });
        } else if (resetType === 'tokens') {
            const scopeText =
                resetClassScope === 'all'
                    ? 'seluruh siswa DPT'
                    : `siswa Kelas ${resetClassScope}`;
            setConfirmModal({
                open: true,
                title: 'Reset & Acak Ulang Token Akses?',
                description: `PERINGATAN: Seluruh token akses login untuk (${scopeText}) akan digantikan dengan token acak 6 karakter baru. Token yang telah dicetak atau dibagikan sebelumnya otomatis tidak akan berlaku lagi!`,
                confirmText: 'Ya, Acak Ulang Token',
                variant: 'warning',
                action: () => {
                    router.post(
                        '/admin/dpt/reset-tokens',
                        { class: resetClassScope },
                        {
                            onSuccess: () => {
                                setIsResetModalOpen(false);
                                toast.success(
                                    `Token akses untuk ${scopeText} berhasil di-reset dan diacak ulang!`,
                                );
                            },
                        },
                    );
                },
            });
        } else if (resetType === 'clear') {
            setIsResetModalOpen(false);
            handleDeleteAll();
        }
    };

    // Delete Voter
    const handleDelete = (voter: Voter) => {
        setConfirmModal({
            open: true,
            title: 'Hapus Data Pemilih?',
            description: `Apakah Anda yakin ingin menghapus data pemilih "${voter.name}" (${voter.username})? Tindakan ini tidak dapat dibatalkan.`,
            confirmText: 'Ya, Hapus',
            variant: 'danger',
            action: () => {
                router.delete(`/admin/dpt/${voter.id}`, {
                    onSuccess: () =>
                        toast.success(
                            `Data pemilih ${voter.name} berhasil dihapus.`,
                        ),
                });
            },
        });
    };

    // Delete All
    const handleDeleteAll = () => {
        setConfirmModal({
            open: true,
            title: 'HAPUS SEMUA DATA DPT?',
            description:
                'PERINGATAN KRUSIAL: Seluruh data pemilih dan token login akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Ya, Hapus Semua DPT',
            variant: 'danger',
            action: () => {
                router.delete('/admin/dpt', {
                    onSuccess: () =>
                        toast.success('Seluruh data DPT berhasil dikosongkan.'),
                });
            },
        });
    };

    // Submit Import
    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        if (importFile) {
            formData.append('file', importFile);
        } else if (importText.trim()) {
            formData.append('raw_text', importText);
        } else {
            toast.warning(
                'Silakan pilih file CSV atau ketik/paste baris data terlebih dahulu.',
            );
            return;
        }

        router.post('/admin/dpt/import', formData, {
            onSuccess: () => {
                setIsImportOpen(false);
                setImportText('');
                setImportFile(null);
                toast.success('Data DPT berhasil diimport!');
            },
        });
    };

    return (
        <>
            <Head title="Manajemen DPT · E-Pradana" />

            <div
                className="flex flex-col gap-6 p-6"
                style={{ background: '#FDFBF7', minHeight: '100%' }}
            >
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1
                            className="text-2xl font-black tracking-tight"
                            style={{ color: '#4A2E1B' }}
                        >
                            Manajemen DPT (Daftar Pemilih Tetap)
                        </h1>
                        <p
                            className="text-sm font-medium"
                            style={{ color: '#8B5A2B' }}
                        >
                            Kelola data siswa pemilih, username akun, dan token
                            akses bilik suara
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-transform hover:scale-105 active:scale-95"
                            style={{ background: '#2D5A27' }}
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Pemilih
                        </button>

                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all hover:bg-[#F5EFE6]"
                            style={{
                                background: '#fff',
                                border: '1px solid #E8D9C4',
                                color: '#4A2E1B',
                            }}
                        >
                            <Upload className="h-4 w-4 text-[#8B5A2B]" />
                            Import CSV / Teks
                        </button>

                        {voters.total > 0 && (
                            <>
                                <button
                                    onClick={() => setIsResetModalOpen(true)}
                                    className="flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all hover:bg-amber-50"
                                    style={{
                                        background: '#fff',
                                        border: '1.5px solid #D4AF37',
                                        color: '#8B5A2B',
                                    }}
                                    title="Pusat Reset Manajemen DPT (Status Hak Suara, Token Akses, atau Kosongkan Data)"
                                >
                                    <RotateCcw className="h-4 w-4 text-[#D4AF37]" />
                                    <span>Reset DPT</span>
                                </button>

                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all hover:bg-[#F5EFE6]"
                                    style={{
                                        background: '#fff',
                                        border: '1px solid #E8D9C4',
                                        color: '#4A2E1B',
                                    }}
                                    title="Cetak Daftar Pemilih"
                                >
                                    <Printer className="h-4 w-4 text-[#8B5A2B]" />
                                    Cetak
                                </button>

                                <button
                                    onClick={handleDeleteAll}
                                    className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                                    title="Kosongkan seluruh data DPT"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Kosongkan
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Banner Token Baru (Flash Token) */}
                {flash_token && (
                    <div
                        className="flex flex-col gap-2 rounded-2xl p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        style={{
                            background: '#F0FDF4',
                            border: '1.5px solid #86EFAC',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                <KeyRound className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
                                    Token Akses Pemilih Berhasil Dibuat
                                </p>
                                <p className="text-sm font-semibold text-emerald-950">
                                    Siswa: <strong>{flash_token.name}</strong> ·
                                    Username:{' '}
                                    <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-emerald-900">
                                        {flash_token.username}
                                    </code>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 shadow-2xs">
                                <span className="text-xs font-medium text-neutral-500">
                                    Token:
                                </span>
                                <span className="font-mono text-base font-black tracking-widest text-emerald-700">
                                    {flash_token.token}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3 Mini Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div
                        className="rounded-2xl p-4 text-center shadow-2xs"
                        style={{
                            background: '#F5EFE6',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <p
                            className="text-3xl font-black"
                            style={{ color: '#4A2E1B' }}
                        >
                            {stats.total}
                        </p>
                        <p
                            className="mt-1 text-xs font-bold tracking-wider uppercase"
                            style={{ color: '#8B5A2B' }}
                        >
                            Total DPT Terdaftar
                        </p>
                    </div>

                    <div
                        className="rounded-2xl p-4 text-center shadow-2xs"
                        style={{
                            background: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                        }}
                    >
                        <p className="text-3xl font-black text-emerald-700">
                            {stats.sudah_memilih}
                        </p>
                        <p className="mt-1 text-xs font-bold tracking-wider text-emerald-800 uppercase">
                            Sudah Memilih (
                            {stats.total > 0
                                ? Math.round(
                                      (stats.sudah_memilih / stats.total) * 100,
                                  )
                                : 0}
                            %)
                        </p>
                    </div>

                    <div
                        className="rounded-2xl p-4 text-center shadow-2xs"
                        style={{
                            background: '#FFFBEB',
                            border: '1px solid #FDE68A',
                        }}
                    >
                        <p className="text-3xl font-black text-amber-700">
                            {stats.belum_memilih}
                        </p>
                        <p className="mt-1 text-xs font-bold tracking-wider text-amber-800 uppercase">
                            Belum Memilih (
                            {stats.total > 0
                                ? Math.round(
                                      (stats.belum_memilih / stats.total) * 100,
                                  )
                                : 0}
                            %)
                        </p>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div
                    className="flex flex-col gap-3 rounded-2xl p-4 shadow-2xs sm:flex-row sm:items-center"
                    style={{ background: '#fff', border: '1px solid #E8D9C4' }}
                >
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search
                            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                            style={{ color: '#8B5A2B' }}
                        />
                        <input
                            type="text"
                            placeholder="Cari nama siswa atau username..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                applyFilters(
                                    e.target.value,
                                    undefined,
                                    undefined,
                                );
                            }}
                            className="w-full rounded-xl py-2 pr-4 pl-9 text-xs font-medium outline-none"
                            style={{
                                background: '#FAF6F0',
                                border: '1px solid #E8D9C4',
                                color: '#4A2E1B',
                            }}
                        />
                    </div>

                    {/* Filter Tingkat Kelas */}
                    <select
                        value={selectedClass}
                        onChange={(e) => {
                            setSelectedClass(e.target.value);
                            applyFilters(undefined, e.target.value, undefined);
                        }}
                        className="cursor-pointer rounded-xl px-3 py-2 text-xs font-bold outline-none"
                        style={{
                            background: '#FAF6F0',
                            border: '1px solid #E8D9C4',
                            color: '#4A2E1B',
                        }}
                    >
                        <option value="">Semua Tingkat</option>
                        {(['X', 'XI', 'XII'] as const)
                            .filter((lvl) =>
                                classes.some(
                                    (c) => c === lvl || c.startsWith(lvl + ' '),
                                ),
                            )
                            .map((lvl) => (
                                <option key={lvl} value={lvl}>
                                    Kelas {lvl}
                                </option>
                            ))}
                    </select>

                    {/* Filter Status Voting */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            applyFilters(undefined, undefined, e.target.value);
                        }}
                        className="cursor-pointer rounded-xl px-3 py-2 text-xs font-bold outline-none"
                        style={{
                            background: '#FAF6F0',
                            border: '1px solid #E8D9C4',
                            color: '#4A2E1B',
                        }}
                    >
                        <option value="all">Semua Status</option>
                        <option value="not_voted">Belum Memilih</option>
                        <option value="voted">Sudah Memilih</option>
                    </select>
                </div>

                {/* Tabel Data Pemilih */}
                <div
                    className="flex flex-col overflow-hidden rounded-2xl shadow-sm"
                    style={{ background: '#fff', border: '1px solid #E8D9C4' }}
                >
                    {/* Header Tabel */}
                    <div
                        className="grid grid-cols-12 items-center px-5 py-3 text-xs font-black tracking-wider uppercase"
                        style={{ background: '#4A2E1B', color: '#D4AF37' }}
                    >
                        <span className="col-span-1">No</span>
                        <span className="col-span-3">Nama Siswa</span>
                        <span className="col-span-2">Kelas</span>
                        <span className="col-span-2">Username</span>
                        <span className="col-span-2">Token Akses</span>
                        <span className="col-span-1 text-center">Status</span>
                        <span className="col-span-1 text-right">Aksi</span>
                    </div>

                    {/* Baris Tabel */}
                    {voters.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Users className="mb-2 h-10 w-10 text-neutral-300" />
                            <p
                                className="text-sm font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                Data Pemilih Tidak Ditemukan
                            </p>
                            <p className="mt-1 text-xs text-[#8B5A2B]">
                                {voters.total === 0
                                    ? 'Belum ada data DPT. Klik "+ Tambah Pemilih" atau "Import CSV" untuk mengisi data.'
                                    : 'Tidak ada pemilih yang sesuai dengan kata kunci pencarian / filter.'}
                            </p>
                        </div>
                    ) : (
                        <div
                            className="divide-y"
                            style={{ borderColor: '#E8D9C4' }}
                        >
                            {voters.data.map((voter, idx) => (
                                <div
                                    key={voter.id}
                                    className="grid grid-cols-12 items-center px-5 py-3 text-xs transition-colors hover:bg-[#FAF6F0]"
                                >
                                    {/* No */}
                                    <span className="col-span-1 font-mono font-bold text-neutral-400">
                                        {(voters.current_page - 1) *
                                            voters.per_page +
                                            idx +
                                            1}
                                    </span>

                                    {/* Nama */}
                                    <div className="col-span-3 min-w-0 pr-2">
                                        <p
                                            className="truncate font-extrabold"
                                            style={{ color: '#4A2E1B' }}
                                        >
                                            {voter.name}
                                        </p>
                                    </div>

                                    {/* Kelas */}
                                    <div className="col-span-2">
                                        <span
                                            className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                                            style={{
                                                background: '#F5EFE6',
                                                color: '#4A2E1B',
                                            }}
                                        >
                                            {voter.class}
                                        </span>
                                    </div>

                                    {/* Username */}
                                    <div className="col-span-2 truncate pr-2 font-mono font-bold text-neutral-600">
                                        {voter.username}
                                    </div>

                                    {/* Token Akses */}
                                    <div className="col-span-2 truncate pr-2 font-mono font-bold text-neutral-600">
                                        {voter.token ?? (
                                            <span className="text-xs text-neutral-400 italic">
                                                —
                                            </span>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 text-center">
                                        {voter.has_voted ? (
                                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                                                Sudah
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                                                Belum
                                            </span>
                                        )}
                                    </div>

                                    {/* Aksi */}
                                    <div className="col-span-1 flex items-center justify-end gap-1">
                                        {/* Reset Status Hak Suara (Jika Sudah Memilih) */}
                                        {voter.has_voted === 1 && (
                                            <button
                                                onClick={() =>
                                                    handleResetStatusIndividual(
                                                        voter,
                                                    )
                                                }
                                                className="rounded-lg p-1.5 text-emerald-700 transition-colors hover:bg-emerald-50"
                                                title="Reset status hak suara (jadikan Belum Memilih kembali)"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" />
                                            </button>
                                        )}

                                        {/* Reset Token */}
                                        <button
                                            onClick={() =>
                                                handleResetToken(voter)
                                            }
                                            className="rounded-lg p-1.5 text-[#B8960A] transition-colors hover:bg-amber-50"
                                            title="Generate ulang token baru untuk siswa ini"
                                        >
                                            <KeyRound className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Edit */}
                                        <button
                                            onClick={() =>
                                                handleOpenEdit(voter)
                                            }
                                            className="rounded-lg p-1.5 text-[#8B5A2B] transition-colors hover:bg-[#F5EFE6]"
                                            title="Edit Data Pemilih"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(voter)}
                                            className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50"
                                            title="Hapus Pemilih"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {voters.last_page > 1 && (
                        <div
                            className="flex items-center justify-between border-t px-5 py-3 text-xs"
                            style={{
                                borderColor: '#E8D9C4',
                                background: '#FAF6F0',
                            }}
                        >
                            <span className="font-medium text-[#8B5A2B]">
                                Menampilkan {voters.data.length} dari{' '}
                                {voters.total} pemilih
                            </span>

                            <div className="flex items-center gap-1">
                                {voters.links.map((link, i) => (
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

            {/* ── PRINT-ONLY SECTION ── */}
            <style>{`
                #print-area { display: none; }
                @media print {
                    body * { visibility: hidden; }
                    #print-area {
                        display: block !important;
                        visibility: visible !important;
                        position: fixed;
                        inset: 0;
                        width: 100%;
                        background: #fff;
                        z-index: 99999;
                        padding: 15mm;
                        box-sizing: border-box;
                    }
                    #print-area * { visibility: visible !important; }
                    @page { size: A4 landscape; margin: 0; }
                }
            `}</style>

            <div id="print-area">
                <div
                    style={{
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '11px',
                        color: '#000',
                    }}
                >
                    <div style={{ marginBottom: '10px' }}>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: 'bold',
                            }}
                        >
                            Daftar Pemilih Tetap (DPT)
                        </h2>
                        <p
                            style={{
                                margin: '3px 0 0',
                                fontSize: '10px',
                                color: '#555',
                            }}
                        >
                            {filters.class
                                ? `Tingkat Kelas: ${filters.class}`
                                : 'Semua Tingkat Kelas'}
                            {filters.status && filters.status !== 'all'
                                ? ` · Status: ${filters.status === 'voted' ? 'Sudah Memilih' : 'Belum Memilih'}`
                                : ''}
                            {filters.search
                                ? ` · Pencarian: "${filters.search}"`
                                : ''}
                            {` · Total: ${voters.total} pemilih`}
                        </p>
                    </div>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '10px',
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: '#4A2E1B',
                                    color: '#D4AF37',
                                }}
                            >
                                <th
                                    style={{
                                        border: '1px solid #ccc',
                                        padding: '5px 7px',
                                        textAlign: 'left',
                                        width: '4%',
                                    }}
                                >
                                    No
                                </th>
                                <th
                                    style={{
                                        border: '1px solid #ccc',
                                        padding: '5px 7px',
                                        textAlign: 'left',
                                        width: '28%',
                                    }}
                                >
                                    Nama Siswa
                                </th>
                                <th
                                    style={{
                                        border: '1px solid #ccc',
                                        padding: '5px 7px',
                                        textAlign: 'left',
                                        width: '16%',
                                    }}
                                >
                                    Kelas
                                </th>
                                <th
                                    style={{
                                        border: '1px solid #ccc',
                                        padding: '5px 7px',
                                        textAlign: 'left',
                                        width: '16%',
                                    }}
                                >
                                    Username
                                </th>
                                <th
                                    style={{
                                        border: '1px solid #ccc',
                                        padding: '5px 7px',
                                        textAlign: 'left',
                                        width: '16%',
                                    }}
                                >
                                    Token Akses
                                </th>
                                <th
                                    style={{
                                        border: '1px solid #ccc',
                                        padding: '5px 7px',
                                        textAlign: 'left',
                                        width: '12%',
                                    }}
                                >
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {voters.data.map((voter, idx) => (
                                <tr
                                    key={voter.id}
                                    style={{
                                        background:
                                            idx % 2 === 0 ? '#fff' : '#FAF6F0',
                                    }}
                                >
                                    <td
                                        style={{
                                            border: '1px solid #ddd',
                                            padding: '4px 7px',
                                        }}
                                    >
                                        {(voters.current_page - 1) *
                                            voters.per_page +
                                            idx +
                                            1}
                                    </td>
                                    <td
                                        style={{
                                            border: '1px solid #ddd',
                                            padding: '4px 7px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {voter.name}
                                    </td>
                                    <td
                                        style={{
                                            border: '1px solid #ddd',
                                            padding: '4px 7px',
                                        }}
                                    >
                                        {voter.class}
                                    </td>
                                    <td
                                        style={{
                                            border: '1px solid #ddd',
                                            padding: '4px 7px',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {voter.username}
                                    </td>
                                    <td
                                        style={{
                                            border: '1px solid #ddd',
                                            padding: '4px 7px',
                                            fontFamily: 'monospace',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {voter.token ?? '—'}
                                    </td>
                                    <td
                                        style={{
                                            border: '1px solid #ddd',
                                            padding: '4px 7px',
                                        }}
                                    >
                                        {voter.has_voted
                                            ? 'Sudah Memilih'
                                            : 'Belum Memilih'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p
                        style={{
                            marginTop: '8px',
                            fontSize: '9px',
                            color: '#888',
                        }}
                    >
                        Dicetak pada: {new Date().toLocaleString('id-ID')}
                    </p>
                </div>
            </div>

            {/* ── MODAL FORM TAMBAH / EDIT PEMILIH ── */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent
                    className="max-w-md rounded-3xl p-6"
                    style={{ background: '#fff', border: '1px solid #E8D9C4' }}
                >
                    <DialogHeader>
                        <DialogTitle
                            className="text-xl font-black"
                            style={{ color: '#4A2E1B' }}
                        >
                            {editingVoter
                                ? 'Edit Data Pemilih (DPT)'
                                : 'Tambah Pemilih Baru'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#8B5A2B]">
                            {editingVoter
                                ? 'Perbarui informasi identitas pemilih siswa.'
                                : 'Token acak 6-karakter akan otomatis dibuat jika kolom token dikosongkan.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                        {/* Nama Siswa */}
                        <div>
                            <label
                                className="block text-xs font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                Nama Lengkap Siswa *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Masukkan nama lengkap siswa"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 w-full rounded-xl px-3 py-2 text-xs outline-none"
                                style={{
                                    background: '#FAF6F0',
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                            />
                        </div>

                        {/* Kelas */}
                        <div>
                            <label
                                className="block text-xs font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                Kelas / Rombel *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Masukkan kelas / rombel"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                className="mt-1 w-full rounded-xl px-3 py-2 text-xs outline-none"
                                style={{
                                    background: '#FAF6F0',
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label
                                className="block text-xs font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                Username Login{' '}
                                {editingVoter ? '*' : '(Opsional)'}
                            </label>
                            <input
                                type="text"
                                required={!!editingVoter}
                                placeholder={
                                    editingVoter
                                        ? 'Masukkan username'
                                        : 'Dikosongkan untuk generate otomatis'
                                }
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 w-full rounded-xl px-3 py-2 font-mono text-xs outline-none"
                                style={{
                                    background: '#FAF6F0',
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                            />
                        </div>

                        {/* Token (Hanya saat Tambah Baru) */}
                        {!editingVoter && (
                            <div>
                                <label
                                    className="block text-xs font-bold"
                                    style={{ color: '#4A2E1B' }}
                                >
                                    Token Akses Khusus (Opsional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Dikosongkan untuk token otomatis"
                                    value={customToken}
                                    onChange={(e) =>
                                        setCustomToken(
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    maxLength={10}
                                    className="mt-1 w-full rounded-xl px-3 py-2 font-mono text-xs tracking-wider uppercase outline-none"
                                    style={{
                                        background: '#FAF6F0',
                                        border: '1px solid #E8D9C4',
                                        color: '#4A2E1B',
                                    }}
                                />
                            </div>
                        )}

                        <div
                            className="flex items-center justify-end gap-2 border-t pt-3"
                            style={{ borderColor: '#E8D9C4' }}
                        >
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-[#F5EFE6]"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs"
                                style={{ background: '#4A2E1B' }}
                            >
                                Simpan Pemilih
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── MODAL IMPORT CSV / TEKS ── */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent
                    className="max-w-lg rounded-3xl p-6"
                    style={{ background: '#fff', border: '1px solid #E8D9C4' }}
                >
                    <DialogHeader>
                        <DialogTitle
                            className="text-xl font-black"
                            style={{ color: '#4A2E1B' }}
                        >
                            Import Data DPT Massal
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#8B5A2B]">
                            Upload file CSV atau paste baris data pemilih secara
                            langsung.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleImportSubmit}
                        className="mt-4 space-y-4"
                    >
                        {/* Pilihan 1: Upload File CSV */}
                        <div>
                            <label
                                className="mb-1 block text-xs font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                1. Upload File CSV (.csv / .txt)
                            </label>
                            <label
                                className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl p-4 text-xs font-semibold transition-colors hover:bg-[#F5EFE6]"
                                style={{
                                    background: '#FAF6F0',
                                    border: '1.5px dashed #E8D9C4',
                                    color: '#8B5A2B',
                                }}
                            >
                                <FileSpreadsheet className="h-6 w-6 text-[#8B5A2B]" />
                                <span>
                                    {importFile
                                        ? importFile.name
                                        : 'Klik untuk pilih file CSV'}
                                </span>
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={(e) =>
                                        setImportFile(
                                            e.target.files
                                                ? e.target.files[0]
                                                : null,
                                        )
                                    }
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-[#E8D9C4]" />
                            <span className="text-[11px] font-bold text-neutral-400">
                                ATAU
                            </span>
                            <div className="h-px flex-1 bg-[#E8D9C4]" />
                        </div>

                        {/* Pilihan 2: Paste Raw Text */}
                        <div>
                            <label
                                className="mb-1 block text-xs font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                2. Paste Baris Data (Format: Nama, Kelas)
                            </label>
                            <textarea
                                rows={5}
                                placeholder="Masukkan data siswa (format: Nama Lengkap, Kelas)"
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                className="w-full rounded-xl p-3 font-mono text-xs outline-none"
                                style={{
                                    background: '#FAF6F0',
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                            />
                            <p className="mt-1 text-[11px] text-[#8B5A2B]">
                                * Tiap baris otomatis dibuatkan username dan
                                token 6 digit acak.
                            </p>
                        </div>

                        <div
                            className="flex items-center justify-end gap-2 border-t pt-2"
                            style={{ borderColor: '#E8D9C4' }}
                        >
                            <button
                                type="button"
                                onClick={() => setIsImportOpen(false)}
                                className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-[#F5EFE6]"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs"
                                style={{ background: '#2D5A27' }}
                            >
                                Proses Import DPT
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── MODAL PUSAT RESET MANAJEMEN DPT ── */}
            <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
                <DialogContent
                    className="max-w-xl rounded-3xl p-6"
                    style={{ background: '#fff', border: '1.5px solid #E8D9C4' }}
                >
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-xs"
                                style={{
                                    background: 'linear-gradient(135deg, #4A2E1B 0%, #2D1A0A 100%)',
                                    color: '#D4AF37',
                                }}
                            >
                                <RotateCcw className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle
                                    className="text-xl font-black"
                                    style={{ color: '#4A2E1B' }}
                                >
                                    Pusat Reset Manajemen DPT
                                </DialogTitle>
                                <DialogDescription className="text-xs text-[#8B5A2B]">
                                    Pilih opsi reset data pemilih sesuai kebutuhan simulasi, pergantian sesi, atau pembaruan token.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="mt-4 space-y-3.5">
                        {/* Pilihan 1: Reset Status Hak Suara */}
                        <div
                            onClick={() => setResetType('status')}
                            className={`cursor-pointer rounded-2xl p-4 transition-all ${
                                resetType === 'status'
                                    ? 'border-2 border-[#D4AF37] bg-[#FAF6F0] shadow-sm'
                                    : 'border border-[#E8D9C4] bg-white hover:bg-[#FDFBF7]'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                                        resetType === 'status'
                                            ? 'bg-[#4A2E1B] text-[#D4AF37]'
                                            : 'bg-[#F5EFE6] text-[#8B5A2B]'
                                    }`}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-[#4A2E1B]">
                                            1. Reset Status Hak Suara (Gladi / Pemilihan Ulang)
                                        </p>
                                        <input
                                            type="radio"
                                            name="reset_type"
                                            checked={resetType === 'status'}
                                            onChange={() => setResetType('status')}
                                            className="accent-[#4A2E1B]"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] leading-relaxed text-[#8B5A2B]">
                                        Mengembalikan status seluruh pemilih yang telah tercatat <strong>&ldquo;Sudah Memilih&rdquo;</strong> menjadi <strong>&ldquo;Belum Memilih&rdquo;</strong>. Data nama, kelas, username, dan token tetap utuh tidak berubah.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pilihan 2: Reset & Acak Ulang Token Akses */}
                        <div
                            onClick={() => setResetType('tokens')}
                            className={`cursor-pointer rounded-2xl p-4 transition-all ${
                                resetType === 'tokens'
                                    ? 'border-2 border-[#D4AF37] bg-[#FAF6F0] shadow-sm'
                                    : 'border border-[#E8D9C4] bg-white hover:bg-[#FDFBF7]'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                                        resetType === 'tokens'
                                            ? 'bg-[#4A2E1B] text-[#D4AF37]'
                                            : 'bg-[#F5EFE6] text-[#8B5A2B]'
                                    }`}
                                >
                                    <KeyRound className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-[#4A2E1B]">
                                            2. Reset & Acak Ulang Token Akses Login
                                        </p>
                                        <input
                                            type="radio"
                                            name="reset_type"
                                            checked={resetType === 'tokens'}
                                            onChange={() => setResetType('tokens')}
                                            className="accent-[#4A2E1B]"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] leading-relaxed text-[#8B5A2B]">
                                        Menghasilkan <strong>token login 6 karakter baru</strong> secara otomatis. Token lama yang pernah dibagikan atau dicetak tidak akan dapat digunakan lagi.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pilihan 3: Kosongkan Seluruh Data DPT */}
                        <div
                            onClick={() => setResetType('clear')}
                            className={`cursor-pointer rounded-2xl p-4 transition-all ${
                                resetType === 'clear'
                                    ? 'border-2 border-rose-500 bg-rose-50/50 shadow-sm'
                                    : 'border border-[#E8D9C4] bg-white hover:bg-rose-50/20'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                                        resetType === 'clear'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-rose-100 text-rose-600'
                                    }`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-rose-700">
                                            3. Kosongkan Seluruh Rekaman Data DPT
                                        </p>
                                        <input
                                            type="radio"
                                            name="reset_type"
                                            checked={resetType === 'clear'}
                                            onChange={() => setResetType('clear')}
                                            className="accent-rose-600"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] leading-relaxed text-rose-600">
                                        Menghapus seluruh daftar siswa DPT secara permanen untuk mengulang input data pemilih dari awal.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Scope Filter (Tampil jika memilih Reset Status atau Token) */}
                        {resetType !== 'clear' && (
                            <div
                                className="rounded-2xl p-3.5"
                                style={{
                                    background: '#FAF6F0',
                                    border: '1px solid #E8D9C4',
                                }}
                            >
                                <label className="block text-xs font-bold text-[#4A2E1B]">
                                    Cakupan Siswa yang Di-reset:
                                </label>
                                <select
                                    value={resetClassScope}
                                    onChange={(e) => setResetClassScope(e.target.value)}
                                    className="mt-1.5 w-full cursor-pointer rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] outline-none shadow-2xs"
                                    style={{ border: '1px solid #E8D9C4' }}
                                >
                                    <option value="all">
                                        Semua Pemilih (Seluruh DPT - {stats.total} Siswa)
                                    </option>
                                    {classes.map((cls) => (
                                        <option key={cls} value={cls}>
                                            Khusus Kelas: {cls}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Tombol Aksi */}
                        <div
                            className="flex items-center justify-end gap-2 border-t pt-3"
                            style={{ borderColor: '#E8D9C4' }}
                        >
                            <button
                                type="button"
                                onClick={() => setIsResetModalOpen(false)}
                                className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-bold text-neutral-600 hover:bg-[#F5EFE6]"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteReset}
                                className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-black text-white shadow-xs transition-transform hover:scale-105 active:scale-95 ${
                                    resetType === 'clear'
                                        ? 'bg-rose-600 hover:bg-rose-700'
                                        : 'bg-[#4A2E1B] hover:bg-[#2D1A0A]'
                                }`}
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Lanjutkan Reset</span>
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Custom Modal Konfirmasi DPT */}
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

DptPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Manajemen DPT', href: '/admin/dpt' },
    ],
};
