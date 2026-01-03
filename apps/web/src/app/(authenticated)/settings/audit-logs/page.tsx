'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { DataTable, Column } from '@/components/common/DataTable';
import { usePagination } from '@/hooks/use-pagination';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/use-permissions';
import { AuditLog, AuditLogFilters } from '@gym-monorepo/shared';
import { AuditLogDetailsDialog } from '@/components/audit-logs/audit-log-details-dialog';
import { Button } from '@/components/ui/button';
import { auditLogsService } from '@/services/audit-logs';
import { toUtcIso } from '@/lib/utils';

type LocalDateRange = {
    from: string;
    to: string;
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [draftFilters, setDraftFilters] = useState<LocalDateRange>({ from: '', to: '' });
    const [appliedFilters, setAppliedFilters] = useState<LocalDateRange>({ from: '', to: '' });
    const pagination = usePagination({ initialLimit: 20 });
    const { page, limit, setTotal, resetPagination } = pagination;
    const { isSuperAdmin } = usePermissions();

    const fetchLogs = useCallback(async () => {
        if (!isSuperAdmin) {
            setLogs([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const filterParams: AuditLogFilters = {};
        const fromIso = toUtcIso(appliedFilters.from);
        if (fromIso) {
            filterParams.from = fromIso;
        }
        const toIso = toUtcIso(appliedFilters.to);
        if (toIso) {
            filterParams.to = toIso;
        }

        try {
            const data = await auditLogsService.getAll(page, limit, filterParams);
            setLogs(data.items || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [appliedFilters, isSuperAdmin, limit, page, setTotal]);

    useEffect(() => {
        if (!isSuperAdmin) {
            setLoading(false);
            setLogs([]);
            return;
        }

        fetchLogs();
    }, [fetchLogs, isSuperAdmin]);

    const handleDraftChange =
        (field: keyof LocalDateRange) => (event: React.ChangeEvent<HTMLInputElement>) => {
            setDraftFilters((prev) => ({ ...prev, [field]: event.target.value }));
        };

    const applyFilters = () => {
        setAppliedFilters({ ...draftFilters });
        resetPagination();
    };

    const clearFilters = () => {
        setDraftFilters({ from: '', to: '' });
        setAppliedFilters({ from: '', to: '' });
        resetPagination();
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
            cell: (log) => (
                <span className="text-sm">
                    {log.performedByUser?.fullName || log.performedBy || 'System'}
                </span>
            ),
        },
        {
            header: "Details",
            cell: (log) => (
                <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs text-blue-500 hover:underline"
                    onClick={() => {
                        setSelectedLog(log);
                        setDialogOpen(true);
                    }}
                >
                    View Changes
                </Button>
            ),
        },
    ], []);

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>You do not have permission to view audit logs.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Audit Logs"
                description="View system-wide audit trails."
            />

            <Card className="border border-border bg-background">
                <CardContent className="space-y-4 p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                            <Label htmlFor="audit-filter-from">Start time</Label>
                            <Input
                                id="audit-filter-from"
                                type="datetime-local"
                                value={draftFilters.from}
                                onChange={handleDraftChange('from')}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="audit-filter-to">End time</Label>
                            <Input
                                id="audit-filter-to"
                                type="datetime-local"
                                value={draftFilters.to}
                                onChange={handleDraftChange('to')}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={clearFilters}
                                disabled={!draftFilters.from && !draftFilters.to}
                            >
                                Clear filters
                            </Button>
                            <Button onClick={applyFilters}>Apply filters</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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

            <AuditLogDetailsDialog
                log={selectedLog}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </div>
    );
}
