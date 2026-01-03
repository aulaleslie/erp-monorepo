"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { tenantsService, Tenant } from "@/services/tenants";
import { Loader2, Pencil, Archive, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/use-permissions";
import { TENANT_TYPE_OPTIONS } from "@gym-monorepo/shared";
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
    const [tenantToArchive, setTenantToArchive] = useState<boolean>(false);

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


    const restoreTenant = async () => {
        if (!tenant) return;

        try {
            const updated = await tenantsService.update(tenant.id, { status: 'ACTIVE' });
            setTenant(updated);
            toast({
                title: "Tenant restored",
                description: "The tenant is now active.",
            });
        } catch (error) {
            toast({
                title: "Error restoring tenant",
                description: "Failed to restore the tenant.",
                variant: "destructive",
            });
        }
    };

    const confirmArchive = async () => {
        if (!tenant) return;

        try {
            await tenantsService.archive(tenant.id);
            setTenant({ ...tenant, status: 'DISABLED' });
            toast({
                title: "Tenant archived",
                description: "The tenant has been archived.",
            });
        } catch (error) {
            toast({
                title: "Error archiving tenant",
                description: "Failed to archive the tenant.",
                variant: "destructive",
            });
        } finally {
            setTenantToArchive(false);
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

    const statusLabel = tenant.status === 'DISABLED' ? 'Archived' : 'Active';
    const tenantTypeLabel =
        TENANT_TYPE_OPTIONS.find((option) => option.value === tenant.type)?.label ?? tenant.type;
    const tenantTaxes = tenant.taxes ?? [];
    const formatTaxLabel = (taxMapping: NonNullable<Tenant["taxes"]>[number]) => {
        if (taxMapping.tax) {
            return taxMapping.tax.code
                ? `${taxMapping.tax.name} (${taxMapping.tax.code})`
                : taxMapping.tax.name;
        }
        return taxMapping.taxId;
    };
    const selectedTax = tenantTaxes.find((tax) => tax.isDefault) ?? tenantTaxes[0];

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
                            {statusLabel}
                        </Badge>
                        <span className="text-muted-foreground text-sm">Created on {new Date(tenant.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href={`/settings/tenants/${tenantId}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </Button>
                    {tenant.status === 'ACTIVE' ? (
                        <Button variant="destructive" onClick={() => setTenantToArchive(true)}>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                        </Button>
                    ) : (
                        <Button onClick={restoreTenant}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Restore
                        </Button>
                    )}
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

                            <span className="text-muted-foreground">Taxable</span>
                            <span>
                                {tenant.isTaxable ? (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Yes</Badge>
                                ) : (
                                    <Badge variant="outline">No</Badge>
                                )}
                            </span>

                            <span className="text-muted-foreground">Tax</span>
                            <span>
                                {tenant.isTaxable && selectedTax ? (
                                    formatTaxLabel(selectedTax)
                                ) : (
                                    <span className="text-muted-foreground">None</span>
                                )}
                            </span>

                            <span className="text-muted-foreground">Tenant Type</span>
                            <span>
                                <Badge variant="secondary">{tenantTypeLabel}</Badge>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={tenantToArchive} onOpenChange={setTenantToArchive}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive Tenant?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will archive the tenant. Users belonging to this tenant may lose access.
                            You can restore it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Archive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
