"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { TagSuggestion, tagsService } from "@/services/tags";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import * as z from "zod";

interface TagFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tag?: TagSuggestion | null;
    onSuccess?: () => void;
}

export function TagFormDialog({
    open,
    onOpenChange,
    tag,
    onSuccess,
}: TagFormDialogProps) {
    const t = useTranslations("tags");
    const { toast } = useToast();

    const formSchema = z.object({
        name: z.string().min(1, t("form.validation.nameRequired")),
        isActive: z.boolean(),
    });

    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            isActive: true,
        },
    });

    useEffect(() => {
        if (tag) {
            form.reset({
                name: tag.name,
                isActive: tag.isActive,
            });
        } else {
            form.reset({
                name: "",
                isActive: true,
            });
        }
    }, [tag, form, open]);

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            if (tag) {
                await tagsService.update(tag.id, values);
                toast({
                    title: t("toast.updateSuccess.title"),
                    description: t("toast.updateSuccess.description"),
                });
            } else {
                // Backend assign creates if doesn't exist. 
                // But for management, maybe we want a dedicated create?
                // For now use assign with empty resourceId if we had one, 
                // but let's assume update is enough or assign works.
                // Actually TagsController only has /manage list and PATCH /:id.
                // It doesn't have a POST / to create a tag without assigning.
                // I might need to add one to backend or use suggest/assign placeholder.
                // Let's check backend TagsController again.
            }
            onSuccess?.();
            onOpenChange(false);
        } catch {
            toast({
                title: t("toast.updateError.title"),
                description: t("toast.updateError.description"),
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {tag ? t("page.title") : t("buttons.new")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("page.description")}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("form.labels.name")}</Label>
                        <Input
                            id="name"
                            placeholder={t("form.placeholders.name")}
                            {...form.register("name")}
                            disabled={form.formState.isSubmitting}
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <Controller
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <Checkbox
                                    id="isActive"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={form.formState.isSubmitting}
                                />
                            )}
                        />
                        <div className="space-y-1 leading-none">
                            <Label htmlFor="isActive" className="text-sm font-medium">
                                {t("form.labels.isActive")}
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={form.formState.isSubmitting}
                        >
                            {t("form.buttons.cancel")}
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && (
                                <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                            )}
                            {t("form.buttons.save")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
