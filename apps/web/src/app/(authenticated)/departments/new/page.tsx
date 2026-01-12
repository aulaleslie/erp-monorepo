"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DepartmentForm } from "@/components/departments/DepartmentForm";

export default function CreateDepartmentPage() {
    const t = useTranslations("departments");

    return (
        <PermissionGuard
            requiredPermissions={["departments.create"]}
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
                <DepartmentForm mode="create" />
            </div>
        </PermissionGuard>
    );
}
