import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
    it('renders loading spinner', () => {
        render(<LoadingState />);

        // Check for the spinning loader SVG
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass('animate-spin');
    });

    it('renders with correct container classes', () => {
        const { container } = render(<LoadingState />);

        expect(container.firstChild).toHaveClass('flex', 'items-center', 'justify-center');
    });
});
