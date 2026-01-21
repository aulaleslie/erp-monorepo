"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileDown, Loader2 } from "lucide-react";
import { itemsService } from "@/services/items";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ExportItemsDialogProps {
    filters?: {
        search?: string;
        type?: string;
        status?: string;
        categoryId?: string;
    };
}

export function ExportItemsDialog({ filters }: ExportItemsDialogProps) {
    const t = useTranslations("items.export");
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [format, setFormat] = React.useState<"csv" | "xlsx">("csv");
    const [selectedFields, setSelectedFields] = React.useState<string[]>([
        "code",
        "name",
        "type",
        "price",
        "status",
    ]);

    const fields = [
        { id: "code", label: t("dialog.fields_list.code") },
        { id: "name", label: t("dialog.fields_list.name") },
        { id: "type", label: t("dialog.fields_list.type") },
        { id: "price", label: t("dialog.fields_list.price") },
        { id: "status", label: t("dialog.fields_list.status") },
        { id: "barcode", label: t("dialog.fields_list.barcode") },
        { id: "unit", label: t("dialog.fields_list.unit") },
        { id: "category", label: t("dialog.fields_list.category") },
        { id: "description", label: t("dialog.fields_list.description") },
    ];

    const toggleField = (fieldId: string) => {
        setSelectedFields((prev) =>
            prev.includes(fieldId)
                ? prev.filter((id) => id !== fieldId)
                : [...prev, fieldId]
        );
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const blob = await itemsService.exportItems({
                format,
                fields: selectedFields,
                ...filters,
            });

            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `items-export-${new Date().toISOString().split("T")[0]}.${format}`
            );
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);

            toast({
                title: t("dialog.success.title"),
                description: t("dialog.success.description"),
            });
            setOpen(false);
        } catch (error) {
            console.error("Export failed", error);
            toast({
                title: "Export Failed",
                description: "Failed to export items. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("button")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("dialog.title")}</DialogTitle>
                    <DialogDescription>
                        {t("dialog.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-3">
                        <Label>{t("dialog.format")}</Label>
                        <Select
                            value={format}
                            onValueChange={(v: "csv" | "xlsx") => setFormat(v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t("dialog.format")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="csv">CSV</SelectItem>
                                <SelectItem value="xlsx">XLSX</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>{t("dialog.fields")}</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {fields.map((field) => (
                                <div key={field.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={field.id}
                                        checked={selectedFields.includes(field.id)}
                                        onCheckedChange={() => toggleField(field.id)}
                                    />
                                    <Label
                                        htmlFor={field.id}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {field.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        {useTranslations("items.buttons")("cancel")}
                    </Button>
                    <Button onClick={handleExport} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? t("dialog.exporting") : t("button")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
