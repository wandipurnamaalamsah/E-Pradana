import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { edit } from '@/routes/profile';
import { ConfirmationModal } from '@/components/confirmation-modal';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleConfirmLogout = () => {
        cleanup();
        setIsLogoutModalOpen(false);
        router.post('/logout');
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="block w-full cursor-pointer text-red-600 focus:text-red-700"
                onSelect={(e) => {
                    e.preventDefault();
                    setIsLogoutModalOpen(true);
                }}
                data-test="logout-button"
            >
                <div className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </div>
            </DropdownMenuItem>

            {/* Custom Modal Konfirmasi Logout Admin (Bukan alert/confirm bawaan browser) */}
            <ConfirmationModal
                open={isLogoutModalOpen}
                onOpenChange={setIsLogoutModalOpen}
                title="Keluar dari Panel Admin?"
                description="Sesi Anda sebagai Administrator E-Pradana akan diakhiri. Sesi pemilih di bilik suara tidak akan terpengaruh."
                confirmText="Ya, Keluar"
                cancelText="Batal"
                variant="danger"
                onConfirm={handleConfirmLogout}
            />
        </>
    );
}
