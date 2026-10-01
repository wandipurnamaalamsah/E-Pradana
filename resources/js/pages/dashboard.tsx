import { useState, useEffect, useCallback, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { dashboard } from '@/routes';
import {
    Users,
    CheckCircle2,
    Clock,
    XCircle,
    Trophy,
    Activity,
    Shield,
    ChevronRight,
    Radio,
    Eye,
    EyeOff,
    RotateCcw,
    Crown,
    Lock,
    Unlock,
    Plus,
    UserSquare2,
    AlertCircle,
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
    candidate_number: number;
    name: string;
    class: string;
    photo_url: string | null;
    vision?: string | null;
    mission?: string | null;
    vote_count: number;
    percentage: number;
};

type DashboardProps = {
    stats: {
        total_dpt: number;
        sudah_memilih: number;
        belum_memilih: number;
        golput: number;
        pct_partisipasi: number;
        pct_belum: number;
        pct_golput: number;
        suara_putra: number;
        suara_putri: number;
        pct_putra: number;
        pct_putri: number;
    };
    election_status: 'draft' | 'rehearsal' | 'open' | 'closed';
    results_revealed: boolean;
    candidates_putra: Candidate[];
    candidates_putri: Candidate[];
    top_putra: Candidate | null;
    top_putri: Candidate | null;
    auth?: { user: { name: string; email: string } };
};

const statusConfig = {
    draft: {
        label: 'Draft (Persiapan)',
        desc: 'Pemilihan belum dibuka · Siapkan data DPT dan Kandidat',
        color: '#8B5A2B',
        bg: '#F5EFE6',
        dot: '#8B5A2B',
    },
    rehearsal: {
        label: 'Gladi Bersih',
        desc: 'Mode simulasi latihan pemilihan',
        color: '#8B5A2B',
        bg: '#F5EFE6',
        dot: '#8B5A2B',
    },
    open: {
        label: 'Pemilihan Berlangsung (Live)',
        desc: 'Bilik suara aktif · Mode Anti-FOMO sedang melindungi kerahasiaan grafik',
        color: '#15803D',
        bg: '#F0FDF4',
        dot: '#22C55E',
    },
    closed: {
        label: 'Pemilihan Ditutup',
        desc: 'Voting selesai · Rekapitulasi suara terkunci siap di-reveal',
        color: '#B91C1C',
        bg: '#FEF2F2',
        dot: '#EF4444',
    },
};

// Palet warna Anti-FOMO (Gradasi Abu-abu Netral)
const antiFomoGrayShades = [
    '#4B5563', // Slate 600
    '#6B7280', // Slate 500
    '#9CA3AF', // Slate 400
    '#CBD5E1', // Slate 300
    '#374151', // Slate 700
];

// Palet warna Reveal Mode Putra & Putri (Warna Identitas Khas Standar Pramuka Coklat & Emas)
const revealPutraColors = [
    '#D4AF37', // Emas Juara
    '#8B5A2B', // Coklat Kulit
    '#2D5A27', // Hijau Pandu
    '#A0522D', // Coklat Sienna
    '#6F4423', // Coklat Tua Pramuka
];

// Palet warna Reveal Mode Putri
const revealPutriColors = [
    '#D4AF37', // Emas Juara
    '#92400E', // Coklat Karamel Pramuka
    '#8B5A2B', // Coklat Ambalan
    '#2D5A27', // Hijau Pandu
    '#B45309', // Amber Coklat
];

/**
 * Komponen Bagan Bulet (Multi-Segment Donut Chart)
 * Memuat persentase seluruh kandidat dalam satu lingkaran:
 * - Anti-FOMO: Irisan lingkaran berwarna abu-abu polos dengan persentase netral
 * - Reveal: Irisan lingkaran berwarna cerah khas Pramuka, memunculkan foto asli kandidat di tengah & di daftar
 */
function MultiCandidateDonut({
    category,
    candidates,
    totalVotes,
    resultsRevealed,
    topCandidate,
    refreshKey = 0,
}: {
    category: 'putra' | 'putri';
    candidates: Candidate[];
    totalVotes: number;
    resultsRevealed: boolean;
    topCandidate: Candidate | null;
    refreshKey?: number;
}) {
    const [hoveredCandidateId, setHoveredCandidateId] = useState<number | null>(
        null,
    );
    const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(
        null,
    );
    const svgRef = useRef<SVGSVGElement>(null);

    // Dimensi SVG Donut
    const size = 200;
    const strokeWidth = 26;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const GAP = 4; // jarak tajam antar segmen

    // Kandidat yang sedang di-hover (hanya dari segmen, bukan fallback)
    const hoveredCandidate = hoveredCandidateId
        ? candidates.find((c) => c.id === hoveredCandidateId) || null
        : null;

    // Jika belum ada kandidat sama sekali di database
    if (candidates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                {/* Lingkaran kosong outline */}
                <div
                    className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-dashed"
                    style={{ borderColor: '#E8D9C4', background: '#FAF6F0' }}
                >
                    <div className="flex flex-col items-center p-4">
                        <UserSquare2
                            className="mb-2 h-10 w-10"
                            style={{ color: '#C4956A' }}
                        />
                        <span
                            className="text-xs font-bold"
                            style={{ color: '#4A2E1B' }}
                        >
                            0 Kandidat
                        </span>
                        <span className="mt-0.5 text-[11px] text-[#8B5A2B]">
                            Belum ada kandidat{' '}
                            {category === 'putra' ? 'Putra' : 'Putri'}
                        </span>
                    </div>
                </div>

                <div className="mt-5">
                    <Link
                        href="/admin/kandidat"
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform hover:scale-105 active:scale-95"
                        style={{
                            background: '#8B5A2B',
                        }}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Kandidat{' '}
                        {category === 'putra' ? 'Putra' : 'Putri'}
                    </Link>
                </div>
            </div>
        );
    }

    // Hitung segmen irisan busur lingkaran untuk tiap kandidat
    let accumulatedAngle = 0;
    const slices = candidates.map((candidate, idx) => {
        const pct =
            totalVotes > 0 ? candidate.percentage : 100 / candidates.length;
        const arcLength = (pct / 100) * circumference;
        // Gap tajam antar segmen
        const drawn = Math.max(0, arcLength - GAP);
        const strokeDasharray = `${drawn} ${circumference - drawn}`;
        const strokeDashoffset = -(accumulatedAngle + GAP / 2);

        // Hitung sudut tengah segmen (midpoint arc) untuk posisi label %
        // accumulatedAngle saat ini = startAngle segmen ini
        const midAngleRad =
            ((accumulatedAngle + arcLength / 2) / circumference) * 2 * Math.PI;
        accumulatedAngle += arcLength;

        // Warna irisan
        const sliceColor = !resultsRevealed
            ? antiFomoGrayShades[idx % antiFomoGrayShades.length]
            : category === 'putra'
              ? revealPutraColors[idx % revealPutraColors.length]
              : revealPutriColors[idx % revealPutriColors.length];

        return {
            candidate,
            pct: candidate.percentage,
            strokeDasharray,
            strokeDashoffset,
            midAngleRad,
            color: sliceColor,
            isHovered: hoveredCandidateId === candidate.id,
            isWinner: resultsRevealed && topCandidate?.id === candidate.id,
        };
    });

    return (
        <div className="flex flex-col items-center">
            {/* ── BAGAN BULET KLASIK (CLEAN DONUT CHART) ── */}
            <div
                className="relative my-4 flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                {/* Donut Ring Utama: Berputar Halus disetiap Refresh */}
                <motion.div
                    key={`donut-spin-${refreshKey}`}
                    className="relative flex items-center justify-center"
                    initial={{ rotate: -360 }}
                    animate={{ rotate: 0 }}
                    transition={{
                        duration: 1.1,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                >
                    <svg
                        ref={svgRef}
                        width={size}
                        height={size}
                        viewBox={`0 0 ${size} ${size}`}
                        className="-rotate-90 transform drop-shadow-sm"
                        style={{ transformOrigin: 'center' }}
                    >
                        {/* Lingkaran latar belakang (Track) */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="#E8D9C4"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            className="opacity-30"
                        />

                        {/* Segmen-segmen — strokeLinecap=butt agar tepi TAJAM */}
                        {slices.map((slice) => (
                            <circle
                                key={slice.candidate.id}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={slice.color}
                                strokeWidth={
                                    slice.isHovered
                                        ? strokeWidth + 5
                                        : strokeWidth
                                }
                                fill="transparent"
                                strokeDasharray={slice.strokeDasharray}
                                strokeDashoffset={slice.strokeDashoffset}
                                strokeLinecap="butt"
                                className="cursor-pointer transition-all duration-200 ease-out"
                                style={{
                                    filter: slice.isHovered
                                        ? `drop-shadow(0 0 5px ${slice.color}99)`
                                        : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    setHoveredCandidateId(slice.candidate.id);
                                    if (svgRef.current) {
                                        const rect =
                                            svgRef.current.getBoundingClientRect();
                                        setTooltip({
                                            x: e.clientX - rect.left,
                                            y: e.clientY - rect.top,
                                        });
                                    }
                                }}
                                onMouseMove={(e) => {
                                    if (svgRef.current) {
                                        const rect =
                                            svgRef.current.getBoundingClientRect();
                                        setTooltip({
                                            x: e.clientX - rect.left,
                                            y: e.clientY - rect.top,
                                        });
                                    }
                                }}
                                onMouseLeave={() => {
                                    setHoveredCandidateId(null);
                                    setTooltip(null);
                                }}
                            />
                        ))}

                        {/* Label Persentase di Tiap Segmen */}
                        {slices.map((slice) => {
                            // Hanya tampilkan jika segmen cukup besar (>= 6%)
                            if (slice.pct < 6) return null;
                            const labelR = radius; // Tepat di tengah ring
                            const lx =
                                size / 2 + labelR * Math.cos(slice.midAngleRad);
                            const ly =
                                size / 2 + labelR * Math.sin(slice.midAngleRad);
                            return (
                                <text
                                    key={`pct-${slice.candidate.id}`}
                                    x={lx}
                                    y={ly}
                                    // Counter-rotate 90deg karena SVG di-rotate -90 via CSS
                                    transform={`rotate(90 ${lx} ${ly})`}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={slice.isHovered ? '11' : '10'}
                                    fontWeight="800"
                                    fill="#FFFFFF"
                                    style={{
                                        pointerEvents: 'none',
                                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    {slice.pct}%
                                </text>
                            );
                        })}
                    </svg>
                </motion.div>

                {/* ── BAGIAN TENGAH: EMOJI FLEUR-DE-LIS PRAMUKA ── */}
                <div
                    className="pointer-events-none absolute flex items-center justify-center rounded-full select-none"
                    style={{
                        width: size - strokeWidth * 2 - 4,
                        height: size - strokeWidth * 2 - 4,
                        background:
                            'linear-gradient(145deg, #FFFFFF 60%, #FAF6F0)',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)',
                    }}
                >
                    <span
                        className="text-5xl drop-shadow-xs transition-transform duration-300"
                        role="img"
                        aria-label="Logo Pramuka"
                    >
                        ⚜️
                    </span>
                </div>

                {/* ── TOOLTIP FLOATING PRESENTASI RESMI ── */}
                {hoveredCandidate && tooltip && (
                    <div
                        className="pointer-events-none absolute z-30"
                        style={{
                            left: tooltip.x,
                            top: tooltip.y - 8,
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.13 }}
                            className="relative rounded-xl px-3.5 py-2.5 text-center shadow-xl"
                            style={{
                                background: '#1C1917',
                                border: `1.5px solid ${
                                    slices.find(
                                        (s) =>
                                            s.candidate.id ===
                                            hoveredCandidate.id,
                                    )?.color || '#D4AF37'
                                }66`,
                                minWidth: 130,
                            }}
                        >
                            <p
                                className="mb-0.5 text-[10px] font-semibold tracking-widest uppercase"
                                style={{ color: '#A8A29E' }}
                            >
                                {!resultsRevealed
                                    ? `Kandidat ${hoveredCandidate.candidate_number}`
                                    : hoveredCandidate.name}
                            </p>
                            <p
                                className="text-2xl leading-none font-black"
                                style={{
                                    color:
                                        slices.find(
                                            (s) =>
                                                s.candidate.id ===
                                                hoveredCandidate.id,
                                        )?.color || '#D4AF37',
                                }}
                            >
                                {hoveredCandidate.percentage}%
                            </p>
                            <p
                                className="mt-1 text-[11px] font-medium"
                                style={{ color: '#D6D3D1' }}
                            >
                                {hoveredCandidate.vote_count} suara
                            </p>
                            {resultsRevealed &&
                                topCandidate?.id === hoveredCandidate.id && (
                                    <span
                                        className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider uppercase"
                                        style={{
                                            background: '#D4AF37',
                                            color: '#1C1917',
                                        }}
                                    >
                                        👑 Juara
                                    </span>
                                )}
                            {/* Panah bawah */}
                            <div
                                className="absolute -bottom-[7px] left-1/2 -translate-x-1/2"
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderLeft: '7px solid transparent',
                                    borderRight: '7px solid transparent',
                                    borderTop: `7px solid ${
                                        slices.find(
                                            (s) =>
                                                s.candidate.id ===
                                                hoveredCandidate.id,
                                        )?.color || '#D4AF37'
                                    }66`,
                                }}
                            />
                        </motion.div>
                    </div>
                )}
            </div>

            {/* ── DAFTAR / LEGENDA KANDIDAT DI BAWAH BULETAN ── */}
            <div className="mt-2 w-full space-y-2.5">
                {slices.map((slice) => {
                    const c = slice.candidate;
                    return (
                        <div
                            key={c.id}
                            onMouseEnter={() => setHoveredCandidateId(c.id)}
                            onMouseLeave={() => setHoveredCandidateId(null)}
                            className={`flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition-all ${
                                slice.isHovered
                                    ? 'translate-x-1 bg-[#F5EFE6] shadow-xs'
                                    : 'bg-[#FAF6F0] hover:bg-[#F5EFE6]'
                            }`}
                            style={{
                                border: slice.isWinner
                                    ? '1.5px solid #D4AF37'
                                    : slice.isHovered
                                      ? `1.5px solid ${slice.color}`
                                      : '1px solid #E8D9C4',
                            }}
                        >
                            <div className="flex min-w-0 items-center gap-2.5">
                                {/* Dot Warna Segmen Donut */}
                                <span
                                    className="h-3 w-3 shrink-0 rounded-full shadow-2xs"
                                    style={{ background: slice.color }}
                                />

                                {/* Avatar / Foto Kandidat */}
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg font-bold shadow-2xs"
                                    style={{
                                        background: !resultsRevealed
                                            ? '#E2E8F0'
                                            : `${slice.color}20`,
                                        color: !resultsRevealed
                                            ? '#64748B'
                                            : slice.color,
                                        border: slice.isWinner
                                            ? '1.5px solid #D4AF37'
                                            : 'none',
                                    }}
                                >
                                    {!resultsRevealed ? (
                                        <span className="text-[11px]">
                                            #{c.candidate_number}
                                        </span>
                                    ) : c.photo_url ? (
                                        <img
                                            src={c.photo_url}
                                            alt={c.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs">
                                            0{c.candidate_number}
                                        </span>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p
                                            className="truncate text-xs font-bold"
                                            style={{ color: '#4A2E1B' }}
                                        >
                                            {!resultsRevealed
                                                ? `Kandidat ${c.candidate_number}`
                                                : c.name}
                                        </p>
                                        {slice.isWinner && (
                                            <span
                                                className="py-0.2 shrink-0 rounded-full px-1.5 text-[9px] font-black uppercase"
                                                style={{
                                                    background: '#D4AF37',
                                                    color: '#4A2E1B',
                                                }}
                                            >
                                                👑 Juara
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className="truncate text-[11px]"
                                        style={{ color: '#8B5A2B' }}
                                    >
                                        {!resultsRevealed
                                            ? 'Identitas kandidat disamarkan'
                                            : `${c.class || 'Kelas -'} · Kandidat 0${c.candidate_number}`}
                                    </p>
                                </div>
                            </div>

                            {/* Nilai Suara & Persen */}
                            <div className="shrink-0 pl-2 text-right">
                                <span
                                    className="text-xs font-extrabold"
                                    style={{ color: '#4A2E1B' }}
                                >
                                    {c.vote_count}{' '}
                                    <span className="text-[10px] font-normal text-[#8B5A2B]">
                                        suara
                                    </span>
                                </span>
                                <p
                                    className="text-xs font-black"
                                    style={{ color: slice.color }}
                                >
                                    {c.percentage}%
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Dashboard({
    stats = {
        total_dpt: 0,
        sudah_memilih: 0,
        belum_memilih: 0,
        golput: 0,
        pct_partisipasi: 0,
        pct_belum: 0,
        pct_golput: 0,
        suara_putra: 0,
        suara_putri: 0,
        pct_putra: 0,
        pct_putri: 0,
    },
    election_status = 'draft',
    results_revealed = false,
    candidates_putra = [],
    candidates_putri = [],
    top_putra = null,
    top_putri = null,
}: DashboardProps) {
    // State timer auto-refresh (7 detik saat open)
    const REFRESH_INTERVAL = 7;
    const [secondsLeft, setSecondsLeft] = useState(REFRESH_INTERVAL);
    const [finalSyncCountdown, setFinalSyncCountdown] = useState<number | null>(
        null,
    );
    const prevStatusRef = useRef(election_status);

    // State refreshKey untuk trigger animasi putar bagan bulet
    const [refreshKey, setRefreshKey] = useState(0);
    const lastAnimRef = useRef<number>(0);

    const triggerSpin = useCallback(() => {
        const now = Date.now();
        if (now - lastAnimRef.current > 300) {
            lastAnimRef.current = now;
            setRefreshKey((k) => k + 1);
        }
    }, []);

    // Listen to Inertia reload/finish event
    useEffect(() => {
        const unregister = router.on('finish', () => {
            triggerSpin();
        });
        return () => unregister();
    }, [triggerSpin]);

    // Juga trigger animasi saat stats suara diperbarui
    useEffect(() => {
        triggerSpin();
    }, [
        stats.suara_putra,
        stats.suara_putri,
        stats.sudah_memilih,
        triggerSpin,
    ]);

    // State Modal Pemenang
    const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

    // State Modal Reset Pemilihan
    const [isResetElectionModalOpen, setIsResetElectionModalOpen] =
        useState(false);

    // State Modal Konfirmasi Status
    const [statusConfirmModal, setStatusConfirmModal] = useState<{
        open: boolean;
        targetStatus: 'open' | 'closed' | 'draft' | null;
        title: string;
        description: string;
        variant: 'danger' | 'warning' | 'primary';
        confirmText: string;
    }>({
        open: false,
        targetStatus: null,
        title: '',
        description: '',
        variant: 'primary',
        confirmText: 'Konfirmasi',
    });

    // Status config
    const cfg = statusConfig[election_status] || statusConfig.draft;

    // Auto-refresh interval 7 detik murni HANYA saat election_status === 'open'
    useEffect(() => {
        if (election_status !== 'open') {
            setSecondsLeft(REFRESH_INTERVAL);
            return;
        }

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    router.reload({
                        only: [
                            'stats',
                            'election_status',
                            'results_revealed',
                            'candidates_putra',
                            'candidates_putri',
                            'top_putra',
                            'top_putri',
                        ],
                    });
                    return REFRESH_INTERVAL;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [election_status]);

    // Transisi saat beres voting: tunggu beberapa detik lalu refresh 1x untuk melihat hasil final
    useEffect(() => {
        if (prevStatusRef.current === 'open' && election_status === 'closed') {
            setFinalSyncCountdown(4); // Tunggu 4 detik untuk sinkronisasi hasil suara final
            toast.info(
                'Sesi voting ditutup! Menunggu 4 detik untuk sinkronisasi hasil final...',
            );
        }
        prevStatusRef.current = election_status;
    }, [election_status]);

    // Countdown untuk 1x final refresh setelah voting beres
    useEffect(() => {
        if (finalSyncCountdown === null) return;

        if (finalSyncCountdown <= 0) {
            triggerSpin();
            router.reload({
                only: [
                    'stats',
                    'election_status',
                    'results_revealed',
                    'candidates_putra',
                    'candidates_putri',
                    'top_putra',
                    'top_putri',
                ],
                onSuccess: () => {
                    toast.success(
                        'Hasil final voting telah berhasil disinkronkan!',
                    );
                },
            });
            setFinalSyncCountdown(null);
            return;
        }

        const timer = setTimeout(() => {
            setFinalSyncCountdown((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearTimeout(timer);
    }, [finalSyncCountdown, triggerSpin]);

    // Manual Refresh
    const handleManualRefresh = () => {
        triggerSpin();
        router.reload({
            only: [
                'stats',
                'election_status',
                'results_revealed',
                'candidates_putra',
                'candidates_putri',
                'top_putra',
                'top_putri',
            ],
        });
        if (election_status === 'open') {
            setSecondsLeft(REFRESH_INTERVAL);
        }
    };

    // Aksi Status Pemilihan dengan Modal Kustom
    const handleSetStatus = (newStatus: 'open' | 'closed' | 'draft') => {
        if (newStatus === 'closed') {
            setStatusConfirmModal({
                open: true,
                targetStatus: 'closed',
                title: 'Tutup Sesi Pemilihan?',
                description:
                    'Apakah Anda yakin ingin MENUTUP sesi pemilihan sekarang? Siswa tidak lagi dapat memberikan suara ke bilik suara.',
                variant: 'danger',
                confirmText: 'Ya, Tutup Pemilihan',
            });
            return;
        }

        if (newStatus === 'open') {
            setStatusConfirmModal({
                open: true,
                targetStatus: 'open',
                title: 'Buka Sesi Pemilihan?',
                description:
                    'Apakah Anda yakin ingin MEMBUKA pemilihan? Siswa dengan token valid dapat mulai melakukan pencoblosan.',
                variant: 'primary',
                confirmText: 'Ya, Buka Pemilihan',
            });
            return;
        }

        router.post('/admin/election/status', { status: newStatus });
    };

    const handleConfirmStatusChange = () => {
        if (statusConfirmModal.targetStatus) {
            router.post('/admin/election/status', {
                status: statusConfirmModal.targetStatus,
            });
        }
        setStatusConfirmModal((prev) => ({ ...prev, open: false }));
    };

    // Aksi Toggle Reveal
    const handleToggleReveal = (revealed: boolean) => {
        router.post('/admin/election/reveal', { revealed });
    };

    // Aksi Umumkan Pemenang
    const handleAnnounceWinner = () => {
        if (candidates_putra.length === 0 && candidates_putri.length === 0) {
            toast.warning(
                'Belum ada data kandidat dan suara yang terdaftar untuk diumumkan.',
            );
            return;
        }

        router.post(
            '/admin/election/announce',
            {},
            {
                onSuccess: () => {
                    setIsWinnerModalOpen(true);
                },
            },
        );
        setIsWinnerModalOpen(true);
    };

    // Aksi Reset Sesi Pemilihan
    const handleResetElection = () => {
        router.post(
            '/admin/election/reset',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsResetElectionModalOpen(false);
                    setSecondsLeft(REFRESH_INTERVAL);
                    setFinalSyncCountdown(null);
                    triggerSpin();
                    router.reload();
                    toast.success(
                        'Sesi pemilihan berhasil direset! Data grafik dan statistik telah kembali ke kondisi awal.',
                    );
                },
            },
        );
    };

    return (
        <>
            <Head title="Dashboard Admin · E-Pradana" />

            <div
                className="flex flex-col gap-6 p-6"
                style={{ background: '#FDFBF7', minHeight: '100%' }}
            >
                {/* ── HEADER & AUTO-REFRESH STATUS ── */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1
                                className="text-2xl font-black tracking-tight"
                                style={{ color: '#4A2E1B' }}
                            >
                                Dashboard Pemilihan E-Pradana
                            </h1>
                            <span
                                className="rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase"
                                style={{
                                    background: '#4A2E1B15',
                                    color: '#4A2E1B',
                                }}
                            >
                                Admin Command
                            </span>
                        </div>
                        <p
                            className="text-sm font-medium"
                            style={{ color: '#8B5A2B' }}
                        >
                            Pusat visualisasi bagan perolehan suara live · Gugus
                            Depan Gerakan Pramuka
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Auto-refresh indicator (Aktif 7s hanya saat Pemilihan Berlangsung) */}
                        {election_status === 'open' ? (
                            <div
                                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-2xs"
                                style={{
                                    background: '#fff',
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                            >
                                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                                <span>
                                    Live Refresh:{' '}
                                    <strong>{secondsLeft}s</strong>
                                </span>
                                <button
                                    onClick={handleManualRefresh}
                                    className="rounded p-1 text-[#8B5A2B] transition-colors hover:bg-[#F5EFE6]"
                                    title="Sinkronkan data sekarang"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : finalSyncCountdown !== null ? (
                            <div className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-800 shadow-2xs">
                                <Clock className="h-3.5 w-3.5 animate-spin text-amber-600" />
                                <span>
                                    Sinkronisasi Final:{' '}
                                    <strong>{finalSyncCountdown}s</strong>
                                </span>
                            </div>
                        ) : election_status === 'closed' ? (
                            <div
                                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-2xs"
                                style={{
                                    background: '#fff',
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                            >
                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                <span>
                                    Voting Selesai ·{' '}
                                    <strong>Hasil Final</strong>
                                </span>
                                <button
                                    onClick={handleManualRefresh}
                                    className="rounded p-1 text-[#8B5A2B] transition-colors hover:bg-[#F5EFE6]"
                                    title="Sinkronkan ulang data"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div
                                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-2xs"
                                style={{
                                    background: '#fff',
                                    border: '1px solid #E8D9C4',
                                    color: '#4A2E1B',
                                }}
                            >
                                <span className="h-2 w-2 rounded-full bg-amber-400" />
                                <span>Mode Persiapan (Draft)</span>
                                <button
                                    onClick={handleManualRefresh}
                                    className="rounded p-1 text-[#8B5A2B] transition-colors hover:bg-[#F5EFE6]"
                                    title="Sinkronkan data sekarang"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Election Status Badge */}
                        <div
                            className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold"
                            style={{
                                background: cfg.bg,
                                border: `1px solid ${cfg.dot}40`,
                                color: cfg.color,
                            }}
                        >
                            {election_status === 'open' ? (
                                <span className="relative flex h-2.5 w-2.5">
                                    <span
                                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                                        style={{ background: cfg.dot }}
                                    />
                                    <span
                                        className="relative inline-flex h-2.5 w-2.5 rounded-full"
                                        style={{ background: cfg.dot }}
                                    />
                                </span>
                            ) : (
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ background: cfg.dot }}
                                />
                            )}
                            <span>{cfg.label}</span>
                            {election_status === 'open' && (
                                <Radio
                                    className="h-3.5 w-3.5 animate-pulse"
                                    style={{ color: cfg.dot }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* ── 1. ELEMEN ANGKA & PERSENTASE (STATISTIK CEPAT) ── */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {/* Total DPT */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-5 shadow-xs transition-transform hover:-translate-y-0.5 hover:shadow-md"
                        style={{
                            background: '#fff',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p
                                    className="text-xs font-bold tracking-wider uppercase"
                                    style={{ color: '#8B5A2B' }}
                                >
                                    Total DPT (100%)
                                </p>
                                <p
                                    className="mt-2 text-3xl font-extrabold"
                                    style={{ color: '#4A2E1B' }}
                                >
                                    {stats.total_dpt}
                                </p>
                                <p
                                    className="mt-1 text-xs font-medium"
                                    style={{ color: '#8B5A2B' }}
                                >
                                    {stats.total_dpt > 0
                                        ? 'Seluruh siswa terdaftar'
                                        : 'Data DPT belum diimpor'}
                                </p>
                            </div>
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ background: '#4A2E1B15' }}
                            >
                                <Users
                                    className="h-6 w-6"
                                    style={{ color: '#4A2E1B' }}
                                />
                            </div>
                        </div>
                        <div className="mt-4 h-1.5 w-full rounded-full bg-[#E8D9C4]">
                            <div
                                className="h-1.5 rounded-full"
                                style={{
                                    width: stats.total_dpt > 0 ? '100%' : '0%',
                                    background: '#4A2E1B',
                                }}
                            />
                        </div>
                    </div>

                    {/* Sudah Memilih (Partisipasi) */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-5 shadow-xs transition-transform hover:-translate-y-0.5 hover:shadow-md"
                        style={{
                            background: '#fff',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p
                                    className="text-xs font-bold tracking-wider uppercase"
                                    style={{ color: '#2D5A27' }}
                                >
                                    Sudah Memilih
                                </p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <span
                                        className="text-3xl font-extrabold"
                                        style={{ color: '#2D5A27' }}
                                    >
                                        {stats.sudah_memilih}
                                    </span>
                                    <span
                                        className="text-sm font-bold"
                                        style={{ color: '#2D5A27' }}
                                    >
                                        ({stats.pct_partisipasi}%)
                                    </span>
                                </div>
                                <p
                                    className="mt-1 text-xs font-medium"
                                    style={{ color: '#2D5A27' }}
                                >
                                    Tingkat partisipasi suara
                                </p>
                            </div>
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ background: '#2D5A2715' }}
                            >
                                <CheckCircle2
                                    className="h-6 w-6"
                                    style={{ color: '#2D5A27' }}
                                />
                            </div>
                        </div>
                        <div className="mt-4 h-1.5 w-full rounded-full bg-[#E8D9C4]">
                            <div
                                className="h-1.5 rounded-full transition-all duration-1000"
                                style={{
                                    width: `${stats.pct_partisipasi}%`,
                                    background:
                                        'linear-gradient(90deg, #2D5A27, #4CAF50)',
                                }}
                            />
                        </div>
                    </div>

                    {/* Belum Memilih */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-5 shadow-xs transition-transform hover:-translate-y-0.5 hover:shadow-md"
                        style={{
                            background: '#fff',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p
                                    className="text-xs font-bold tracking-wider uppercase"
                                    style={{ color: '#B8960A' }}
                                >
                                    Belum Memilih
                                </p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <span
                                        className="text-3xl font-extrabold"
                                        style={{ color: '#B8960A' }}
                                    >
                                        {stats.belum_memilih}
                                    </span>
                                    <span
                                        className="text-sm font-bold"
                                        style={{ color: '#B8960A' }}
                                    >
                                        ({stats.pct_belum}%)
                                    </span>
                                </div>
                                <p
                                    className="mt-1 text-xs font-medium"
                                    style={{ color: '#B8960A' }}
                                >
                                    Sisa pemilih di antrean
                                </p>
                            </div>
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ background: '#D4AF3715' }}
                            >
                                <Clock
                                    className="h-6 w-6"
                                    style={{ color: '#B8960A' }}
                                />
                            </div>
                        </div>
                        <div className="mt-4 h-1.5 w-full rounded-full bg-[#E8D9C4]">
                            <div
                                className="h-1.5 rounded-full transition-all duration-1000"
                                style={{
                                    width: `${stats.pct_belum}%`,
                                    background:
                                        'linear-gradient(90deg, #D4AF37, #F59E0B)',
                                }}
                            />
                        </div>
                    </div>

                    {/* Golput / Tidak Hadir */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-5 shadow-xs transition-transform hover:-translate-y-0.5 hover:shadow-md"
                        style={{
                            background: '#fff',
                            border: '1px solid #E8D9C4',
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p
                                    className="text-xs font-bold tracking-wider uppercase"
                                    style={{ color: '#B91C1C' }}
                                >
                                    Golput / Tidak Hadir
                                </p>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <span
                                        className="text-3xl font-extrabold"
                                        style={{ color: '#B91C1C' }}
                                    >
                                        {election_status === 'closed'
                                            ? stats.golput
                                            : '—'}
                                    </span>
                                    {election_status === 'closed' && (
                                        <span
                                            className="text-sm font-bold"
                                            style={{ color: '#B91C1C' }}
                                        >
                                            ({stats.pct_golput}%)
                                        </span>
                                    )}
                                </div>
                                <p
                                    className="mt-1 text-xs font-medium"
                                    style={{ color: '#8B5A2B' }}
                                >
                                    {election_status === 'closed'
                                        ? 'Akumulasi hak suara hangus'
                                        : 'Dihitung saat pemilihan ditutup'}
                                </p>
                            </div>
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ background: '#B91C1C15' }}
                            >
                                <XCircle
                                    className="h-6 w-6"
                                    style={{ color: '#B91C1C' }}
                                />
                            </div>
                        </div>
                        <div className="mt-4 h-1.5 w-full rounded-full bg-[#E8D9C4]">
                            <div
                                className="h-1.5 rounded-full transition-all duration-1000"
                                style={{
                                    width: `${election_status === 'closed' ? stats.pct_golput : 0}%`,
                                    background:
                                        'linear-gradient(90deg, #B91C1C, #EF4444)',
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── PANEL KONTROL KEAMANAN VISUAL (ANTI-FOMO / REVEAL CONTROLLER) ── */}
                <div
                    className="flex flex-col gap-4 rounded-2xl p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    style={{
                        background: results_revealed
                            ? 'linear-gradient(135deg, #4A2E1B 0%, #291508 100%)'
                            : election_status === 'closed'
                              ? '#FFFBEB'
                              : '#F8FAFC',
                        border: results_revealed
                            ? '1.5px solid #D4AF37'
                            : election_status === 'closed'
                              ? '1.5px solid #FCD34D'
                              : '1.5px solid #CBD5E1',
                    }}
                >
                    <div className="flex items-start gap-3.5">
                        <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs"
                            style={{
                                background: results_revealed
                                    ? '#D4AF37'
                                    : election_status === 'closed'
                                      ? '#F59E0B'
                                      : '#64748B',
                                color: results_revealed ? '#4A2E1B' : '#fff',
                            }}
                        >
                            {results_revealed ? (
                                <Eye className="h-6 w-6" />
                            ) : (
                                <Lock className="h-6 w-6" />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3
                                    className="text-base font-extrabold tracking-tight"
                                    style={{
                                        color: results_revealed
                                            ? '#FDFBF7'
                                            : election_status === 'closed'
                                              ? '#92400E'
                                              : '#1E293B',
                                    }}
                                >
                                    {results_revealed
                                        ? '✨ REVEAL MODE AKTIF: Seluruh Hasil & Foto Kandidat Terbuka'
                                        : election_status === 'closed'
                                          ? '🔒 Sesi Pemilihan Selesai: Siap untuk Reveal Hasil'
                                          : '🛡️ Mode Anti-FOMO Aktif (Proyektor View)'}
                                </h3>
                                <span
                                    className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                                    style={{
                                        background: results_revealed
                                            ? '#D4AF37'
                                            : election_status === 'closed'
                                              ? '#FEF3C7'
                                              : '#E2E8F0',
                                        color: results_revealed
                                            ? '#4A2E1B'
                                            : '#475569',
                                    }}
                                >
                                    {results_revealed
                                        ? 'Terbuka'
                                        : 'Tersamar Abu-Abu'}
                                </span>
                            </div>
                            <p
                                className="mt-1 text-xs"
                                style={{
                                    color: results_revealed
                                        ? '#E8D9C4'
                                        : election_status === 'closed'
                                          ? '#B45309'
                                          : '#64748B',
                                }}
                            >
                                {results_revealed
                                    ? 'Bagan bulet berubah warna cerah khas Pramuka, memunculkan foto kandidat, nama lengkap, dan persentase akhir.'
                                    : election_status === 'closed'
                                      ? 'Waktu voting telah ditutup. Klik tombol "Buka Hasil (Reveal)" untuk menampilkan identitas kandidat dan foto pemenang.'
                                      : 'Bagan bulet memuat persentase suara kandidat dengan warna abu-abu polos tanpa foto/nama untuk mencegah peer-pressure di aula.'}
                            </p>
                        </div>
                    </div>

                    {/* Tombol Aksi Panitia */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {election_status === 'open' && (
                            <button
                                onClick={() => handleSetStatus('closed')}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95"
                                style={{ background: '#DC2626' }}
                            >
                                <Lock className="h-4 w-4" />
                                Tutup Pemilihan
                            </button>
                        )}

                        {election_status !== 'open' && (
                            <button
                                onClick={() => handleSetStatus('open')}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
                                style={{ background: '#15803D' }}
                            >
                                <Unlock className="h-4 w-4" />
                                {election_status === 'closed'
                                    ? 'Buka Kembali Sesi'
                                    : 'Mulai Pemilihan'}
                            </button>
                        )}

                        {election_status === 'closed' && !results_revealed && (
                            <button
                                onClick={() => handleToggleReveal(true)}
                                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md transition-all hover:brightness-110 active:scale-95"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #D4AF37 0%, #B8960A 100%)',
                                    color: '#4A2E1B',
                                    border: '1px solid #FFE082',
                                }}
                            >
                                <Eye className="h-4 w-4" />
                                Buka Hasil (Reveal Mode)
                            </button>
                        )}

                        {results_revealed && (
                            <>
                                <button
                                    onClick={handleAnnounceWinner}
                                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                                        color: '#4A2E1B',
                                        border: '1.5px solid #FDFBF7',
                                    }}
                                >
                                    <Trophy className="h-4 w-4 text-[#4A2E1B]" />
                                    Umumkan Pemenang
                                </button>

                                <button
                                    onClick={() => handleToggleReveal(false)}
                                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors hover:text-white"
                                    title="Kembalikan grafik ke mode abu-abu"
                                >
                                    <EyeOff className="h-3.5 w-3.5" />
                                    Sembunyikan
                                </button>
                            </>
                        )}

                        {/* Tombol Reset Pemilihan (Kembali ke Kondisi Awal / Draft) */}
                        <button
                            type="button"
                            onClick={() => setIsResetElectionModalOpen(true)}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-95"
                            style={{
                                background: '#fff',
                                borderColor: '#E8D9C4',
                                color: '#8B5A2B',
                            }}
                            title="Reset seluruh sesi pemilihan ke kondisi awal (Draft, 0 suara, DPT belum memilih)"
                        >
                            <RotateCcw className="h-4 w-4 text-rose-600" />
                            <span>Reset Pemilihan</span>
                        </button>
                    </div>
                </div>

                {/* ── 2. BAGAN BULET GRAFIK PEROLEHAN SUARA (DUA KOLOM: PUTRA & PUTRI) ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* ── KOLOM KIRI: BAGAN BULET PRADANA PUTRA ── */}
                    <div
                        className="flex flex-col justify-between rounded-2xl p-6 shadow-sm transition-all"
                        style={{
                            background: '#fff',
                            border: results_revealed
                                ? '2px solid #8B5A2B50'
                                : '1px solid #E8D9C4',
                        }}
                    >
                        <div>
                            {/* Header Bagan Putra */}
                            <div
                                className="flex items-center justify-between border-b pb-4"
                                style={{ borderColor: '#E8D9C4' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-11 w-11 items-center justify-center rounded-xl shadow-xs text-2xl select-none"
                                        style={{
                                            background:
                                                'linear-gradient(135deg, #8B5A2B, #6F4423)',
                                        }}
                                    >
                                        <span role="img" aria-label="Logo Pramuka">⚜️</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2
                                                className="text-lg font-black tracking-tight"
                                                style={{ color: '#4A2E1B' }}
                                            >
                                                Bagan Pradana Putra
                                            </h2>
                                            {/* Live Pulse Indicator (Hanya saat Pemilihan Berlangsung) */}
                                            {election_status === 'open' && (
                                                <span
                                                    className="relative flex h-2 w-2"
                                                    title="Live refresh 7 detik aktif"
                                                >
                                                    <span
                                                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                                                        style={{
                                                            backgroundColor:
                                                                results_revealed
                                                                    ? '#8B5A2B'
                                                                    : '#D4AF37',
                                                        }}
                                                    />
                                                    <span
                                                        className="relative inline-flex h-2 w-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                results_revealed
                                                                    ? '#8B5A2B'
                                                                    : '#D4AF37',
                                                        }}
                                                    />
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className="flex items-center gap-1 text-xs font-medium"
                                            style={{ color: '#8B5A2B' }}
                                        >
                                            <span>Total Suara Masuk:</span>
                                            <motion.span
                                                key={`suara-putra-${refreshKey}`}
                                                initial={{
                                                    scale: 1.18,
                                                    color: results_revealed
                                                        ? '#8B5A2B'
                                                        : '#4A2E1B',
                                                }}
                                                animate={{
                                                    scale: 1,
                                                    color: '#4A2E1B',
                                                }}
                                                transition={{ duration: 0.45 }}
                                                className="inline-block font-extrabold"
                                            >
                                                {stats.suara_putra} suara
                                            </motion.span>
                                            <span>({stats.pct_putra}%)</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                        className="rounded-full px-3 py-1 text-xs font-bold"
                                        style={{
                                            background: results_revealed
                                                ? '#F5EFE6'
                                                : '#F1F5F9',
                                            color: results_revealed
                                                ? '#8B5A2B'
                                                : '#64748B',
                                            border: `1px solid ${results_revealed ? '#E8D9C4' : '#CBD5E1'}`,
                                        }}
                                    >
                                        {candidates_putra.length} Kandidat
                                    </span>
                                </div>
                            </div>

                            {/* Komponen Bagan Bulet Multi-Kandidat Putra */}
                            <MultiCandidateDonut
                                category="putra"
                                candidates={candidates_putra}
                                totalVotes={stats.suara_putra}
                                resultsRevealed={results_revealed}
                                topCandidate={top_putra}
                                refreshKey={refreshKey}
                            />
                        </div>

                        {/* Catatan Kaki Kolom Putra */}
                        <div
                            className="mt-6 border-t pt-3 text-[11px]"
                            style={{ borderColor: '#E8D9C4', color: '#8B5A2B' }}
                        >
                            {!results_revealed ? (
                                <span>
                                    🔒 Tiap irisan buletan memuat persentase
                                    voting kandidat dalam balutan warna abu-abu
                                    netral.
                                </span>
                            ) : (
                                <span>
                                    🏆 Rekapitulasi suara resmi & foto asli
                                    kandidat Pradana Putra ambalan.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── KOLOM KANAN: BAGAN BULET PRADANA PUTRI ── */}
                    <div
                        className="flex flex-col justify-between rounded-2xl p-6 shadow-sm transition-all"
                        style={{
                            background: '#fff',
                            border: results_revealed
                                ? '2px solid #8B5A2B50'
                                : '1px solid #E8D9C4',
                        }}
                    >
                        <div>
                            {/* Header Bagan Putri */}
                            <div
                                className="flex items-center justify-between border-b pb-4"
                                style={{ borderColor: '#E8D9C4' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-11 w-11 items-center justify-center rounded-xl shadow-xs text-2xl select-none"
                                        style={{
                                            background:
                                                'linear-gradient(135deg, #8B5A2B, #6F4423)',
                                        }}
                                    >
                                        <span role="img" aria-label="Logo Pramuka">⚜️</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2
                                                className="text-lg font-black tracking-tight"
                                                style={{ color: '#4A2E1B' }}
                                            >
                                                Bagan Pradana Putri
                                            </h2>
                                            {/* Live Pulse Indicator (Hanya saat Pemilihan Berlangsung) */}
                                            {election_status === 'open' && (
                                                <span
                                                    className="relative flex h-2 w-2"
                                                    title="Live refresh 7 detik aktif"
                                                >
                                                    <span
                                                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                                                        style={{
                                                            backgroundColor:
                                                                results_revealed
                                                                    ? '#8B5A2B'
                                                                    : '#D4AF37',
                                                        }}
                                                    />
                                                    <span
                                                        className="relative inline-flex h-2 w-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                results_revealed
                                                                    ? '#8B5A2B'
                                                                    : '#D4AF37',
                                                        }}
                                                    />
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className="flex items-center gap-1 text-xs font-medium"
                                            style={{ color: '#8B5A2B' }}
                                        >
                                            <span>Total Suara Masuk:</span>
                                            <motion.span
                                                key={`suara-putri-${refreshKey}`}
                                                initial={{
                                                    scale: 1.18,
                                                    color: results_revealed
                                                        ? '#8B5A2B'
                                                        : '#4A2E1B',
                                                }}
                                                animate={{
                                                    scale: 1,
                                                    color: '#4A2E1B',
                                                }}
                                                transition={{ duration: 0.45 }}
                                                className="inline-block font-extrabold"
                                            >
                                                {stats.suara_putri} suara
                                            </motion.span>
                                            <span>({stats.pct_putri}%)</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                        className="rounded-full px-3 py-1 text-xs font-bold"
                                        style={{
                                            background: results_revealed
                                                ? '#F5EFE6'
                                                : '#F1F5F9',
                                            color: results_revealed
                                                ? '#8B5A2B'
                                                : '#64748B',
                                            border: `1px solid ${results_revealed ? '#E8D9C4' : '#CBD5E1'}`,
                                        }}
                                    >
                                        {candidates_putri.length} Kandidat
                                    </span>
                                </div>
                            </div>

                            {/* Komponen Bagan Bulet Multi-Kandidat Putri */}
                            <MultiCandidateDonut
                                category="putri"
                                candidates={candidates_putri}
                                totalVotes={stats.suara_putri}
                                resultsRevealed={results_revealed}
                                topCandidate={top_putri}
                                refreshKey={refreshKey}
                            />
                        </div>

                        {/* Catatan Kaki Kolom Putri */}
                        <div
                            className="mt-6 border-t pt-3 text-[11px]"
                            style={{ borderColor: '#E8D9C4', color: '#8B5A2B' }}
                        >
                            {!results_revealed ? (
                                <span>
                                    🔒 Tiap irisan buletan memuat persentase
                                    voting kandidat dalam balutan warna abu-abu
                                    netral.
                                </span>
                            ) : (
                                <span>
                                    🏆 Rekapitulasi suara resmi & foto asli
                                    kandidat Pradana Putri ambalan.
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── 3. TOMBOL CEPAT MENU ADMIN LAINNYA ── */}
                <div
                    className="flex flex-col gap-4 rounded-2xl p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between"
                    style={{ background: '#fff', border: '1px solid #E8D9C4' }}
                >
                    <div
                        className="flex items-center gap-2 text-xs font-semibold"
                        style={{ color: '#4A2E1B' }}
                    >
                        <Shield
                            className="h-4 w-4"
                            style={{ color: '#8B5A2B' }}
                        />
                        <span>Manajemen Menu Terkait:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            {
                                label: 'Kelola DPT',
                                href: '/admin/dpt',
                                icon: '👥',
                            },
                            {
                                label: 'Kelola Kandidat',
                                href: '/admin/kandidat',
                                icon: '🏆',
                            },
                            {
                                label: 'Pengaturan Jadwal',
                                href: '/admin/pengaturan',
                                icon: '⚙️',
                            },
                            {
                                label: 'Audit Log',
                                href: '/admin/audit-log',
                                icon: '📋',
                            },
                        ].map((m) => (
                            <Link
                                key={m.href}
                                href={m.href}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all hover:bg-[#F5EFE6]"
                                style={{
                                    color: '#4A2E1B',
                                    border: '1px solid #E8D9C4',
                                }}
                            >
                                <span>{m.icon}</span>
                                <span>{m.label}</span>
                                <ChevronRight className="h-3 w-3 opacity-40" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── 4. POPUP MEGAH PEMENANG (MODAL JUARA 1 PUTRA & PUTRI) ── */}
            <Dialog
                open={isWinnerModalOpen}
                onOpenChange={setIsWinnerModalOpen}
            >
                <DialogContent
                    className="max-w-2xl overflow-hidden rounded-3xl border-0 p-0 shadow-2xl"
                    style={{
                        background:
                            'linear-gradient(135deg, #2D1A0A 0%, #170C04 100%)',
                        color: '#FDFBF7',
                        border: '2px solid #D4AF37',
                    }}
                >
                    {/* Header Modal Selebrasi */}
                    <div className="relative overflow-hidden border-b border-[#D4AF37]/30 p-6 text-center">
                        <div
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
                            style={{
                                background:
                                    'linear-gradient(135deg, #D4AF37, #F59E0B)',
                                color: '#4A2E1B',
                            }}
                        >
                            <Trophy className="h-8 w-8" />
                        </div>

                        <DialogTitle
                            className="mt-3 text-2xl font-black tracking-tight"
                            style={{ color: '#FDFBF7' }}
                        >
                            HASIL RESMI PEMILIHAN PRADANA
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-xs font-semibold tracking-wider text-[#D4AF37] uppercase">
                            Dewan Ambalan Penegak · Masa Bakti Terpilih
                        </DialogDescription>
                    </div>

                    {/* Dua Kartu Juara Bersanding */}
                    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                        {/* 🏆 Juara 1 Putra */}
                        <div
                            className="relative flex flex-col items-center rounded-2xl p-5 text-center shadow-lg transition-transform hover:scale-[1.02]"
                            style={{
                                background:
                                    'linear-gradient(135deg, rgba(29, 78, 216, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%)',
                                border: '1.5px solid #D4AF37',
                            }}
                        >
                            <span
                                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black tracking-wider uppercase shadow-sm"
                                style={{
                                    background: '#D4AF37',
                                    color: '#4A2E1B',
                                }}
                            >
                                <Crown className="h-3 w-3" />
                                Pradana Putra Terpilih
                            </span>

                            <div
                                className="relative my-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-md"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #6F4423 0%, #8B5A2B 100%)',
                                    border: '3px solid #D4AF37',
                                }}
                            >
                                {top_putra?.photo_url ? (
                                    <img
                                        src={top_putra.photo_url}
                                        alt={top_putra.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl">👦</span>
                                )}
                                <span className="absolute -right-1 -bottom-2 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-black text-[#4A2E1B]">
                                    #1
                                </span>
                            </div>

                            <h4
                                className="text-lg font-black tracking-tight"
                                style={{ color: '#FDFBF7' }}
                            >
                                {top_putra?.name || 'Belum Ada Pemenang'}
                            </h4>
                            <p className="text-xs font-medium text-[#D4AF37]">
                                {top_putra
                                    ? `${top_putra.class} · Kandidat Urut 0${top_putra.candidate_number}`
                                    : 'Menunggu hasil voting'}
                            </p>

                            <div
                                className="mt-4 w-full rounded-xl p-3"
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(212, 175, 55, 0.3)',
                                }}
                            >
                                <p className="text-[11px] text-neutral-400">
                                    Total Perolehan Suara
                                </p>
                                <p className="text-xl font-black text-[#D4AF37]">
                                    {top_putra?.vote_count || 0}{' '}
                                    <span className="text-xs font-normal text-neutral-300">
                                        suara ({top_putra?.percentage || 0}%)
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* 🏆 Juara 1 Putri */}
                        <div
                            className="relative flex flex-col items-center rounded-2xl p-5 text-center shadow-lg transition-transform hover:scale-[1.02]"
                            style={{
                                background:
                                    'linear-gradient(135deg, rgba(139, 90, 43, 0.15) 0%, rgba(212, 175, 55, 0.1) 100%)',
                                border: '1.5px solid #D4AF37',
                            }}
                        >
                            <span
                                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black tracking-wider uppercase shadow-sm"
                                style={{
                                    background: '#D4AF37',
                                    color: '#4A2E1B',
                                }}
                            >
                                <Crown className="h-3 w-3" />
                                Pradana Putri Terpilih
                            </span>

                            <div
                                className="relative my-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-md"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #8B5A2B 0%, #A77B4A 100%)',
                                    border: '3px solid #D4AF37',
                                }}
                            >
                                {top_putri?.photo_url ? (
                                    <img
                                        src={top_putri.photo_url}
                                        alt={top_putri.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl">👧</span>
                                )}
                                <span className="absolute -right-1 -bottom-2 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-black text-[#4A2E1B]">
                                    #1
                                </span>
                            </div>

                            <h4
                                className="text-lg font-black tracking-tight"
                                style={{ color: '#FDFBF7' }}
                            >
                                {top_putri?.name || 'Belum Ada Pemenang'}
                            </h4>
                            <p className="text-xs font-medium text-[#D4AF37]">
                                {top_putri
                                    ? `${top_putri.class} · Kandidat Urut 0${top_putri.candidate_number}`
                                    : 'Menunggu hasil voting'}
                            </p>

                            <div
                                className="mt-4 w-full rounded-xl p-3"
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(212, 175, 55, 0.3)',
                                }}
                            >
                                <p className="text-[11px] text-neutral-400">
                                    Total Perolehan Suara
                                </p>
                                <p className="text-xl font-black text-[#D4AF37]">
                                    {top_putri?.vote_count || 0}{' '}
                                    <span className="text-xs font-normal text-neutral-300">
                                        suara ({top_putri?.percentage || 0}%)
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Modal */}
                    <div className="flex flex-col gap-3 border-t border-[#D4AF37]/20 p-6 pt-0 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-neutral-400">
                            🛡️ Berita acara akan tercatat resmi di sistem audit
                            ambalan.
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsWinnerModalOpen(false)}
                                className="rounded-xl px-5 py-2.5 text-xs font-bold transition-all hover:bg-white/10"
                                style={{
                                    border: '1px solid #D4AF37',
                                    color: '#D4AF37',
                                }}
                            >
                                Tutup Jendela
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="rounded-xl px-5 py-2.5 text-xs font-black shadow-md transition-all hover:brightness-110"
                                style={{
                                    background: '#D4AF37',
                                    color: '#4A2E1B',
                                }}
                            >
                                Cetak Berita Acara
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Custom Modal Konfirmasi Perubahan Status Pemilihan */}
            <ConfirmationModal
                open={statusConfirmModal.open}
                onOpenChange={(open) =>
                    setStatusConfirmModal((prev) => ({ ...prev, open }))
                }
                title={statusConfirmModal.title}
                description={statusConfirmModal.description}
                confirmText={statusConfirmModal.confirmText}
                cancelText="Batal"
                variant={statusConfirmModal.variant}
                onConfirm={handleConfirmStatusChange}
            />

            {/* Modal Konfirmasi Reset Pemilihan */}
            <ConfirmationModal
                open={isResetElectionModalOpen}
                onOpenChange={setIsResetElectionModalOpen}
                title="Reset Sesi Pemilihan ke Kondisi Awal?"
                description={
                    <div className="space-y-2 text-left text-xs text-neutral-600">
                        <p>
                            Tindakan ini akan mengembalikan sesi pemilihan
                            seakan-akan <strong>belum pernah dimulai</strong>:
                        </p>
                        <ul className="list-disc space-y-1 pl-4 text-neutral-700">
                            <li>
                                Seluruh rekaman suara masuk akan{' '}
                                <strong>dihapus total (0 suara)</strong>.
                            </li>
                            <li>
                                Hak suara seluruh siswa DPT dikembalikan menjadi{' '}
                                <strong>&ldquo;Belum Memilih&rdquo;</strong>{' '}
                                (token akses tetap berlaku dan dapat digunakan
                                ulang).
                            </li>
                            <li>
                                Status sistem dikembalikan ke{' '}
                                <strong>DRAFT (Persiapan)</strong>.
                            </li>
                            <li>
                                Hasil buka suara / reveal mode akan
                                dinonaktifkan kembali.
                            </li>
                        </ul>
                        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 font-semibold text-emerald-800">
                            🛡️ Data daftar siswa (DPT) dan profil kandidat tetap
                            aman dan tidak akan terhapus.
                        </p>
                    </div>
                }
                confirmText="Ya, Reset Pemilihan Sekarang"
                cancelText="Batal"
                variant="danger"
                icon={RotateCcw}
                onConfirm={handleResetElection}
            />
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
