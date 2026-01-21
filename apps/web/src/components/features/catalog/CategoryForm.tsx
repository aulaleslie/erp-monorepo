"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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
import {
    categoriesService,
    CategoryStatus,
    CategoryListItem,
} from "@/services/categories";

const createSchema = (t: (key: string) => string) =>
    z.object({
        name: z.string().min(1, t("validation.nameRequired")),
        parentId: z.string().nullable().optional(),
        status: z.nativeEnum(CategoryStatus).optional(),
    });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

interface CategoryFormProps {
    initialData?: CategoryListItem;
    onSuccess?: () => void;
}

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
    const t = useTranslations("categories.form");
    const commonT = useTranslations("categories.toast");
    const { toast } = useToast();
    const router = useRouter();
    const [loadingParents, setLoadingParents] = React.useState(false);
    const [parents, setParents] = React.useState<CategoryListItem[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(createSchema(t)),
        defaultValues: {
            name: initialData?.name || "",
            parentId: initialData?.parentId || null,
            status: initialData?.status || CategoryStatus.ACTIVE,
        },
    });

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form;

    React.useEffect(() => {
        const fetchParents = async () => {
            try {
                setLoadingParents(true);
                // Tree depth max 2 levels means only root categories can be parents.
                const roots = await categoriesService.getRoots();
                // Filter out current category if editing to prevent cyclic parent
                setParents(roots.filter((r) => r.id !== initialData?.id));
            } catch (error) {
                console.error("Failed to fetch root categories", error);
            } finally {
                setLoadingParents(false);
            }
        };

        fetchParents();
    }, [initialData]);

    const onSubmit = async (data: FormValues) => {
        try {
            setIsSubmitting(true);
            if (initialData) {
                await categoriesService.update(initialData.id, {
                    name: data.name,
                    parentId: data.parentId || null,
                    status: data.status,
                });
                toast({
                    title: commonT("updateSuccess.title"),
                    description: commonT("updateSuccess.description"),
                });
            } else {
                await categoriesService.create({
                    name: data.name,
                    parentId: data.parentId || undefined,
                });
                toast({
                    title: commonT("createSuccess.title"),
                    description: commonT("createSuccess.description"),
                });
            }
            if (onSuccess) {
                onSuccess();
            } else {
                router.push("/catalog/categories");
                router.refresh();
            }
        } catch (error: any) {
            toast({
                title: commonT("error.title"),
                description: error.response?.data?.message || commonT("error.description"),
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t("labels.name")}</Label>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                id="name"
                                placeholder={t("placeholders.name")}
                                {...field}
                                disabled={isSubmitting}
                            />
                        )}
                    />
                    {errors.name && (
                        <p className="text-sm font-medium text-destructive">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="parentId">{t("labels.parent")}</Label>
                    <Controller
                        name="parentId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                                value={field.value || "none"}
                                disabled={isSubmitting || loadingParents}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("placeholders.parent")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {parents.map((parent) => (
                                        <SelectItem key={parent.id} value={parent.id}>
                                            {parent.name} ({parent.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {initialData && (
                    <div className="space-y-2">
                        <Label htmlFor="status">{t("labels.status")}</Label>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("placeholders.status")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={CategoryStatus.ACTIVE}>
                                            {CategoryStatus.ACTIVE}
                                        </SelectItem>
                                        <SelectItem value={CategoryStatus.INACTIVE}>
                                            {CategoryStatus.INACTIVE}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                >
                    {t("buttons.cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? t("buttons.save") : t("buttons.create")}
                </Button>
            </div>
        </form>
    );
}
