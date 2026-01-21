"use client";

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
import { TENANT_TYPE_OPTIONS, LOCALE_LABELS } from "@gym-monorepo/shared";
import { useTranslations } from "next-intl";
import { LABEL_REGISTRY } from "@/lib/labelRegistry";
import { getApiErrorMessage } from "@/lib/api";
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
    const t = useTranslations("tenants");
    const tLabels = useTranslations();
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
            } catch (error: unknown) {
                const message = getApiErrorMessage(error);
                toast({
                    title: t("detail.toast.fetchError.title"),
                    description: message || t("detail.toast.fetchError.description"),
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
    }, [tenantId, isSuperAdmin, t, toast]);


    const restoreTenant = async () => {
        if (!tenant) return;

        try {
            const updated = await tenantsService.update(tenant.id, { status: 'ACTIVE' });
            setTenant(updated);
            toast({
                title: t("detail.toast.restoreSuccess.title"),
                description: t("detail.toast.restoreSuccess.description"),
            });
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: t("detail.toast.restoreError.title"),
                description: message || t("detail.toast.restoreError.description"),
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
                title: t("detail.toast.archiveSuccess.title"),
                description: t("detail.toast.archiveSuccess.description"),
            });
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: t("detail.toast.archiveError.title"),
                description: message || t("detail.toast.archiveError.description"),
                variant: "destructive",
            });
        } finally {
            setTenantToArchive(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{t("detail.alerts.noPermission")}</AlertDescription>
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
                <AlertDescription>{t("detail.alerts.notFound")}</AlertDescription>
            </Alert>
        );
    }

    const statusLabel = tenant.status === 'DISABLED' ? t("detail.status.archived") : t("detail.status.active");
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
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("detail.buttons.back")}
            </Button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {statusLabel}
                        </Badge>
                        <span className="text-muted-foreground text-sm">{t("detail.labels.createdOn")} {new Date(tenant.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href={`/settings/tenants/${tenantId}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> {t("detail.buttons.edit")}
                        </Link>
                    </Button>
                    {tenant.status === 'ACTIVE' ? (
                        <Button variant="destructive" onClick={() => setTenantToArchive(true)}>
                            <Archive className="mr-2 h-4 w-4" /> {t("detail.buttons.archive")}
                        </Button>
                    ) : (
                        <Button onClick={restoreTenant}>
                            <RotateCcw className="mr-2 h-4 w-4" /> {t("detail.buttons.restore")}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="border rounded-md p-4 space-y-4">
                        <h3 className="font-semibold text-lg">{t("detail.sections.details")}</h3>
                        <div className="grid grid-cols-[100px_1fr] gap-4 text-sm">
                            <span className="text-muted-foreground">{t("detail.labels.id")}</span>
                            <span className="font-mono">{tenant.id}</span>

                            <span className="text-muted-foreground">{t("detail.labels.slug")}</span>
                            <span className="font-mono">{tenant.slug}</span>

                            <span className="text-muted-foreground">{tLabels(LABEL_REGISTRY.tenants.language)}</span>
                            <span>{LOCALE_LABELS[tenant.language] ?? tenant.language}</span>

                            <span className="text-muted-foreground">{t("detail.labels.taxable")}</span>
                            <span>
                                {tenant.isTaxable ? (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">{t("detail.labels.yes")}</Badge>
                                ) : (
                                    <Badge variant="outline">{t("detail.labels.no")}</Badge>
                                )}
                            </span>

                            <span className="text-muted-foreground">{t("detail.labels.tax")}</span>
                            <span>
                                {tenant.isTaxable && selectedTax ? (
                                    formatTaxLabel(selectedTax)
                                ) : (
                                    <span className="text-muted-foreground">{t("detail.labels.none")}</span>
                                )}
                            </span>

                            <span className="text-muted-foreground">{t("detail.labels.tenantType")}</span>
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
                        <AlertDialogTitle>{t("detail.confirm.archive.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("detail.confirm.archive.description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("detail.confirm.archive.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t("detail.confirm.archive.confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
