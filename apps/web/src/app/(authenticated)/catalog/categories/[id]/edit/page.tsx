"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryForm } from "@/components/features/catalog/CategoryForm";
import { categoriesService, CategoryListItem } from "@/services/categories";
import { useToast } from "@/hooks/use-toast";

export default function EditCategoryPage() {
    const { id } = useParams();
    const t = useTranslations("categories");
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(true);
    const [category, setCategory] = React.useState<CategoryListItem | null>(null);

    React.useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await categoriesService.get(id as string);
                setCategory(data);
            } catch (error) {
                console.error("Failed to fetch category", error);
                toast({
                    title: t("toast.loadError.title"),
                    description: t("toast.loadError.description"),
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, t, toast]);

    return (
        <PermissionGuard
            requiredPermissions={["categories.update"]}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noEditPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <PageHeader
                    title={t("edit.page.title")}
                    description={t("edit.page.description")}
                />

                <Card>
                    <CardContent className="pt-6">
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <div className="flex justify-end gap-2">
                                    <Skeleton className="h-10 w-24" />
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            </div>
                        ) : category ? (
                            <CategoryForm initialData={category} />
                        ) : (
                            <Alert variant="destructive">
                                <AlertDescription>{t("toast.loadError.description")}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
