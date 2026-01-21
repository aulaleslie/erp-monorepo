"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { ActionButtons } from "@/components/common/ActionButtons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { departmentsService, DepartmentListItem } from "@/services/departments";
import { DepartmentStatus } from "@gym-monorepo/shared";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getApiErrorMessage } from "@/lib/api";

export default function DepartmentsPage() {
    const t = useTranslations("departments");
    const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const pagination = usePagination({ initialLimit: 10 });
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<DepartmentStatus | "">("");
    const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchDepartments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await departmentsService.list({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch || undefined,
                status: statusFilter || undefined,
            });
            setDepartments(data.items);
            pagination.setTotal(data.total);
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: t("toast.fetchError.title"),
                description: message || t("toast.fetchError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, pagination, statusFilter, t, toast]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const handleDelete = async () => {
        if (!departmentToDelete) return;
        try {
            await departmentsService.remove(departmentToDelete);
            toast({
                title: t("toast.deleteSuccess.title"),
                description: t("toast.deleteSuccess.description"),
            });
            fetchDepartments();
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: t("toast.deleteError.title"),
                description: message || t("toast.deleteError.description"),
                variant: "destructive",
            });
        } finally {
            setDepartmentToDelete(null);
        }
    };

    const statusOptions = useMemo(
        () => [
            { value: "", label: t("statuses.any") },
            { value: DepartmentStatus.ACTIVE, label: t("statuses.active") },
            { value: DepartmentStatus.INACTIVE, label: t("statuses.inactive") },
        ],
        [t]
    );

    const columns: Column<DepartmentListItem>[] = useMemo(
        () => [
            {
                header: t("list.table.headers.code"),
                accessorKey: "code",
                className: "font-medium",
            },
            {
                header: t("list.table.headers.name"),
                accessorKey: "name",
            },
            {
                header: t("list.table.headers.status"),
                cell: (item) => <StatusBadge status={item.status} />,
            },
            {
                header: t("list.table.headers.actions"),
                className: "w-[150px]",
                cell: (item) => (
                    <ActionButtons
                        viewUrl={`/departments/${item.id}`}
                        editUrl={`/departments/${item.id}/edit`}
                        onDelete={() => setDepartmentToDelete(item.id)}
                        permissions={{
                            edit: ["departments.update"],
                            delete: ["departments.delete"],
                        }}
                    />
                ),
            },
        ],
        [t]
    );

    return (
        <PermissionGuard
            requiredPermissions={["departments.read"]}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noListPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <PageHeader
                        title={t("page.title")}
                        description={t("page.description")}
                    />
                    <div className="flex gap-2">
                        <PermissionGuard requiredPermissions={["departments.create"]}>
                            <Button asChild>
                                <Link href="/departments/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t("buttons.new")}
                                </Link>
                            </Button>
                        </PermissionGuard>
                    </div>
                </div>

                <div className="rounded-md border border-border bg-card p-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground">
                                {t("list.filters.search")}
                            </label>
                            <Input
                                placeholder={t("list.filters.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground">
                                {t("list.filters.status")}
                            </label>
                            <select
                                className="w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value as DepartmentStatus | "")
                                }
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <DataTable
                    data={departments}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    emptyMessage={t("list.table.empty")}
                    rowKey={(item) => item.id}
                />

                <ConfirmDialog
                    open={!!departmentToDelete}
                    onOpenChange={(open) => !open && setDepartmentToDelete(null)}
                    title={t("confirm.delete.title")}
                    description={t("confirm.delete.description")}
                    onConfirm={handleDelete}
                    confirmLabel={t("confirm.delete.confirmLabel")}
                    variant="destructive"
                />
            </div>
        </PermissionGuard>
    );
}
