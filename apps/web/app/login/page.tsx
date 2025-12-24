"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./login.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { refreshAuth } = useAuth();
    const router = useRouter();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
                credentials: "include", // Important for cookies
            });

            if (!res.ok) {
                throw new Error("Invalid credentials");
            }

            // Refresh auth state to get user and potentially active tenant
            await refreshAuth();

            // Determine where to go
            // We can't immediately check 'activeTenant' from context because closure might be stale depending on how refreshAuth updates
            // However, after await refreshAuth(), the context should have updated if we could access it. 
            // Instead, we can fetch active tenant explicitly or just go to select-tenant.
            // Easiest is to go to select-tenant, which will redirect to app if active is set. (We'll implement that logic there)
            // OR we can default to /select-tenant

            router.push("/select-tenant");

        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome back</h1>
                    <p className={styles.subtitle}>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.field}>
                        <label htmlFor="email" className={styles.label}>Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            placeholder="admin@gym.com"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
