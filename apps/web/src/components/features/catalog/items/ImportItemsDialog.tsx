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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Loader2 } from "lucide-react";
import { itemsService } from "@/services/items";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/lib/api";

interface ImportItemsDialogProps {
    onSuccess?: () => void;
}

export function ImportItemsDialog({ onSuccess }: ImportItemsDialogProps) {
    const t = useTranslations("items.import");
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [file, setFile] = React.useState<File | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        try {
            setLoading(true);
            setError(null);
            await itemsService.importItems(file);
            toast({
                title: t("dialog.success.title"),
                description: t("dialog.success.description"),
            });
            setOpen(false);
            onSuccess?.();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
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

                <div className="grid gap-4 py-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>{t("dialog.error.title")}</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="file">{t("dialog.fileLabel")}</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".csv, .xlsx"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                        <p className="text-sm text-muted-foreground">
                            {t("dialog.fileHint")}
                        </p>
                    </div>

                    {/* Template download link could be added here if there's an endpoint */}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        {useTranslations("items.buttons")("cancel")}
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? t("dialog.importing") : t("button")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
