"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Building } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { usePermissions } from "@/hooks/use-permissions";
import { getSidebarAccessForPath } from "@/components/layout/sidebar-config";
import { useTranslations } from "next-intl";

interface Tenant {
    id: string;
    name: string;
    slug: string;
}

interface UserTenant {
    tenant: Tenant;
    role: { id: string; name: string; isSuperAdmin: boolean } | null;
}

const normalizeRedirectPath = (path: string | null) => {
    if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
    if (path.startsWith("/select-tenant") || path.startsWith("/login")) return null;
    return path;
};

export default function SelectTenantPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
    const { refreshAuth, isLoading } = useAuth();
    const { isSuperAdmin, canAny } = usePermissions();
    const t = useTranslations("selectTenant");
    const router = useRouter();
    const searchParams = useSearchParams();
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

    useEffect(() => {
        if (!pendingRedirect || isLoading) return;
        const normalizedPath = normalizeRedirectPath(pendingRedirect);
        if (!normalizedPath) {
            router.push("/dashboard");
            setPendingRedirect(null);
            return;
        }

        const access = getSidebarAccessForPath(normalizedPath);
        if (!access) {
            router.push(normalizedPath);
            setPendingRedirect(null);
            return;
        }

        if (isSuperAdmin) {
            router.push(access.href);
            setPendingRedirect(null);
            return;
        }

        if (access.superAdminOnly) {
            router.push("/dashboard");
            setPendingRedirect(null);
            return;
        }

        const target = access.permissions.length === 0 || canAny(access.permissions)
            ? access.href
            : "/dashboard";
        router.push(target);
        setPendingRedirect(null);
    }, [pendingRedirect, isLoading, router, isSuperAdmin, canAny]);

    const normalizeTenants = (data: unknown): Tenant[] => {
        if (!Array.isArray(data)) return [];

        return data
            .map((item) => {
                if (!item || typeof item !== "object") return null;

                if ("tenant" in item) {
                    const tenant = (item as UserTenant).tenant;
                    if (tenant?.id) {
                        return {
                            id: tenant.id,
                            name: tenant.name,
                            slug: tenant.slug,
                        };
                    }
                }

                if ("id" in item) {
                    const tenant = item as Tenant;
                    if (tenant?.id) {
                        return {
                            id: tenant.id,
                            name: tenant.name,
                            slug: tenant.slug,
                        };
                    }
                }

                return null;
            })
            .filter((tenant): tenant is Tenant => tenant !== null);
    };

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const res = await fetch(`${API_URL}/me/tenants`, {
                    credentials: "include",
                });
                if (res.status === 401) {
                    console.error("Unauthorized access to tenants");
                    // Do not redirect to login here if we believe we are authenticated.
                    // Let the AuthContext/Guard handle global session state.
                    // If we redirect here, we risk a loop if AuthContext thinks we are logged in.
                    setLoading(false);
                    return;
                }
                if (res.ok) {
                    const responseData = await res.json();
                    const tenantList = normalizeTenants(responseData.data);

                    // If user has no tenants, redirect to dashboard directly
                    if (tenantList.length === 0) {
                        router.push("/dashboard");
                        return;
                    }

                    setTenants(tenantList);
                }
            } catch (error) {
                console.error("Failed to fetch tenants", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, [API_URL, router]);

    const handleSelect = async (tenantId: string) => {
        try {
            const res = await fetch(`${API_URL}/me/tenants/active`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId }),
                credentials: "include",
            });

            if (res.ok) {
                await refreshAuth();
                const redirectPath = normalizeRedirectPath(searchParams.get("redirect"));
                setPendingRedirect(redirectPath || "/dashboard");
            } else {
                console.error("Failed to set active tenant");
            }
        } catch (error) {
            console.error("Error setting tenant", error);
        }
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingState /></div>;

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
                    <CardDescription>{t('description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {tenants.length === 0 ? (
                        <EmptyState
                            icon={Building}
                            title={t('noWorkspaces')}
                            description={t('emptyDescription')}
                        />
                    ) : (
                        <div className="space-y-2">
                            {tenants.map((tenant) => (
                                <Button
                                    key={tenant.id}
                                    variant="outline"
                                    className="w-full justify-between h-auto py-4 px-4"
                                    onClick={() => handleSelect(tenant.id)}
                                >
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-semibold">{tenant.name}</span>
                                        <span className="text-xs text-muted-foreground">{tenant.slug}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
