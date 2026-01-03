'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { DateTimeInput } from '@/components/ui/date-time-input';
import { Label } from '@/components/ui/label';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { format, subMinutes } from 'date-fns';
import { DataTable, Column } from '@/components/common/DataTable';
import { usePagination } from '@/hooks/use-pagination';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/use-permissions';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AuditLog, AuditLogFilters, AuditAction } from '@gym-monorepo/shared';
import { AuditLogDetailsDialog } from '@/components/audit-logs/audit-log-details-dialog';
import { Button } from '@/components/ui/button';
import { auditLogsService } from '@/services/audit-logs';
import { toUtcIso } from '@/lib/utils';

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
    { value: AuditAction.CREATE, label: 'Create' },
    { value: AuditAction.UPDATE, label: 'Update' },
    { value: AuditAction.DELETE, label: 'Delete' },
    { value: AuditAction.SOFT_REMOVE, label: 'Soft Remove' },
];

type FilterState = {
    from: string;
    to: string;
    entityName: string;
    performedBy: string;
    action?: AuditAction;
};

const DEFAULT_FILTER_STATE: FilterState = {
    from: '',
    to: '',
    entityName: '',
    performedBy: '',
};

const QUICK_RANGE_PRESETS = [
    { label: 'Last 15 minutes', minutes: 15 },
    { label: 'Last 1 hour', minutes: 60 },
];

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [draftFilters, setDraftFilters] = useState<FilterState>({ ...DEFAULT_FILTER_STATE });
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({ ...DEFAULT_FILTER_STATE });
    const [quickRange, setQuickRange] = useState('');
    const pagination = usePagination({ initialLimit: 20 });
    const { page, limit, setTotal, resetPagination } = pagination;
    const { isSuperAdmin } = usePermissions();

    const hasDraftFilters = useMemo(
        () =>
            Object.values(draftFilters).some((value) => {
                if (typeof value === 'string') {
                    return value !== '';
                }
                return value !== undefined;
            }),
        [draftFilters],
    );

    const entityOptions = useMemo(() => {
        const values = logs
            .map((log) => log.entityName)
            .filter((value): value is string => Boolean(value));
        return Array.from(new Set(values));
    }, [logs]);

    const performedByOptions = useMemo(() => {
        const values = logs.flatMap((log) => [
            log.performedByUser?.fullName,
            log.performedBy,
        ]);
        return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
    }, [logs]);

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

        const entityName = appliedFilters.entityName.trim();
        if (entityName) {
            filterParams.entityName = entityName;
        }

        const performedBy = appliedFilters.performedBy.trim();
        if (performedBy) {
            filterParams.performedBy = performedBy;
        }

        if (appliedFilters.action) {
            filterParams.action = appliedFilters.action;
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

    const handleActionChange = (value: string) => {
        setDraftFilters((prev) => ({
            ...prev,
            action: value === '' ? undefined : (value as AuditAction),
        }));
    };

    const handleEntityChange = (value: string) => {
        setDraftFilters((prev) => ({ ...prev, entityName: value }));
    };

    const handlePerformedByChange = (value: string) => {
        setDraftFilters((prev) => ({ ...prev, performedBy: value }));
    };

    const handleDateChange = (field: 'from' | 'to') => (event: React.ChangeEvent<HTMLInputElement>) => {
        setDraftFilters((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const formatLocalInputValue = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");

    const applyRelativeRange = (minutes: number) => {
        const now = new Date();
        setDraftFilters((prev) => ({
            ...prev,
            from: formatLocalInputValue(subMinutes(now, minutes)),
            to: formatLocalInputValue(now),
        }));
    };

    const handleQuickRangeChange = (value: string) => {
        setQuickRange(value);
        const preset = QUICK_RANGE_PRESETS.find((option) => option.label === value);
        if (preset) {
            applyRelativeRange(preset.minutes);
        }
    };

    const applyFilters = () => {
        setAppliedFilters({ ...draftFilters });
        resetPagination();
    };

    const clearFilters = () => {
        setDraftFilters({ ...DEFAULT_FILTER_STATE });
        setAppliedFilters({ ...DEFAULT_FILTER_STATE });
        setQuickRange('');
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
                <CardContent className="space-y-6 p-4">
                    <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                            Audit timestamps stay in UTC but are rendered in your browser’s timezone so the
                            filters you choose match your local clock.
                        </p>
                        <p>Apply multiple filters at once to narrow down a specific change window.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 items-end">
                        <div className="space-y-1">
                            <Label htmlFor="audit-filter-from">Start time (local)</Label>
                            <DateTimeInput
                                id="audit-filter-from"
                                value={draftFilters.from}
                                onChange={handleDateChange('from')}
                                placeholder="Select start time"
                                showIcon={false}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="audit-filter-to">End time (local)</Label>
                            <DateTimeInput
                                id="audit-filter-to"
                                value={draftFilters.to}
                                onChange={handleDateChange('to')}
                                placeholder="Select end time"
                                showIcon={false}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="audit-filter-action">Action</Label>
                            <Select value={draftFilters.action} onValueChange={handleActionChange}>
                                <SelectTrigger id="audit-filter-action">
                                    <SelectValue placeholder="Any action" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACTION_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="audit-filter-quick-range">Quick range</Label>
                            <Select
                                value={quickRange}
                                onValueChange={handleQuickRangeChange}
                            >
                                <SelectTrigger className="w-full" id="audit-filter-quick-range">
                                    <SelectValue placeholder="Pick a preset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {QUICK_RANGE_PRESETS.map((preset) => (
                                        <SelectItem key={preset.label} value={preset.label}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <SearchableDropdown
                            label="Entity name"
                            value={draftFilters.entityName}
                            options={entityOptions}
                            placeholder="Entity name"
                            onChange={handleEntityChange}
                        />
                        <SearchableDropdown
                            label="Performed by"
                            value={draftFilters.performedBy}
                            options={performedByOptions}
                            placeholder="User ID or name"
                            onChange={handlePerformedByChange}
                        />
                        <div className="md:col-span-2 flex items-end justify-end gap-2">
                            <Button variant="ghost" onClick={clearFilters} disabled={!hasDraftFilters}>
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
