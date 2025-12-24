"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./select-tenant.module.css";
import { ChevronRight } from "lucide-react";

interface Tenant {
    id: string;
    name: string;
    slug: string;
}

export default function SelectTenantPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const { refreshAuth } = useAuth(); // We might need this to redirect if user not logged in, but better to use AuthGuard logic or just fetch.
    // Actually, this page should be protected. If fetch fails (401), we redirect.

    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
                    const data = await res.json();
                    setTenants(data);
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
                await refreshAuth(); // Updating active tenant in context
                router.push("/app/dashboard");
            } else {
                console.error("Failed to set active tenant");
            }
        } catch (error) {
            console.error("Error setting tenant", error);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Select Workspace</h1>
                    <p className={styles.subtitle}>Choose which organization you want to access</p>
                </div>

                {loading ? (
                    <div className={styles.loading}>Loading workspaces...</div>
                ) : tenants.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No workspaces found.</p>
                        <p className="text-sm mt-2">Please contact your administrator.</p>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {tenants.map((tenant) => (
                            <div
                                key={tenant.id}
                                className={styles.tenantItem}
                                onClick={() => handleSelect(tenant.id)}
                            >
                                <div className={styles.tenantInfo}>
                                    <span className={styles.tenantName}>{tenant.name}</span>
                                    <span className={styles.tenantSlug}>{tenant.slug}</span>
                                </div>
                                <ChevronRight className={styles.arrow} size={20} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
