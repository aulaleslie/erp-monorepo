"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { PEOPLE_ERRORS, PeopleStatus, PeopleType } from "@gym-monorepo/shared";

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
    peopleService,
    CreatePersonData,
    UpdatePersonData,
} from "@/services/people";

interface PersonFormData {
    fullName: string;
    type: PeopleType;
    email: string;
    phone: string;
    tags: string;
    status: PeopleStatus;
    code?: string;
}

interface PersonFormProps {
    mode: "create" | "edit";
    initialData?: {
        id: string;
        fullName: string;
        type: PeopleType;
        email: string | null;
        phone: string | null;
        tags: string[];
        status: PeopleStatus;
        code: string;
    };
    onSuccess?: () => void;
}

const isPersonFormField = (
    field: string,
    data: PersonFormData
): field is keyof PersonFormData => Object.prototype.hasOwnProperty.call(data, field);

export function PersonForm({ mode, initialData, onSuccess }: PersonFormProps) {
    const t = useTranslations("people");
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<PersonFormData>({
        fullName: initialData?.fullName ?? "",
        type: initialData?.type ?? PeopleType.CUSTOMER,
        email: initialData?.email ?? "",
        phone: initialData?.phone ?? "",
        tags: initialData?.tags?.join(", ") ?? "",
        status: initialData?.status ?? PeopleStatus.ACTIVE,
        code: initialData?.code,
    });

    const {
        errors,
        validate,
        validateField,
        setFieldError,
        clearAllErrors,
    } = useFormValidation<PersonFormData>({
        fullName: [validators.required(t("form.validation.fullNameRequired"))],
        email: [validators.email(t("form.validation.invalidEmail"))],
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                fullName: initialData.fullName,
                type: initialData.type,
                email: initialData.email ?? "",
                phone: initialData.phone ?? "",
                tags: initialData.tags.join(", "),
                status: initialData.status,
                code: initialData.code,
            });
        }
    }, [initialData]);

    const handleChange = <K extends keyof PersonFormData>(
        field: K,
        value: PersonFormData[K]
    ) => {
        const newData: PersonFormData = { ...formData, [field]: value };
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
            const tags = formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean);

            if (mode === "create") {
                const createData: CreatePersonData = {
                    fullName: formData.fullName,
                    type: formData.type,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    tags,
                };
                await peopleService.create(createData);
                toast({
                    title: t("toast.createSuccess.title"),
                    description: t("toast.createSuccess.description"),
                });
            } else {
                if (!initialData?.id) return;

                const updateData: UpdatePersonData = {
                    fullName: formData.fullName,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    status: formData.status,
                    tags,
                };
                await peopleService.update(initialData.id, updateData);
                toast({
                    title: t("toast.updateSuccess.title"),
                    description: t("toast.updateSuccess.description"),
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/people");
            }
        } catch (error: unknown) {
            const fieldErrors = getApiFieldErrors(error);
            let didSetFieldError = false;

            if (fieldErrors) {
                Object.entries(fieldErrors).forEach(([field, messages]) => {
                    if (isPersonFormField(field, formData) && messages?.[0]) {
                        setFieldError(field, messages[0]);
                        didSetFieldError = true;
                    }
                });
            }

            if (didSetFieldError) {
                return;
            }

            const errorMessage = getApiErrorMessage(error);

            if (errorMessage === PEOPLE_ERRORS.DUPLICATE_EMAIL.message) {
                setFieldError("email", t("toast.duplicateEmail"));
                return;
            }

            if (errorMessage === PEOPLE_ERRORS.DUPLICATE_PHONE.message) {
                setFieldError("phone", t("toast.duplicatePhone"));
                return;
            }

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
                <Label htmlFor="fullName" className="required">
                    {t("form.labels.fullName")} <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    placeholder={t("form.placeholders.fullName")}
                    className={errors.fullName ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
            </div>

            {mode === "create" && (
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="type">{t("form.labels.type")}</Label>
                    <Select
                        value={formData.type}
                        onValueChange={(value) => handleChange("type", value as PeopleType)}
                    >
                        <SelectTrigger id="type">
                            <SelectValue placeholder={t("form.placeholders.type")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={PeopleType.CUSTOMER}>{t("types.customer")}</SelectItem>
                            <SelectItem value={PeopleType.SUPPLIER}>{t("types.supplier")}</SelectItem>
                            <SelectItem value={PeopleType.STAFF}>{t("types.staff")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="email">{t("form.labels.email")}</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder={t("form.placeholders.email")}
                        className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="phone">{t("form.labels.phone")}</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder={t("form.placeholders.phone")}
                        className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>
            </div>

            {mode === "edit" && (
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="status">{t("form.labels.status")}</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => handleChange("status", value as PeopleStatus)}
                    >
                        <SelectTrigger id="status">
                            <SelectValue placeholder={t("form.placeholders.status")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={PeopleStatus.ACTIVE}>{t("statuses.active")}</SelectItem>
                            <SelectItem value={PeopleStatus.INACTIVE}>{t("statuses.inactive")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="tags">{t("form.labels.tags")}</Label>
                <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleChange("tags", e.target.value)}
                    placeholder={t("form.placeholders.tags")}
                />
                <p className="text-xs text-muted-foreground">
                    Separated by comma, e.g. &quot;vip, wholesale&quot;
                </p>
            </div>

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
