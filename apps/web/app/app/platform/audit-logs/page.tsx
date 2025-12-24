'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { LoadingState } from '@/components/common/LoadingState';
import { PaginationControls } from '@/components/common/PaginationControls';

interface AuditLog {
    id: string;
    entityName: string;
    entityId: string;
    action: string;
    performedBy: string;
    timestamp: string;
    previousValues: any;
    newValues: any;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/audit-logs', {
                params: {
                    page,
                    limit,
                },
            });
            setLogs(response.data.items);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Audit Logs"
                description="View system-wide audit trails."
            />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Entity ID</TableHead>
                                <TableHead>Performed By</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <div className="h-24 flex items-center justify-center">
                                            <LoadingState />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No audit logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            {format(new Date(log.timestamp), 'PPpp')}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${log.action === 'CREATE'
                                                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                    : log.action === 'UPDATE'
                                                        ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                                                        : 'bg-red-50 text-red-700 ring-red-600/20'
                                                    }`}
                                            >
                                                {log.action}
                                            </span>
                                        </TableCell>
                                        <TableCell>{log.entityName}</TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {log.entityId}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {log.performedBy || 'System'}
                                        </TableCell>
                                        <TableCell>
                                            <details>
                                                <summary className="cursor-pointer text-xs text-blue-500">View Changes</summary>
                                                <div className="mt-2 text-xs font-mono bg-muted p-2 rounded max-w-md overflow-hidden text-clip whitespace-pre-wrap">
                                                    {JSON.stringify(log.newValues || log.previousValues, null, 2)}
                                                </div>
                                            </details>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                loading={loading}
            />
        </div>
    );
}
