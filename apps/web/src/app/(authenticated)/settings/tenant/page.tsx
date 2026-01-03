"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TenantTaxForm } from "@/components/features/settings/tenant-tax-form";
import { Badge } from "@/components/ui/badge";
import { TENANT_TYPE_OPTIONS } from "@gym-monorepo/shared";
import {
    getTenantProfileSettings,
    updateTenantProfileSettings,
    TenantProfileSettings,
} from "@/lib/api/tenant-settings";

export default function TenantSettingsPage() {
    const { isSuperAdmin, can, canAny } = usePermissions();
    const { refreshPermissions } = useAuth();
    const { toast } = useToast();

    const canView = isSuperAdmin || canAny(["settings.tenant.read", "settings.tenant.update"]);
    const canEdit = isSuperAdmin || can("settings.tenant.update");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tenant, setTenant] = useState<TenantProfileSettings | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
    });
    const [errors, setErrors] = useState<Record<string, string | string[]>>({});

    useEffect(() => {
        const fetchTenant = async () => {
            if (!canView) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await getTenantProfileSettings();
                const data = response.data;
                setTenant(data);
                setFormData({
                    name: data.name,
                    slug: data.slug,
                });
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load tenant settings.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, [canView, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;

        setSaving(true);
        setErrors({});

        try {
            const response = await updateTenantProfileSettings({
                name: formData.name,
                slug: formData.slug,
            });
            setTenant(response.data);
            setFormData({
                name: response.data.name,
                slug: response.data.slug,
            });
            toast({
                title: "Success",
                description: "Tenant settings updated.",
            });
            await refreshPermissions();
        } catch (error: any) {
            const responseData = error.response?.data;
            const errorMessage = responseData?.message || "Failed to update tenant settings.";

            if (responseData?.errors) {
                setErrors(responseData.errors);
            } else {
                setErrors({ form: errorMessage });
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (!canView) {
        return (
            <Alert variant="destructive">
                <AlertDescription>You do not have permission to view tenant settings.</AlertDescription>
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

    const statusLabel = tenant.status === "DISABLED" ? "Archived" : "Active";
    const tenantTypeLabel =
        TENANT_TYPE_OPTIONS.find((option) => option.value === tenant.type)?.label ?? tenant.type;

    return (
        <div className="space-y-6 max-w-2xl">
            <PageHeader
                title="Tenant Settings"
                description="View and update the active tenant profile and tax settings."
            />

            <form onSubmit={handleSubmit} className="space-y-8 border p-6 rounded-md">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <StatusBadge status={statusLabel} variantMap={{ Archived: "secondary" }} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Tenant Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: "" });
                            }}
                            disabled={!canEdit}
                            className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500 mt-1">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => {
                                setFormData({ ...formData, slug: e.target.value });
                                if (errors.slug) setErrors({ ...errors, slug: "" });
                            }}
                            disabled={!canEdit}
                            className={errors.slug ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.slug && (
                            <p className="text-sm text-red-500 mt-1">{Array.isArray(errors.slug) ? errors.slug[0] : errors.slug}</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="isTaxable" checked={tenant.isTaxable} disabled />
                        <Label htmlFor="isTaxable" className="text-muted-foreground">
                            Taxable Tenant
                        </Label>
                    </div>

                    <div className="flex items-center gap-3">
                        <Label className="text-muted-foreground">Tenant Type</Label>
                        <Badge variant="secondary">{tenantTypeLabel}</Badge>
                    </div>
                </div>

                {errors.form && (
                    <Alert variant="destructive">
                        <AlertDescription>{errors.form}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end">
                    <Button type="submit" disabled={!canEdit || saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>

            <Separator />

            <TenantTaxForm />
        </div>
    );
}
