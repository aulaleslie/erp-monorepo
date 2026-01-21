"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
    ItemListItem,
    ItemType,
    ItemServiceKind,
    ItemDurationUnit,
    ItemStatus,
    itemsService,
    CreateItemData,
    UpdateItemData,
} from "@/services/items";
import { categoriesService, CategoryListItem } from "@/services/categories";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
    name: z.string().min(1, "nameRequired"),
    type: z.nativeEnum(ItemType),
    price: z.coerce.number().min(0, "priceRequired"),
    categoryId: z.string().optional().nullable(),
    status: z.nativeEnum(ItemStatus),
    barcode: z.string().optional().nullable(),
    unit: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    tags: z.string().optional().nullable(),
    // Service specific fields
    serviceKind: z.nativeEnum(ItemServiceKind).optional().nullable(),
    durationValue: z.coerce.number().optional().nullable(),
    durationUnit: z.nativeEnum(ItemDurationUnit).optional().nullable(),
    sessionCount: z.coerce.number().optional().nullable(),
    includedPtSessions: z.coerce.number().optional().nullable(),
}).refine((data) => {
    if (data.type === ItemType.SERVICE && !data.serviceKind) return false;
    return true;
}, {
    message: "serviceKindRequired",
    path: ["serviceKind"],
}).refine((data) => {
    if (data.type === ItemType.SERVICE && data.serviceKind && !data.durationValue) return false;
    return true;
}, {
    message: "durationRequired",
    path: ["durationValue"],
}).refine((data) => {
    if (data.type === ItemType.SERVICE && data.serviceKind && !data.durationUnit) return false;
    return true;
}, {
    message: "durationRequired",
    path: ["durationUnit"],
}).refine((data) => {
    if (data.type === ItemType.SERVICE && data.serviceKind === ItemServiceKind.PT_SESSION && !data.sessionCount) return false;
    return true;
}, {
    message: "sessionCountRequired",
    path: ["sessionCount"],
});

type FormValues = z.infer<typeof formSchema>;

interface ItemFormProps {
    initialData?: ItemListItem | null;
}

