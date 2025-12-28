import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, Column } from './DataTable';

// Mock UI components
vi.mock('@/components/ui/table', () => ({
    Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
    TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
    TableCell: ({
        children,
        colSpan,
        className,
    }: {
        children: React.ReactNode;
        colSpan?: number;
        className?: string;
    }) => (
        <td colSpan={colSpan} className={className}>
            {children}
        </td>
    ),
    TableHead: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <th className={className}>{children}</th>
    ),
    TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
    TableRow: ({
        children,
        onClick,
        className,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        className?: string;
    }) => (
        <tr onClick={onClick} className={className}>
            {children}
        </tr>
    ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Loader2: ({ className }: { className?: string }) => (
        <div data-testid="loader" className={className}>
            Loading...
        </div>
    ),
}));

// Mock PaginationControls
vi.mock('@/components/common/PaginationControls', () => ({
    PaginationControls: ({
        currentPage,
        totalPages,
        onPageChange,
    }: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    }) => (
        <div data-testid="pagination-controls">
            Page {currentPage} of {totalPages}
            <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
        </div>
    ),
}));

interface TestItem {
    id: string;
    name: string;
    email: string;
}

const testData: TestItem[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

const testColumns: Column<TestItem>[] = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
];

describe('DataTable', () => {
    describe('loading state', () => {
        it('shows loading spinner when loading is true', () => {
            render(<DataTable data={[]} columns={testColumns} loading={true} />);

            expect(screen.getByTestId('loader')).toBeInTheDocument();
        });

        it('does not show data rows when loading', () => {
            render(<DataTable data={testData} columns={testColumns} loading={true} />);

            expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        });
    });

    describe('empty state', () => {
        it('shows default empty message when no data', () => {
            render(<DataTable data={[]} columns={testColumns} />);

            expect(screen.getByText('No data found.')).toBeInTheDocument();
        });

        it('shows custom empty message when provided', () => {
            render(<DataTable data={[]} columns={testColumns} emptyMessage="No users available" />);

            expect(screen.getByText('No users available')).toBeInTheDocument();
        });
    });

    describe('data rendering', () => {
        it('renders column headers', () => {
            render(<DataTable data={testData} columns={testColumns} />);

            expect(screen.getByText('Name')).toBeInTheDocument();
            expect(screen.getByText('Email')).toBeInTheDocument();
        });

        it('renders data using accessorKey', () => {
            render(<DataTable data={testData} columns={testColumns} />);

            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('john@example.com')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        });

        it('renders data using custom cell renderer', () => {
            const columnsWithCell: Column<TestItem>[] = [
                {
                    header: 'Name',
                    cell: (item) => <strong data-testid={`name-${item.id}`}>{item.name}</strong>,
                },
                { header: 'Email', accessorKey: 'email' },
            ];

            render(<DataTable data={testData} columns={columnsWithCell} />);

            expect(screen.getByTestId('name-1')).toHaveTextContent('John Doe');
            expect(screen.getByTestId('name-2')).toHaveTextContent('Jane Smith');
        });

        it('renders empty cell when no accessorKey or cell provided', () => {
            const emptyColumn: Column<TestItem>[] = [{ header: 'Empty' }];

            render(<DataTable data={testData} columns={emptyColumn} />);

            expect(screen.getByText('Empty')).toBeInTheDocument();
        });
    });

    describe('row clicks', () => {
        it('calls onRowClick when row is clicked', () => {
            const onRowClick = vi.fn();
            render(<DataTable data={testData} columns={testColumns} onRowClick={onRowClick} />);

            fireEvent.click(screen.getByText('John Doe').closest('tr')!);

            expect(onRowClick).toHaveBeenCalledWith(testData[0]);
        });

        it('does not apply click styles when no onRowClick provided', () => {
            render(<DataTable data={testData} columns={testColumns} />);

            const row = screen.getByText('John Doe').closest('tr');
            expect(row).not.toHaveClass('cursor-pointer');
        });
    });

    describe('row keys', () => {
        it('uses custom rowKey function when provided', () => {
            const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => { });

            render(
                <DataTable
                    data={testData}
                    columns={testColumns}
                    rowKey={(item) => `custom-${item.id}`}
                />
            );

            // If duplicate keys were generated, React would warn
            expect(consoleWarn).not.toHaveBeenCalled();
            consoleWarn.mockRestore();
        });
    });

    describe('pagination', () => {
        it('renders pagination controls when pagination prop provided', () => {
            const mockPagination = {
                page: 1,
                limit: 10,
                total: 50,
                totalPages: 5,
                setPage: vi.fn(),
                setLimit: vi.fn(),
                setTotal: vi.fn(),
                resetPagination: vi.fn(),
            };

            render(<DataTable data={testData} columns={testColumns} pagination={mockPagination} />);

            expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
        });

        it('does not render pagination controls when no pagination prop', () => {
            render(<DataTable data={testData} columns={testColumns} />);

            expect(screen.queryByTestId('pagination-controls')).not.toBeInTheDocument();
        });

        it('passes correct props to pagination controls', () => {
            const mockPagination = {
                page: 2,
                limit: 10,
                total: 50,
                totalPages: 5,
                setPage: vi.fn(),
                setLimit: vi.fn(),
                setTotal: vi.fn(),
                resetPagination: vi.fn(),
            };

            render(<DataTable data={testData} columns={testColumns} pagination={mockPagination} />);

            expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
        });

        it('calls setPage when pagination button clicked', () => {
            const mockPagination = {
                page: 2,
                limit: 10,
                total: 50,
                totalPages: 5,
                setPage: vi.fn(),
                setLimit: vi.fn(),
                setTotal: vi.fn(),
                resetPagination: vi.fn(),
            };

            render(<DataTable data={testData} columns={testColumns} pagination={mockPagination} />);

            fireEvent.click(screen.getByText('Next'));
            expect(mockPagination.setPage).toHaveBeenCalledWith(3);
        });
    });
});
