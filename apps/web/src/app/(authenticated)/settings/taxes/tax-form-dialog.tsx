"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tax, TaxType, taxesService } from "@/services/taxes";

// Zod schema with discriminatedUnion for type-specific validation
const baseSchema = {
    name: z.string().min(1, "Name is required"),
    code: z.string().optional(),
};

const percentageSchema = z.object({
    ...baseSchema,
    type: z.literal(TaxType.PERCENTAGE),
    rate: z.coerce.number()
        .gt(0, "Rate must be greater than 0")
        .lte(1, "Rate must be at most 1 (e.g., 0.1 for 10%)"),
    amount: z.coerce.number().optional(),
});

const fixedSchema = z.object({
    ...baseSchema,
    type: z.literal(TaxType.FIXED),
    rate: z.coerce.number().optional(),
    amount: z.coerce.number()
        .gt(0, "Amount must be greater than 0"),
});

const platformTaxSchema = z.discriminatedUnion("type", [percentageSchema, fixedSchema]);

type PlatformTaxFormValues = z.infer<typeof platformTaxSchema>;

interface TaxFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tax?: Tax | null;
    onSuccess: () => void;
}

export function TaxFormDialog({ open, onOpenChange, tax, onSuccess }: TaxFormDialogProps) {
    const { toast } = useToast();
    const isEditing = !!tax;
    const t = useTranslations("taxes");
    const dialogTitle = isEditing ? t("form.dialog.title.edit") : t("form.dialog.title.create");
    const dialogDescription = isEditing
        ? t("form.dialog.description.edit")
        : t("form.dialog.description.create");
    const cancelLabel = t("form.buttons.cancel");
    const saveLabel = t("form.buttons.save");

    const form = useForm<PlatformTaxFormValues>({
        resolver: zodResolver(platformTaxSchema),
        defaultValues: {
            name: "",
            code: "",
            type: TaxType.PERCENTAGE,
            rate: 0,
            amount: 0,
        },
    });

    const { control, handleSubmit, watch, reset, setError, formState: { errors, isSubmitting } } = form;
    const selectedType = watch("type");

    useEffect(() => {
        if (open) {
            reset({
                name: tax?.name || "",
                code: tax?.code || "",
                type: tax?.type || TaxType.PERCENTAGE,
                rate: tax?.rate || 0,
                amount: tax?.amount || 0,
            });
        }
    }, [open, tax, reset]);

    const onSubmit = async (data: PlatformTaxFormValues) => {
        try {
            const payload = {
                name: data.name,
                code: data.code || undefined,
                type: data.type,
                rate: data.type === TaxType.PERCENTAGE ? data.rate : undefined,
                amount: data.type === TaxType.FIXED ? data.amount : undefined,
            };

            if (isEditing && tax) {
                await taxesService.update(tax.id, payload);
                toast({
                    title: t("form.toast.success.title"),
                    description: t("form.toast.success.update"),
                });
            } else {
                await taxesService.create(payload);
                toast({
                    title: t("form.toast.success.title"),
                    description: t("form.toast.success.create"),
                });
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            // Handle axios error with proper type narrowing
            let message = "Something went wrong";
            let responseErrors: Record<string, string[]> | undefined;

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
                message = axiosError.response?.data?.message || message;
                responseErrors = axiosError.response?.data?.errors;
            }

            toast({
                title: t("form.toast.error.title"),
                description: message || t("form.toast.error.description"),
                variant: "destructive",
            });

            // Map server errors to form fields
            if (responseErrors) {
                Object.entries(responseErrors).forEach(([key, msgs]) => {
                    if (key in form.getValues()) {
                        setError(key as keyof PlatformTaxFormValues, { message: msgs[0] });
                    }
                });
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("form.labels.name")}</Label>
                        <Controller
                            control={control}
                            name="name"
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    id="name"
                                    placeholder={t("form.placeholders.name")}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                            )}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code">{t("form.labels.codeOptional")}</Label>
                        <Controller
                            control={control}
                            name="code"
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    value={field.value || ""}
                                    id="code"
                                    placeholder={t("form.placeholders.code")}
                                    className={errors.code ? "border-red-500" : ""}
                                />
                            )}
                        />
                        {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>{t("form.labels.type")}</Label>
                        <Controller
                            control={control}
                            name="type"
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                                        <SelectValue placeholder={t("form.placeholders.selectType")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={TaxType.PERCENTAGE}>{t("form.typeOptions.percentage")}</SelectItem>
                                        <SelectItem value={TaxType.FIXED}>{t("form.typeOptions.fixed")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
                    </div>

                    {selectedType === TaxType.PERCENTAGE && (
                        <div className="space-y-2">
                            <Label htmlFor="rate">{t("form.labels.rate")}</Label>
                            <Controller
                                control={control}
                                name="rate"
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id="rate"
                                        type="number"
                                        step="0.0001"
                                        placeholder={t("form.placeholders.rate")}
                                        className={errors.rate ? "border-red-500" : ""}
                                    />
                                )}
                            />
                            {errors.rate && <p className="text-sm text-red-500">{errors.rate.message}</p>}
                        </div>
                    )}

                    {selectedType === TaxType.FIXED && (
                        <div className="space-y-2">
                            <Label htmlFor="amount">{t("form.labels.amount")}</Label>
                            <Controller
                                control={control}
                                name="amount"
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder={t("form.placeholders.amount")}
                                        className={errors.amount ? "border-red-500" : ""}
                                    />
                                )}
                            />
                            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {cancelLabel}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {saveLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
