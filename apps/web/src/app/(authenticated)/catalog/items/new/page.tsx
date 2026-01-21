"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ItemForm } from "@/components/features/catalog/ItemForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateItemPage() {
    const t = useTranslations("items");

    return (
        <PermissionGuard
            requiredPermissions={["items.create"]}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noCreatePermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <PageHeader
                    title={t("create.page.title")}
                    description={t("create.page.description")}
                />

                <ItemForm />
            </div>
        </PermissionGuard>
    );
}
