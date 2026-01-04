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
import { useTranslations } from 'next-intl';

const ACTION_OPTIONS_BASE: { value: AuditAction; labelKey: string }[] = [
    { value: AuditAction.CREATE, labelKey: 'actions.create' },
    { value: AuditAction.UPDATE, labelKey: 'actions.update' },
    { value: AuditAction.DELETE, labelKey: 'actions.delete' },
    { value: AuditAction.SOFT_REMOVE, labelKey: 'actions.softRemove' },
];

const QUICK_RANGE_PRESETS = [
    { id: 'last15', minutes: 15, labelKey: 'quickRange.presets.last15' },
    { id: 'last60', minutes: 60, labelKey: 'quickRange.presets.last60' },
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
    const t = useTranslations('auditLogs');

    const actionOptions = useMemo(
        () =>
            ACTION_OPTIONS_BASE.map((option) => ({
                value: option.value,
                label: t(option.labelKey),
            })),
        [t],
    );

    const actionLabelByValue = useMemo(() => {
        return actionOptions.reduce<Record<AuditAction, string>>((carry, option) => {
            carry[option.value] = option.label;
            return carry;
        }, {} as Record<AuditAction, string>);
    }, [actionOptions]);

    const quickRangeOptions = useMemo(
        () =>
            QUICK_RANGE_PRESETS.map((preset) => ({
                ...preset,
                label: t(preset.labelKey),
            })),
        [t],
    );

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
        const preset = QUICK_RANGE_PRESETS.find((option) => option.id === value);
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

    const columns: Column<AuditLog>[] = useMemo(
        () => [
            {
                header: t('table.timestamp'),
                cell: (log) => format(new Date(log.timestamp), 'PPpp'),
            },
            {
                header: t('table.action'),
                cell: (log) => {
                    let colorClass = 'bg-gray-100 text-gray-800';
                    if (log.action === 'CREATE')
                        colorClass = 'bg-green-100 text-green-800 border-green-200';
                    else if (log.action === 'UPDATE')
                        colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
                    else if (log.action === 'DELETE')
                        colorClass = 'bg-red-100 text-red-800 border-red-200';

                    const label = actionLabelByValue[log.action] ?? log.action;

                    return (
                        <Badge variant="outline" className={`border ${colorClass}`}>
                            {label}
                        </Badge>
                    );
                },
            },
            {
                header: t('table.entity'),
                accessorKey: 'entityName',
            },
            {
                header: t('table.entityId'),
                accessorKey: 'entityId',
                className: 'font-mono text-xs',
            },
            {
                header: t('table.performedBy'),
                cell: (log) => (
                    <span className="text-sm">
                        {log.performedByUser?.fullName || log.performedBy || t('systemLabel')}
                    </span>
                ),
            },
            {
                header: t('table.details'),
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
                        {t('buttons.viewChanges')}
                    </Button>
                ),
            },
        ],
        [actionLabelByValue, t],
    );

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{t('alert.noPermission')}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title={t('pageTitle')} description={t('pageDescription')} />

                <Card className="border border-border bg-background">
                    <CardContent className="space-y-6 p-4">
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{t('info.timestamps')}</p>
                            <p>{t('info.filters')}</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4 items-end">
                            <div className="space-y-1">
                                <Label htmlFor="audit-filter-from">{t('filters.startTime')}</Label>
                                <DateTimeInput
                                    id="audit-filter-from"
                                    value={draftFilters.from}
                                    onChange={handleDateChange('from')}
                                    placeholder={t('filters.startTimePlaceholder')}
                                    showIcon={false}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="audit-filter-to">{t('filters.endTime')}</Label>
                                <DateTimeInput
                                    id="audit-filter-to"
                                    value={draftFilters.to}
                                    onChange={handleDateChange('to')}
                                    placeholder={t('filters.endTimePlaceholder')}
                                    showIcon={false}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="audit-filter-action">{t('filters.action')}</Label>
                                <Select
                                    value={draftFilters.action ?? ''}
                                    onValueChange={handleActionChange}
                                >
                                    <SelectTrigger id="audit-filter-action">
                                        <SelectValue placeholder={t('filters.actionPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {actionOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="audit-filter-quick-range">{t('filters.quickRangeLabel')}</Label>
                                <Select value={quickRange} onValueChange={handleQuickRangeChange}>
                                    <SelectTrigger className="w-full" id="audit-filter-quick-range">
                                        <SelectValue placeholder={t('filters.quickRangePlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {quickRangeOptions.map((preset) => (
                                            <SelectItem key={preset.id} value={preset.id}>
                                                {preset.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                            <SearchableDropdown
                                label={t('filters.entityName')}
                                value={draftFilters.entityName}
                                options={entityOptions}
                                placeholder={t('filters.entityPlaceholder')}
                                onChange={handleEntityChange}
                            />
                            <SearchableDropdown
                                label={t('filters.performedBy')}
                                value={draftFilters.performedBy}
                                options={performedByOptions}
                                placeholder={t('filters.performedByPlaceholder')}
                                onChange={handlePerformedByChange}
                            />
                            <div className="md:col-span-2 flex items-end justify-end gap-2">
                                <Button variant="ghost" onClick={clearFilters} disabled={!hasDraftFilters}>
                                    {t('buttons.clearFilters')}
                                </Button>
                                <Button onClick={applyFilters}>{t('buttons.applyFilters')}</Button>
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
                          emptyMessage={t('table.emptyState')}
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
