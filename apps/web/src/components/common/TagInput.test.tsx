import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagInput } from './TagInput';
import { tagsService } from '@/services/tags';

// Mock transitions/translations
vi.mock('next-intl', () => ({
    useTranslations: () => (key: string, params?: { tag?: string }) => {
        if (key === 'addNew') return `Create "${params?.tag}"`;
        return key;
    },
}));

// Mock tags service
vi.mock('@/services/tags', () => ({
    tagsService: {
        suggest: vi.fn(),
    },
}));

// Mock UI components that might be complex or use portals
vi.mock('@/components/ui/scroll-area', () => ({
    ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('TagInput', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(tagsService.suggest).mockResolvedValue([]);
    });

    it('renders with placeholder when empty', () => {
        render(<TagInput value={[]} onChange={() => { }} />);
        expect(screen.getByPlaceholderText('placeholder')).toBeInTheDocument();
    });

    it('renders selected tags as badges', () => {
        render(<TagInput value={['tag1', 'tag2']} onChange={() => { }} />);
        expect(screen.getByText('tag1')).toBeInTheDocument();
        expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('calls onChange with new tag when Enter is pressed', async () => {
        const onChange = vi.fn();
        render(<TagInput value={[]} onChange={onChange} />);

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'new-tag' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(onChange).toHaveBeenCalledWith(['new-tag']);
    });

    it('calls onChange with removed tags when X is clicked', () => {
        const onChange = vi.fn();
        render(<TagInput value={['tag1', 'tag2']} onChange={onChange} />);

        const removeButtons = screen.getAllByRole('button');
        // Now buttons are just the X marks on badges
        fireEvent.click(removeButtons[0]); // Remove 'tag1'

        expect(onChange).toHaveBeenCalledWith(['tag2']);
    });

    it('fetches suggestions when search changes', async () => {
        vi.mocked(tagsService.suggest).mockResolvedValue([
            { id: '1', name: 'suggestion1', usageCount: 1, lastUsedAt: null, isActive: true },
        ]);

        render(<TagInput value={[]} onChange={() => { }} />);

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'sug' } });

        await waitFor(() => {
            expect(tagsService.suggest).toHaveBeenCalledWith('sug');
        });

        await waitFor(() => {
            expect(screen.getByText('suggestion1')).toBeInTheDocument();
        });
    });

    it('adds tag when clicking a suggestion', async () => {
        const onChange = vi.fn();
        vi.mocked(tagsService.suggest).mockResolvedValue([
            { id: '1', name: 'suggestion1', usageCount: 1, lastUsedAt: null, isActive: true },
        ]);

        render(<TagInput value={[]} onChange={onChange} />);

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'sug' } });

        await waitFor(() => {
            expect(screen.getByText('suggestion1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('suggestion1'));

        expect(onChange).toHaveBeenCalledWith(['suggestion1']);
    });

    it('prevents duplicate tags (case-insensitive)', async () => {
        const onChange = vi.fn();
        render(<TagInput value={['Existing']} onChange={onChange} />);

        const input = screen.getByRole('textbox');

        // Try adding "existing" (lowercase)
        fireEvent.change(input, { target: { value: 'existing' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(onChange).not.toHaveBeenCalled();
    });

    it('shows "Create" button when search does not match suggestions', async () => {
        render(<TagInput value={[]} onChange={() => { }} />);

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'unique-tag' } });

        await waitFor(() => {
            expect(screen.getByText('Create "unique-tag"')).toBeInTheDocument();
        });
    });

    it('removes last tag when Backspace is pressed on empty input', () => {
        const onChange = vi.fn();
        render(<TagInput value={['tag1', 'tag2']} onChange={onChange} />);

        const input = screen.getByRole('textbox');
        fireEvent.keyDown(input, { key: 'Backspace', code: 'Backspace' });

        expect(onChange).toHaveBeenCalledWith(['tag1']);
    });
});
