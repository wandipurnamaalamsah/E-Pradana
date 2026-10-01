import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div
                className="flex aspect-square size-8 items-center justify-center rounded-md select-none text-base shadow-xs"
                style={{ background: '#D4AF37' }}
            >
                <span role="img" aria-label="Logo Pramuka">⚜️</span>
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
