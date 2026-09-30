import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    UserSquare2,
    Plus,
    Edit2,
    Trash2,
    Upload,
    X,
    Eye,
    Check,
    AlertTriangle,
    ShieldAlert,
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

type Candidate = {
    id: number;
    category: 'putra' | 'putri';
    candidate_number: number;
    name: string;
    class: string;
    vision: string | null;
    mission: string | null;
    photo_url: string | null;
    vote_count: number;
};

type Props = {
    kandidat_putra: Candidate[];
    kandidat_putri: Candidate[];
    election_status: string;
};

export default function KandidatPage({
    kandidat_putra = [],
    kandidat_putri = [],
    election_status = 'draft',
}: Props) {
    const isLocked = election_status === 'open';

    // State Modal Form (Create / Edit)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(
        null,
    );
    const [formCategory, setFormCategory] = useState<'putra' | 'putri'>(
        'putra',
    );

    // State Fields
    const [candidateNumber, setCandidateNumber] = useState<number>(1);
    const [name, setName] = useState('');
    const [className, setClassName] = useState('');
    const [vision, setVision] = useState('');
    const [mission, setMission] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // State Detail Visi-Misi Modal
    const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null);

    // State Modal Konfirmasi Hapus Kandidat
    const [candidateToDelete, setCandidateToDelete] =
        useState<Candidate | null>(null);

    // Buka Modal Tambah
    const handleOpenAdd = (category: 'putra' | 'putri') => {
        setEditingCandidate(null);
        setFormCategory(category);
        const list = category === 'putra' ? kandidat_putra : kandidat_putri;
        const nextNum =
            list.length > 0
                ? Math.max(...list.map((c) => c.candidate_number)) + 1
                : 1;
        setCandidateNumber(nextNum);
        setName('');
        setClassName('');
        setVision('');
        setMission('');
        setPhotoFile(null);
        setPhotoPreview(null);
        setIsFormOpen(true);
    };

    // Buka Modal Edit
    const handleOpenEdit = (candidate: Candidate) => {
        setEditingCandidate(candidate);
        setFormCategory(candidate.category);
        setCandidateNumber(candidate.candidate_number);
        setName(candidate.name);
        setClassName(candidate.class || '');
        setVision(candidate.vision || '');
        setMission(candidate.mission || '');
        setPhotoFile(null);
        setPhotoPreview(candidate.photo_url);
        setIsFormOpen(true);
    };

    // Handle File Change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    // Submit Form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('candidate_number', candidateNumber.toString());
        formData.append('name', name);
        formData.append('class', className);
        formData.append('vision', vision);
        formData.append('mission', mission);

        if (photoFile) {
            formData.append('photo', photoFile);
        }

        if (editingCandidate) {
            // Update
            router.post(`/admin/kandidat/${editingCandidate.id}`, formData, {
                onSuccess: () => {
                    setIsFormOpen(false);
                },
            });
        } else {
            // Create
            formData.append('category', formCategory);
            router.post('/admin/kandidat', formData, {
                onSuccess: () => {
                    setIsFormOpen(false);
                },
            });
        }
    };

    // Hapus Kandidat
    const handleDelete = (candidate: Candidate) => {
        if (isLocked) {
            toast.error(
                'Kandidat tidak dapat dihapus saat pemilihan sedang berlangsung!',
            );
            return;
        }

        setCandidateToDelete(candidate);
    };

    const handleConfirmDelete = () => {
        if (candidateToDelete) {
            router.delete(`/admin/kandidat/${candidateToDelete.id}`, {
                onSuccess: () => setCandidateToDelete(null),
            });
        }
    };

    return (
        <>
            <Head title="Manajemen Kandidat · E-Pradana" />

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
                            Manajemen Kandidat Pradana
                        </h1>
                        <p
                            className="text-sm font-medium"
                            style={{ color: '#8B5A2B' }}
                        >
                            Daftarkan calon Pradana Putra dan Putri beserta
                            nomor urut, foto, visi & misi
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className="rounded-full px-3 py-1 text-xs font-bold"
                            style={{
                                background: isLocked ? '#FEF2F2' : '#EFF6FF',
                                color: isLocked ? '#B91C1C' : '#1D4ED8',
                                border: `1px solid ${isLocked ? '#FECACA' : '#BFDBFE'}`,
                            }}
                        >
                            {isLocked
                                ? '🔒 Status: Terkunci (Open)'
                                : '✏️ Mode Konfigurasi'}
                        </span>
                    </div>
                </div>

                {/* Banner Status Proteksi */}
                {isLocked && (
                    <div
                        className="flex items-center gap-3 rounded-2xl p-4 text-xs font-semibold"
                        style={{
                            background: '#FEF2F2',
                            border: '1.5px solid #F87171',
                            color: '#991B1B',
                        }}
                    >
                        <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
                        <span>
                            <strong>Perhatian:</strong> Pemilihan sedang
                            berlangsung (Status <strong>Open</strong>).
                            Penambahan, pengubahan, dan penghapusan kandidat
                            dikunci demi integritas suara. Tutup pemilihan
                            terlebih dahulu jika perlu melakukan perubahan
                            darurat.
                        </span>
                    </div>
                )}

                {/* Dua Kolom: Pradana Putra & Pradana Putri */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* ── KOLOM PUTRA ── */}
                    <div className="flex flex-col gap-4">
                        {/* Tab header Putra */}
                        <div
                            className="flex items-center justify-between rounded-2xl px-5 py-4 shadow-2xs"
                            style={{
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-11 w-11 items-center justify-center rounded-xl shadow-xs"
                                    style={{
                                        background: '#1D4ED8',
                                        color: '#fff',
                                    }}
                                >
                                    <span className="text-xl">👦</span>
                                </div>
                                <div>
                                    <p
                                        className="text-base font-extrabold"
                                        style={{ color: '#1E3A8A' }}
                                    >
                                        Calon Pradana Putra
                                    </p>
                                    <p className="text-xs font-semibold text-blue-600">
                                        {kandidat_putra.length} kandidat
                                        terdaftar
                                    </p>
                                </div>
                            </div>

                            {!isLocked && (
                                <button
                                    onClick={() => handleOpenAdd('putra')}
                                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform hover:scale-105 active:scale-95"
                                    style={{ background: '#1D4ED8' }}
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Putra
                                </button>
                            )}
                        </div>

                        {/* Daftar Kandidat Putra */}
                        {kandidat_putra.length === 0 ? (
                            <div
                                className="flex flex-col items-center justify-center rounded-2xl py-14 text-center"
                                style={{
                                    background: '#fff',
                                    border: '1px solid #E8D9C4',
                                }}
                            >
                                <UserSquare2
                                    className="mb-3 h-12 w-12"
                                    style={{ color: '#E8D9C4' }}
                                />
                                <p
                                    className="text-sm font-bold"
                                    style={{ color: '#4A2E1B' }}
                                >
                                    Belum Ada Kandidat Pradana Putra
                                </p>
                                <p className="mt-1 text-xs text-[#8B5A2B]">
                                    Klik tombol Tambah Putra untuk mendaftarkan
                                    kandidat nomor 1
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {kandidat_putra.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex flex-col gap-3 rounded-2xl p-4 shadow-2xs transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                        style={{
                                            background: '#fff',
                                            border: '1px solid #E8D9C4',
                                        }}
                                    >
                                        <div className="flex min-w-0 items-center gap-3.5">
                                            {/* Foto / Thumbnail */}
                                            <div
                                                className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-2xs"
                                                style={{
                                                    background: '#EFF6FF',
                                                    border: '2px solid #BFDBFE',
                                                }}
                                            >
                                                {c.photo_url ? (
                                                    <img
                                                        src={c.photo_url}
                                                        alt={c.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl">
                                                        👦
                                                    </span>
                                                )}
                                                <span
                                                    className="py-0.2 absolute -top-1 -left-1 rounded-full px-1.5 text-[9px] font-black text-white"
                                                    style={{
                                                        background: '#1D4ED8',
                                                    }}
                                                >
                                                    #{c.candidate_number}
                                                </span>
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="rounded-full px-2 py-0.5 text-[10px] font-black"
                                                        style={{
                                                            background:
                                                                '#1D4ED815',
                                                            color: '#1D4ED8',
                                                        }}
                                                    >
                                                        Kandidat 0
                                                        {c.candidate_number}
                                                    </span>
                                                    <span className="text-xs font-semibold text-[#8B5A2B]">
                                                        {c.class || 'Kelas -'}
                                                    </span>
                                                </div>
                                                <h3
                                                    className="truncate text-base font-extrabold"
                                                    style={{ color: '#4A2E1B' }}
                                                >
                                                    {c.name}
                                                </h3>
                                                {c.vision && (
                                                    <p className="mt-0.5 max-w-xs truncate text-xs text-[#8B5A2B]">
                                                        Visi: {c.vision}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Aksi */}
                                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                                            <button
                                                onClick={() =>
                                                    setViewCandidate(c)
                                                }
                                                className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-[#F5EFE6]"
                                                title="Lihat Detail Profil Visi Misi"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>

                                            {!isLocked && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleOpenEdit(c)
                                                        }
                                                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                                        title="Edit Kandidat"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(c)
                                                        }
                                                        className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50"
                                                        title="Hapus Kandidat"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── KOLOM PUTRI ── */}
                    <div className="flex flex-col gap-4">
                        {/* Tab header Putri */}
                        <div
                            className="flex items-center justify-between rounded-2xl px-5 py-4 shadow-2xs"
                            style={{
                                background: '#FDF2F8',
                                border: '1px solid #FBCFE8',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-11 w-11 items-center justify-center rounded-xl shadow-xs"
                                    style={{
                                        background: '#BE185D',
                                        color: '#fff',
                                    }}
                                >
                                    <span className="text-xl">👧</span>
                                </div>
                                <div>
                                    <p
                                        className="text-base font-extrabold"
                                        style={{ color: '#831843' }}
                                    >
                                        Calon Pradana Putri
                                    </p>
                                    <p className="text-xs font-semibold text-pink-600">
                                        {kandidat_putri.length} kandidat
                                        terdaftar
                                    </p>
                                </div>
                            </div>

                            {!isLocked && (
                                <button
                                    onClick={() => handleOpenAdd('putri')}
                                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform hover:scale-105 active:scale-95"
                                    style={{ background: '#BE185D' }}
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Putri
                                </button>
                            )}
                        </div>

                        {/* Daftar Kandidat Putri */}
                        {kandidat_putri.length === 0 ? (
                            <div
                                className="flex flex-col items-center justify-center rounded-2xl py-14 text-center"
                                style={{
                                    background: '#fff',
                                    border: '1px solid #E8D9C4',
                                }}
                            >
                                <UserSquare2
                                    className="mb-3 h-12 w-12"
                                    style={{ color: '#E8D9C4' }}
                                />
                                <p
                                    className="text-sm font-bold"
                                    style={{ color: '#4A2E1B' }}
                                >
                                    Belum Ada Kandidat Pradana Putri
                                </p>
                                <p className="mt-1 text-xs text-[#8B5A2B]">
                                    Klik tombol Tambah Putri untuk mendaftarkan
                                    kandidat nomor 1
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {kandidat_putri.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex flex-col gap-3 rounded-2xl p-4 shadow-2xs transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                        style={{
                                            background: '#fff',
                                            border: '1px solid #E8D9C4',
                                        }}
                                    >
                                        <div className="flex min-w-0 items-center gap-3.5">
                                            {/* Foto / Thumbnail */}
                                            <div
                                                className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-2xs"
                                                style={{
                                                    background: '#FDF2F8',
                                                    border: '2px solid #FBCFE8',
                                                }}
                                            >
                                                {c.photo_url ? (
                                                    <img
                                                        src={c.photo_url}
                                                        alt={c.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl">
                                                        👧
                                                    </span>
                                                )}
                                                <span
                                                    className="py-0.2 absolute -top-1 -left-1 rounded-full px-1.5 text-[9px] font-black text-white"
                                                    style={{
                                                        background: '#BE185D',
                                                    }}
                                                >
                                                    #{c.candidate_number}
                                                </span>
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="rounded-full px-2 py-0.5 text-[10px] font-black"
                                                        style={{
                                                            background:
                                                                '#BE185D15',
                                                            color: '#BE185D',
                                                        }}
                                                    >
                                                        Kandidat 0
                                                        {c.candidate_number}
                                                    </span>
                                                    <span className="text-xs font-semibold text-[#8B5A2B]">
                                                        {c.class || 'Kelas -'}
                                                    </span>
                                                </div>
                                                <h3
                                                    className="truncate text-base font-extrabold"
                                                    style={{ color: '#4A2E1B' }}
                                                >
                                                    {c.name}
                                                </h3>
                                                {c.vision && (
                                                    <p className="mt-0.5 max-w-xs truncate text-xs text-[#8B5A2B]">
                                                        Visi: {c.vision}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Aksi */}
                                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                                            <button
                                                onClick={() =>
                                                    setViewCandidate(c)
                                                }
                                                className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-[#F5EFE6]"
                                                title="Lihat Detail Profil Visi Misi"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>

                                            {!isLocked && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleOpenEdit(c)
                                                        }
                                                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                                        title="Edit Kandidat"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(c)
                                                        }
                                                        className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50"
                                                        title="Hapus Kandidat"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── MODAL FORM TAMBAH / EDIT KANDIDAT ── */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent
                    className="max-w-lg rounded-3xl p-6"
                    style={{ background: '#fff', border: '1px solid #E8D9C4' }}
                >
                    <DialogHeader>
                        <DialogTitle
                            className="text-xl font-black"
                            style={{ color: '#4A2E1B' }}
                        >
                            {editingCandidate
                                ? `Edit Kandidat ${editingCandidate.candidate_number} (${editingCandidate.category === 'putra' ? 'Putra' : 'Putri'})`
                                : `Tambah Calon Pradana ${formCategory === 'putra' ? 'Putra' : 'Putri'}`}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#8B5A2B]">
                            Isi identitas lengkap calon, nomor urut, foto resmi,
                            serta visi dan misi.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            {/* Nomor Urut */}
                            <div>
                                <label
                                    className="block text-xs font-bold"
                                    style={{ color: '#4A2E1B' }}
                                >
                                    Nomor Urut *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    required
                                    value={candidateNumber}
                                    onChange={(e) =>
                                        setCandidateNumber(
                                            parseInt(e.target.value) || 1,
                                        )
                                    }
                                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm font-bold outline-none"
                                    style={{
                                        background: '#FAF6F0',
                                        border: '1px solid #E8D9C4',
                                        color: '#4A2E1B',
                                    }}
                                />
                            </div>

                            {/* Nama Lengkap */}
                            <div className="col-span-2">
                                <label
                                    className="block text-xs font-bold"
                                    style={{ color: '#4A2E1B' }}
                                >
                                    Nama Lengkap Kandidat *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Masukkan nama lengkap kandidat"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
                                    style={{
                                        background: '#FAF6F0',
                                        border: '1px solid #E8D9C4',
                                        color: '#4A2E1B',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Kelas */}
                        <div>
                            <label
                                className="block text-xs font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                Kelas / Jurusan *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Masukkan kelas"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                className="mt-1 w-full rounded-xl px-3 py-2 text-sm outline-none"
                                style={{
                                    background: '#FAF6F0',
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                            />
                        </div>

                        {/* Upload Foto */}
                        <div>
                            <label
                                className="mb-1 block text-xs font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                Foto Kandidat (Opsional)
                            </label>
                            <div className="flex items-center gap-3">
                                {photoPreview && (
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="h-14 w-14 rounded-xl border-2 object-cover"
                                        style={{ borderColor: '#D4AF37' }}
                                    />
                                )}
                                <label
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl p-3 text-xs font-semibold transition-colors hover:bg-[#F5EFE6]"
                                    style={{
                                        background: '#FAF6F0',
                                        border: '1.5px dashed #E8D9C4',
                                        color: '#8B5A2B',
                                    }}
                                >
                                    <Upload className="h-4 w-4" />
                                    <span>
                                        {photoFile
                                            ? photoFile.name
                                            : 'Pilih file foto (JPG, PNG maks 2MB)'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Visi */}
                        <div>
                            <label
                                className="block text-xs font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                Visi Kandidat
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Masukkan visi kandidat"
                                value={vision}
                                onChange={(e) => setVision(e.target.value)}
                                className="mt-1 w-full rounded-xl p-3 text-xs outline-none"
                                style={{
                                    background: '#FAF6F0',
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                            />
                        </div>

                        {/* Misi */}
                        <div>
                            <label
                                className="block text-xs font-bold"
                                style={{ color: '#4A2E1B' }}
                            >
                                Misi Kandidat
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Masukkan misi kandidat"
                                value={mission}
                                onChange={(e) => setMission(e.target.value)}
                                className="mt-1 w-full rounded-xl p-3 text-xs outline-none"
                                style={{
                                    background: '#FAF6F0',
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                            />
                        </div>

                        {/* Action buttons */}
                        <div
                            className="flex items-center justify-end gap-2 border-t pt-2"
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
                                className="rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-transform hover:scale-105 active:scale-95"
                                style={{
                                    background:
                                        formCategory === 'putra'
                                            ? '#1D4ED8'
                                            : '#BE185D',
                                }}
                            >
                                Simpan Data Kandidat
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── MODAL DETAIL PROFIL & VISI MISI ── */}
            <Dialog
                open={!!viewCandidate}
                onOpenChange={() => setViewCandidate(null)}
            >
                <DialogContent
                    className="max-w-md rounded-3xl p-6"
                    style={{ background: '#fff', border: '1px solid #E8D9C4' }}
                >
                    {viewCandidate && (
                        <div>
                            <div
                                className="flex items-center gap-3 border-b pb-4"
                                style={{ borderColor: '#E8D9C4' }}
                            >
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-[#D4AF37] shadow-xs">
                                    {viewCandidate.photo_url ? (
                                        <img
                                            src={viewCandidate.photo_url}
                                            alt={viewCandidate.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div
                                            className="flex h-full w-full items-center justify-center text-3xl"
                                            style={{
                                                background:
                                                    viewCandidate.category ===
                                                    'putra'
                                                        ? '#1D4ED815'
                                                        : '#BE185D15',
                                            }}
                                        >
                                            {viewCandidate.category === 'putra'
                                                ? '👦'
                                                : '👧'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span
                                        className="rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase"
                                        style={{
                                            background:
                                                viewCandidate.category ===
                                                'putra'
                                                    ? '#EFF6FF'
                                                    : '#FDF2F8',
                                            color:
                                                viewCandidate.category ===
                                                'putra'
                                                    ? '#1D4ED8'
                                                    : '#BE185D',
                                        }}
                                    >
                                        Kandidat 0
                                        {viewCandidate.candidate_number} ·{' '}
                                        {viewCandidate.category === 'putra'
                                            ? 'Pradana Putra'
                                            : 'Pradana Putri'}
                                    </span>
                                    <h3
                                        className="text-lg font-black"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        {viewCandidate.name}
                                    </h3>
                                    <p className="text-xs font-semibold text-[#8B5A2B]">
                                        Kelas: {viewCandidate.class}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <h4
                                        className="text-xs font-bold tracking-wider uppercase"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        🎯 Visi Kandidat
                                    </h4>
                                    <p className="mt-1 rounded-xl border border-[#E8D9C4] bg-[#FAF6F0] p-3 text-xs leading-relaxed text-[#8B5A2B]">
                                        {viewCandidate.vision ||
                                            'Belum mencantumkan visi.'}
                                    </p>
                                </div>

                                <div>
                                    <h4
                                        className="text-xs font-bold tracking-wider uppercase"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        📋 Misi Kandidat
                                    </h4>
                                    <div className="mt-1 rounded-xl border border-[#E8D9C4] bg-[#FAF6F0] p-3 text-xs leading-relaxed whitespace-pre-line text-[#8B5A2B]">
                                        {viewCandidate.mission ||
                                            'Belum mencantumkan misi.'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end">
                                <button
                                    onClick={() => setViewCandidate(null)}
                                    className="rounded-xl px-4 py-2 text-xs font-bold"
                                    style={{
                                        background: '#4A2E1B',
                                        color: '#FDFBF7',
                                    }}
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Custom Modal Konfirmasi Hapus Kandidat */}
            <ConfirmationModal
                open={!!candidateToDelete}
                onOpenChange={(open) => {
                    if (!open) setCandidateToDelete(null);
                }}
                title="Hapus Data Kandidat?"
                description={`Apakah Anda yakin ingin menghapus kandidat "${candidateToDelete?.name}" (Kandidat 0${candidateToDelete?.candidate_number})? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, Hapus Kandidat"
                cancelText="Batal"
                variant="danger"
                onConfirm={handleConfirmDelete}
            />
        </>
    );
}

KandidatPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Manajemen Kandidat', href: '/admin/kandidat' },
    ],
};
