"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { tenantsService, Tenant } from "@/services/tenants";
import { Plus, Ban, Power, Percent } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable, Column } from "@/components/common/DataTable";
import { usePagination } from "@/hooks/use-pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ActionButtons } from "@/components/common/ActionButtons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useRouter } from "next/navigation";

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const pagination = usePagination();

    const [tenantToDisable, setTenantToDisable] = useState<string | null>(null);
    const { toast } = useToast();
    const { isSuperAdmin } = usePermissions();
    const { refreshAuth } = useAuth();
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

    useEffect(() => {
        if (isSuperAdmin) {
            fetchTenants();
        } else {
            setLoading(false);
        }
    }, [isSuperAdmin, pagination.page]);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const data: any = await tenantsService.getAll(pagination.page, pagination.limit);
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

    const toggleStatus = async (tenant: Tenant) => {
        try {
            if (tenant.status === 'ACTIVE') {
                setTenantToDisable(tenant.id);
                return;
            }

            await tenantsService.update(tenant.id, { status: 'ACTIVE' });
            toast({
                title: "Tenant activated",
                description: "The tenant is now active.",
            });
            fetchTenants();
        } catch (error) {
            toast({
                title: "Error updating tenant",
                description: "Failed to update tenant status.",
                variant: "destructive",
            });
        }
    };

    const confirmDisable = async () => {
        if (!tenantToDisable) return;

        try {
            await tenantsService.disable(tenantToDisable);
            toast({
                title: "Tenant disabled",
                description: "The tenant has been disabled.",
            });
            fetchTenants();
        } catch (error) {
            toast({
                title: "Error disabling tenant",
                description: "Failed to disable the tenant.",
                variant: "destructive",
            });
        } finally {
            setTenantToDisable(null);
        }
    };

    const handleConfigureTaxes = async (tenant: Tenant) => {
        if (tenant.status !== "ACTIVE") {
            toast({
                title: "Tenant inactive",
                description: "Activate this tenant before configuring taxes.",
                variant: "destructive",
            });
            return;
        }

        try {
            const res = await fetch(`${API_URL}/me/tenants/active`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId: tenant.id }),
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Failed to set active tenant");
            }

            await refreshAuth();
            router.push("/settings/tenant");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to set active tenant.",
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
            cell: (tenant) => <StatusBadge status={tenant.status} />,
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
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfigureTaxes(tenant);
                                }}
                                title="Configure taxes"
                            >
                                <Percent className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStatus(tenant);
                                }}
                                title={tenant.status === 'ACTIVE' ? "Disable" : "Activate"}
                            >
                                {tenant.status === 'ACTIVE' ? (
                                    <Ban className="h-4 w-4 text-destructive" />
                                ) : (
                                    <Power className="h-4 w-4 text-green-600" />
                                )}
                            </Button>
                        </>
                    }
                />
            ),
        },
    ], []);

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
                    title="Tenants Management"
                    description="Manage all tenants."
                />
                <Button asChild>
                    <Link href="/settings/tenants/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Tenant
                    </Link>
                </Button>
            </div>

            <DataTable
                data={tenants}
                columns={columns}
                loading={loading}
                pagination={pagination}
                emptyMessage="No tenants found."
            />

            <ConfirmDialog
                open={!!tenantToDisable}
                onOpenChange={(open) => !open && setTenantToDisable(null)}
                title="Disable Tenant?"
                description="This will disable the tenant. Users belonging to this tenant may lose access. You can reactivate it later."
                onConfirm={confirmDisable}
                confirmLabel="Disable"
                variant="destructive"
            />
        </div>
    );
}
