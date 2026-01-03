"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { SearchableSelect } from "@/components/common/SearchableSelect";
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
import { tenantsService, CreateTenantDto, Tenant } from "@/services/tenants";
import { taxesService, Tax, TaxStatus } from "@/services/taxes";
import { Loader2, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { TENANT_TYPE_OPTIONS, TenantType } from "@gym-monorepo/shared";

export default function EditTenantPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const router = useRouter();
    const { toast } = useToast();
    const { isSuperAdmin } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initialTaxLabel, setInitialTaxLabel] = useState("");

    const [formData, setFormData] = useState<CreateTenantDto>({
        name: "",
        slug: "",
        type: TenantType.GYM,
        isTaxable: false,
        taxIds: [],
    });
    const [errors, setErrors] = useState<Record<string, string | string[]>>({});

    const formatTaxLabel = (tax: NonNullable<Tenant["taxes"]>[number]) => {
        if (tax?.tax) {
            return tax.tax.code ? `${tax.tax.name} (${tax.tax.code})` : tax.tax.name;
        }
        return tax?.taxId || "";
    };

    useEffect(() => {
        const fetchTenant = async () => {
            if (!tenantId) return;
            try {
                const data = await tenantsService.getOne(tenantId);
                const defaultTax = data.isTaxable
                    ? data.taxes?.find((tax) => tax.isDefault) || data.taxes?.[0]
                    : undefined;
                const defaultTaxId = defaultTax?.taxId || "";
                setFormData({
                    name: data.name,
                    slug: data.slug,
                    type: data.type,
                    isTaxable: data.isTaxable,
                    taxIds: defaultTaxId ? [defaultTaxId] : [],
                });
                setInitialTaxLabel(defaultTax ? formatTaxLabel(defaultTax) : "");
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

        setSaving(true);
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
                                initialLabel={initialTaxLabel || undefined}
                                fetchItems={fetchTaxes}
                                getItemValue={(tax) => tax.id}
                                getItemLabel={(tax) => tax.code ? `${tax.name} (${tax.code})` : tax.name}
                                getItemDescription={(tax) => tax.type}
                                disabled={saving}
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
