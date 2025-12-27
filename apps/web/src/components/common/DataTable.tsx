import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { PaginationControls } from '@/components/common/PaginationControls';
import { UsePaginationReturn } from '@/hooks/use-pagination';

export interface Column<T> {
    header: React.ReactNode;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    pagination?: UsePaginationReturn;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    rowKey?: (item: T) => string | number;
}

export function DataTable<T>({
    data,
    columns,
    loading = false,
    pagination,
    emptyMessage = 'No data found.',
    onRowClick,
    rowKey,
}: DataTableProps<T>) {
    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableHead key={index} className={column.className}>
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-center py-10"
                                >
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-center py-10 text-muted-foreground"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => (
                                <TableRow
                                    key={rowKey ? rowKey(item) : (item as any).id || index}
                                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                                >
                                    {columns.map((column, colIndex) => (
                                        <TableCell key={colIndex} className={column.className}>
                                            {column.cell
                                                ? column.cell(item)
                                                : column.accessorKey
                                                    ? (item[column.accessorKey] as React.ReactNode)
                                                    : null}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && (
                <PaginationControls
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.setPage}
                    loading={loading}
                />
            )}
        </div>
    );
}
