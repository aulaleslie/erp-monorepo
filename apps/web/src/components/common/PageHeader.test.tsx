import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        back: vi.fn(),
        push: vi.fn(),
        replace: vi.fn(),
    }),
}));

describe('PageHeader', () => {
    it('renders title', () => {
        render(<PageHeader title="Users" />);

        expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
        render(
            <PageHeader
                title="Users"
                description="Manage your users here"
            />
        );

        expect(screen.getByText('Manage your users here')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
        render(<PageHeader title="Users" />);

        // Only the title should be present
        const textElements = screen.getAllByText(/./);
        expect(textElements).toHaveLength(1);
    });

    it('renders children (actions)', () => {
        render(
            <PageHeader title="Users">
                <button>Add User</button>
            </PageHeader>
        );

        expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
    });

    it('renders multiple action children', () => {
        render(
            <PageHeader title="Users">
                <button>Add User</button>
                <button>Export</button>
            </PageHeader>
        );

        expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    });
});
