"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
                    <CardHeader>
                        <CardTitle>{t("placeholders.formTitle")}</CardTitle>
                        <CardDescription>{t("placeholders.formDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Category creation form will be implemented in C4D-FE-02.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
