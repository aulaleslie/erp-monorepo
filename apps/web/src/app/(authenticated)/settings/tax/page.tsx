"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { TenantTaxForm } from "@/components/features/settings/tenant-tax-form";

export default function TenantTaxSettingsPage() {
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
