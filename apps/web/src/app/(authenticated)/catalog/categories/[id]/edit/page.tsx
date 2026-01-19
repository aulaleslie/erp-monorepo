"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditCategoryPage() {
    const t = useTranslations("categories");
    const { id } = useParams();

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
                    <CardHeader>
                        <CardTitle>{t("placeholders.formTitle")}</CardTitle>
                        <CardDescription>{t("placeholders.formDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Category edit form for ID: {id} will be implemented in C4D-FE-02.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
