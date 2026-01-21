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
import { tenantsService, CreateTenantDto, Tenant } from "@/services/tenants";
import { taxesService, Tax, TaxStatus } from "@/services/taxes";
import { Loader2, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { TENANT_TYPE_OPTIONS, TenantType, Locale } from "@gym-monorepo/shared";
import { useTranslations } from "next-intl";
import { LABEL_REGISTRY, LANGUAGE_SELECT_OPTIONS } from "@/lib/labelRegistry";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";

export default function EditTenantPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const router = useRouter();
    const { toast } = useToast();
    const { isSuperAdmin } = usePermissions();
    const t = useTranslations("tenants");
    const tLabels = useTranslations();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initialTaxLabel, setInitialTaxLabel] = useState("");

    const [formData, setFormData] = useState<CreateTenantDto>({
        name: "",
        slug: "",
        type: TenantType.GYM,
        isTaxable: false,
        taxIds: [],
        themePresetId: "corporate-blue",
        language: Locale.EN,
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
                const currentThemePresetId = data.theme?.[0]?.presetId || "corporate-blue";
                setFormData({
                    name: data.name,
                    slug: data.slug,
                    type: data.type,
                    isTaxable: data.isTaxable,
                    taxIds: defaultTaxId ? [defaultTaxId] : [],
                    themePresetId: currentThemePresetId,
                    language: data.language ?? Locale.EN,
                });
                setInitialTaxLabel(defaultTax ? formatTaxLabel(defaultTax) : "");
            } catch (error: unknown) {
                const message = getApiErrorMessage(error);
                toast({
                    title: t("edit.toast.fetchError.title"),
                    description: message || t("edit.toast.fetchError.description"),
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
    }, [tenantId, isSuperAdmin, t, toast]);

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
            validationErrors.taxIds = t("create.form.validation.taxRequired");
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);
        try {
            await tenantsService.update(tenantId, formData);
            toast({
                title: t("edit.toast.success.title"),
                description: t("edit.toast.success.description"),
            });
            router.push("/settings/tenants");
        } catch (error: unknown) {
            const responseErrors = getApiFieldErrors(error);
            const errorMessage = getApiErrorMessage(error) || "Failed to update tenant.";

            if (responseErrors) {
                setErrors(responseErrors);
            } else {
                setErrors({ form: errorMessage });
            }

            toast({
                title: t("edit.toast.error.title"),
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
                <AlertDescription>{t("edit.alerts.noPermission")}</AlertDescription>
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
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("detail.buttons.back")}
            </Button>

            <PageHeader
                title={t("edit.page.title")}
                description={t("edit.page.description")}
            />

            <form onSubmit={handleSubmit} className="space-y-8 border p-6 rounded-md">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("create.form.labels.name")}</Label>
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
                        <Label htmlFor="slug">{t("create.form.labels.slug")}</Label>
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
                        <Label>{t("create.form.labels.type")}</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => {
                                setFormData({ ...formData, type: value as TenantType });
                                if (errors.type) setErrors({ ...errors, type: "" });
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t("create.form.placeholders.type")} />
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

                    <div className="space-y-2">
                        <Label htmlFor="language">{tLabels(LABEL_REGISTRY.tenantSettings.language)}</Label>
                        <Select
                            value={formData.language}
                            onValueChange={(value) => {
                                const language = value as Locale;
                                setFormData({ ...formData, language });
                                if (errors.language) setErrors({ ...errors, language: "" });
                            }}
                            disabled={saving}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={tLabels(LABEL_REGISTRY.tenantSettings.language)} />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGE_SELECT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.language && (
                            <p className="text-sm text-red-500 mt-1">
                                {Array.isArray(errors.language) ? errors.language[0] : errors.language}
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
                        <Label htmlFor="isTaxable">{t("create.form.labels.taxable")}</Label>
                    </div>

                    {formData.isTaxable && (
                        <div className="space-y-2">
                            <Label>
                                {t("create.form.labels.taxSelection")} <span className="text-destructive">*</span>
                            </Label>
                            <SearchableSelect<Tax>
                                value={formData.taxIds?.[0] || ""}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, taxIds: value ? [value] : [] });
                                    if (errors.taxIds) setErrors({ ...errors, taxIds: "" });
                                }}
                                placeholder={t("create.form.placeholders.taxSelection")}
                                searchPlaceholder={t("create.form.placeholders.searchTaxes")}
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
                                {t("create.form.descriptions.taxSelection")}
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
                            disabled={saving}
                            label={t("create.form.labels.theme")}
                            description={t("create.form.descriptions.theme")}
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
                        {t("create.form.buttons.cancel")}
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("edit.form.buttons.save")}
                    </Button>
                </div>
            </form>
        </div>
    );
}
