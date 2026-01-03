"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { tenantsService, CreateTenantDto } from "@/services/tenants";
import { Loader2, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";

export default function EditTenantPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const router = useRouter();
    const { toast } = useToast();
    const { isSuperAdmin } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<CreateTenantDto>({
        name: "",
        slug: "",
        isTaxable: false,
        isEatery: false,
    });
    const [errors, setErrors] = useState<Record<string, string | string[]>>({});

    useEffect(() => {
        const fetchTenant = async () => {
            if (!tenantId) return;
            try {
                const data = await tenantsService.getOne(tenantId);
                setFormData({
                    name: data.name,
                    slug: data.slug,
                    isTaxable: data.isTaxable,
                    isEatery: data.isEatery
                });
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load tenant.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        if (isSuperAdmin) {
            fetchTenant();
        } else {
            setLoading(false);
        }
    }, [tenantId, isSuperAdmin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            await tenantsService.update(tenantId, formData);
            toast({
                title: "Success",
                description: "Tenant updated successfully.",
            });
            router.push("/settings/tenants");
        } catch (error: any) {
            const responseData = error.response?.data;
            const errorMessage = responseData?.message || "Failed to update tenant.";

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

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>You do not have permission to edit tenants.</AlertDescription>
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

    return (
        <div className="space-y-6 max-w-2xl">
            <Button variant="ghost" className="pl-0" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
            </Button>

            <PageHeader
                title="Edit Tenant"
                description="Update tenant details."
            />

            <form onSubmit={handleSubmit} className="space-y-8 border p-6 rounded-md">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Tenant Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: "" });
                            }}
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
                            className={errors.slug ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.slug && (
                            <p className="text-sm text-red-500 mt-1">{Array.isArray(errors.slug) ? errors.slug[0] : errors.slug}</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isTaxable"
                            checked={formData.isTaxable}
                            onCheckedChange={(checked) => setFormData({ ...formData, isTaxable: checked as boolean })}
                        />
                        <Label htmlFor="isTaxable">Taxable Tenant</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isEatery"
                            checked={formData.isEatery}
                            onCheckedChange={(checked) => setFormData({ ...formData, isEatery: checked as boolean })}
                        />
                        <Label htmlFor="isEatery">Eatery Tenant</Label>
                    </div>
                </div>

                {errors.form && (
                    <Alert variant="destructive">
                        <AlertDescription>{errors.form}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
