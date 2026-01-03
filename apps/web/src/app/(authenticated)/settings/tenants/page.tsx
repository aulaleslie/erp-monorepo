"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { tenantsService, Tenant, TenantStatus } from "@/services/tenants";
import { Plus, Archive, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { DataTable, Column } from "@/components/common/DataTable";
import { usePagination } from "@/hooks/use-pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ActionButtons } from "@/components/common/ActionButtons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useSearchParams } from "next/navigation";

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const pagination = usePagination();

    const [tenantToArchive, setTenantToArchive] = useState<string | null>(null);
    const { toast } = useToast();
    const { isSuperAdmin } = usePermissions();
    const searchParams = useSearchParams();
    const isArchivedView = searchParams.get("status") === "archived";
    const statusFilter: TenantStatus = isArchivedView ? "DISABLED" : "ACTIVE";

    useEffect(() => {
        if (isSuperAdmin) {
            fetchTenants();
        } else {
            setLoading(false);
        }
    }, [isSuperAdmin, pagination.page, pagination.limit, statusFilter]);

    useEffect(() => {
        pagination.resetPagination();
    }, [statusFilter]);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const data: any = await tenantsService.getAll(
                pagination.page,
                pagination.limit,
                statusFilter
            );
            if (data.items) {
                setTenants(data.items);
                pagination.setTotal(data.total);
            } else {
                setTenants(data);
                pagination.setTotal(data.length);
            }
        } catch (error) {
            toast({
                title: "Error fetching tenants",
                description: "Failed to load tenants list.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmArchive = async () => {
        if (!tenantToArchive) return;

        try {
            await tenantsService.archive(tenantToArchive);
            toast({
                title: "Tenant archived",
                description: "The tenant has been archived.",
            });
            fetchTenants();
        } catch (error) {
            toast({
                title: "Error archiving tenant",
                description: "Failed to archive the tenant.",
                variant: "destructive",
            });
        } finally {
            setTenantToArchive(null);
        }
    };

    const restoreTenant = async (tenant: Tenant) => {
        try {
            await tenantsService.update(tenant.id, { status: "ACTIVE" });
            toast({
                title: "Tenant restored",
                description: "The tenant is now active.",
            });
            fetchTenants();
        } catch (error) {
            toast({
                title: "Error restoring tenant",
                description: "Failed to restore the tenant.",
                variant: "destructive",
            });
        }
    };

    const columns: Column<Tenant>[] = useMemo(() => [
        {
            header: "Name",
            accessorKey: "name",
            className: "font-medium",
        },
        {
            header: "Slug",
            accessorKey: "slug",
        },
        {
            header: "Status",
            cell: (tenant) => (
                <StatusBadge
                    status={tenant.status === "DISABLED" ? "Archived" : "Active"}
                    variantMap={{ Archived: "secondary" }}
                />
            ),
        },
        {
            header: "Actions",
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
                                    title="Archive tenant"
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
                                    title="Restore tenant"
                                >
                                    <RotateCcw className="h-4 w-4 text-green-600" />
                                </Button>
                            )}
                        </>
                    }
                />
            ),
        },
    ], [restoreTenant]);

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>You do not have permission to view tenants.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title={isArchivedView ? "Archived Tenants" : "Tenants Management"}
                    description={
                        isArchivedView
                            ? "Review archived tenants."
                            : "Manage all tenants."
                    }
                />
                <div className="flex items-center gap-2">
                    <Button variant="link" asChild>
                        <Link href={isArchivedView ? "/settings/tenants" : "/settings/tenants?status=archived"}>
                            {isArchivedView ? "Back to active" : "See archived"}
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/settings/tenants/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Tenant
                        </Link>
                    </Button>
                </div>
            </div>

            <DataTable
                data={tenants}
                columns={columns}
                loading={loading}
                pagination={pagination}
                emptyMessage={isArchivedView ? "No archived tenants found." : "No tenants found."}
            />

            <ConfirmDialog
                open={!!tenantToArchive}
                onOpenChange={(open) => !open && setTenantToArchive(null)}
                title="Archive Tenant?"
                description="This will archive the tenant. Users belonging to this tenant may lose access. You can restore it later."
                onConfirm={confirmArchive}
                confirmLabel="Archive"
                variant="destructive"
            />
        </div>
    );
}
