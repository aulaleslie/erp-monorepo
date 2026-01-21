"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useActiveTenant, usePermissions } from "@/hooks/use-permissions";
import { MultiSearchableSelect } from "@/components/common/MultiSearchableSelect";
import { EmptyState } from "@/components/common/EmptyState";
import {
    getPlatformTaxes,
    TaxType
} from "@/lib/api/taxes";
import {
    getTenantTaxSettings,
    updateTenantTaxSettings,
} from "@/lib/api/tenant-settings";
import { useTranslations } from "next-intl";

type TaxOption = {
    id: string;
    name: string;
    code?: string;
    type: TaxType;
    rate?: number;
    amount?: number;
};

const createFormSchema = (t: (key: string) => string) => z.object({
    taxIds: z.array(z.string()).refine((val) => val.length > 0, {
        message: t('taxForm.validation.atLeastOneTax'),
    }),
    defaultTaxId: z.string().optional(),
}).refine((data) => {
    if (data.defaultTaxId && !data.taxIds.includes(data.defaultTaxId)) {
        return false;
    }
    return true;
}, {
    message: t('taxForm.validation.defaultMustBeSelected'),
    path: ["defaultTaxId"],
});

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export function TenantTaxForm() {
    const activeTenant = useActiveTenant();
    const { isSuperAdmin, can } = usePermissions();
    const { toast } = useToast();
    const t = useTranslations('tenant');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // We keep a cache of full tax objects to display labels for selected IDs
    // Initialized with taxes from settings if available
    const [availableTaxes, setAvailableTaxes] = useState<TaxOption[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(createFormSchema(t)),
        defaultValues: {
            taxIds: [],
            defaultTaxId: "",
        },
    });

    const { control, handleSubmit, watch, formState: { errors } } = form;
    const selectedTaxIds = watch("taxIds");

    // Fetch settings
    useEffect(() => {
        async function loadData() {
            if (!activeTenant) return;

            try {
                setLoading(true);
                // We only fetch settings if tenant is taxable, but the API might return empty/default if we just call it?
                // Implementation plan says: "If activeTenant.isTaxable=false: show informational EmptyState"
                // So we can check activeTenant.isTaxable here directly.

                if (!activeTenant.isTaxable) {
                    setLoading(false);
                    return;
                }

                const response = await getTenantTaxSettings();
                const data = response.data; // access inner data from axios response

                // If the settings response includes expanded taxes, add them to availableTaxes
                if (data.taxes) {
                    setAvailableTaxes(prev => {
                        const map = new Map(prev.map(t => [t.id, t]));
                        data.taxes?.forEach(t => map.set(t.id, t));
                        return Array.from(map.values());
                    });
                }

                form.reset({
                    taxIds: data.selectedTaxIds || [],
                    defaultTaxId: data.defaultTaxId || "",
                });

            } catch (error) {
                console.error("Failed to load tax settings", error);
                toast({
                    title: t('taxForm.toast.loadError.title'),
                    description: t('taxForm.toast.loadError.description'),
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [activeTenant, form, t, toast]);

    const fetchTaxes = async ({ search, page, limit }: { search: string; page: number; limit: number }) => {
        const res = await getPlatformTaxes({
            search,
            status: 'ACTIVE',
            page,
            limit
        });
        // Add fetched taxes to availableTaxes cache so we have their names
        setAvailableTaxes(prev => {
            const map = new Map(prev.map(t => [t.id, t]));
            res.data.data.forEach(t => map.set(t.id, t));
            return Array.from(map.values());
        });

        return {
            items: res.data.data,
            total: res.data.meta.total,
            hasMore: res.data.meta.page < res.data.meta.totalPages
        };
    };

    const onSubmit = async (data: FormValues) => {
        if (!canEdit) {
            return;
        }
        try {
            setSaving(true);
            await updateTenantTaxSettings({
                taxIds: data.taxIds,
                defaultTaxId: data.defaultTaxId || undefined,
            });

            toast({
                title: t('taxForm.toast.success.title'),
                description: t('taxForm.toast.success.description'),
            });

            // Refresh local state if needed?
        } catch (error) {
            console.error("Failed to save settings", error);
            toast({
                title: t('taxForm.toast.error.title'),
                description: t('taxForm.toast.error.description'),
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!activeTenant?.isTaxable) {
        return (
            <EmptyState
                icon={Ban}
                title={t('taxForm.emptyState.title')}
                description={t('taxForm.emptyState.description')}
            />
        );
    }

    const canEdit = isSuperAdmin || can("settings.tenant.update");

    // Filter available taxes to only selected ones for the default tax dropdown
    const selectedTaxesList = availableTaxes.filter(t => selectedTaxIds.includes(t.id));

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('taxForm.card.title')}</CardTitle>
                <CardDescription>
                    {t('taxForm.card.description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label>{t('taxForm.form.labels.applicableTaxes')}</Label>
                        <Controller
                            control={control}
                            name="taxIds"
                            render={({ field }) => (
                                <MultiSearchableSelect<TaxOption>
                                    value={field.value}
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        // If default tax is no longer in selected taxes, clear it
                                        const currentDefault = form.getValues("defaultTaxId");
                                        if (currentDefault && !val.includes(currentDefault)) {
                                            form.setValue("defaultTaxId", ""); // or set to first available?
                                        }
                                    }}
                                    fetchItems={fetchTaxes}
                                    getItemValue={(item) => item.id}
                                    getItemLabel={(item) => `${item.name} (${item.code || '-'}) - ${item.type === 'PERCENTAGE' ? (item.rate ? item.rate + '%' : '0%') : (item.amount || 0)}`}
                                    getItemDescription={(item) => item.type}
                                    placeholder={t('taxForm.form.placeholders.selectTaxes')}
                                    initialSelectedItems={availableTaxes.filter(t => field.value.includes(t.id))}
                                    disabled={!canEdit || saving}
                                />
                            )}
                        />
                        {errors.taxIds && (
                            <p className="text-sm font-medium text-destructive">{errors.taxIds.message}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {t('taxForm.form.descriptions.taxesHelp')}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('taxForm.form.labels.defaultTax')}</Label>
                        <Controller
                            control={control}
                            name="defaultTaxId"
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={!canEdit || saving || selectedTaxIds.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('taxForm.form.placeholders.selectDefaultTax')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                {selectedTaxesList.map((tax) => (
                                            <SelectItem key={tax.id} value={tax.id}>
                                                {tax.name} ({tax.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.defaultTaxId && (
                            <p className="text-sm font-medium text-destructive">{errors.defaultTaxId.message}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {t('taxForm.form.descriptions.defaultTaxHelp')}
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={!canEdit || saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('taxForm.form.buttons.save')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