export function ItemForm({ initialData }: ItemFormProps) {
    const t = useTranslations("items");
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    const [categories, setCategories] = React.useState<CategoryListItem[]>([]);
    const [imageFile, setImageFile] = React.useState<File | null>(null);

    const isEdit = !!initialData;

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            type: initialData.type,
            price: initialData.price,
            categoryId: initialData.categoryId,
            status: initialData.status,
            barcode: initialData.barcode,
            unit: initialData.unit,
            description: initialData.description,
            tags: initialData.tags?.join(", "),
            serviceKind: initialData.serviceKind,
            durationValue: initialData.durationValue,
            durationUnit: initialData.durationUnit,
            sessionCount: initialData.sessionCount,
            includedPtSessions: initialData.includedPtSessions,
        } : {
            name: "",
            type: ItemType.PRODUCT,
            price: 0,
            status: ItemStatus.ACTIVE,
            barcode: "",
            unit: "",
            description: "",
            tags: "",
        },
    });

    const watchType = watch("type");
    const watchServiceKind = watch("serviceKind");

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoriesService.getActive();
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();
    }, []);

    const onSubmit = async (values: FormValues) => {
        try {
            setLoading(true);
            const tagsArray = typeof values.tags === 'string'
                ? values.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                : [];

            const payload: any = {
                ...values,
                tags: tagsArray,
            };

            // Clean up payload based on type
            if (values.type === ItemType.PRODUCT) {
                delete payload.serviceKind;
                delete payload.durationValue;
                delete payload.durationUnit;
                delete payload.sessionCount;
                delete payload.includedPtSessions;
            }

            let result: ItemListItem;
            if (isEdit) {
                result = await itemsService.update(initialData.id, payload as UpdateItemData);
            } else {
                result = await itemsService.create(payload as CreateItemData);
            }

            // Handle image upload if present
            if (imageFile) {
                await itemsService.uploadImage(isEdit ? initialData.id : result.id, imageFile);
            }

            toast({
                title: isEdit ? t("toast.updateSuccess.title") : t("toast.createSuccess.title"),
                description: isEdit ? t("toast.updateSuccess.description") : t("toast.createSuccess.description"),
            });

            router.push("/catalog/items");
            router.refresh();
        } catch (error) {
            toast({
                title: t("toast.error.title"),
                description: t("toast.error.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl pb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("form.sections.basic")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t("form.labels.name")}</Label>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            id="name"
                                            disabled={loading}
                                            placeholder={t("form.placeholders.name")}
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    )}
                                />
                                {errors.name && <p className="text-xs text-destructive">{t(`form.validation.${errors.name.message}`)}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">{t("form.labels.type")}</Label>
                                    <Controller
                                        name="type"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                disabled={loading || isEdit}
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger id="type">
                                                    <SelectValue placeholder={t("form.placeholders.type")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={ItemType.PRODUCT}>{t("types.PRODUCT")}</SelectItem>
                                                    <SelectItem value={ItemType.SERVICE}>{t("types.SERVICE")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">{t("form.labels.price")}</Label>
                                    <Controller
                                        name="price"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="price"
                                                type="number"
                                                disabled={loading}
                                                placeholder={t("form.placeholders.price")}
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors.price && <p className="text-xs text-destructive">{t(`form.validation.${errors.price.message}`)}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="categoryId">{t("form.labels.category")}</Label>
                                    <Controller
                                        name="categoryId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                disabled={loading}
                                                onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                                                value={field.value || "none"}
                                            >
                                                <SelectTrigger id="categoryId">
                                                    <SelectValue placeholder={t("form.placeholders.category")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No Category</SelectItem>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">{t("form.labels.status")}</Label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                disabled={loading}
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger id="status">
                                                    <SelectValue placeholder={t("form.placeholders.status")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={ItemStatus.ACTIVE}>ACTIVE</SelectItem>
                                                    <SelectItem value={ItemStatus.INACTIVE}>INACTIVE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="barcode">{t("form.labels.barcode")}</Label>
                                    <Controller
                                        name="barcode"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="barcode"
                                                disabled={loading}
                                                placeholder={t("form.placeholders.barcode")}
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit">{t("form.labels.unit")}</Label>
                                    <Controller
                                        name="unit"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="unit"
                                                disabled={loading}
                                                placeholder={t("form.placeholders.unit")}
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tags">{t("form.labels.tags")}</Label>
                                <Controller
                                    name="tags"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="space-y-1">
                                            <Input
                                                id="tags"
                                                disabled={loading}
                                                placeholder={t("form.placeholders.tags")}
                                                {...field}
                                                value={field.value || ""}
                                            />
                                            <p className="text-[10px] text-muted-foreground">Separate tags with commas</p>
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t("form.labels.description")}</Label>
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            id="description"
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={loading}
                                            placeholder={t("form.placeholders.description")}
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {watchType === ItemType.SERVICE && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("form.sections.service")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="serviceKind">{t("form.labels.serviceKind")}</Label>
                                    <Controller
                                        name="serviceKind"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                disabled={loading}
                                                onValueChange={field.onChange}
                                                value={field.value || undefined}
                                            >
                                                <SelectTrigger id="serviceKind">
                                                    <SelectValue placeholder={t("form.placeholders.serviceKind")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={ItemServiceKind.MEMBERSHIP}>{t("serviceKinds.MEMBERSHIP")}</SelectItem>
                                                    <SelectItem value={ItemServiceKind.PT_SESSION}>{t("serviceKinds.PT_SESSION")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.serviceKind && <p className="text-xs text-destructive">{t(`form.validation.${errors.serviceKind.message}`)}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="durationValue">{t("form.labels.durationValue")}</Label>
                                        <Controller
                                            name="durationValue"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    id="durationValue"
                                                    type="number"
                                                    disabled={loading}
                                                    placeholder="0"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            )}
                                        />
                                        {errors.durationValue && <p className="text-xs text-destructive">{t(`form.validation.${errors.durationValue.message}`)}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="durationUnit">{t("form.labels.durationUnit")}</Label>
                                        <Controller
                                            name="durationUnit"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    disabled={loading}
                                                    onValueChange={field.onChange}
                                                    value={field.value || undefined}
                                                >
                                                    <SelectTrigger id="durationUnit">
                                                        <SelectValue placeholder={t("form.placeholders.durationUnit")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={ItemDurationUnit.DAY}>Days</SelectItem>
                                                        <SelectItem value={ItemDurationUnit.WEEK}>Weeks</SelectItem>
                                                        <SelectItem value={ItemDurationUnit.MONTH}>Months</SelectItem>
                                                        <SelectItem value={ItemDurationUnit.YEAR}>Years</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.durationUnit && <p className="text-xs text-destructive">{t(`form.validation.${errors.durationUnit.message}`)}</p>}
                                    </div>
                                </div>

                                {watchServiceKind === ItemServiceKind.PT_SESSION && (
                                    <div className="space-y-2">
                                        <Label htmlFor="sessionCount">{t("form.labels.sessionCount")}</Label>
                                        <Controller
                                            name="sessionCount"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    id="sessionCount"
                                                    type="number"
                                                    disabled={loading}
                                                    placeholder="0"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            )}
                                        />
                                        {errors.sessionCount && <p className="text-xs text-destructive">{t(`form.validation.${errors.sessionCount.message}`)}</p>}
                                    </div>
                                )}

                                {watchServiceKind === ItemServiceKind.MEMBERSHIP && (
                                    <div className="space-y-2">
                                        <Label htmlFor="includedPtSessions">{t("form.labels.includedPtSessions")}</Label>
                                        <Controller
                                            name="includedPtSessions"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="space-y-1">
                                                    <Input
                                                        id="includedPtSessions"
                                                        type="number"
                                                        disabled={loading}
                                                        placeholder="0"
                                                        {...field}
                                                        value={field.value || ""}
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">Optional: include PT sessions in this membership</p>
                                                </div>
                                            )}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("form.sections.image")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ImageUpload
                                value={initialData?.imageUrl}
                                onChange={(file) => setImageFile(file)}
                                disabled={loading}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-2">
                        <Button disabled={loading} type="submit" className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? t("form.buttons.save") : t("form.buttons.create")}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={loading}
                            onClick={() => router.push("/catalog/items")}
                        >
                            {t("form.buttons.cancel")}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
