import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    AlertTriangle,
    AlertCircle,
    CheckCircle2,
    HelpCircle,
    Loader2,
    type LucideIcon,
} from 'lucide-react';

export type ConfirmationModalVariant =
    | 'danger'
    | 'warning'
    | 'primary'
    | 'success';

interface ConfirmationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationModalVariant;
    icon?: LucideIcon;
    isLoading?: boolean;
    onConfirm: () => void;
}

export function ConfirmationModal({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'primary',
    icon,
    isLoading = false,
    onConfirm,
}: ConfirmationModalProps) {
    const getVariantConfig = () => {
        switch (variant) {
            case 'danger':
                return {
                    Icon: icon || AlertTriangle,
                    iconBg: 'rgba(239, 68, 68, 0.15)',
                    iconColor: '#DC2626',
                    iconBorder: 'rgba(239, 68, 68, 0.3)',
                    buttonClass:
                        'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20',
                };
            case 'warning':
                return {
                    Icon: icon || AlertCircle,
                    iconBg: 'rgba(245, 158, 11, 0.15)',
                    iconColor: '#D97706',
                    iconBorder: 'rgba(245, 158, 11, 0.3)',
                    buttonClass:
                        'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20',
                };
            case 'success':
                return {
                    Icon: icon || CheckCircle2,
                    iconBg: 'rgba(34, 197, 94, 0.15)',
                    iconColor: '#16A34A',
                    iconBorder: 'rgba(34, 197, 94, 0.3)',
                    buttonClass:
                        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20',
                };
            case 'primary':
            default:
                return {
                    Icon: icon || HelpCircle,
                    iconBg: 'rgba(74, 46, 27, 0.12)',
                    iconColor: '#4A2E1B',
                    iconBorder: 'rgba(212, 175, 55, 0.35)',
                    buttonClass:
                        'bg-[#4A2E1B] hover:bg-[#3D2211] text-[#FAF6F0] shadow-md shadow-[#4A2E1B]/20',
                };
        }
    };

    const config = getVariantConfig();
    const IconComponent = config.Icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-md overflow-hidden rounded-3xl border p-6 shadow-2xl sm:p-7"
                style={{
                    background: '#FFFFFF',
                    borderColor: 'rgba(74, 46, 27, 0.15)',
                }}
            >
                <div className="flex flex-col items-center text-center">
                    {/* Icon with Glowing Badge */}
                    <div
                        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{
                            background: config.iconBg,
                            border: `1.5px solid ${config.iconBorder}`,
                        }}
                    >
                        <IconComponent
                            className="h-7 w-7"
                            style={{ color: config.iconColor }}
                        />
                    </div>

                    <DialogHeader className="space-y-2 text-center">
                        <DialogTitle className="text-xl font-black tracking-tight text-[#4A2E1B]">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-relaxed font-medium text-[#735A47]">
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Actions */}
                    <div className="mt-6 flex w-full flex-col-reverse items-center justify-end gap-2.5 sm:flex-row sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="w-full rounded-xl border-[#E8DCC8] px-5 font-semibold text-[#5C4033] hover:bg-[#FAF6F0] sm:w-auto"
                        >
                            {cancelText}
                        </Button>

                        <Button
                            type="button"
                            onClick={() => {
                                onConfirm();
                            }}
                            disabled={isLoading}
                            className={`w-full rounded-xl px-6 font-bold transition-all sm:w-auto ${config.buttonClass}`}
                        >
                            {isLoading ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Memproses...</span>
                                </span>
                            ) : (
                                confirmText
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
