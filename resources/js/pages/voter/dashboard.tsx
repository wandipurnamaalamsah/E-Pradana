import { useState, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    ShieldCheck,
    LogOut,
    Check,
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Sparkles,
    Vote,
    User,
    Compass,
    FileText,
    ChevronLeft,
    ChevronRight,
    Menu,
    HelpCircle,
    Lock,
    Award,
    Shield,
    X,
    Save,
    RotateCcw,
    Mail,
    Copy,
    MessageCircle,
    Instagram,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';

type Candidate = {
    id: number;
    candidate_number: number;
    name: string;
    class: string;
    vision: string | null;
    mission: string | null;
    photo_url: string | null;
};

type Props = {
    voter: {
        id: number;
        name: string;
        class: string;
        username: string;
        has_voted: boolean;
    };
    election_status: 'draft' | 'rehearsal' | 'open' | 'closed';
    allow_blank: boolean;
    candidates_putra: Candidate[];
    candidates_putri: Candidate[];
    just_voted?: boolean;
    voter_token?: string;
};

export default function VoterDashboard({
    voter,
    election_status = 'draft',
    allow_blank = false,
    candidates_putra = [],
    candidates_putri = [],
    just_voted = false,
    voter_token,
}: Props) {
    const { flash } = usePage().props as any;

    // Selected Candidates (Temporary / Mutable until saved)
    const [selectedPutraId, setSelectedPutraId] = useState<number | null>(null);
    const [selectedPutriId, setSelectedPutriId] = useState<number | null>(null);

    // Active voting tab in Bilik Suara: 'putra' | 'putri'
    const [activeVoteTab, setActiveVoteTab] = useState<'putra' | 'putri'>(
        'putra',
    );

    // Modals
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(just_voted);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Active Section Spy for Sidebar Navigation
    const [activeSection, setActiveSection] = useState<
        'tata-cara' | 'profil-putra' | 'profil-putri' | 'bilik-suara'
    >('tata-cara');

    // Section Refs
    const tataCaraRef = useRef<HTMLDivElement | null>(null);
    const profilPutraRef = useRef<HTMLDivElement | null>(null);
    const profilPutriRef = useRef<HTMLDivElement | null>(null);
    const bilikSuaraRef = useRef<HTMLDivElement | null>(null);

    // Strictly check if voting is allowed (ONLY 'open' allows live voting)
    const isVotingAllowed = election_status === 'open';

    const selectedPutra =
        candidates_putra.find((c) => c.id === selectedPutraId) || null;
    const selectedPutri =
        candidates_putri.find((c) => c.id === selectedPutriId) || null;

    const isBothSelected = selectedPutraId !== null && selectedPutriId !== null;
    const progressCount = (selectedPutraId ? 1 : 0) + (selectedPutriId ? 1 : 0);

    // When just_voted prop is received or changes to true, trigger success modal
    useEffect(() => {
        if (just_voted) {
            setIsSuccessModalOpen(true);
        }
    }, [just_voted]);

    // Intersection Observer / Scroll Spy for section tracking
    useEffect(() => {
        const sections = [
            { id: 'tata-cara', ref: tataCaraRef },
            { id: 'profil-putra', ref: profilPutraRef },
            { id: 'profil-putri', ref: profilPutriRef },
            { id: 'bilik-suara', ref: bilikSuaraRef },
        ];

        const handleScroll = () => {
            const scrollPosition = window.scrollY + 250;
            for (let i = sections.length - 1; i >= 0; i--) {
                const element = sections[i].ref.current;
                if (element && element.offsetTop <= scrollPosition) {
                    setActiveSection(sections[i].id as any);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Smooth scroll helper
    const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setIsMobileDrawerOpen(false);
    };

    // Candidate selection in Bilik Suara (Freely mutable / switchable)
    const handleSelectPutra = (id: number) => {
        if (!isVotingAllowed) return;
        setSelectedPutraId(id);
        if (!selectedPutriId) {
            setTimeout(() => {
                setActiveVoteTab('putri');
            }, 300);
        }
    };

    const handleSelectPutri = (id: number) => {
        if (!isVotingAllowed) return;
        setSelectedPutriId(id);
    };

    // Submitting vote
    const handleFinalSubmit = () => {
        if (!isVotingAllowed) return;
        setIsSubmitting(true);
        router.post(
            '/voter/vote',
            {
                candidate_putra_id: selectedPutraId,
                candidate_putri_id: selectedPutriId,
                vt: voter_token,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSubmitting(false);
                    setIsConfirmModalOpen(false);
                },
                onSuccess: () => {
                    setIsSuccessModalOpen(true);
                },
            },
        );
    };

    // Final logout execution after confirmed
    const executeLogout = () => {
        router.post('/voter/logout', {
            vt: voter_token,
        });
    };

    return (
        <>
            <Head title="Bilik Suara Pemilih · E-Pradana" />

            <div className="flex min-h-screen w-full overflow-x-hidden bg-[#FDFBF7] font-sans text-[#4A2E1B] antialiased">
                {/* ═════════════════════════════════════════════════════════════
                    1. TRUE APP SIDEBAR (FIXED TO LEFT ON DESKTOP, OUTSIDE CONTENT)
                ═════════════════════════════════════════════════════════════ */}
                <aside
                    className="fixed top-0 bottom-0 left-0 z-30 hidden h-screen w-72 flex-col justify-between overflow-y-auto border-r p-5 shadow-xs lg:flex xl:w-80"
                    style={{
                        background: '#FAF6F0',
                        borderColor: '#E8D9C4',
                    }}
                >
                    <VoterSidebarContent
                        voter={voter}
                        activeSection={activeSection}
                        selectedPutra={selectedPutra}
                        selectedPutri={selectedPutri}
                        isBothSelected={isBothSelected}
                        progressCount={progressCount}
                        isVotingAllowed={isVotingAllowed}
                        onNavigateTataCara={() => scrollToSection(tataCaraRef)}
                        onNavigateProfilPutra={() =>
                            scrollToSection(profilPutraRef)
                        }
                        onNavigateProfilPutri={() =>
                            scrollToSection(profilPutriRef)
                        }
                        onNavigateBilikSuara={() =>
                            scrollToSection(bilikSuaraRef)
                        }
                        onRequestLogout={() => setIsLogoutModalOpen(true)}
                    />
                </aside>

                {/* ═════════════════════════════════════════════════════════════
                    2. MAIN APP CONTAINER (RIGHT CONTENT COLUMN)
                ═════════════════════════════════════════════════════════════ */}
                <div className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden lg:pl-72 xl:pl-80">
                    {/* Fixed Top Header */}
                    <header
                        className="fixed top-0 right-0 left-0 z-20 flex items-center justify-between border-b px-4 py-3.5 shadow-2xs backdrop-blur-md transition-all sm:px-8 lg:left-72 xl:left-80"
                        style={{
                            background: 'rgba(253, 251, 247, 0.95)',
                            borderColor: '#E8D9C4',
                        }}
                    >
                        {/* Left: Mobile hamburger & Brand */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsMobileDrawerOpen(true)}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors hover:bg-[#F5EFE6] lg:hidden"
                                style={{
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                                aria-label="Buka Menu Pemilih"
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-xl shadow-xs"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #4A2E1B 0%, #2D1A0A 100%)',
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-5 w-5 text-[#D4AF37]"
                                    >
                                        <path
                                            d="M12 2C12 2 7 7 7 12C7 14.8 8.5 17.2 12 19C15.5 17.2 17 14.8 17 12C17 7 12 2 12 2Z"
                                            fill="currentColor"
                                        />
                                        <path
                                            d="M12 19V22M9 22H15"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-base font-black tracking-tight"
                                            style={{ color: '#4A2E1B' }}
                                        >
                                            E-Pradana
                                        </span>
                                        <span
                                            className="rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase"
                                            style={{
                                                background: '#F5EFE6',
                                                color: '#8B5A2B',
                                                border: '1px solid #E8D9C4',
                                            }}
                                        >
                                            Bilik Suara
                                        </span>
                                    </div>
                                    <span className="block text-[10px] font-bold text-[#8B5A2B]">
                                        Pemilihan Pradana Ambalan Pramuka
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Quick Bilik Suara Button & Logout */}
                        <div className="flex items-center gap-2.5">
                            {/* Status Chip Pemilihan */}
                            <span
                                className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black sm:inline-flex ${
                                    isVotingAllowed
                                        ? 'border border-emerald-300 bg-emerald-100 text-emerald-800'
                                        : 'border border-amber-300 bg-amber-100 text-amber-800'
                                }`}
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${isVotingAllowed ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'}`}
                                />
                                {isVotingAllowed
                                    ? 'Voting Sedang Dibuka'
                                    : 'Voting Belum Dibuka'}
                            </span>

                            {/* Tombol Cepat Bilik Pencoblosan */}
                            <button
                                type="button"
                                onClick={() => scrollToSection(bilikSuaraRef)}
                                className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black text-white shadow-xs transition-all hover:scale-105 active:scale-95"
                                style={{ background: '#2D5A27' }}
                            >
                                <Vote className="h-4 w-4 text-[#D4AF37]" />
                                <span className="xs:inline hidden">
                                    Ke Bilik Suara
                                </span>
                            </button>

                            {/* Tombol Keluar dengan Konfirmasi */}
                            <button
                                type="button"
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:bg-rose-50 hover:text-rose-600"
                                style={{
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                                title="Keluar dari akun ini"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden md:inline">Keluar</span>
                            </button>
                        </div>
                    </header>

                    {/* Content Body */}
                    <main className="mx-auto w-full max-w-4xl flex-1 space-y-10 px-4.5 py-6 pt-20 pb-16 sm:space-y-12 sm:px-8 sm:py-8 sm:pt-24">
                        {/* Banner status jika belum dibuka */}
                        {!isVotingAllowed && (
                            <motion.div
                                initial={{ opacity: 0, y: -15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3.5 rounded-3xl p-5 text-xs font-semibold shadow-xs sm:items-center"
                                style={{
                                    background: '#FEF3C7',
                                    border: '1.5px solid #FDE68A',
                                    color: '#92400E',
                                }}
                            >
                                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 sm:mt-0" />
                                <div>
                                    <p className="text-sm font-black">
                                        {election_status === 'closed'
                                            ? 'Pemilihan Telah Ditutup'
                                            : 'Bilik Suara Belum Dibuka Oleh Panitia (Status: Draft)'}
                                    </p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                                        {election_status === 'closed'
                                            ? 'Sesi pemungutan suara telah berakhir. Hasil resmi sedang ditabulasi oleh panitia.'
                                            : 'Sistem pencoblosan saat ini masih dikunci. Anda dapat membaca profil, visi, dan misi seluruh kandidat di bawah sebelum sesi voting resmi dibuka.'}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* ═════════════════════════════════════════════════════
                            BAGIAN 1: SAPAAN & PANDUAN TATA CARA MEMILIH
                        ═════════════════════════════════════════════════════ */}
                        <ScrollRevealSection ref={tataCaraRef} id="tata-cara">
                            <div
                                className="relative overflow-hidden rounded-3xl p-6 text-white shadow-md sm:p-9"
                                style={{
                                    background:
                                        'linear-gradient(145deg, #3D2211 0%, #291508 60%, #1A0D05 100%)',
                                    border: '1.5px solid rgba(212, 175, 55, 0.25)',
                                }}
                            >
                                <div className="mb-2 flex items-center gap-2 text-xs font-extrabold tracking-wider text-[#D4AF37] uppercase">
                                    <Sparkles className="h-4 w-4" />
                                    <span>Bilik Suara Digital Siswa</span>
                                </div>

                                <h1 className="text-2xl leading-tight font-black tracking-tight text-[#FAF6F0] sm:text-4xl">
                                    Halo, {voter.name}!
                                </h1>
                                <p className="mt-1 text-xs font-medium text-[#D6C7B2] sm:text-sm">
                                    Pemilih Terdaftar:{' '}
                                    <strong className="text-white">
                                        Kelas {voter.class}
                                    </strong>{' '}
                                    · Username:{' '}
                                    <code className="rounded bg-black/30 px-2 py-0.5 font-mono text-xs text-[#D4AF37]">
                                        {voter.username}
                                    </code>
                                </p>

                                {/* 4 Langkah Mudah */}
                                <div className="mt-6 border-t border-white/10 pt-6">
                                    <div className="mb-3.5 flex items-center gap-2">
                                        <Compass className="h-4 w-4 text-[#D4AF37]" />
                                        <h2 className="text-xs font-black tracking-wider text-[#FAF6F0] uppercase">
                                            Tata Cara Penyaluran Hak Suara
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                                        <div
                                            className="flex items-start gap-3 rounded-2xl p-3.5"
                                            style={{
                                                background:
                                                    'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(212, 175, 55, 0.15)',
                                            }}
                                        >
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-black text-[#3D2211]">
                                                1
                                            </span>
                                            <div>
                                                <p className="font-bold text-white">
                                                    Baca Visi & Misi
                                                </p>
                                                <p className="mt-0.5 text-[11px] leading-snug text-[#D6C7B2]">
                                                    Pelajari program kerja
                                                    seluruh calon Pradana Putra
                                                    & Putri di bawah.
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-start gap-3 rounded-2xl p-3.5"
                                            style={{
                                                background:
                                                    'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(212, 175, 55, 0.15)',
                                            }}
                                        >
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-black text-[#3D2211]">
                                                2
                                            </span>
                                            <div>
                                                <p className="font-bold text-white">
                                                    Tentukan Pilihan di Bilik
                                                </p>
                                                <p className="mt-0.5 text-[11px] leading-snug text-[#D6C7B2]">
                                                    Pilih calon di Bilik Suara.
                                                    Pilihan masih bebas
                                                    diganti-ganti sebelum
                                                    disimpan.
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-start gap-3 rounded-2xl p-3.5"
                                            style={{
                                                background:
                                                    'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(212, 175, 55, 0.15)',
                                            }}
                                        >
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-black text-[#3D2211]">
                                                3
                                            </span>
                                            <div>
                                                <p className="font-bold text-white">
                                                    Simpan & Validasi
                                                </p>
                                                <p className="mt-0.5 text-[11px] leading-snug text-[#D6C7B2]">
                                                    Tekan tombol Simpan Jawaban
                                                    untuk memeriksa kembali
                                                    sebelum suara dikirim.
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-start gap-3 rounded-2xl p-3.5"
                                            style={{
                                                background:
                                                    'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(212, 175, 55, 0.15)',
                                            }}
                                        >
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-black text-[#3D2211]">
                                                4
                                            </span>
                                            <div>
                                                <p className="font-bold text-white">
                                                    Notifikasi & Logout
                                                </p>
                                                <p className="mt-0.5 text-[11px] leading-snug text-[#D6C7B2]">
                                                    Setelah suara masuk ke
                                                    kotak, lakukan logout demi
                                                    menjaga kerahasiaan pilihan.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            scrollToSection(profilPutraRef)
                                        }
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/15"
                                        style={{
                                            border: '1px solid rgba(212, 175, 55, 0.4)',
                                        }}
                                    >
                                        <FileText className="h-4 w-4 text-[#D4AF37]" />
                                        <span>Baca Visi & Misi Kandidat ↓</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            scrollToSection(bilikSuaraRef)
                                        }
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black text-white shadow-md transition-all hover:scale-105 active:scale-95"
                                        style={{ background: '#2D5A27' }}
                                    >
                                        <Vote className="h-4 w-4 text-[#D4AF37]" />
                                        <span>Menuju Bilik Pencoblosan 🗳️</span>
                                    </button>
                                </div>
                            </div>
                        </ScrollRevealSection>

                        {/* ═════════════════════════════════════════════════════
                            BAGIAN 2: PROFIL KANDIDAT PUTRA (MURNI LITERASI - TANPA TOMBOL VOTING)
                        ═════════════════════════════════════════════════════ */}
                        <ScrollRevealSection
                            ref={profilPutraRef}
                            id="profil-putra"
                        >
                            <div className="mx-auto w-full max-w-xl space-y-4">
                                <div
                                    className="flex items-center justify-between rounded-2xl px-4.5 py-4 shadow-xs sm:px-6 sm:py-4.5"
                                    style={{
                                        background: '#FAF6F0',
                                        border: '1.5px solid #E8D9C4',
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2D5A27] text-base font-black text-white shadow-xs sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg">
                                            ♂
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black tracking-tight text-[#4A2E1B] sm:text-lg">
                                                Calon Pradana Putra
                                            </h3>
                                            <p className="text-xs font-medium text-[#8B5A2B]">
                                                {candidates_putra.length}{' '}
                                                Kandidat
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <CandidateSlider
                                    candidates={candidates_putra}
                                    category="putra"
                                />
                            </div>
                        </ScrollRevealSection>

                        {/* ═════════════════════════════════════════════════════
                            BAGIAN 3: PROFIL KANDIDAT PUTRI (MURNI LITERASI - TANPA TOMBOL VOTING)
                        ═════════════════════════════════════════════════════ */}
                        <ScrollRevealSection
                            ref={profilPutriRef}
                            id="profil-putri"
                        >
                            <div className="mx-auto w-full max-w-xl space-y-3.5">
                                <div
                                    className="flex items-center justify-between rounded-2xl px-4.5 py-4 shadow-xs sm:px-6 sm:py-4.5"
                                    style={{
                                        background: '#FAF6F0',
                                        border: '1.5px solid #E8D9C4',
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5A2B] text-base font-black text-white shadow-xs sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg">
                                            ♀
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black tracking-tight text-[#4A2E1B] sm:text-lg">
                                                Calon Pradana Putri
                                            </h3>
                                            <p className="text-xs font-medium text-[#8B5A2B]">
                                                {candidates_putri.length}{' '}
                                                Kandidat
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <CandidateSlider
                                    candidates={candidates_putri}
                                    category="putri"
                                />
                            </div>
                        </ScrollRevealSection>

                        {/* ═════════════════════════════════════════════════════
                            BAGIAN 4: BILIK SUARA (AREA PENCOBLOSAN & SIMPAN JAWABAN)
                        ═════════════════════════════════════════════════════ */}
                        <ScrollRevealSection
                            ref={bilikSuaraRef}
                            id="bilik-suara"
                        >
                            <div
                                className="rounded-3xl p-6 shadow-lg transition-all sm:p-8"
                                style={{
                                    background: '#F5EFE6',
                                    border: '2.5px solid #D4AF37',
                                }}
                            >
                                {/* Header Bilik Pencoblosan */}
                                <div className="flex flex-col gap-3 border-b border-[#E8D9C4] pb-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4A2E1B] text-[#D4AF37] shadow-xs">
                                                <Vote className="h-5 w-5" />
                                            </div>
                                            <h2 className="text-2xl font-black tracking-tight text-[#4A2E1B]">
                                                Bilik Pencoblosan Digital
                                            </h2>
                                        </div>
                                        <p className="mt-1 text-xs font-medium text-[#8B5A2B]">
                                            Klik calon pilihan Anda. Pilihan
                                            bersifat sementara dan{' '}
                                            <strong>masih bebas diganti</strong>{' '}
                                            sebelum Anda menekan tombol Simpan
                                            Jawaban.
                                        </p>
                                    </div>

                                    {/* Status Pemilihan Live Badge */}
                                    <div className="flex items-center gap-2 text-xs font-black">
                                        <span
                                            className={`rounded-full px-3 py-1.5 text-xs shadow-2xs ${
                                                selectedPutraId
                                                    ? 'bg-emerald-600 font-extrabold text-white'
                                                    : 'border border-[#E8D9C4] bg-white text-neutral-500'
                                            }`}
                                        >
                                            Putra:{' '}
                                            {selectedPutra
                                                ? `#${selectedPutra.candidate_number}`
                                                : 'Belum'}
                                        </span>
                                        <span
                                            className={`rounded-full px-3 py-1.5 text-xs shadow-2xs ${
                                                selectedPutriId
                                                    ? 'bg-emerald-600 font-extrabold text-white'
                                                    : 'border border-[#E8D9C4] bg-white text-neutral-500'
                                            }`}
                                        >
                                            Putri:{' '}
                                            {selectedPutri
                                                ? `#${selectedPutri.candidate_number}`
                                                : 'Belum'}
                                        </span>
                                    </div>
                                </div>

                                {/* Banner Peringatan jika voting belum dibuka */}
                                {!isVotingAllowed && (
                                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
                                        <Lock className="h-5 w-5 shrink-0 text-amber-600" />
                                        <span>
                                            Bilik suara ini terkunci karena
                                            status pemilihan saat ini belum
                                            berstatus{' '}
                                            <strong>
                                                &ldquo;OPEN (Dibuka)&rdquo;
                                            </strong>{' '}
                                            oleh panitia. Tombol pemilihan
                                            dinonaktifkan.
                                        </span>
                                    </div>
                                )}

                                {/* Dua Tab: Putra & Putri */}
                                <div
                                    className="my-6 grid grid-cols-2 rounded-2xl p-1.5 shadow-xs"
                                    style={{
                                        background: '#FAF6F0',
                                        border: '1.5px solid #E8D9C4',
                                    }}
                                >
                                    {/* Tab 1: Putra */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveVoteTab('putra')
                                        }
                                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-xs font-black transition-all sm:text-sm ${
                                            activeVoteTab === 'putra'
                                                ? 'scale-[1.01] bg-[#4A2E1B] text-[#D4AF37] shadow-md'
                                                : 'text-[#8B5A2B] hover:text-[#4A2E1B]'
                                        }`}
                                    >
                                        <span>⚜️ Pradana Putra</span>
                                        {selectedPutraId ? (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white">
                                                ✓
                                            </span>
                                        ) : (
                                            <span className="text-[11px] opacity-60">
                                                (Pilih 1)
                                            </span>
                                        )}
                                    </button>

                                    {/* Tab 2: Putri */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveVoteTab('putri')
                                        }
                                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-xs font-black transition-all sm:text-sm ${
                                            activeVoteTab === 'putri'
                                                ? 'scale-[1.01] bg-[#4A2E1B] text-[#D4AF37] shadow-md'
                                                : 'text-[#8B5A2B] hover:text-[#4A2E1B]'
                                        }`}
                                    >
                                        <span>🌸 Pradana Putri</span>
                                        {selectedPutriId ? (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white">
                                                ✓
                                            </span>
                                        ) : (
                                            <span className="text-[11px] opacity-60">
                                                (Pilih 1)
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Konten Kartu Tab Bilik Suara */}
                                <AnimatePresence mode="wait">
                                    {activeVoteTab === 'putra' ? (
                                        <motion.div
                                            key="booth-putra"
                                            initial={{ opacity: 0, x: -15 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 15 }}
                                            transition={{ duration: 0.25 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center justify-between text-xs font-bold text-[#4A2E1B]">
                                                <span>
                                                    Pilih 1 Calon Pradana Putra:
                                                </span>
                                                {selectedPutra && (
                                                    <span className="text-right font-black text-emerald-800">
                                                        Terpilih: No.{' '}
                                                        {
                                                            selectedPutra.candidate_number
                                                        }{' '}
                                                        · {selectedPutra.name}
                                                    </span>
                                                )}
                                            </div>

                                            <div
                                                className={`flex flex-wrap justify-center gap-4 ${
                                                    candidates_putra.length <= 2
                                                        ? 'mx-auto max-w-lg'
                                                        : ''
                                                }`}
                                                style={
                                                    candidates_putra.length > 2
                                                        ? {
                                                              display: 'grid',
                                                              gridTemplateColumns:
                                                                  'repeat(auto-fill, minmax(180px, 1fr))',
                                                          }
                                                        : undefined
                                                }
                                            >
                                                {candidates_putra.map(
                                                    (candidate) => (
                                                        <VotingActionCard
                                                            key={candidate.id}
                                                            candidate={
                                                                candidate
                                                            }
                                                            isSelected={
                                                                selectedPutraId ===
                                                                candidate.id
                                                            }
                                                            isVotingAllowed={
                                                                isVotingAllowed
                                                            }
                                                            onSelect={() =>
                                                                handleSelectPutra(
                                                                    candidate.id,
                                                                )
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="booth-putri"
                                            initial={{ opacity: 0, x: 15 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -15 }}
                                            transition={{ duration: 0.25 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center justify-between text-xs font-bold text-[#4A2E1B]">
                                                <span>
                                                    Pilih 1 Calon Pradana Putri:
                                                </span>
                                                {selectedPutri && (
                                                    <span className="text-right font-black text-emerald-800">
                                                        Terpilih: No.{' '}
                                                        {
                                                            selectedPutri.candidate_number
                                                        }{' '}
                                                        · {selectedPutri.name}
                                                    </span>
                                                )}
                                            </div>

                                            <div
                                                className={`flex flex-wrap justify-center gap-4 ${
                                                    candidates_putri.length <= 2
                                                        ? 'mx-auto max-w-lg'
                                                        : ''
                                                }`}
                                                style={
                                                    candidates_putri.length > 2
                                                        ? {
                                                              display: 'grid',
                                                              gridTemplateColumns:
                                                                  'repeat(auto-fill, minmax(180px, 1fr))',
                                                          }
                                                        : undefined
                                                }
                                            >
                                                {candidates_putri.map(
                                                    (candidate) => (
                                                        <VotingActionCard
                                                            key={candidate.id}
                                                            candidate={
                                                                candidate
                                                            }
                                                            isSelected={
                                                                selectedPutriId ===
                                                                candidate.id
                                                            }
                                                            isVotingAllowed={
                                                                isVotingAllowed
                                                            }
                                                            onSelect={() =>
                                                                handleSelectPutri(
                                                                    candidate.id,
                                                                )
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Area Tombol Simpan Jawaban & Validasi */}
                                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#E8D9C4] pt-6 sm:flex-row">
                                    <div className="text-xs text-[#8B5A2B]">
                                        <p className="font-bold text-[#4A2E1B]">
                                            Status Pilihan: {progressCount}/2
                                            Terpilih (Sementara)
                                        </p>
                                        <p className="mt-0.5">
                                            Klik tombol simpan untuk memvalidasi
                                            pilihan suara Anda ke kotak suara.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsConfirmModalOpen(true)
                                        }
                                        disabled={
                                            !isBothSelected || !isVotingAllowed
                                        }
                                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-xs font-black shadow-md transition-all sm:text-sm ${
                                            isBothSelected && isVotingAllowed
                                                ? 'bg-[#2D5A27] text-white hover:scale-105 active:scale-95'
                                                : 'cursor-not-allowed bg-neutral-300 text-neutral-500 opacity-75'
                                        }`}
                                    >
                                        <Save className="h-4 w-4 text-[#D4AF37]" />
                                        <span>
                                            {!isVotingAllowed
                                                ? '🔒 Bilik Suara Belum Dibuka'
                                                : isBothSelected
                                                  ? '💾 Simpan Jawaban & Validasi Pilihan'
                                                  : `Pilih Calon ${!selectedPutraId ? 'Putra' : 'Putri'} Terlebih Dahulu`}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </ScrollRevealSection>
                    </main>

                    {/* Footer Resmi Pemilih */}
                    <VoterFooter
                        onScrollToTop={() =>
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        }
                    />
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    3. POPUP VERIFIKASI PILIHAN (VALIDASI SEBELUM SIMPAN RESMI)
                ═════════════════════════════════════════════════════════════ */}
                <Dialog
                    open={isConfirmModalOpen}
                    onOpenChange={setIsConfirmModalOpen}
                >
                    <DialogContent
                        className="max-w-md rounded-3xl p-6"
                        style={{
                            background: '#fff',
                            border: '1.5px solid #E8D9C4',
                        }}
                    >
                        <DialogHeader>
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <DialogTitle
                                className="text-center text-xl font-black"
                                style={{ color: '#4A2E1B' }}
                            >
                                Apakah Anda yakin dengan pilihan Anda?
                            </DialogTitle>
                            <DialogDescription className="text-center text-xs text-[#8B5A2B]">
                                Periksa kembali surat suara Anda. Setelah
                                disimpan, suara Anda resmi masuk ke kotak suara
                                dan <strong>tidak dapat diubah lagi</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Review Calon Terpilih */}
                        <div className="my-4 space-y-3">
                            {/* Putra */}
                            <div
                                className="flex items-center gap-3 rounded-2xl p-3.5"
                                style={{
                                    background: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                }}
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2D5A27] font-mono text-base font-black text-white shadow-xs">
                                    {selectedPutra?.candidate_number}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase">
                                        Calon Pradana Putra
                                    </span>
                                    <p className="truncate text-sm font-black text-[#4A2E1B]">
                                        {selectedPutra?.name}
                                    </p>
                                    <p className="text-[11px] font-medium text-neutral-500">
                                        Kelas {selectedPutra?.class}
                                    </p>
                                </div>
                            </div>

                            {/* Putri */}
                            <div
                                className="flex items-center gap-3 rounded-2xl p-3.5"
                                style={{
                                    background: '#FFFBEB',
                                    border: '1px solid #FDE68A',
                                }}
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8B5A2B] font-mono text-base font-black text-white shadow-xs">
                                    {selectedPutri?.candidate_number}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-[10px] font-extrabold tracking-wider text-amber-700 uppercase">
                                        Calon Pradana Putri
                                    </span>
                                    <p className="truncate text-sm font-black text-[#4A2E1B]">
                                        {selectedPutri?.name}
                                    </p>
                                    <p className="text-[11px] font-medium text-neutral-500">
                                        Kelas {selectedPutri?.class}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Dua Tombol Keputusan */}
                        <div className="mt-4 grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="cursor-pointer rounded-2xl py-3 text-xs font-bold text-neutral-600 transition-colors hover:bg-[#F5EFE6]"
                                style={{ border: '1px solid #E8D9C4' }}
                            >
                                Batal / Ganti Pilihan
                            </button>

                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleFinalSubmit}
                                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                style={{ background: '#2D5A27' }}
                            >
                                {isSubmitting ? (
                                    <span>Menyimpan Suara...</span>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Ya, Simpan & Kirim</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ═════════════════════════════════════════════════════════════
                    5. NOTIFIKASI SUKSES (JAWABAN SUDAH MASUK + TOMBOL SIMPAN & LOGOUT)
                ═════════════════════════════════════════════════════════════ */}
                <Dialog open={isSuccessModalOpen} onOpenChange={() => {}}>
                    <DialogContent
                        className="max-w-md rounded-3xl p-6 text-center"
                        style={{
                            background: '#fff',
                            border: '2px solid #2D5A27',
                        }}
                    >
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 shadow-md">
                            <Sparkles className="h-9 w-9 animate-pulse text-emerald-600" />
                        </div>

                        <DialogTitle className="text-2xl font-black text-[#4A2E1B]">
                            🎉 Jawaban Anda Sudah Masuk!
                        </DialogTitle>

                        <DialogDescription className="mt-2 text-xs leading-relaxed text-[#8B5A2B]">
                            Terima kasih! Surat suara Anda telah berhasil
                            disimpan dan resmi tercatat ke dalam kotak suara
                            digital secara sah, aman, dan rahasia.
                        </DialogDescription>

                        {/* Ringkasan Suara Terkunci */}
                        <div
                            className="my-5 space-y-2 rounded-2xl p-4 text-left text-xs"
                            style={{
                                background: '#F0FDF4',
                                border: '1px solid #BBF7D0',
                            }}
                        >
                            <p className="text-[11px] font-extrabold tracking-wider text-emerald-800 uppercase">
                                Rekaman Hak Suara Anda:
                            </p>
                            <p className="font-semibold text-[#4A2E1B]">
                                • Pradana Putra Terpilih:{' '}
                                <strong>
                                    {selectedPutra
                                        ? `#${selectedPutra.candidate_number} ${selectedPutra.name}`
                                        : 'Telah Terekam'}
                                </strong>
                            </p>
                            <p className="font-semibold text-[#4A2E1B]">
                                • Pradana Putri Terpilih:{' '}
                                <strong>
                                    {selectedPutri
                                        ? `#${selectedPutri.candidate_number} ${selectedPutri.name}`
                                        : 'Telah Terekam'}
                                </strong>
                            </p>
                            <p className="border-t border-emerald-200 pt-1 text-[11px] text-emerald-700">
                                Status:{' '}
                                <strong>Sah & Terenkripsi Kriptografi</strong>
                            </p>
                        </div>

                        <p className="mb-4 text-[11px] text-neutral-500">
                            Demi menjaga kerahasiaan pilihan dan integritas
                            sistem, silakan logout untuk mengakhiri sesi bilik
                            suara Anda.
                        </p>

                        {/* Tombol Simpan & Logout */}
                        <button
                            type="button"
                            onClick={executeLogout}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                            style={{ background: '#2D5A27' }}
                        >
                            <LogOut className="h-4 w-4 text-[#D4AF37]" />
                            <span>Simpan & Logout (Keluar)</span>
                        </button>
                    </DialogContent>
                </Dialog>

                {/* ═════════════════════════════════════════════════════════════
                    6. POPUP KONFIRMASI LOGOUT (APAKAH ANDA YAKIN INGIN KELUAR?)
                ═════════════════════════════════════════════════════════════ */}
                <Dialog
                    open={isLogoutModalOpen}
                    onOpenChange={setIsLogoutModalOpen}
                >
                    <DialogContent
                        className="max-w-sm rounded-3xl p-6 text-center"
                        style={{
                            background: '#fff',
                            border: '1.5px solid #E8D9C4',
                        }}
                    >
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                            <LogOut className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-lg font-black text-[#4A2E1B]">
                            Apakah Anda yakin ingin keluar?
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-xs text-[#8B5A2B]">
                            Jika Anda belum menyimpan jawaban suara, pilihan
                            draf Anda saat ini tidak akan terekam ke kotak
                            suara.
                        </DialogDescription>

                        <div className="mt-5 grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="cursor-pointer rounded-2xl py-2.5 text-xs font-bold text-neutral-600 transition-colors hover:bg-[#F5EFE6]"
                                style={{ border: '1px solid #E8D9C4' }}
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                onClick={executeLogout}
                                className="cursor-pointer rounded-2xl bg-rose-600 py-2.5 text-xs font-black text-white shadow-md transition-colors hover:bg-rose-700"
                            >
                                Ya, Keluar
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ═════════════════════════════════════════════════════════════
                    7. MOBILE VOTER DRAWER (SHEET NAVIGASI KHUSUS HP)
                ═════════════════════════════════════════════════════════════ */}
                <Sheet
                    open={isMobileDrawerOpen}
                    onOpenChange={setIsMobileDrawerOpen}
                >
                    <SheetContent
                        side="left"
                        className="w-[85vw] max-w-xs overflow-y-auto p-5"
                        style={{ background: '#FAF6F0' }}
                    >
                        <SheetHeader className="mb-4 p-0 text-left">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4A2E1B] text-[#D4AF37]">
                                    <Compass className="h-5 w-5" />
                                </div>
                                <div>
                                    <SheetTitle className="text-base font-black text-[#4A2E1B]">
                                        Menu Pemilih
                                    </SheetTitle>
                                    <SheetDescription className="text-[11px] text-[#8B5A2B]">
                                        Bilik Suara Digital E-Pradana
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        <VoterSidebarContent
                            voter={voter}
                            activeSection={activeSection}
                            selectedPutra={selectedPutra}
                            selectedPutri={selectedPutri}
                            isBothSelected={isBothSelected}
                            progressCount={progressCount}
                            isVotingAllowed={isVotingAllowed}
                            onNavigateTataCara={() =>
                                scrollToSection(tataCaraRef)
                            }
                            onNavigateProfilPutra={() =>
                                scrollToSection(profilPutraRef)
                            }
                            onNavigateProfilPutri={() =>
                                scrollToSection(profilPutriRef)
                            }
                            onNavigateBilikSuara={() =>
                                scrollToSection(bilikSuaraRef)
                            }
                            onRequestLogout={() => {
                                setIsMobileDrawerOpen(false);
                                setIsLogoutModalOpen(true);
                            }}
                        />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}

// ── COMPONENT 1: SCROLL REVEAL WRAPPER (ANIMASI BUKA-TUTUP KETIKA SCROLL) ──
const ScrollRevealSection = ({
    children,
    id,
    ref,
}: {
    children: React.ReactNode;
    id: string;
    ref: React.RefObject<HTMLDivElement | null>;
}) => {
    return (
        <motion.section
            ref={ref}
            id={id}
            initial={{ opacity: 0.35, y: 40, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{
                once: false,
                amount: 0.15,
                margin: '-50px 0px -50px 0px',
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="scroll-mt-24 transition-all"
        >
            {children}
        </motion.section>
    );
};

// ── COMPONENT 2: VOTER SIDEBAR CONTENT (DIPAKAI DI DOCKED SIDEBAR & MOBILE DRAWER) ──
function VoterSidebarContent({
    voter,
    activeSection,
    selectedPutra,
    selectedPutri,
    isBothSelected,
    progressCount,
    isVotingAllowed,
    onNavigateTataCara,
    onNavigateProfilPutra,
    onNavigateProfilPutri,
    onNavigateBilikSuara,
    onRequestLogout,
}: {
    voter: Props['voter'];
    activeSection:
        | 'tata-cara'
        | 'profil-putra'
        | 'profil-putri'
        | 'bilik-suara';
    selectedPutra: Candidate | null;
    selectedPutri: Candidate | null;
    isBothSelected: boolean;
    progressCount: number;
    isVotingAllowed: boolean;
    onNavigateTataCara: () => void;
    onNavigateProfilPutra: () => void;
    onNavigateProfilPutri: () => void;
    onNavigateBilikSuara: () => void;
    onRequestLogout: () => void;
}) {
    return (
        <div className="space-y-4">
            {/* Profil Pemilih Card */}
            <div
                className="rounded-3xl p-4 text-xs shadow-2xs"
                style={{ background: '#fff', border: '1.5px solid #E8D9C4' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-xs"
                        style={{
                            background:
                                'linear-gradient(135deg, #4A2E1B 0%, #2D1A0A 100%)',
                        }}
                    >
                        {voter.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                            Pemilih Sah:
                        </span>
                        <p className="truncate text-sm font-black text-[#4A2E1B]">
                            {voter.name}
                        </p>
                        <p className="text-[11px] font-semibold text-[#8B5A2B]">
                            Kelas {voter.class} ·{' '}
                            <code className="font-mono text-neutral-600">
                                {voter.username}
                            </code>
                        </p>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#E8D9C4] pt-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        <span>Hak Suara Aktif</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase">
                        Belum Memilih
                    </span>
                </div>
            </div>

            {/* Stepper Navigasi Halaman (Scroll-Spy) */}
            <div
                className="space-y-1 rounded-3xl p-3.5 shadow-2xs"
                style={{ background: '#fff', border: '1.5px solid #E8D9C4' }}
            >
                <span className="mb-1.5 block px-2 text-[10px] font-extrabold tracking-wider text-[#8B5A2B] uppercase">
                    Alur Pemilihan
                </span>

                <button
                    type="button"
                    onClick={onNavigateTataCara}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition-all ${
                        activeSection === 'tata-cara'
                            ? 'bg-[#4A2E1B] text-[#D4AF37] shadow-xs'
                            : 'text-[#4A2E1B] hover:bg-[#F5EFE6]'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <Compass className="h-4 w-4" />
                        <span>1. Panduan & Aturan</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </button>

                <button
                    type="button"
                    onClick={onNavigateProfilPutra}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition-all ${
                        activeSection === 'profil-putra'
                            ? 'bg-[#4A2E1B] text-[#D4AF37] shadow-xs'
                            : 'text-[#4A2E1B] hover:bg-[#F5EFE6]'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <span className="font-mono text-sm">♂</span>
                        <span>2. Visi Misi Putra</span>
                    </span>
                    {selectedPutra ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                            ✓
                        </span>
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={onNavigateProfilPutri}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition-all ${
                        activeSection === 'profil-putri'
                            ? 'bg-[#4A2E1B] text-[#D4AF37] shadow-xs'
                            : 'text-[#4A2E1B] hover:bg-[#F5EFE6]'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <span className="font-mono text-sm">♀</span>
                        <span>3. Visi Misi Putri</span>
                    </span>
                    {selectedPutri ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                            ✓
                        </span>
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={onNavigateBilikSuara}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition-all ${
                        activeSection === 'bilik-suara'
                            ? 'bg-[#2D5A27] text-white shadow-xs'
                            : 'bg-emerald-50/60 text-[#2D5A27] hover:bg-emerald-100/60'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <Vote className="h-4 w-4" />
                        <span>4. Bilik Pencoblosan</span>
                    </span>
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-black">
                        {progressCount}/2
                    </span>
                </button>
            </div>

            {/* Kotak Status Pilihan (Draf Suara Pemilih) */}
            <div
                className="space-y-3 rounded-3xl p-4 text-xs shadow-2xs"
                style={{ background: '#fff', border: '1.5px solid #E8D9C4' }}
            >
                <div className="flex items-center justify-between">
                    <span className="block font-extrabold text-[#4A2E1B]">
                        Draf Pilihan Anda:
                    </span>
                    <span className="text-[11px] font-black text-[#8B5A2B]">
                        {isBothSelected ? 'Siap Validasi ✅' : 'Belum Lengkap'}
                    </span>
                </div>

                <div className="space-y-2">
                    <div
                        className="flex items-center justify-between rounded-2xl p-2.5"
                        style={{
                            background: '#FAF6F0',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <span className="text-[11px] font-semibold text-neutral-500">
                            Calon Putra:
                        </span>
                        <strong
                            className={
                                selectedPutra
                                    ? 'font-black text-emerald-700'
                                    : 'text-neutral-400'
                            }
                        >
                            {selectedPutra
                                ? `#${selectedPutra.candidate_number} ${selectedPutra.name}`
                                : 'Belum'}
                        </strong>
                    </div>

                    <div
                        className="flex items-center justify-between rounded-2xl p-2.5"
                        style={{
                            background: '#FAF6F0',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <span className="text-[11px] font-semibold text-neutral-500">
                            Calon Putri:
                        </span>
                        <strong
                            className={
                                selectedPutri
                                    ? 'font-black text-emerald-700'
                                    : 'text-neutral-400'
                            }
                        >
                            {selectedPutri
                                ? `#${selectedPutri.candidate_number} ${selectedPutri.name}`
                                : 'Belum'}
                        </strong>
                    </div>
                </div>
            </div>

            {/* Jaminan Luber & Jurdil */}
            <div
                className="space-y-1.5 rounded-3xl p-3.5 text-[11px] text-[#8B5A2B]"
                style={{ background: '#fff', border: '1.5px solid #E8D9C4' }}
            >
                <div className="flex items-center gap-1.5 font-black text-[#4A2E1B]">
                    <Shield className="h-4 w-4 text-[#D4AF37]" />
                    <span>Jaminan Asas LUBER JURDIL</span>
                </div>
                <p className="leading-snug">
                    Pilihan suara Anda dijamin 100% rahasia tanpa identitas nama
                    dan langsung terenkripsi ke sistem.
                </p>
            </div>

            {/* Logout Button (Dengan Dialog Konfirmasi) */}
            <button
                type="button"
                onClick={onRequestLogout}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
                style={{ border: '1.5px solid #FEE2E2' }}
            >
                <LogOut className="h-4 w-4" />
                <span>Keluar dari Bilik Suara</span>
            </button>
        </div>
    );
}

// ── COMPONENT 3: KARTU MEMBACA VISI & MISI KANDIDAT (MURNI LITERASI - TANPA TOMBOL VOTING) ──
function CandidateReadingCard({
    candidate,
    category,
}: {
    candidate: Candidate;
    category: 'putra' | 'putri';
}) {
    const themeColor = category === 'putra' ? '#2D5A27' : '#8B5A2B';

    return (
        <div
            className="w-full rounded-3xl bg-white p-5 shadow-xs transition-all sm:p-7"
            style={{
                border: '1.5px solid #E8D9C4',
            }}
        >
            <div className="flex flex-col items-center">
                {/* Foto Calon di Tengah (Besar & Jelas) */}
                <div className="flex justify-center">
                    {candidate.photo_url ? (
                        <img
                            src={candidate.photo_url}
                            alt={candidate.name}
                            className="h-64 w-48 rounded-3xl border-2 border-[#E8D9C4] object-cover shadow-md sm:h-76 sm:w-56 md:h-84 md:w-64"
                        />
                    ) : (
                        <div
                            className="flex h-64 w-48 flex-col items-center justify-center rounded-3xl border border-[#E8D9C4] shadow-inner sm:h-76 sm:w-56 md:h-84 md:w-64"
                            style={{ background: '#F5EFE6', color: '#4A2E1B' }}
                        >
                            <span className="text-4xl font-black tracking-wider sm:text-5xl">
                                {candidate.name.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Identitas Kandidat di Tengah (Simetris & Rapi) */}
                <div className="mt-4 w-full max-w-xl px-2 text-center">
                    <div className="mb-1.5 flex flex-wrap items-center justify-center gap-2">
                        <span
                            className="inline-block rounded-lg px-2.5 py-0.5 text-xs font-black text-white shadow-2xs"
                            style={{ background: themeColor }}
                        >
                            No. {candidate.candidate_number}
                        </span>
                        <span
                            className="inline-block rounded-lg px-2.5 py-0.5 text-xs font-bold"
                            style={{
                                background: '#FAF6F0',
                                color: '#8B5A2B',
                                border: '1px solid #E8D9C4',
                            }}
                        >
                            Kelas {candidate.class}
                        </span>
                    </div>

                    <h4 className="text-xl font-black tracking-tight text-[#4A2E1B] sm:text-2xl">
                        {candidate.name}
                    </h4>
                </div>

                {/* Kotak Visi & Misi Terbuka Rapi & Lebar */}
                <div className="mx-auto mt-5 w-full max-w-xl space-y-3.5">
                    {/* Kotak Visi */}
                    <div
                        className="rounded-2xl p-4 text-center text-xs shadow-2xs sm:p-5 sm:text-sm"
                        style={{
                            background: '#FAF6F0',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <span className="mb-1.5 block text-center font-black tracking-wider text-[#8B5A2B] uppercase">
                            Visi
                        </span>
                        <p className="text-center leading-relaxed font-medium whitespace-pre-line text-[#4A2E1B]">
                            {candidate.vision ||
                                'Visi belum diunggah oleh panitia.'}
                        </p>
                    </div>

                    {/* Kotak Misi */}
                    <div
                        className="rounded-2xl p-4 text-center text-xs shadow-2xs sm:p-5 sm:text-sm"
                        style={{
                            background: '#FAF6F0',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <span className="mb-2 block text-center font-black tracking-wider text-[#8B5A2B] uppercase">
                            Misi & Program Kerja
                        </span>
                        <div className="mx-auto max-w-md text-left">
                            <p className="leading-relaxed font-medium whitespace-pre-line text-[#4A2E1B]">
                                {candidate.mission ||
                                    'Misi belum diunggah oleh panitia.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── COMPONENT 3.5: SLIDER PEMAPARAN VISI & MISI KANDIDAT (SLIDE KE SAMPING) ──
function CandidateSlider({
    candidates,
    category,
}: {
    candidates: Candidate[];
    category: 'putra' | 'putri';
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    if (candidates.length === 0) {
        return (
            <div
                className="rounded-2xl bg-white p-6 text-center shadow-xs"
                style={{ border: '1.5px solid #E8D9C4' }}
            >
                <p className="text-sm font-medium text-[#8B5A2B]">
                    Belum ada calon terdaftar pada kategori ini.
                </p>
            </div>
        );
    }

    const scrollToCandidate = (index: number) => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const children = container.children;
        if (children[index]) {
            const child = children[index] as HTMLElement;
            container.scrollTo({
                left: child.offsetLeft - container.offsetLeft,
                behavior: 'smooth',
            });
        }
        setActiveIndex(index);
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const scrollLeft = container.scrollLeft;
        const children = Array.from(container.children) as HTMLElement[];
        if (children.length === 0) return;

        let closestIndex = 0;
        let minDiff = Infinity;
        children.forEach((child, idx) => {
            const diff = Math.abs(
                child.offsetLeft - container.offsetLeft - scrollLeft,
            );
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = idx;
            }
        });

        if (closestIndex !== activeIndex) {
            setActiveIndex(closestIndex);
        }
    };

    const isMulti = candidates.length > 1;
    const themeColor = category === 'putra' ? '#2D5A27' : '#8B5A2B';

    return (
        <div className="mx-auto w-full max-w-xl space-y-3">
            {/* Symmetrical Candidate Tabs */}
            {isMulti && (
                <div className="no-scrollbar flex items-center justify-center gap-2 overflow-x-auto px-0.5 py-0.5">
                    {candidates.map((c, idx) => {
                        const isActive = activeIndex === idx;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => scrollToCandidate(idx)}
                                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 truncate rounded-xl px-3 py-2 text-center text-xs font-black transition-all sm:min-w-[120px] sm:flex-initial ${
                                    isActive
                                        ? 'text-white shadow-xs'
                                        : 'border border-[#E8D9C4] bg-white text-[#4A2E1B] hover:bg-[#FAF6F0]'
                                }`}
                                style={
                                    isActive ? { background: themeColor } : {}
                                }
                            >
                                <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                                        isActive
                                            ? 'bg-white/25 text-white'
                                            : 'bg-[#FAF6F0] text-[#8B5A2B]'
                                    }`}
                                >
                                    {c.candidate_number}
                                </span>
                                <span className="truncate">
                                    {c.name.split(' ')[0]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Horizontal Slider Track with clean margins & gap */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-0.5 py-1.5 select-none"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {candidates.map((candidate) => (
                    <div
                        key={candidate.id}
                        className="flex w-full min-w-full shrink-0 snap-center justify-center"
                    >
                        <CandidateReadingCard
                            candidate={candidate}
                            category={category}
                        />
                    </div>
                ))}
            </div>

            {/* Symmetrical Bottom Navigation & Dots */}
            {isMulti && (
                <div className="flex items-center justify-between gap-3 px-1.5 pt-0.5">
                    <button
                        type="button"
                        onClick={() =>
                            scrollToCandidate(Math.max(0, activeIndex - 1))
                        }
                        disabled={activeIndex === 0}
                        className="flex cursor-pointer items-center gap-1 rounded-xl border border-[#E8D9C4] bg-white px-3 py-1.5 text-xs font-bold text-[#4A2E1B] shadow-2xs transition-all hover:bg-[#FAF6F0] disabled:cursor-not-allowed disabled:opacity-20"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Sebelumnya</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                        {candidates.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => scrollToCandidate(idx)}
                                className={`h-2 cursor-pointer rounded-full transition-all ${
                                    activeIndex === idx
                                        ? 'w-5'
                                        : 'w-2 bg-[#E8D9C4] hover:bg-[#D4AF37]'
                                }`}
                                style={
                                    activeIndex === idx
                                        ? { background: themeColor }
                                        : {}
                                }
                                aria-label={`Calon ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            scrollToCandidate(
                                Math.min(
                                    candidates.length - 1,
                                    activeIndex + 1,
                                ),
                            )
                        }
                        disabled={activeIndex === candidates.length - 1}
                        className="flex cursor-pointer items-center gap-1 rounded-xl border border-[#E8D9C4] bg-white px-3 py-1.5 text-xs font-bold text-[#4A2E1B] shadow-2xs transition-all hover:bg-[#FAF6F0] disabled:cursor-not-allowed disabled:opacity-20"
                    >
                        <span>Selanjutnya</span>
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── COMPONENT 4: KARTU AKSI PENCOBLOSAN (DI DALAM TAB BILIK SUARA - BEBAS DIGANTI) ──
function VotingActionCard({
    candidate,
    isSelected,
    isVotingAllowed,
    onSelect,
}: {
    candidate: Candidate;
    isSelected: boolean;
    isVotingAllowed: boolean;
    onSelect: () => void;
}) {
    return (
        <motion.div
            whileHover={
                isVotingAllowed ? { y: -3, transition: { duration: 0.2 } } : {}
            }
            whileTap={isVotingAllowed ? { scale: 0.98 } : {}}
            onClick={isVotingAllowed ? onSelect : undefined}
            className={`group relative flex w-full flex-col justify-between overflow-hidden rounded-3xl p-5 shadow-xs transition-all sm:w-60 ${
                !isVotingAllowed
                    ? 'cursor-not-allowed border-neutral-300 bg-neutral-100 opacity-60'
                    : isSelected
                      ? 'cursor-pointer bg-[#2D5A27] text-white shadow-lg ring-3 ring-[#2D5A27]'
                      : 'cursor-pointer bg-white hover:shadow-md'
            }`}
            style={{
                border: isSelected
                    ? '2.5px solid #2D5A27'
                    : '1.5px solid #E8D9C4',
                color: isSelected ? '#fff' : '#4A2E1B',
            }}
        >
            <div>
                {/* Status Pilihan Terpilih (jika aktif) */}
                <div className="mb-1 flex h-6 items-center justify-end">
                    {isSelected && (
                        <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-black text-white shadow-2xs backdrop-blur-xs"
                        >
                            ✓ Dipilih Sementara
                        </motion.span>
                    )}
                </div>

                {/* Foto Calon */}
                <div className="my-1 flex justify-center">
                    {candidate.photo_url ? (
                        <img
                            src={candidate.photo_url}
                            alt={candidate.name}
                            className={`h-28 w-28 rounded-2xl border-2 object-cover shadow-sm ${
                                isSelected
                                    ? 'border-white/70'
                                    : 'border-[#E8D9C4]'
                            }`}
                        />
                    ) : (
                        <div
                            className={`flex h-28 w-28 items-center justify-center rounded-2xl text-2xl font-black shadow-inner ${
                                isSelected
                                    ? 'bg-white/10 text-white'
                                    : 'bg-[#FAF6F0] text-[#4A2E1B]'
                            }`}
                        >
                            {candidate.name.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Nama & Nomor/Kelas */}
                <div className="mt-3 text-center">
                    <h4 className="truncate text-sm leading-tight font-black">
                        {candidate.name}
                    </h4>
                    <div className="mt-1.5 flex items-center justify-center gap-1.5">
                        <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black ${
                                isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'border border-[#E8D9C4] bg-[#FAF6F0] text-[#8B5A2B]'
                            }`}
                        >
                            No. {candidate.candidate_number}
                        </span>
                        <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                isSelected
                                    ? 'bg-white/15 text-white'
                                    : 'border border-[#E8D9C4] bg-[#FAF6F0] text-[#8B5A2B]'
                            }`}
                        >
                            Kelas {candidate.class}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tombol Pilih / Ganti */}
            <div
                className="mt-5 border-t pt-3.5"
                style={{
                    borderColor: isSelected
                        ? 'rgba(255,255,255,0.2)'
                        : '#F5EFE6',
                }}
            >
                <button
                    type="button"
                    disabled={!isVotingAllowed}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isVotingAllowed) onSelect();
                    }}
                    className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black shadow-xs transition-all ${
                        !isVotingAllowed
                            ? 'cursor-not-allowed bg-neutral-300 text-neutral-500'
                            : isSelected
                              ? 'bg-white font-black text-[#2D5A27] shadow-sm hover:bg-neutral-100'
                              : 'bg-[#4A2E1B] text-white hover:bg-[#3D2211]'
                    }`}
                >
                    {!isVotingAllowed ? (
                        <>
                            <Lock className="h-3.5 w-3.5" />
                            <span>🔒 Belum Dibuka</span>
                        </>
                    ) : isSelected ? (
                        <>
                            <Check className="h-4 w-4 text-[#2D5A27]" />
                            <span>✅ Terpilih (Klik lain untuk ganti)</span>
                        </>
                    ) : (
                        <>
                            <span>Pilih Kandidat Ini</span>
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}

// ── COMPONENT 5: RESMI & KAYA FITUR FOOTER PEMILIH ──
function VoterFooter({ onScrollToTop }: { onScrollToTop: () => void }) {
    const [copiedEmail, setCopiedEmail] = useState(false);

    const handleCopyEmail = () => {
        navigator.clipboard.writeText('wandipurnamaalamsah@gmail.com');
        setCopiedEmail(true);
        setTimeout(() => {
            setCopiedEmail(false);
        }, 2000);
    };

    return (
        <footer
            className="mt-16 border-t pt-12 pb-12 text-[#FAF6F0] sm:pb-16"
            style={{
                background: 'linear-gradient(170deg, #2D1A0A 0%, #1A0D05 100%)',
                borderColor: '#4A2E1B',
            }}
        >
            <div className="mx-auto max-w-4xl space-y-12 px-4 sm:px-6">
                <div className="grid grid-cols-1 gap-8 text-xs md:grid-cols-3">
                    {/* Kolom 1: Tentang E-Pradana & Ambalan */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37] font-black text-[#2D1A0A]">
                                ⚜️
                            </div>
                            <div>
                                <h5 className="text-sm font-black text-white">
                                    E-Pradana Bilik Suara
                                </h5>
                                <span className="text-[10px] font-bold text-[#D4AF37]">
                                    Ambalan Penegak
                                </span>
                            </div>
                        </div>
                        <p className="leading-relaxed text-[#D6C7B2]">
                            Sistem e-voting modern untuk suksesi kepemimpinan
                            Pradana Putra & Putri Ambalan Gugus Depan. Menjamin
                            demokrasi pramuka yang tertib, aman, dan
                            berintegritas tinggi.
                        </p>
                        <p className="text-[11px] text-[#A89884] italic">
                            &ldquo;Satyaku Kudarmakan, Darmaku
                            Kubaktikan.&rdquo;
                        </p>
                    </div>

                    {/* Kolom 2: Asas Pemilihan Luber Jurdil */}
                    <div className="space-y-3">
                        <h5 className="flex items-center gap-1.5 text-xs font-black tracking-wider text-[#D4AF37] uppercase">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Asas Pemilihan (LUBER JURDIL)</span>
                        </h5>
                        <ul className="space-y-1.5 text-[#D6C7B2]">
                            <li>
                                • <strong>Langsung:</strong> Disalurkan sendiri
                                tanpa perantara.
                            </li>
                            <li>
                                • <strong>Umum:</strong> Terbuka untuk seluruh
                                siswa dalam DPT.
                            </li>
                            <li>
                                • <strong>Bebas:</strong> Sesuai hati nurani
                                tanpa paksaan.
                            </li>
                            <li>
                                • <strong>Rahasia:</strong> Enkripsi token tanpa
                                identitas pemilih.
                            </li>
                            <li>
                                • <strong>Jujur & Adil:</strong> Suara dihitung
                                murni & setara.
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 3: Kontak & Bantuan */}
                    <div className="space-y-3">
                        <h5 className="flex items-center gap-1.5 text-xs font-black tracking-wider text-[#D4AF37] uppercase">
                            <HelpCircle className="h-4 w-4" />
                            <span>Kontak & Bantuan</span>
                        </h5>
                        <p className="leading-relaxed text-[#D6C7B2]">
                            Hubungi panitia jika membutuhkan informasi atau
                            kendala teknis dalam pemilihan:
                        </p>
                        <div className="space-y-2 pt-1">
                            {/* 1. Email: Klik untuk salin */}
                            <button
                                type="button"
                                onClick={handleCopyEmail}
                                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 text-left transition-all hover:bg-white/5"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(212, 175, 55, 0.15)',
                                }}
                                title="Klik untuk menyalin alamat email"
                            >
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                                    style={{
                                        background: 'rgba(212, 175, 55, 0.15)',
                                        color: '#D4AF37',
                                        border: '1px solid rgba(212, 175, 55, 0.25)',
                                    }}
                                >
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] leading-tight text-[#A89884]">
                                            Email
                                        </span>
                                        {copiedEmail && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#D4AF37]">
                                                <Check className="h-3 w-3" />{' '}
                                                Tersalin!
                                            </span>
                                        )}
                                    </div>
                                    <span className="block truncate text-xs font-medium text-[#FAF6F0] transition-colors group-hover:text-[#D4AF37]">
                                        wandipurnamaalamsah@gmail.com
                                    </span>
                                </div>
                            </button>

                            {/* 2. Instagram: Klik untuk buka profil */}
                            <a
                                href="https://www.instagram.com/wandipurnama09?stkn=dTIyZ2V0b21nenp4"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 text-left transition-all hover:bg-white/5"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(212, 175, 55, 0.15)',
                                }}
                                title="Kunjungi profil Instagram @wandipurnama09"
                            >
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                                    style={{
                                        background: 'rgba(212, 175, 55, 0.15)',
                                        color: '#D4AF37',
                                        border: '1px solid rgba(212, 175, 55, 0.25)',
                                    }}
                                >
                                    <Instagram className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-[10px] leading-tight text-[#A89884]">
                                        Instagram
                                    </span>
                                    <span className="block truncate text-xs font-medium text-[#FAF6F0] transition-colors group-hover:text-[#D4AF37]">
                                        @wandipurnama09
                                    </span>
                                </div>
                            </a>

                            {/* 3. WhatsApp: Klik untuk chat via wa.me */}
                            <a
                                href="https://wa.me/6282315296241"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 text-left transition-all hover:bg-white/5"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(212, 175, 55, 0.15)',
                                }}
                                title="Chat WhatsApp 082315296241"
                            >
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                                    style={{
                                        background: 'rgba(212, 175, 55, 0.15)',
                                        color: '#D4AF37',
                                        border: '1px solid rgba(212, 175, 55, 0.25)',
                                    }}
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-[10px] leading-tight text-[#A89884]">
                                        WhatsApp
                                    </span>
                                    <span className="block truncate text-xs font-medium text-[#FAF6F0] transition-colors group-hover:text-[#D4AF37]">
                                        082315296241
                                    </span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar Footer */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#A89884] sm:flex-row">
                    <div>
                        © {new Date().getFullYear()} E-Pradana · Panitia
                        Pemilihan Pradana Ambalan Pramuka.
                    </div>

                    <button
                        type="button"
                        onClick={onScrollToTop}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-[#D4AF37] transition-colors hover:bg-white/10"
                    >
                        <ArrowUp className="h-3.5 w-3.5" />
                        <span>Kembali ke Atas</span>
                    </button>
                </div>
            </div>
        </footer>
    );
}

VoterDashboard.layout = null;
