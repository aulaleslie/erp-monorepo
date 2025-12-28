import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationControls } from './PaginationControls';

// Mock the Button component
vi.mock('@/components/ui/button', () => ({
    Button: ({
        variant,
        size,
        onClick,
        disabled,
        children,
    }: {
        variant: string;
        size: string;
        onClick?: () => void;
        disabled?: boolean;
        children: React.ReactNode;
    }) => (
        <button
            data-variant={variant}
            data-size={size}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    ),
}));

describe('PaginationControls', () => {
    describe('rendering', () => {
        it('displays current page and total pages', () => {
            render(
                <PaginationControls
                    currentPage={3}
                    totalPages={10}
                    onPageChange={() => { }}
                />
            );

            expect(screen.getByText('Page 3 of 10')).toBeInTheDocument();
        });

        it('displays 1 as total pages when totalPages is 0', () => {
            render(
                <PaginationControls
                    currentPage={1}
                    totalPages={0}
                    onPageChange={() => { }}
                />
            );

            expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
        });

        it('renders Previous and Next buttons', () => {
            render(
                <PaginationControls
                    currentPage={2}
                    totalPages={5}
                    onPageChange={() => { }}
                />
            );

            expect(screen.getByText('Previous')).toBeInTheDocument();
            expect(screen.getByText('Next')).toBeInTheDocument();
        });
    });

    describe('button states', () => {
        it('disables Previous button on first page', () => {
            render(
                <PaginationControls
                    currentPage={1}
                    totalPages={5}
                    onPageChange={() => { }}
                />
            );

            expect(screen.getByText('Previous')).toBeDisabled();
            expect(screen.getByText('Next')).not.toBeDisabled();
        });

        it('disables Next button on last page', () => {
            render(
                <PaginationControls
                    currentPage={5}
                    totalPages={5}
                    onPageChange={() => { }}
                />
            );

            expect(screen.getByText('Previous')).not.toBeDisabled();
            expect(screen.getByText('Next')).toBeDisabled();
        });

        it('enables both buttons on middle page', () => {
            render(
                <PaginationControls
                    currentPage={3}
                    totalPages={5}
                    onPageChange={() => { }}
                />
            );

            expect(screen.getByText('Previous')).not.toBeDisabled();
            expect(screen.getByText('Next')).not.toBeDisabled();
        });

        it('disables both buttons when loading', () => {
            render(
                <PaginationControls
                    currentPage={3}
                    totalPages={5}
                    onPageChange={() => { }}
                    loading={true}
                />
            );

            expect(screen.getByText('Previous')).toBeDisabled();
            expect(screen.getByText('Next')).toBeDisabled();
        });
    });

    describe('callbacks', () => {
        it('calls onPageChange with previous page when Previous clicked', () => {
            const onPageChange = vi.fn();
            render(
                <PaginationControls
                    currentPage={3}
                    totalPages={5}
                    onPageChange={onPageChange}
                />
            );

            fireEvent.click(screen.getByText('Previous'));
            expect(onPageChange).toHaveBeenCalledWith(2);
        });

        it('calls onPageChange with next page when Next clicked', () => {
            const onPageChange = vi.fn();
            render(
                <PaginationControls
                    currentPage={3}
                    totalPages={5}
                    onPageChange={onPageChange}
                />
            );

            fireEvent.click(screen.getByText('Next'));
            expect(onPageChange).toHaveBeenCalledWith(4);
        });

        it('does not go below page 1 when clicking Previous', () => {
            const onPageChange = vi.fn();
            render(
                <PaginationControls
                    currentPage={1}
                    totalPages={5}
                    onPageChange={onPageChange}
                />
            );

            // Button is disabled but let's verify the logic anyway
            fireEvent.click(screen.getByText('Previous'));
            expect(onPageChange).not.toHaveBeenCalled();
        });

        it('does not go above totalPages when clicking Next', () => {
            const onPageChange = vi.fn();
            render(
                <PaginationControls
                    currentPage={5}
                    totalPages={5}
                    onPageChange={onPageChange}
                />
            );

            // Button is disabled
            fireEvent.click(screen.getByText('Next'));
            expect(onPageChange).not.toHaveBeenCalled();
        });
    });
});
