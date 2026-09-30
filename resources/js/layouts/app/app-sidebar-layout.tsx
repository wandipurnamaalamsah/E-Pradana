import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="flex h-svh !min-h-0 min-w-0 flex-col overflow-x-clip"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {/* Hanya area ini yang scroll, header tetap di atas */}
                <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </AppContent>
        </AppShell>
    );
}
