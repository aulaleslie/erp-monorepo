'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { DataTable, Column } from '@/components/common/DataTable';
import { usePagination } from '@/hooks/use-pagination';
import { Badge } from '@/components/ui/badge';

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
    const pagination = usePagination({ initialLimit: 20 });

    useEffect(() => {
        fetchLogs();
    }, [pagination.page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/audit-logs', {
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                },
            });
            setLogs(response.data.items);
            pagination.setTotal(response.data.total);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<AuditLog>[] = useMemo(() => [
        {
            header: "Timestamp",
            cell: (log) => format(new Date(log.timestamp), 'PPpp'),
        },
        {
            header: "Action",
            cell: (log) => {
                let colorClass = 'bg-gray-100 text-gray-800';
                if (log.action === 'CREATE') colorClass = 'bg-green-100 text-green-800 border-green-200';
                else if (log.action === 'UPDATE') colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
                else if (log.action === 'DELETE') colorClass = 'bg-red-100 text-red-800 border-red-200';

                return (
                    <Badge variant="outline" className={`border ${colorClass}`}>
                        {log.action}
                    </Badge>
                );
            }
        },
        {
            header: "Entity",
            accessorKey: "entityName",
        },
        {
            header: "Entity ID",
            accessorKey: "entityId",
            className: "font-mono text-xs",
        },
        {
            header: "Performed By",
            cell: (log) => <span className="font-mono text-xs">{log.performedBy || 'System'}</span>,
        },
        {
            header: "Details",
            cell: (log) => (
                <details>
                    <summary className="cursor-pointer text-xs text-blue-500 hover:underline">View Changes</summary>
                    <div className="mt-2 text-xs font-mono bg-muted p-2 rounded max-w-md overflow-hidden text-clip whitespace-pre-wrap">
                        {JSON.stringify(log.newValues || log.previousValues, null, 2)}
                    </div>
                </details>
            ),
        },
    ], []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Audit Logs"
                description="View system-wide audit trails."
            />

            <Card className="border-none shadow-none">
                <CardContent className="p-0">
                    <DataTable
                        data={logs}
                        columns={columns}
                        loading={loading}
                        pagination={pagination}
                        emptyMessage="No audit logs found."
                    />
                </CardContent>
            </Card>
        </div>
    );
}
