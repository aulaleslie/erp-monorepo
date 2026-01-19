"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ItemsPage() {
    const t = useTranslations("items");

    return (
        <PermissionGuard
            requiredPermissions={["items.read"]}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noListPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <PageHeader
                        title={t("page.title")}
                        description={t("page.description")}
                    />
                    <div className="flex gap-2">
                        <PermissionGuard requiredPermissions={["items.create"]}>
                            <Button asChild>
                                <Link href="/catalog/items/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t("buttons.new")}
                                </Link>
                            </Button>
                        </PermissionGuard>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("placeholders.listTitle")}</CardTitle>
                        <CardDescription>{t("placeholders.listDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Full items list with filters, search, and actions will be implemented in C4D-FE-03.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
