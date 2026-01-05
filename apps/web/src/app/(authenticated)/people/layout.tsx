"use client";

import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

const peoplePermissions = [
    "people.read",
    "people.create",
    "people.update",
    "people.delete",
];

export default function PeopleLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations("people");

    return (
        <PermissionGuard
            requiredPermissions={peoplePermissions}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noAccess")}</AlertDescription>
                </Alert>
            }
        >
            {children}
        </PermissionGuard>
    );
}
