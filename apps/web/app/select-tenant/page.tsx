"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Building } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";

interface Tenant {
    id: string;
    name: string;
    slug: string;
}

export default function SelectTenantPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const { refreshAuth } = useAuth();
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const res = await fetch(`${API_URL}/tenants/my`, {
                    credentials: "include",
                });
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                if (res.ok) {
                    const responseData = await res.json();
                    const tenantList = responseData.data || [];

                    // If user has no tenants, redirect to dashboard directly
                    if (tenantList.length === 0) {
                        router.push("/app/dashboard");
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
            const res = await fetch(`${API_URL}/tenants/active`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId }),
                credentials: "include",
            });

            if (res.ok) {
                await refreshAuth();
                router.push("/app/dashboard");
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
                    <CardTitle className="text-2xl font-bold">Select Workspace</CardTitle>
                    <CardDescription>Choose which organization you want to access</CardDescription>
                </CardHeader>
                <CardContent>
                    {tenants.length === 0 ? (
                        <EmptyState
                            icon={Building}
                            title="No workspaces found"
                            description="Please contact your administrator."
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
