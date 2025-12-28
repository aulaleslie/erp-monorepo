import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionButtons } from './ActionButtons';

// Mock the PermissionGuard to always render children
vi.mock('@/components/guards/PermissionGuard', () => ({
    PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ActionButtons', () => {
    it('renders view button when viewUrl is provided', () => {
        render(<ActionButtons viewUrl="/test/view" />);

        const viewLink = screen.getByRole('link');
        expect(viewLink).toHaveAttribute('href', '/test/view');
    });

    it('renders edit button when editUrl is provided', () => {
        render(<ActionButtons editUrl="/test/edit" />);

        const editLink = screen.getByRole('link');
        expect(editLink).toHaveAttribute('href', '/test/edit');
    });

    it('renders delete button when onDelete is provided', () => {
        const onDelete = vi.fn();
        render(<ActionButtons onDelete={onDelete} />);

        const deleteButton = screen.getByRole('button');
        expect(deleteButton).toBeInTheDocument();
    });

    it('calls onDelete callback when delete button is clicked', () => {
        const onDelete = vi.fn();
        render(<ActionButtons onDelete={onDelete} />);

        fireEvent.click(screen.getByRole('button'));

        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('renders all buttons when all props are provided', () => {
        const onDelete = vi.fn();
        render(
            <ActionButtons
                viewUrl="/test/view"
                editUrl="/test/edit"
                onDelete={onDelete}
            />
        );

        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders custom actions', () => {
        render(
            <ActionButtons
                customActions={<button data-testid="custom">Custom</button>}
            />
        );

        expect(screen.getByTestId('custom')).toBeInTheDocument();
    });

    it('does not render any buttons when no props are provided', () => {
        const { container } = render(<ActionButtons />);

        expect(container.querySelectorAll('a, button')).toHaveLength(0);
    });
});
