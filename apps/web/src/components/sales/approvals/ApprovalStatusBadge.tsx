import React from 'react';
import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/common/StatusBadge';

interface ApprovalStatusBadgeProps {
    status: string;
    className?: string;
}

export function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
    const ts = useTranslations('sales.statusLabels');

    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        PENDING: 'outline',
        APPROVED: 'default',
        REJECTED: 'destructive',
        REVISION_REQUESTED: 'secondary',
    };

    return (
        <StatusBadge
            status={status}
            variantMap={variantMap}
            className={className}
        >
            {ts(status)}
        </StatusBadge>
    );
}
