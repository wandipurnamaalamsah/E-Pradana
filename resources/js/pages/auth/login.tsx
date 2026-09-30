import { useState, useEffect } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import {
    KeyRound,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    Compass,
} from 'lucide-react';

type Props = {
    election_status?: 'draft' | 'rehearsal' | 'open' | 'closed';
    status?: string | null;
};

export default function Login({
    election_status = 'draft',
    status = null,
}: Props) {
    const { auth, flash } = usePage().props;
    const [showSecret, setShowSecret] = useState(false);

    // Guard: jika admin sudah login, redirect ke dashboard
    useEffect(() => {
        if (auth?.user) {
            router.visit('/dashboard', { replace: true });
        }
    }, [auth?.user]);

    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login', {
            preserveScroll: true,
        });
    };

    const getStatusBadge = () => {
        switch (election_status) {
            case 'open':
                return {
                    text: 'Pemilihan Sedang Berlangsung',
                    bg: 'rgba(34, 197, 94, 0.15)',
                    border: 'rgba(34, 197, 94, 0.3)',
                    color: '#4ADE80',
                    dot: '#22C55E',
                };
            case 'rehearsal':
                return {
                    text: 'Mode Gladi Bersih / Uji Coba',
                    bg: 'rgba(59, 130, 246, 0.15)',
                    border: 'rgba(59, 130, 246, 0.3)',
                    color: '#60A5FA',
                    dot: '#3B82F6',
                };
            case 'closed':
                return {
                    text: 'Pemilihan Telah Ditutup',
                    bg: 'rgba(239, 68, 68, 0.15)',
                    border: 'rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    dot: '#EF4444',
                };
            default:
                return {
                    text: 'Bilik Suara Dalam Persiapan',
                    bg: 'rgba(234, 179, 8, 0.15)',
                    border: 'rgba(234, 179, 8, 0.3)',
                    color: '#FACC15',
                    dot: '#EAB308',
                };
        }
    };

    const statusBadge = getStatusBadge();

    return (
        <>
            <Head title="Bilik Suara Siswa · E-Pradana" />

            <div
                className="grid min-h-screen w-full lg:grid-cols-12"
                style={{ background: '#FDFBF7' }}
            >
                {/* ── Left Hero Panel (Visual Pramuka Branding) ── */}
                <div
                    className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:col-span-6 lg:flex xl:col-span-7"
                    style={{
                        background:
                            'linear-gradient(150deg, #3D2211 0%, #291508 55%, #180B04 100%)',
                    }}
                >
                    {/* Background Decorative Glows */}
                    <div
                        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
                        style={{ background: '#D4AF37' }}
                    />
                    <div
                        className="pointer-events-none absolute -right-32 -bottom-32 h-[450px] w-[450px] rounded-full opacity-15 blur-3xl"
                        style={{ background: '#2D5A27' }}
                    />

                    {/* Logo & Brand Header */}
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                                }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="h-7 w-7 text-[#3D2211]"
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
                                <span className="text-2xl font-black tracking-tight text-[#FAF6F0]">
                                    E-Pradana
                                </span>
                                <span className="block text-[11px] font-bold tracking-wider text-[#D4AF37] uppercase">
                                    E-Voting Ambalan Pramuka
                                </span>
                            </div>
                        </div>

                        {/* Status Chip */}
                        <div
                            className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold"
                            style={{
                                background: statusBadge.bg,
                                border: `1px solid ${statusBadge.border}`,
                                color: statusBadge.color,
                            }}
                        >
                            <span
                                className="h-2 w-2 animate-pulse rounded-full"
                                style={{ background: statusBadge.dot }}
                            />
                            {statusBadge.text}
                        </div>
                    </div>

                    {/* Center Description */}
                    <div className="relative z-10 my-auto max-w-xl py-10">
                        <div
                            className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold tracking-wider uppercase"
                            style={{
                                background: 'rgba(212, 175, 55, 0.15)',
                                color: '#D4AF37',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                            }}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Bilik Suara Digital
                        </div>

                        <h1 className="text-4xl leading-tight font-black text-[#FAF6F0] xl:text-5xl">
                            Bilik Suara Digital <br />
                            <span style={{ color: '#D4AF37' }}>
                                Pemilihan Pradana
                            </span>
                        </h1>

                        <p className="mt-4 text-base leading-relaxed text-[#D6C7B2]">
                            Selamat datang di Bilik Suara Digital E-Pradana.
                            Salurkan hak suara Anda untuk memilih Pradana Putra
                            & Pradana Putri masa bakti berikutnya secara{' '}
                            <strong>
                                Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil
                            </strong>
                            .
                        </p>

                        {/* 3 Pillars */}
                        <div className="mt-10 grid grid-cols-3 gap-4">
                            <div
                                className="rounded-2xl p-4"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(212, 175, 55, 0.18)',
                                }}
                            >
                                <ShieldCheck className="mb-2 h-6 w-6 text-[#D4AF37]" />
                                <h3 className="text-xs font-black text-[#FAF6F0] uppercase">
                                    Kerahasiaan Terjamin
                                </h3>
                                <p className="mt-1 text-[11px] leading-snug text-[#A89884]">
                                    Pilihan Anda dijamin 100% rahasia, aman, dan
                                    tidak dapat dilacak oleh pihak manapun.
                                </p>
                            </div>

                            <div
                                className="rounded-2xl p-4"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(212, 175, 55, 0.18)',
                                }}
                            >
                                <KeyRound className="mb-2 h-6 w-6 text-[#D4AF37]" />
                                <h3 className="text-xs font-black text-[#FAF6F0] uppercase">
                                    Token Sekali Pakai
                                </h3>
                                <p className="mt-1 text-[11px] leading-snug text-[#A89884]">
                                    Token akses hanya berlaku 1 kali dan
                                    otomatis kedaluwarsa setelah Anda selesai
                                    mencoblos.
                                </p>
                            </div>

                            <div
                                className="rounded-2xl p-4"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(212, 175, 55, 0.18)',
                                }}
                            >
                                <Compass className="mb-2 h-6 w-6 text-[#D4AF37]" />
                                <h3 className="text-xs font-black text-[#FAF6F0] uppercase">
                                    Aman & Transparan
                                </h3>
                                <p className="mt-1 text-[11px] leading-snug text-[#A89884]">
                                    Proses penghitungan suara terekam secara
                                    otomatis, real-time, dan akurat.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 flex items-center justify-between text-xs text-[#8A7966]">
                        <span>
                            © {new Date().getFullYear()} E-Pradana · Ambalan
                            Pramuka
                        </span>
                        <span className="font-semibold text-[#D4AF37]">
                            Sistem E-Voting Modern
                        </span>
                    </div>
                </div>

                {/* ── Right Panel: Form Bilik Suara ── */}
                <div className="col-span-12 flex flex-col justify-between p-6 sm:p-10 lg:col-span-6 lg:p-12 xl:col-span-5">
                    {/* Mobile Brand */}
                    <div className="mb-6 flex items-center gap-2 lg:hidden">
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ background: '#4A2E1B' }}
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
                            </svg>
                        </div>
                        <span className="text-lg font-black text-[#4A2E1B]">
                            E-Pradana
                        </span>
                    </div>

                    {/* Center Single Form Card */}
                    <div className="mx-auto my-auto w-full max-w-md py-4">
                        {/* Flash Error (misal: dari redirect voter session expired) */}
                        {flash?.error && (
                            <div
                                className="mb-5 flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-semibold text-rose-800"
                                style={{
                                    background: '#FFF1F2',
                                    border: '1px solid #FECDD3',
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 shrink-0 text-rose-600"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{flash.error}</span>
                            </div>
                        )}
                        {/* Status Message (success) */}
                        {status && (
                            <div
                                className="mb-5 flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-semibold text-emerald-800"
                                style={{
                                    background: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                }}
                            >
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span>{status}</span>
                            </div>
                        )}

                        {/* Title Header */}
                        <div className="mb-8">
                            <span
                                className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black tracking-wider uppercase"
                                style={{
                                    background: '#F5EFE6',
                                    color: '#8B5A2B',
                                }}
                            >
                                <Lock className="h-3.5 w-3.5" />
                                Bilik Suara Siswa
                            </span>
                            <h2
                                className="text-3xl font-black tracking-tight"
                                style={{ color: '#4A2E1B' }}
                            >
                                Masuk Bilik Suara
                            </h2>
                            <p className="mt-1.5 text-xs leading-relaxed font-medium text-[#8B5A2B]">
                                Silakan masukkan <strong>Username</strong> dan{' '}
                                <strong>Token Akses</strong> pemilihan Anda.
                            </p>
                        </div>

                        {/* ── FORM BILIK SUARA ── */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* USERNAME FIELD */}
                            <div>
                                <label
                                    className="mb-1.5 block text-xs font-extrabold tracking-wider uppercase"
                                    style={{ color: '#4A2E1B' }}
                                >
                                    Username Pemilih
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        placeholder="Masukkan username atau NIS"
                                        value={data.username}
                                        onChange={(e) =>
                                            setData('username', e.target.value)
                                        }
                                        className="w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all outline-none placeholder:font-normal placeholder:text-neutral-400"
                                        style={{
                                            background: '#FAF6F0',
                                            border: errors.username
                                                ? '1.5px solid #EF4444'
                                                : '1.5px solid #E8D9C4',
                                            color: '#4A2E1B',
                                        }}
                                    />
                                </div>
                                {errors.username && (
                                    <p className="mt-1.5 text-xs font-bold text-rose-600">
                                        {errors.username}
                                    </p>
                                )}
                            </div>

                            {/* TOKEN AKSES FIELD */}
                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label
                                        className="block text-xs font-extrabold tracking-wider uppercase"
                                        style={{ color: '#4A2E1B' }}
                                    >
                                        Token Akses Pemilih
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showSecret ? 'text' : 'password'}
                                        required
                                        placeholder="Masukkan 6 karakter token akses"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData('password', e.target.value)
                                        }
                                        className="w-full rounded-2xl py-3 pr-11 pl-4 text-sm font-semibold transition-all outline-none placeholder:font-normal placeholder:text-neutral-400"
                                        style={{
                                            background: '#FAF6F0',
                                            border: errors.password
                                                ? '1.5px solid #EF4444'
                                                : '1.5px solid #E8D9C4',
                                            color: '#4A2E1B',
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowSecret(!showSecret)
                                        }
                                        className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400 hover:text-neutral-700"
                                        title={
                                            showSecret
                                                ? 'Sembunyikan'
                                                : 'Tampilkan'
                                        }
                                    >
                                        {showSecret ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs font-bold text-rose-600">
                                        {errors.password}
                                    </p>
                                )}
                                <p className="mt-1.5 text-[11px] leading-snug text-[#8B5A2B]">
                                    * Masukkan token akses unik 6 karakter yang
                                    tertera pada kartu akun pemilihan Anda.
                                </p>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #4A2E1B 0%, #2D1A0A 100%)',
                                    border: '1px solid #351C0C',
                                }}
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg
                                            className="h-4 w-4 animate-spin"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Memverifikasi Token Akses...
                                    </span>
                                ) : (
                                    <>
                                        <span>Buka Surat Suara</span>
                                        <ArrowRight className="h-4 w-4 text-[#D4AF37]" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Bottom Footer */}
                    <div className="text-center text-[11px] font-medium text-neutral-400">
                        E-Pradana Voting Engine · Bilik Suara Resmi Pemilihan
                        Pradana
                    </div>
                </div>
            </div>
        </>
    );
}

Login.layout = null;
