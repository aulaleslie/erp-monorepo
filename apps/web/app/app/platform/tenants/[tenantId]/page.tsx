"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { tenantsService, Tenant } from "@/services/tenants";
import { Check, Loader2, Pencil, Ban, Power, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/use-permissions";
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

export default function TenantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { isSuperAdmin } = usePermissions();
    const tenantId = params.tenantId as string;

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [tenantToDisable, setTenantToDisable] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;

            try {
                const tenantData = await tenantsService.getOne(tenantId);
                setTenant(tenantData);
            } catch (error) {
                toast({
                    title: "Error fetching details",
                    description: "Failed to load tenant details.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        if (isSuperAdmin) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [tenantId, isSuperAdmin]);


    const toggleStatus = async () => {
        if (!tenant) return;

        try {
            if (tenant.status === 'ACTIVE') {
                setTenantToDisable(true);
                return;
            }

            // Activate
            const updated = await tenantsService.update(tenant.id, { status: 'ACTIVE' });
            setTenant(updated);
            toast({
                title: "Tenant activated",
                description: "The tenant is now active.",
            });

        } catch (error) {
            toast({
                title: "Error updating tenant",
                description: "Failed to update tenant status.",
                variant: "destructive",
            });
        }
    };

    const confirmDisable = async () => {
        if (!tenant) return;

        try {
            await tenantsService.disable(tenant.id);
            setTenant({ ...tenant, status: 'DISABLED' });
            toast({
                title: "Tenant disabled",
                description: "The tenant has been disabled.",
            });
        } catch (error) {
            toast({
                title: "Error disabling tenant",
                description: "Failed to disable the tenant.",
                variant: "destructive",
            });
        } finally {
            setTenantToDisable(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>You do not have permission to view this tenant.</AlertDescription>
            </Alert>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!tenant) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Tenant not found.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-8">
            <Button variant="ghost" className="pl-0" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
            </Button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {tenant.status}
                        </Badge>
                        <span className="text-muted-foreground text-sm">Created on {new Date(tenant.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href={`/app/platform/tenants/${tenantId}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </Button>
                    <Button
                        variant={tenant.status === 'ACTIVE' ? "destructive" : "default"}
                        onClick={toggleStatus}
                    >
                        {tenant.status === 'ACTIVE' ? (
                            <>
                                <Ban className="mr-2 h-4 w-4" /> Disable
                            </>
                        ) : (
                            <>
                                <Power className="mr-2 h-4 w-4" /> Activate
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="border rounded-md p-4 space-y-4">
                        <h3 className="font-semibold text-lg">Details</h3>
                        <div className="grid grid-cols-[100px_1fr] gap-4 text-sm">
                            <span className="text-muted-foreground">ID</span>
                            <span className="font-mono">{tenant.id}</span>

                            <span className="text-muted-foreground">Slug</span>
                            <span className="font-mono">{tenant.slug}</span>

                            <span className="text-muted-foreground">Created At</span>
                            <span>{new Date(tenant.createdAt).toLocaleString()}</span>

                            <span className="text-muted-foreground">Updated At</span>
                            <span>{new Date(tenant.updatedAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={tenantToDisable} onOpenChange={setTenantToDisable}>
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
