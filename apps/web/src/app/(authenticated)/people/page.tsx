"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

export default function PeoplePage() {
    const t = useTranslations("people");

    return (
        <PermissionGuard
            requiredPermissions={["people.read"]}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noListPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <PageHeader
                    title={t("page.title")}
                    description={t("page.description")}
                />
                <EmptyState
                    title={t("placeholders.listTitle")}
                    description={t("placeholders.listDescription")}
                />
            </div>
        </PermissionGuard>
    );
}
