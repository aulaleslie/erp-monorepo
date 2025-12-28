import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        title: 'Confirm Action',
        description: 'Are you sure you want to proceed?',
        onConfirm: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders title and description', () => {
        render(<ConfirmDialog {...defaultProps} />);

        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('renders default button labels', () => {
        render(<ConfirmDialog {...defaultProps} />);

        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders custom button labels', () => {
        render(
            <ConfirmDialog
                {...defaultProps}
                confirmLabel="Yes, delete"
                cancelLabel="No, keep it"
            />
        );

        expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'No, keep it' })).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', () => {
        render(<ConfirmDialog {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('applies destructive styling when variant is destructive', () => {
        render(<ConfirmDialog {...defaultProps} variant="destructive" />);

        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        expect(confirmButton).toHaveClass('bg-destructive');
    });

    it('does not render when open is false', () => {
        render(<ConfirmDialog {...defaultProps} open={false} />);

        expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });
});
