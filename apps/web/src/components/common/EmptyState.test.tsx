import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';
import { Search } from 'lucide-react';

describe('EmptyState', () => {
    it('renders title and description', () => {
        render(
            <EmptyState
                title="No results found"
                description="Try adjusting your search"
            />
        );

        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
        render(
            <EmptyState
                icon={Search}
                title="No results"
                description="Try again"
            />
        );

        // Icon should be in the document (SVG element)
        expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('renders action when provided', () => {
        render(
            <EmptyState
                title="No items"
                description="Add your first item"
                action={<button>Add Item</button>}
            />
        );

        expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(
            <EmptyState
                title="Empty"
                description="Nothing here"
                className="custom-class"
            />
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });
});
