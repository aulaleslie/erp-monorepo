"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, Users, Building, LucideIcon, ChevronDown } from "lucide-react";
import { PermissionGuard } from "../guards/PermissionGuard";
import styles from "./sidebar.module.css";

interface SidebarItem {
    label: string;
    icon?: LucideIcon;
    href: string;
    permissions?: string[];
    superAdminOnly?: boolean;
    children?: SidebarItem[];
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

const SidebarSectionComponent = ({ item }: { item: SidebarSection }) => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(
        // Default open if not collapsible, or if active child
        !item.collapsible || item.children?.some(child => pathname === child.href)
    );

    // Auto-open if a child becomes active
    useEffect(() => {
        if (item.collapsible && item.children?.some(child => pathname === child.href)) {
            setIsOpen(true);
        }
    }, [pathname, item.collapsible, item.children]);

    const toggle = () => {
        if (item.collapsible) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className={styles.section}>
            <div
                className={item.collapsible ? styles.collapsibleHeader : styles.sectionLabel}
                onClick={toggle}
            >
                <span>{item.label}</span>
                {item.collapsible && (
                    <ChevronDown
                        size={16}
                        className={`${styles.chevron} ${!isOpen ? styles.rotate : ''}`}
                    />
                )}
            </div>
            {isOpen && item.children?.map((child, cIndex) => {
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
};

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
                        const Section = <SidebarSectionComponent key={index} item={item as SidebarSection} />;

                        if (item.superAdminOnly) {
                            return (
                                <PermissionGuard key={index} requiredPermissions={['__SUPER_ADMIN_ONLY__']}>
                                    {Section}
                                </PermissionGuard>
                            );
                        }
                        return Section;
                    }

                    // Single item
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
