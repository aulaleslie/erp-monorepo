"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { ThemeSelector } from "@/components/common/ThemeSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { tenantsService, CreateTenantDto } from "@/services/tenants";
import { taxesService, Tax, TaxStatus } from "@/services/taxes";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { TENANT_TYPE_OPTIONS, TenantType } from "@gym-monorepo/shared";

export default function CreateTenantPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { isSuperAdmin } = usePermissions();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateTenantDto>({
        name: "",
        slug: "",
        type: TenantType.GYM,
        isTaxable: false,
        taxIds: [],
        themePresetId: "corporate-blue",
    });
    const [errors, setErrors] = useState<Record<string, string | string[]>>({});

    const fetchTaxes = async ({ search, page, limit }: { search: string; page: number; limit: number }) => {
        const response = await taxesService.getAll({
            search,
            page,
            limit,
            status: TaxStatus.ACTIVE,
        });

        return {
            items: response.items,
            total: response.total,
            hasMore: response.page < response.totalPages,
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const validationErrors: Record<string, string | string[]> = {};
        if (formData.isTaxable && (!formData.taxIds || formData.taxIds.length === 0)) {
            validationErrors.taxIds = "Tax selection is required for taxable tenants.";
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            await tenantsService.create(formData);
            toast({
                title: "Success",
                description: "Tenant created successfully.",
            });
            router.push("/settings/tenants");
        } catch (error: any) {
            const responseData = error.response?.data;
            const errorMessage = responseData?.message || "Failed to create tenant.";

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
            setLoading(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>You do not have permission to create tenants.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <PageHeader
                title="Create Tenant"
                description="Create a new tenant organization."
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
                            placeholder="e.g. Acme Corp"
                            className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500 mt-1">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL Identifier)</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => {
                                setFormData({ ...formData, slug: e.target.value });
                                if (errors.slug) setErrors({ ...errors, slug: "" });
                            }}
                            placeholder="e.g. acme-corp"
                            className={errors.slug ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.slug && (
                            <p className="text-sm text-red-500 mt-1">{Array.isArray(errors.slug) ? errors.slug[0] : errors.slug}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Unique identifier for the tenant, used in URLs.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Tenant Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => {
                                setFormData({ ...formData, type: value as TenantType });
                                if (errors.type) setErrors({ ...errors, type: "" });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a tenant type" />
                            </SelectTrigger>
                            <SelectContent>
                                {TENANT_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.type && (
                            <p className="text-sm text-red-500 mt-1">
                                {Array.isArray(errors.type) ? errors.type[0] : errors.type}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isTaxable"
                            checked={formData.isTaxable}
                            onCheckedChange={(checked) => {
                                const isTaxable = checked as boolean;
                                setFormData((prev) => ({
                                    ...prev,
                                    isTaxable,
                                    taxIds: isTaxable ? prev.taxIds : [],
                                }));
                                if (!isTaxable && errors.taxIds) {
                                    setErrors({ ...errors, taxIds: "" });
                                }
                            }}
                        />
                        <Label htmlFor="isTaxable">Taxable Tenant</Label>
                    </div>

                    {formData.isTaxable && (
                        <div className="space-y-2">
                            <Label>
                                Tax Selection <span className="text-destructive">*</span>
                            </Label>
                            <SearchableSelect<Tax>
                                value={formData.taxIds?.[0] || ""}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, taxIds: value ? [value] : [] });
                                    if (errors.taxIds) setErrors({ ...errors, taxIds: "" });
                                }}
                                placeholder="Select a tax"
                                searchPlaceholder="Search taxes..."
                                fetchItems={fetchTaxes}
                                getItemValue={(tax) => tax.id}
                                getItemLabel={(tax) => tax.code ? `${tax.name} (${tax.code})` : tax.name}
                                getItemDescription={(tax) => tax.type}
                                disabled={loading}
                            />
                            {errors.taxIds && (
                                <p className="text-sm text-red-500 mt-1">
                                    {Array.isArray(errors.taxIds) ? errors.taxIds[0] : errors.taxIds}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Select the default tax that will apply to this tenant.
                            </p>
                        </div>
                    )}

                    {/* Theme Selection */}
                    <div className="pt-4 border-t">
                        <ThemeSelector
                            value={formData.themePresetId || "corporate-blue"}
                            onChange={(presetId) => {
                                setFormData({ ...formData, themePresetId: presetId });
                            }}
                            disabled={loading}
                            label="Theme"
                            description="Select a color theme for this tenant. The preview applies immediately."
                        />
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
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Tenant
                    </Button>
                </div>
            </form>
        </div>
    );
}
