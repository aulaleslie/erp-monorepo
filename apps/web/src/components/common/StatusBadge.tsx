import React from 'react';
import { Badge } from '@/components/ui/badge';

type StatusType = 'ACTIVE' | 'DISABLED' | 'PENDING' | 'INACTIVE' | string;

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
    variantMap?: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'>;
}

export function StatusBadge({ status, className, variantMap }: StatusBadgeProps) {
    const getVariant = (s: string) => {
        if (variantMap && variantMap[s]) return variantMap[s];

        switch (s?.toUpperCase()) {
            case 'ACTIVE':
                return 'default'; // Usually standard/primary color or we could optimize for green
            case 'DISABLED':
            case 'INACTIVE':
                return 'secondary';
            case 'ERROR':
            case 'BANNED':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    // We might want to customize colors further via CSS classes if shadcn badges are limited
    // But strictly using shadcn variants is cleaner for now.

    return (
        <Badge variant={getVariant(status)} className={className}>
            {status}
        </Badge>
    );
}
