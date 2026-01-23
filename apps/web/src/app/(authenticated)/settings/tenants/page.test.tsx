
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TenantsPage from './page';
import { tenantsService } from '@/services/tenants';

// Mock services
vi.mock('@/services/tenants', () => ({
    tenantsService: {
        getAll: vi.fn(),
        archive: vi.fn(),
        update: vi.fn(),
    },
}));

// Mock hooks
vi.mock('@/hooks/use-permissions', () => ({
    usePermissions: () => ({ isSuperAdmin: true }),
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: mockToast }),
}));

const mockT = (key: string) => key;
vi.mock('next-intl', () => ({
    useTranslations: () => mockT,
}));

vi.mock('next/navigation', () => ({
    useSearchParams: () => ({ get: () => null }),
    usePathname: () => '/settings/tenants',
}));

// Components that might need mocking to avoid rendering issues
vi.mock('@/components/common/PageHeader', () => ({
    PageHeader: () => <div data-testid="page-header" />,
}));
vi.mock('@/components/common/DataTable', () => ({
    DataTable: () => <div data-testid="data-table" />,
}));
vi.mock('@/components/common/StatusBadge', () => ({
    StatusBadge: () => <div />,
}));
vi.mock('@/components/common/ActionButtons', () => ({
    ActionButtons: () => <div />,
}));
vi.mock('@/components/common/ConfirmDialog', () => ({
    ConfirmDialog: () => <div />,
}));

describe('TenantsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch tenants only once on mount', async () => {
        vi.mocked(tenantsService.getAll).mockResolvedValue({
            items: [],
            total: 10,
            page: 1,
            limit: 10,
            totalPages: 1,
        });

        render(<TenantsPage />);

        // Wait for first call
        await waitFor(() => {
            expect(tenantsService.getAll).toHaveBeenCalled();
        });

        // wait a bit to see if it loops
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Should still be called only once
        expect(tenantsService.getAll).toHaveBeenCalledTimes(1);
    });
});
