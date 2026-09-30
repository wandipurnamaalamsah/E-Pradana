import type { Auth, User } from '@/types/auth';
import type { BreadcrumbItem } from '@/types/navigation';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: {
                user: User | null;
            };
            sidebarOpen: boolean;
            flash: {
                success?: string | null;
                error?: string | null;
                status?: string | null;
            };
            voter_session?: {
                active: boolean;
                active_vt?: string | null;
            };
            [key: string]: unknown;
        };
    }
}

declare module '@inertiajs/react' {
    interface LayoutProps {
        breadcrumbs?: BreadcrumbItem[];
        title?: string;
        description?: string;
    }
}
