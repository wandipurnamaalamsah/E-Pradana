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
    User,
    Shield,
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
                                className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg select-none text-2xl"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                                }}
                            >
                                <span role="img" aria-label="Logo Pramuka">⚜️</span>
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

                {/* ── Right Panel: Form Bilik Suara & Mobile Layout ── */}
                <div className="col-span-12 flex min-h-screen flex-col justify-between bg-[#FDFBF7] p-0 lg:col-span-6 lg:p-10 xl:col-span-5 xl:p-14">
                    {/* Desktop Top Header (Official Seal / Identity) */}
                    <div className="hidden items-center justify-between pb-4 lg:flex">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#4A2E1B] text-base shadow-sm select-none">
                                ⚜️
                            </span>
                            <div>
                                <span className="block text-xs font-black tracking-wider uppercase text-[#4A2E1B]">
                                    Bilik Suara Digital
                                </span>
                                <span className="block text-[10px] font-bold tracking-wide text-[#8B5A2B]">
                                    Ambalan Penegak
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#FAF6F0] px-3 py-1 text-xs font-bold text-[#8B5A2B]">
                            <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
                            <span>Portal Pemilih Resmi</span>
                        </div>
                    </div>

                    {/* Mobile Hero Header (Eksklusif Mobile < lg: Berwibawa & Estetik) */}
                    <div
                        className="relative overflow-hidden px-6 pt-10 pb-12 text-white lg:hidden"
                        style={{
                            background:
                                'linear-gradient(155deg, #2D1A0E 0%, #1A0D05 55%, #100702 100%)',
                            borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
                        }}
                    >
                        {/* Decorative ambient golden glow */}
                        <div
                            className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
                            style={{ background: '#D4AF37' }}
                        />
                        <div
                            className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-15 blur-3xl"
                            style={{ background: '#2D5A27' }}
                        />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            {/* Logo Pramuka */}
                            <div className="mb-3 flex items-center justify-center">
                                <div
                                    className="flex h-13 w-13 items-center justify-center rounded-2xl shadow-lg select-none text-2xl"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                                        border: '1.5px solid rgba(255, 255, 255, 0.25)',
                                    }}
                                >
                                    <span role="img" aria-label="Logo Pramuka">⚜️</span>
                                </div>
                            </div>

                            <h1 className="text-2xl font-black tracking-tight text-[#FAF6F0]">
                                E-Pradana Bilik Suara
                            </h1>
                            <p className="mt-1 text-xs font-semibold tracking-wider text-[#D4AF37] uppercase">
                                Pemilihan Pradana Ambalan Penegak
                            </p>

                            {/* Status Chip Pemilihan Mobile */}
                            <div
                                className="mt-3.5 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-bold"
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

                            {/* 3 Quick Pillar Badges */}
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold text-[#D6C7B2]">
                                <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 border border-white/10">
                                    ⚖️ Asas LUBER JURDIL
                                </span>
                                <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 border border-white/10">
                                    🔑 Token 1x Pakai
                                </span>
                                <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 border border-white/10">
                                    🛡️ Rahasia & Sah
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Form Container (Elevated Floating Card di Mobile, Elegant Centered Card di Desktop) */}
                    <div className="mx-auto my-auto w-full max-w-md -mt-6 px-4 sm:px-6 lg:mt-0 lg:px-0">
                        <div className="w-full rounded-3xl border border-[#E8D9C4] bg-white p-6 shadow-xl shadow-[#4A2E1B]/5 sm:p-8 lg:p-9">
                            {/* Flash Error Message */}
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

                            {/* Title Header Form */}
                            <div className="mb-6 sm:mb-8">
                                <span
                                    className="mb-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-black tracking-wider uppercase"
                                    style={{
                                        background: '#FAF6F0',
                                        color: '#8B5A2B',
                                        border: '1px solid #E8D9C4',
                                    }}
                                >
                                    <Lock className="h-3.5 w-3.5 text-[#D4AF37]" />
                                    Bilik Suara Resmi
                                </span>
                                <h2 className="text-2xl font-black tracking-tight text-[#4A2E1B] sm:text-3xl">
                                    Masuk Bilik Suara
                                </h2>
                                <p className="mt-1.5 text-xs leading-relaxed font-medium text-[#8B5A2B] sm:text-sm">
                                    Masukkan <strong>Username</strong> dan{' '}
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
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8B5A2B]">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            autoFocus
                                            placeholder="Masukkan username atau NIS"
                                            value={data.username}
                                            onChange={(e) =>
                                                setData('username', e.target.value)
                                            }
                                            className={`w-full rounded-2xl bg-[#FAF6F0] py-3 pr-4 pl-10.5 text-sm font-semibold text-[#4A2E1B] outline-none transition-all placeholder:font-normal placeholder:text-neutral-400 focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 ${
                                                errors.username
                                                    ? 'border-1.5 border-rose-500'
                                                    : 'border border-[#E8D9C4] focus:border-[#D4AF37]'
                                            }`}
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
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8B5A2B]">
                                            <KeyRound className="h-4 w-4" />
                                        </div>
                                        <input
                                            type={showSecret ? 'text' : 'password'}
                                            required
                                            placeholder="Masukkan 6 karakter token akses"
                                            value={data.password}
                                            onChange={(e) =>
                                                setData('password', e.target.value)
                                            }
                                            className={`w-full rounded-2xl bg-[#FAF6F0] py-3 pr-11 pl-10.5 text-sm font-semibold text-[#4A2E1B] outline-none transition-all placeholder:font-normal placeholder:text-neutral-400 focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 ${
                                                errors.password
                                                    ? 'border-1.5 border-rose-500'
                                                    : 'border border-[#E8D9C4] focus:border-[#D4AF37]'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowSecret(!showSecret)
                                            }
                                            className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-neutral-400 transition-colors hover:text-[#4A2E1B]"
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
                                        * Masukkan token akses unik 6 karakter dari kartu pemilihan resmi Anda.
                                    </p>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white shadow-md shadow-[#4A2E1B]/15 transition-all hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
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

                            {/* Trust Security Note */}
                            <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#E8D9C4]/60 pt-4 text-center text-[11px] font-semibold text-[#8B5A2B]">
                                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Sesi Bilik Suara Aman & Terenkripsi Kriptografi</span>
                            </div>
                        </div>

                        {/* Mobile Bottom Footer (< lg) */}
                        <div className="mt-5 pb-6 text-center text-[11px] font-medium text-[#8B5A2B]/60 lg:hidden">
                            E-Pradana Voting Engine · Pemilihan Pradana Ambalan
                        </div>
                    </div>

                    {/* Desktop Bottom Footer (lg+) */}
                    <div className="hidden pt-4 text-center text-xs font-medium text-[#8B5A2B]/60 lg:block">
                        E-Pradana Voting Engine · Bilik Suara Resmi Pemilihan Pradana Ambalan
                    </div>
                </div>
            </div>
        </>
    );
}

Login.layout = null;
