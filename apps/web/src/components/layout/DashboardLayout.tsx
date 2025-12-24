"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import styles from "./dashboard-layout.module.css";

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className={styles.container}>
            <Sidebar />
            <div className={styles.main}>
                <Navbar />
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
};
