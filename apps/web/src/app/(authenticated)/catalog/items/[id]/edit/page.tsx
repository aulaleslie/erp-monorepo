"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import React from "react";
import { itemsService, ItemListItem } from "@/services/items";
import { ItemForm } from "@/components/features/catalog/ItemForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditItemPage() {
    const t = useTranslations("items");
    const { id } = useParams();

    return (
        <PermissionGuard
            requiredPermissions={["items.update"]}
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

                <ItemEditWrapper id={id as string} />
            </div>
        </PermissionGuard>
    );
}

function ItemEditWrapper({ id }: { id: string }) {
    const t = useTranslations("items");
    const [loading, setLoading] = React.useState(true);
    const [item, setItem] = React.useState<ItemListItem | null>(null);

    React.useEffect(() => {
        const fetchItem = async () => {
            try {
                const data = await itemsService.get(id);
                setItem(data);
            } catch (error) {
                console.error("Failed to fetch item", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!item) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{t("toast.loadError.description")}</AlertDescription>
            </Alert>
        );
    }

    return <ItemForm initialData={item} />;
}
