"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "../../ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { InvoiceLineItems } from "./InvoiceLineItems";
import { peopleService, PersonListItem } from "@/services/people";
import { salesInvoicesService, SalesInvoiceCreatePayload, SalesInvoiceDetail } from "@/services/sales-invoices";
import { useToast } from "@/hooks/use-toast";
import { SalesTaxPricingMode, PeopleType, PeopleStatus } from "@gym-monorepo/shared";

const invoiceSchema = z.object({
    documentDate: z.string().min(1, "Issue date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    personId: z.string().min(1, "Customer is required"),
    salespersonPersonId: z.string().optional(),
    externalRef: z.string().optional(),
    paymentTerms: z.string().optional(),
    taxPricingMode: z.nativeEnum(SalesTaxPricingMode),
    notes: z.string().optional(),
    items: z.array(z.object({
        itemId: z.string().min(1, "Item is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.number().min(0, "Price cannot be negative"),
        description: z.string().optional(),
    })).min(1, "At least one item is required"),
    billingAddressSnapshot: z.string().optional(),
    shippingAddressSnapshot: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
    initialData?: SalesInvoiceDetail;
    isEdit?: boolean;
}

export function InvoiceForm({ initialData, isEdit = false }: InvoiceFormProps) {
    const t = useTranslations("sales.invoices.form");
    const commonT = useTranslations("people.form.buttons");
    const { toast } = useToast();
    const router = useRouter();

    const methods = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: initialData ? {
            documentDate: initialData.documentDate.split("T")[0],
            dueDate: initialData.salesHeader?.dueDate?.split("T")[0] || "",
            personId: initialData.personId || "",
            salespersonPersonId: initialData.salesHeader?.salespersonPersonId || undefined,
            externalRef: initialData.salesHeader?.externalRef || "",
            paymentTerms: initialData.salesHeader?.paymentTerms || "",
            taxPricingMode: initialData.salesHeader?.taxPricingMode || SalesTaxPricingMode.INCLUSIVE,
            notes: initialData.notes || "",
            items: initialData.items.map(item => ({
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                description: item.description || "",
            })),
            billingAddressSnapshot: initialData.salesHeader?.billingAddressSnapshot || "",
            shippingAddressSnapshot: initialData.salesHeader?.shippingAddressSnapshot || "",
        } : {
            documentDate: new Date().toISOString().split("T")[0],
            dueDate: "",
            personId: "",
            taxPricingMode: SalesTaxPricingMode.INCLUSIVE,
            items: [{ itemId: "", quantity: 1, unitPrice: 0, description: "" }],
        },
    });

    const { handleSubmit, control, watch, setValue } = methods;

    const onSubmit = async (values: InvoiceFormValues) => {
        try {
            if (isEdit && initialData) {
                await salesInvoicesService.update(initialData.id, values);
                toast({
                    title: t("toast.success.title"),
                    description: t("toast.success.description"),
                });
                router.push(`/sales/invoices/${initialData.id}`);
            } else {
                const result = await salesInvoicesService.create(values as SalesInvoiceCreatePayload);
                toast({
                    title: t("toast.createSuccess.title"),
                    description: t("toast.createSuccess.description"),
                });
                router.push(`/sales/invoices/${result.id}`);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save invoice. Please try again.",
                variant: "destructive",
            });
        }
    };

    const fetchCustomers = async (params: { search: string; page: number; limit: number }) => {
        const result = await peopleService.list({ ...params, type: PeopleType.CUSTOMER, status: PeopleStatus.ACTIVE });
        return {
            items: result.items,
            total: result.total,
            hasMore: result.page < Math.ceil(result.total / result.limit),
        };
    };

    const fetchStaff = async (params: { search: string; page: number; limit: number }) => {
        const result = await peopleService.list({ ...params, type: PeopleType.STAFF, status: PeopleStatus.ACTIVE });
        return {
            items: result.items,
            total: result.total,
            hasMore: result.page < Math.ceil(result.total / result.limit),
        };
    };

    // Summary calculations
    const watchItems = watch("items");
    const subtotal = watchItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const total = subtotal;

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                        {isEdit ? "Edit Invoice" : "New Invoice"}
                    </h2>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            {commonT("cancel")}
                        </Button>
                        <Button type="submit">
                            {isEdit ? commonT("save") : commonT("create")}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <FormField
                                control={control}
                                name="personId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("customerLabel")}</FormLabel>
                                        <FormControl>
                                            <SearchableSelect<PersonListItem>
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder={t("customerPlaceholder")}
                                                fetchItems={fetchCustomers}
                                                getItemValue={(item) => item.id}
                                                getItemLabel={(item) => item.fullName}
                                                getItemDescription={(item) => item.code}
                                                initialLabel={initialData?.personName || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name="documentDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("documentDate")}</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("dueDate")}</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name="salespersonPersonId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("salespersonLabel")}</FormLabel>
                                        <FormControl>
                                            <SearchableSelect<PersonListItem>
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder={t("salespersonPlaceholder")}
                                                fetchItems={fetchStaff}
                                                getItemValue={(item) => item.id}
                                                getItemLabel={(item) => item.fullName}
                                                getItemDescription={(item) => item.code}
                                                initialLabel={initialData?.salesHeader?.salesperson?.fullName || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name="taxPricingMode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("taxModeLabel")}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t("taxModePlaceholder")} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={SalesTaxPricingMode.INCLUSIVE}>
                                                    {t("taxModeInclusive")}
                                                </SelectItem>
                                                <SelectItem value={SalesTaxPricingMode.EXCLUSIVE}>
                                                    {t("taxModeExclusive")}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name="externalRef"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("externalRefLabel")}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t("externalRefPlaceholder")} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <InvoiceLineItems />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardContent className="pt-6">
                            <FormField
                                control={control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t("summary.notesPlaceholder")}
                                                className="h-32"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t("summary.subtotal")}</span>
                                    <span>{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed pt-2 font-bold">
                                    <span>{t("summary.total")}</span>
                                    <span>{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </FormProvider>
    );
}
