"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./navbar.module.css";
import Link from "next/link";

export const Navbar = () => {
    const { user, activeTenant, refreshAuth } = useAuth();
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
            await refreshAuth();
            router.push("/login"); // or refreshAuth handles it if user becomes null? but explicit redirect is safer
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const initials = user?.fullName
        ? user.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
        : "U";

    return (
        <header className={styles.navbar}>
            <div className={styles.left}>
                <Link href="/select-tenant" className={styles.tenantSelector}>
                    {activeTenant ? activeTenant.name : "Select Tenant"}
                    <ChevronDown size={16} />
                </Link>
            </div>

            <div className={styles.right}>
                <div className={styles.userMenu}>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.fullName}</span>
                        {user?.isSuperAdmin && <span className={styles.userRole}>Super Admin</span>}
                    </div>
                    <div className={styles.avatar}>
                        {initials}
                    </div>
                </div>

                <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};
