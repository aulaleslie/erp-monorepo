"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, Users, Building, LucideIcon } from "lucide-react";
import { PermissionGuard } from "../guards/PermissionGuard";
import styles from "./sidebar.module.css";

interface SidebarItem {
    label: string;
    icon?: LucideIcon;
    href: string;
    permissions?: string[];
    superAdminOnly?: boolean;
    children?: SidebarItem[]; // Recursive definition not strictly needed based on structure but good to have
}

interface SidebarSection {
    label: string;
    icon?: LucideIcon;
    href?: string;
    collapsible?: boolean;
    children?: SidebarItem[];
    superAdminOnly?: boolean;
}

const sidebarConfig: (SidebarItem | SidebarSection)[] = [
    {
        label: 'Dashboard',
        icon: Home,
        href: '/app/dashboard',
    },
    {
        label: 'Settings',
        collapsible: true,
        children: [
            {
                label: 'Roles',
                icon: Shield,
                href: '/app/settings/roles',
                permissions: [
                    'roles.read',
                    'roles.create',
                    'roles.update',
                    'roles.delete',
                ],
            },
            {
                label: 'Users',
                icon: Users,
                href: '/app/settings/users',
                permissions: [
                    'users.read',
                    'users.create',
                    'users.update',
                    'users.assignRole',
                ],
            },
        ],
    },
    {
        label: 'Platform',
        superAdminOnly: true,
        children: [
            {
                label: 'Tenants',
                icon: Building,
                href: '/app/platform/tenants',
            },
        ],
    },
];

export const Sidebar = () => {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                Gym ERP
            </div>
            <nav className={styles.nav}>
                {sidebarConfig.map((item, index) => {
                    // Check if it's a section with children
                    if ('children' in item && item.children) {
                        const SectionContent = (
                            <div key={index} className={styles.section}>
                                <div className={styles.sectionLabel}>{item.label}</div>
                                {item.children.map((child, cIndex) => {
                                    const Item = (
                                        <Link key={cIndex} href={child.href} className={`${styles.link} ${pathname === child.href ? styles.active : ''}`}>
                                            {child.icon && <child.icon size={18} />}
                                            <span>{child.label}</span>
                                        </Link>
                                    );

                                    if (child.permissions) {
                                        return (
                                            <PermissionGuard key={cIndex} requiredPermissions={child.permissions}>
                                                {Item}
                                            </PermissionGuard>
                                        );
                                    }
                                    return Item;
                                })}
                            </div>
                        );

                        if (item.superAdminOnly) {
                            return (
                                <PermissionGuard key={index} requiredPermissions={['__SUPER_ADMIN_ONLY__']}>
                                    {SectionContent}
                                </PermissionGuard>
                            )
                        }
                        return SectionContent;
                    }

                    // Single item
                    // Need to cast or check to ensure it has href and icon if we access them
                    // based on config above, top level items without children have href.
                    const singleItem = item as SidebarItem;

                    return (
                        <Link key={index} href={singleItem.href} className={`${styles.link} ${pathname === singleItem.href ? styles.active : ''}`}>
                            {singleItem.icon && <singleItem.icon size={18} />}
                            <span>{singleItem.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};
