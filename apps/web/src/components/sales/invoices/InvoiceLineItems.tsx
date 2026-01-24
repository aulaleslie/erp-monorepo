"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { itemsService } from "@/services/items";
import { ItemListItem, ItemStatus } from "@gym-monorepo/shared";

export function InvoiceLineItems() {
    const t = useTranslations("sales.invoices.form");
    const { control, register, watch, setValue } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const watchItems = watch("items");

    const fetchItems = async (params: {
        search: string;
        page: number;
        limit: number;
    }) => {
        const result = await itemsService.list({
            ...params,
            status: ItemStatus.ACTIVE,
        });
        return {
            items: result.items,
            total: result.total,
            hasMore: result.page < Math.ceil(result.total / result.limit),
        };
    };

    const handleAddItem = () => {
        append({
            itemId: "",
            quantity: 1,
            unitPrice: 0,
            description: "",
        });
    };

    const handleItemSelect = (index: number, item: ItemListItem | null) => {
        if (item) {
            setValue(`items.${index}.itemId`, item.id);
            setValue(`items.${index}.unitPrice`, item.price);
            setValue(`items.${index}.description`, item.description || "");
        } else {
            setValue(`items.${index}.itemId`, "");
            setValue(`items.${index}.unitPrice`, 0);
            setValue(`items.${index}.description`, "");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t("itemsHeader")}</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("addItem")}
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">
                                {t("itemsTable.headers.item")}
                            </TableHead>
                            <TableHead>{t("itemsTable.headers.description")}</TableHead>
                            <TableHead className="w-[100px]">
                                {t("itemsTable.headers.quantity")}
                            </TableHead>
                            <TableHead className="w-[150px]">
                                {t("itemsTable.headers.price")}
                            </TableHead>
                            <TableHead className="w-[150px] text-right">
                                {t("itemsTable.headers.lineTotal")}
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                            const qty = watchItems?.[index]?.quantity || 0;
                            const price = watchItems?.[index]?.unitPrice || 0;
                            const lineTotal = qty * price;

                            return (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <SearchableSelect<ItemListItem>
                                            value={watchItems?.[index]?.itemId}
                                            onValueChange={() => { }}
                                            onSelectionChange={(item) => handleItemSelect(index, item)}
                                            placeholder={t("itemPlaceholder")}
                                            fetchItems={fetchItems}
                                            getItemValue={(item) => item.id}
                                            getItemLabel={(item) => item.name}
                                            getItemDescription={(item) => item.code}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            {...register(`items.${index}.description`)}
                                            placeholder={t("descriptionPlaceholder")}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            {...register(`items.${index}.quantity`, {
                                                valueAsNumber: true,
                                                min: 1,
                                            })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...register(`items.${index}.unitPrice`, {
                                                valueAsNumber: true,
                                                min: 0,
                                            })}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {lineTotal.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {fields.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    {t("list.table.empty")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
