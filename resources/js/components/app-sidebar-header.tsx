import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <header
            className="flex h-14 shrink-0 items-center gap-3 border-b px-4"
            style={{ borderColor: '#E8D9C4', background: '#FDFBF7' }}
        >
            {/* Tombol toggle sidebar - selalu ada di desktop & mobile agar mudah menutup/membuka kapan saja */}
            <SidebarTrigger
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[#4A2E1B] transition-colors hover:bg-[#F5EFE6]"
                title={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            />

            {/* Separator */}
            <div className="h-5 w-px" style={{ background: '#E8D9C4' }} />

            {/* Breadcrumbs */}
            <Breadcrumbs breadcrumbs={breadcrumbs} />
        </header>
    );
}
