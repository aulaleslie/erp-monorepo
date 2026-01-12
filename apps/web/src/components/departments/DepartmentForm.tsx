"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { DepartmentStatus } from "@gym-monorepo/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation, validators } from "@/hooks/use-form-validation";
import {
    departmentsService,
    CreateDepartmentData,
    UpdateDepartmentData,
    DepartmentListItem,
} from "@/services/departments";

interface DepartmentFormData {
    name: string;
    status: DepartmentStatus;
    code?: string;
}

interface DepartmentFormProps {
    mode: "create" | "edit";
    initialData?: DepartmentListItem;
    onSuccess?: () => void;
}

export function DepartmentForm({ mode, initialData, onSuccess }: DepartmentFormProps) {
    const t = useTranslations("departments");
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<DepartmentFormData>({
        name: initialData?.name ?? "",
        status: initialData?.status ?? DepartmentStatus.ACTIVE,
        code: initialData?.code,
    });

    const {
        errors,
        validate,
        validateField,
        setFieldError,
        clearAllErrors,
    } = useFormValidation<DepartmentFormData>({
        name: [validators.required(t("form.validation.nameRequired"))],
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                status: initialData.status,
                code: initialData.code,
            });
        }
    }, [initialData]);

    const handleChange = <K extends keyof DepartmentFormData>(
        field: K,
        value: DepartmentFormData[K]
    ) => {
        const newData: DepartmentFormData = { ...formData, [field]: value };
        setFormData(newData);
        validateField(field, newData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearAllErrors();

        if (!validate(formData)) {
            return;
        }

        setLoading(true);

        try {
            if (mode === "create") {
                const createData: CreateDepartmentData = {
                    name: formData.name,
                    status: formData.status,
                };
                await departmentsService.create(createData);
                toast({
                    title: t("toast.createSuccess.title"),
                    description: t("toast.createSuccess.description"),
                });
            } else {
                if (!initialData?.id) return;

                const updateData: UpdateDepartmentData = {
                    name: formData.name,
                    status: formData.status,
                };
                await departmentsService.update(initialData.id, updateData);
                toast({
                    title: t("toast.updateSuccess.title"),
                    description: t("toast.updateSuccess.description"),
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/departments");
            }
        } catch (error: unknown) {
            const fieldErrors = getApiFieldErrors(error);
            let didSetFieldError = false;

            if (fieldErrors) {
                Object.entries(fieldErrors).forEach(([field, messages]) => {
                    if (messages?.[0]) {
                        if (field === "name") {
                            setFieldError("name", messages[0]);
                            didSetFieldError = true;
                        }
                    }
                });
            }

            if (didSetFieldError) {
                return;
            }

            const errorMessage = getApiErrorMessage(error);
            toast({
                title: mode === "create" ? t("toast.createError.title") : t("toast.updateError.title"),
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl border p-6 rounded-lg bg-card text-card-foreground shadow-sm">
            {mode === "edit" && formData.code && (
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="code">{t("form.labels.code")}</Label>
                    <Input id="code" value={formData.code} disabled readOnly className="bg-muted" />
                </div>
            )}

            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="name" className="required">
                    {t("form.labels.name")} <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder={t("form.placeholders.name")}
                    className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            {mode === "edit" && (
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="status">{t("form.labels.status")}</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => handleChange("status", value as DepartmentStatus)}
                    >
                        <SelectTrigger id="status">
                            <SelectValue placeholder={t("form.placeholders.status")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={DepartmentStatus.ACTIVE}>{t("statuses.active")}</SelectItem>
                            <SelectItem value={DepartmentStatus.INACTIVE}>{t("statuses.inactive")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    {t("form.buttons.cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "create" ? t("form.buttons.create") : t("form.buttons.save")}
                </Button>
            </div>
        </form>
    );
}
