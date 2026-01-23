"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { tenantsService, Tenant, TenantStatus } from "@/services/tenants";
import { Plus, Archive, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { DataTable, Column } from "@/components/common/DataTable";
import { usePagination } from "@/hooks/use-pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ActionButtons } from "@/components/common/ActionButtons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useSearchParams } from "next/navigation";
import { LOCALE_LABELS } from "@gym-monorepo/shared";
import { useTranslations } from "next-intl";
import { LABEL_REGISTRY } from "@/lib/labelRegistry";
import { getApiErrorMessage } from "@/lib/api";

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const pagination = usePagination();

    const { page, limit, setTotal, resetPagination } = pagination;

    const [tenantToArchive, setTenantToArchive] = useState<string | null>(null);
    const { toast } = useToast();
    const { isSuperAdmin } = usePermissions();
    const t = useTranslations("tenants");
    const tLabels = useTranslations();
    const searchParams = useSearchParams();
    const isArchivedView = searchParams.get("status") === "archived";
    const statusFilter: TenantStatus = isArchivedView ? "DISABLED" : "ACTIVE";

    const fetchTenants = useCallback(async () => {
        setLoading(true);
        try {
            const data = await tenantsService.getAll(
                page,
                limit,
                statusFilter
            );
            setTenants(data.items);
            setTotal(data.total);
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: t("toast.fetchError.title"),
                description: message || t("toast.fetchError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [page, limit, setTotal, statusFilter, t, toast]);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchTenants();
        } else {
            setLoading(false);
        }
    }, [fetchTenants, isSuperAdmin]);

    useEffect(() => {
        resetPagination();
    }, [resetPagination, statusFilter]);

    const confirmArchive = useCallback(async () => {
        if (!tenantToArchive) return;

        try {
            await tenantsService.archive(tenantToArchive);
            toast({
                title: t("toast.archiveSuccess.title"),
                description: t("toast.archiveSuccess.description"),
            });
            fetchTenants();
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: t("toast.archiveError.title"),
                description: message || t("toast.archiveError.description"),
                variant: "destructive",
            });
        } finally {
            setTenantToArchive(null);
        }
    }, [fetchTenants, t, tenantToArchive, toast]);

    const restoreTenant = useCallback(async (tenant: Tenant) => {
        try {
            await tenantsService.update(tenant.id, { status: "ACTIVE" });
            toast({
                title: t("toast.restoreSuccess.title"),
                description: t("toast.restoreSuccess.description"),
            });
            fetchTenants();
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: t("toast.restoreError.title"),
                description: message || t("toast.restoreError.description"),
                variant: "destructive",
            });
        }
    }, [fetchTenants, t, toast]);

    const columns: Column<Tenant>[] = useMemo(
        () => [
            {
                header: tLabels(LABEL_REGISTRY.tenants.name),
                accessorKey: "name",
                className: "font-medium",
            },
            {
                header: tLabels(LABEL_REGISTRY.tenants.slug),
                accessorKey: "slug",
            },
            {
                header: tLabels(LABEL_REGISTRY.tenants.status),
                cell: (tenant) => (
                    <StatusBadge
                        status={tenant.status === "DISABLED" ? "Archived" : "Active"}
                        variantMap={{ Archived: "secondary" }}
                    />
                ),
            },
            {
                header: tLabels(LABEL_REGISTRY.tenants.language),
                accessorKey: "language",
                cell: (tenant) => LOCALE_LABELS[tenant.language] ?? tenant.language,
            },
            {
                header: tLabels(LABEL_REGISTRY.tenants.actions),
                className: "w-[150px]",
                cell: (tenant) => (
                    <ActionButtons
                        viewUrl={`/settings/tenants/${tenant.id}`}
                        editUrl={`/settings/tenants/${tenant.id}/edit`}
                        customActions={
                            <>
                                {tenant.status === "ACTIVE" ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTenantToArchive(tenant.id);
                                        }}
                                        title={t("actions.archive.title")}
                                    >
                                        <Archive className="h-4 w-4 text-destructive" />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            restoreTenant(tenant);
                                        }}
                                        title={t("actions.restore.title")}
                                    >
                                        <RotateCcw className="h-4 w-4 text-green-600" />
                                    </Button>
                                )}
                            </>
                        }
                    />
                ),
            },
        ],
        [restoreTenant, t, tLabels]
    );

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{t("alerts.noPermission")}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title={isArchivedView ? t("page.archivedTitle") : t("page.title")}
                    description={
                        isArchivedView
                            ? t("page.archivedDescription")
                            : t("page.description")
                    }
                />
                <div className="flex items-center gap-2">
                    <Button variant="link" asChild>
                        <Link href={isArchivedView ? "/settings/tenants" : "/settings/tenants?status=archived"}>
                            {isArchivedView ? t("buttons.backToActive") : t("buttons.seeArchived")}
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/settings/tenants/create">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("buttons.create")}
                        </Link>
                    </Button>
                </div>
            </div>

            <DataTable
                data={tenants}
                columns={columns}
                loading={loading}
                pagination={pagination}
                emptyMessage={isArchivedView ? t("empty.archived") : t("empty.active")}
            />

            <ConfirmDialog
                open={!!tenantToArchive}
                onOpenChange={(open) => !open && setTenantToArchive(null)}
                title={t("confirm.archive.title")}
                description={t("confirm.archive.description")}
                onConfirm={confirmArchive}
                confirmLabel={t("confirm.archive.confirmLabel")}
                variant="destructive"
            />
        </div>
    );
}
