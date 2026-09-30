import { Link } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    UserSquare2,
    Settings2,
    ScrollText,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Manajemen DPT',
        href: '/admin/dpt',
        icon: Users,
    },
    {
        title: 'Manajemen Kandidat',
        href: '/admin/kandidat',
        icon: UserSquare2,
    },
    {
        title: 'Audit Log',
        href: '/admin/audit-log',
        icon: ScrollText,
    },
    {
        title: 'Pengaturan',
        href: '/admin/pengaturan',
        icon: Settings2,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
