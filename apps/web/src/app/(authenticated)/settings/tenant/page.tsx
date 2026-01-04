"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { ThemeSelector } from "@/components/common/ThemeSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TENANT_TYPE_OPTIONS, TenantType } from "@gym-monorepo/shared";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getTenantProfileSettings,
    getTenantTaxSettings,
    TenantTaxSettingItem,
    updateTenantProfileSettings,
    TenantProfileSettings,
} from "@/lib/api/tenant-settings";
import { Locale } from "@gym-monorepo/shared";
import { useTranslations } from "next-intl";
import { LABEL_REGISTRY, LANGUAGE_SELECT_OPTIONS } from "@/lib/labelRegistry";

export default function TenantSettingsPage() {
    const { isSuperAdmin, can, canAny } = usePermissions();
    const { refreshPermissions } = useAuth();
    const { toast } = useToast();

    const canView = isSuperAdmin || canAny(["settings.tenant.read", "settings.tenant.update"]);
    const canEdit = isSuperAdmin || can("settings.tenant.update");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tenant, setTenant] = useState<TenantProfileSettings | null>(null);
    const [availableTaxes, setAvailableTaxes] = useState<TenantTaxSettingItem[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        type: TenantType.GYM,
        isTaxable: false,
        taxIds: [] as string[],
        themePresetId: "corporate-blue",
        language: Locale.EN,
    });
    const [errors, setErrors] = useState<Record<string, string | string[]>>({});
    const t = useTranslations("tenant");
    const tLabels = useTranslations();

    useEffect(() => {
        const fetchTenant = async () => {
            if (!canView) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const [tenantResponse, taxesResponse] = await Promise.all([
                    getTenantProfileSettings(),
                    getTenantTaxSettings(),
                ]);
                const data = tenantResponse.data;
                const taxSettings = taxesResponse.data;
                setTenant(data);
                setAvailableTaxes(taxSettings.taxes || []);
                const defaultTaxId = data.isTaxable
                    ? taxSettings.defaultTaxId || taxSettings.selectedTaxIds?.[0] || ""
                    : "";
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
            } catch (error) {
                toast({
                    title: t("toast.loadError.title"),
                    description: t("toast.loadError.description"),
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, [canView, toast]);

    const fetchTaxes = async ({ search, page, limit }: { search: string; page: number; limit: number }) => {
        const normalizedSearch = search.toLowerCase();
        const filtered = availableTaxes.filter((tax) => {
            const haystack = `${tax.name} ${tax.code || ""}`.toLowerCase();
            return haystack.includes(normalizedSearch);
        });
        const start = (page - 1) * limit;
        const items = filtered.slice(start, start + limit);
        return {
            items,
            total: filtered.length,
            hasMore: start + limit < filtered.length,
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;

        setErrors({});

        const validationErrors: Record<string, string | string[]> = {};
        if (formData.isTaxable && (!formData.taxIds || formData.taxIds.length === 0)) {
            validationErrors.taxIds = t("form.validation.taxRequired");
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);
        try {
            const response = await updateTenantProfileSettings({
                name: formData.name,
                slug: formData.slug,
                type: formData.type,
                isTaxable: formData.isTaxable,
                taxIds: formData.taxIds,
                themePresetId: formData.themePresetId,
                language: formData.language,
            });
            setTenant(response.data);
            const updatedThemePresetId = response.data.theme?.[0]?.presetId || formData.themePresetId;
            setFormData({
                name: response.data.name,
                slug: response.data.slug,
                type: response.data.type,
                isTaxable: response.data.isTaxable,
                taxIds: formData.taxIds,
                themePresetId: updatedThemePresetId,
                language: response.data.language ?? formData.language,
            });
            toast({
                title: t("toast.saveSuccess.title"),
                description: t("toast.saveSuccess.description"),
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
                title: t("toast.error.title"),
                description: errorMessage || t("toast.error.description"),
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (!canView) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{t("alerts.noPermission")}</AlertDescription>
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
                <AlertDescription>{t("alerts.notFound")}</AlertDescription>
            </Alert>
        );
    }

    const statusLabel = tenant.status === "DISABLED" ? "Archived" : "Active";
    const selectedTax = availableTaxes.find((tax) => tax.id === formData.taxIds?.[0]);
    const selectedTaxLabel = selectedTax
        ? selectedTax.code
            ? `${selectedTax.name} (${selectedTax.code})`
            : selectedTax.name
        : "";

    return (
        <div className="space-y-6 max-w-2xl">
            <PageHeader
                title={t("page.title")}
                description={t("page.description")}
            />

            <form onSubmit={handleSubmit} className="space-y-8 border p-6 rounded-md">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{t("form.labels.status")}</span>
                        <StatusBadge status={statusLabel} variantMap={{ Archived: "secondary" }} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">{t("form.labels.tenantName")}</Label>
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
                        <Label htmlFor="slug">{t("form.labels.slug")}</Label>
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

                    <div className="space-y-2">
                        <Label>{t("form.labels.tenantType")}</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => {
                                setFormData({ ...formData, type: value as TenantType });
                                if (errors.type) setErrors({ ...errors, type: "" });
                            }}
                            disabled={!canEdit}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t("form.placeholders.tenantType")} />
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
                            disabled={!canEdit || saving}
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
                            disabled={!canEdit}
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
                        <Label htmlFor="isTaxable">{t("form.labels.taxable")}</Label>
                    </div>

                    {formData.isTaxable && (
                        <div className="space-y-2">
                            <Label>
                                {t("form.labels.taxSelection")} <span className="text-destructive">*</span>
                            </Label>
                            <SearchableSelect<TenantTaxSettingItem>
                                value={formData.taxIds?.[0] || ""}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, taxIds: value ? [value] : [] });
                                    if (errors.taxIds) setErrors({ ...errors, taxIds: "" });
                                }}
                                placeholder={t("form.placeholders.taxSelection")}
                                searchPlaceholder={t("form.placeholders.searchTaxes")}
                                initialLabel={selectedTaxLabel || undefined}
                                fetchItems={fetchTaxes}
                                getItemValue={(tax) => tax.id}
                                getItemLabel={(tax) => tax.code ? `${tax.name} (${tax.code})` : tax.name}
                                getItemDescription={(tax) => tax.type}
                                disabled={!canEdit || saving}
                            />
                            {errors.taxIds && (
                                <p className="text-sm text-red-500 mt-1">
                                    {Array.isArray(errors.taxIds) ? errors.taxIds[0] : errors.taxIds}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {t("form.descriptions.taxSelection")}
                            </p>
                        </div>
                    )}

                    {/* Theme Selection */}
                    <div className="pt-4 border-t">
                        <ThemeSelector
                            value={formData.themePresetId}
                            onChange={(presetId) => {
                                setFormData({ ...formData, themePresetId: presetId });
                            }}
                            disabled={!canEdit || saving}
                            label={t("form.labels.theme")}
                            description={t("form.descriptions.theme")}
                        />
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
                        {t("form.buttons.save")}
                    </Button>
                </div>
            </form>
        </div>
    );
}
