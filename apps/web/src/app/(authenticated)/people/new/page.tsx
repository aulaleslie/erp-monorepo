"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

export default function NewPersonPage() {
    const t = useTranslations("people");

    return (
        <PermissionGuard
            requiredPermissions={["people.create"]}
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
                <EmptyState
                    title={t("placeholders.formTitle")}
                    description={t("placeholders.formDescription")}
                />
            </div>
        </PermissionGuard>
    );
}
