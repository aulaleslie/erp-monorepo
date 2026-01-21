"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryForm } from "@/components/features/catalog/CategoryForm";

export default function CreateCategoryPage() {
    const t = useTranslations("categories");

    return (
        <PermissionGuard
            requiredPermissions={["categories.create"]}
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

                <Card>
                    <CardContent className="pt-6">
                        <CategoryForm />
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
