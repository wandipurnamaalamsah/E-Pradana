import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div
                className="flex aspect-square size-8 items-center justify-center rounded-md"
                style={{ background: '#D4AF37' }}
            >
                <svg viewBox="0 0 24 24" fill="none" className="size-5">
                    <path
                        d="M12 2C12 2 7 7 7 12C7 14.8 8.5 17.2 12 19C15.5 17.2 17 14.8 17 12C17 7 12 2 12 2Z"
                        fill="#4A2E1B"
                    />
                    <path
                        d="M12 19V22M9 22H15"
                        stroke="#4A2E1B"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span
                    className="mb-0.5 truncate leading-tight font-bold"
                    style={{ color: '#FDFBF7' }}
                >
                    {name || 'E-Pradana'}
                </span>
                <span
                    className="truncate text-[10px] font-medium"
                    style={{ color: '#D4AF37' }}
                >
                    Panel Admin
                </span>
            </div>
        </>
    );
}
