import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

// Mock the Badge component to capture the variant prop
vi.mock('@/components/ui/badge', () => ({
    Badge: ({
        variant,
        className,
        children,
    }: {
        variant: string;
        className?: string;
        children: React.ReactNode;
    }) => (
        <span data-testid="badge" data-variant={variant} className={className}>
            {children}
        </span>
    ),
}));

describe('StatusBadge', () => {
    describe('variant selection', () => {
        it('returns "default" variant for ACTIVE status', () => {
            render(<StatusBadge status="ACTIVE" />);
            expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'default');
        });

        it('returns "secondary" variant for DISABLED status', () => {
            render(<StatusBadge status="DISABLED" />);
            expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'secondary');
        });

        it('returns "secondary" variant for INACTIVE status', () => {
            render(<StatusBadge status="INACTIVE" />);
            expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'secondary');
        });

        it('returns "destructive" variant for ERROR status', () => {
            render(<StatusBadge status="ERROR" />);
            expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'destructive');
        });

        it('returns "destructive" variant for BANNED status', () => {
            render(<StatusBadge status="BANNED" />);
            expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'destructive');
        });

        it('returns "outline" variant for unknown status', () => {
            render(<StatusBadge status="UNKNOWN" />);
            expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'outline');
        });

        it('handles case-insensitive status (lowercase)', () => {
            render(<StatusBadge status="active" />);
            expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'default');
        });

        it('handles case-insensitive status (mixed case)', () => {
            render(<StatusBadge status="AcTiVe" />);
            expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'default');
        });
    });

    describe('custom variantMap', () => {
        it('uses custom variant mapping when provided', () => {
            render(
                <StatusBadge
                    status="PENDING"
                    variantMap={{ PENDING: 'secondary' }}
                />
            );
            expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'secondary');
        });

        it('custom variantMap takes precedence over defaults', () => {
            render(
                <StatusBadge
                    status="ACTIVE"
                    variantMap={{ ACTIVE: 'destructive' }}
                />
            );
            expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'destructive');
        });
    });

    describe('rendering', () => {
        it('displays the status text', () => {
            render(<StatusBadge status="ACTIVE" />);
            expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        });

        it('passes className to Badge', () => {
            render(<StatusBadge status="ACTIVE" className="custom-class" />);
            expect(screen.getByTestId('badge')).toHaveClass('custom-class');
        });
    });
});
