"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TenantTaxForm } from "@/components/features/settings/tenant-tax-form";
import { usePermissions } from "@/hooks/use-permissions";

export default function TenantTaxSettingsPage() {
    const { isSuperAdmin } = usePermissions();

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Only Super Admins can manage tenant tax settings.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tax Settings"
                description="Manage applicable taxes and default tax settings for your tenant."
            />
            <div className="max-w-4xl">
                <TenantTaxForm />
            </div>
        </div>
    );
}
