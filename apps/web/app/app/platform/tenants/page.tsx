"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControls } from "@/components/common/PaginationControls";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { tenantsService, Tenant } from "@/services/tenants";
import { Check, Loader2, Plus, Eye, Pencil, Ban, Power } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { Badge } from "@/components/ui/badge";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const [tenantToDisable, setTenantToDisable] = useState<string | null>(null);
    const { toast } = useToast();
    const { isSuperAdmin } = usePermissions();

    useEffect(() => {
        if (isSuperAdmin) {
            fetchTenants();
        } else {
            setLoading(false);
        }
    }, [isSuperAdmin, page]);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            // Updated service call to accept pagination params
            // Assuming tenantsService.getAll is updated to accept params or we update usage here
            // Wait, I need to update tenantsService in frontend first!
            // Let's assume the service method signature is `getAll(page?: number, limit?: number)`
            const data: any = await tenantsService.getAll(page, limit);
            if (data.items) {
                setTenants(data.items);
                setTotal(data.total);
            } else {
                // Fallback if API hasn't fully propagated or service not updated yet
                setTenants(data);
                setTotal(data.length);
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
        // If Active -> Disable (Soft Delete behavior or explicit disable)
        // If Disabled -> Activate

        try {
            if (tenant.status === 'ACTIVE') {
                // Confirm disable
                setTenantToDisable(tenant.id);
                return;
            }

            // Activate
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
                    description="Manage platform tenants."
                />
                <Button asChild>
                    <Link href="/app/platform/tenants/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Tenant
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[150px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : tenants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    No tenants found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell className="font-medium">{tenant.name}</TableCell>
                                    <TableCell>{tenant.slug}</TableCell>
                                    <TableCell>
                                        <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {tenant.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/app/platform/tenants/${tenant.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/app/platform/tenants/${tenant.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleStatus(tenant)}
                                                title={tenant.status === 'ACTIVE' ? "Disable" : "Activate"}
                                            >
                                                {tenant.status === 'ACTIVE' ? (
                                                    <Ban className="h-4 w-4 text-destructive" />
                                                ) : (
                                                    <Power className="h-4 w-4 text-green-600" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaginationControls
                currentPage={page}
                totalPages={Math.ceil(total / limit)}
                onPageChange={setPage}
                loading={loading}
            />

            <AlertDialog open={!!tenantToDisable} onOpenChange={(open) => !open && setTenantToDisable(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disable Tenant?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will disable the tenant. Users belonging to this tenant may lose access.
                            You can reactivate it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDisable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Disable
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
