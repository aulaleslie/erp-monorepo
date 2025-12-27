"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tenantsService } from "@/services/tenants";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";

export default function CreateTenantPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { isSuperAdmin } = usePermissions();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
    });
    const [errors, setErrors] = useState<Record<string, string | string[]>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await tenantsService.create(formData);
            toast({
                title: "Success",
                description: "Tenant created successfully. It is initially disabled.",
            });
            router.push("/platform/tenants");
        } catch (error: any) {
            const responseData = error.response?.data;
            const errorMessage = responseData?.message || "Failed to create tenant.";

            if (responseData?.errors) {
                setErrors(responseData.errors);
            } else {
                setErrors({ form: errorMessage });
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>You do not have permission to create tenants.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <PageHeader
                title="Create Tenant"
                description="Create a new tenant organization."
            />

            <form onSubmit={handleSubmit} className="space-y-8 border p-6 rounded-md">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Tenant Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: "" });
                            }}
                            placeholder="e.g. Acme Corp"
                            className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500 mt-1">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL Identifier)</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => {
                                setFormData({ ...formData, slug: e.target.value });
                                if (errors.slug) setErrors({ ...errors, slug: "" });
                            }}
                            placeholder="e.g. acme-corp"
                            className={errors.slug ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.slug && (
                            <p className="text-sm text-red-500 mt-1">{Array.isArray(errors.slug) ? errors.slug[0] : errors.slug}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Unique identifier for the tenant, used in URLs.</p>
                    </div>
                </div>

                {errors.form && (
                    <Alert variant="destructive">
                        <AlertDescription>{errors.form}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Tenant
                    </Button>
                </div>
            </form>
        </div>
    );
}
