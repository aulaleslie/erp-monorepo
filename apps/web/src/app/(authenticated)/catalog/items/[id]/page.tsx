"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";

export default function ItemDetailsPage() {
    const t = useTranslations("items");
    const { id } = useParams();

    return (
        <PermissionGuard
            requiredPermissions={["items.read"]}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noReadPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/catalog/items">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <PageHeader
                            title={t("detail.page.title")}
                            description={`ID: ${id}`}
                        />
                    </div>
                    <PermissionGuard requiredPermissions={["items.update"]}>
                        <Button asChild>
                            <Link href={`/catalog/items/${id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("buttons.edit")}
                            </Link>
                        </Button>
                    </PermissionGuard>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("placeholders.detailTitle")}</CardTitle>
                        <CardDescription>{t("placeholders.detailDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Item details view will be implemented in C4D-FE-03.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
