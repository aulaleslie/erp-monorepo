import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionGuard } from '@/components/guards/PermissionGuard';

export interface ActionButtonProps {
    viewUrl?: string;
    editUrl?: string;
    onDelete?: () => void;
    deleteLabel?: string; // Additional custom label/icon? defaulting to trash icon
    permissions?: {
        view?: string[];
        edit?: string[];
        delete?: string[];
    };
    customActions?: React.ReactNode;
}

export function ActionButtons({
    viewUrl,
    editUrl,
    onDelete,
    permissions,
    customActions,
}: ActionButtonProps) {
    return (
        <div className="flex items-center gap-2">
            {viewUrl && (
                <ConditionalWrapper
                    permissions={permissions?.view}
                >
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={viewUrl}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                </ConditionalWrapper>
            )}

            {editUrl && (
                <ConditionalWrapper
                    permissions={permissions?.edit}
                >
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={editUrl}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                </ConditionalWrapper>
            )}

            {onDelete && (
                <ConditionalWrapper
                    permissions={permissions?.delete}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </ConditionalWrapper>
            )}

            {customActions}
        </div>
    );
}

function ConditionalWrapper({
    permissions,
    children,
}: {
    permissions?: string[];
    children: React.ReactNode;
}) {
    if (!permissions || permissions.length === 0) {
        return <>{children}</>;
    }
    return (
        <PermissionGuard requiredPermissions={permissions}>
            {children}
        </PermissionGuard>
    );
}
