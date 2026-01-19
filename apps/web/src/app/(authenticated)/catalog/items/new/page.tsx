"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

                <Card>
                    <CardHeader>
                        <CardTitle>{t("placeholders.formTitle")}</CardTitle>
                        <CardDescription>{t("placeholders.formDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Item creation form will be implemented in C4D-FE-03.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
