
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

        // Wait for first call and loading to finish
        await waitFor(() => {
            expect(tenantsService.getAll).toHaveBeenCalled();
        });

        // Wait for potential extra calls (should not happen)
        // Instead of hard-coded setTimeout, we wait for the call count to definitely stay 1
        // by waiting for some other indicator that the render cycle is complete.
        // Actually, just waiting for the table to appear (if not mocked) would be better.
        // But since mocked, we check the call count.
        await waitFor(() => {
            expect(tenantsService.getAll).toHaveBeenCalledTimes(1);
        }, { timeout: 500 });
    });
});
