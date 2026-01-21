"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePagination } from "@/hooks/use-pagination";
import { categoriesService, CategoryListItem } from "@/services/categories";
import { CategoriesTable } from "@/components/features/catalog/CategoriesTable";

export default function CategoriesPage() {
    const t = useTranslations("categories");
    const pagination = usePagination();
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<CategoryListItem[]>([]);
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            pagination.setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, pagination]);

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await categoriesService.list({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch || undefined,
            });
            setData(response.items);
            pagination.setTotal(response.total);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, debouncedSearch]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <PermissionGuard
            requiredPermissions={["categories.read"]}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noListPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <PageHeader
                        title={t("page.title")}
                        description={t("page.description")}
                    />
                    <div className="flex items-center gap-2">
                        <PermissionGuard requiredPermissions={["categories.create"]}>
                            <Button asChild>
                                <Link href="/catalog/categories/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t("buttons.new")}
                                </Link>
                            </Button>
                        </PermissionGuard>
                    </div>
                </div>

                <div className="flex items-center gap-2 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("list.filters.searchPlaceholder")}
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <CategoriesTable
                    data={data}
                    loading={loading}
                    pagination={pagination}
                    onRefresh={fetchData}
                />
            </div>
        </PermissionGuard>
    );
}
