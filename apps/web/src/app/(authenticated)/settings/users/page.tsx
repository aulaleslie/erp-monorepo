"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usersService, TenantUser } from "@/services/users";
import { Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";
import { DataTable, Column } from "@/components/common/DataTable";
import { usePagination } from "@/hooks/use-pagination";
import { ActionButtons } from "@/components/common/ActionButtons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getApiErrorMessage } from "@/lib/api";

export default function UsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);
    const pagination = usePagination();

    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const { toast } = useToast();
    const t = useTranslations("users");

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await usersService.getAll(pagination.page, pagination.limit);
            // Filter out superadmin users unless the current user is a superadmin
            const filteredUsers = user?.isSuperAdmin
                ? data.items
                : data.items.filter((tenantUser) => !tenantUser.role?.isSuperAdmin);
            setUsers(filteredUsers);
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
    }, [pagination, t, toast, user?.isSuperAdmin]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            await usersService.remove(userToDelete);
            toast({
                title: t("toast.removeSuccess.title"),
                description: t("toast.removeSuccess.description"),
            });
            fetchUsers();
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: t("toast.removeError.title"),
                description: message || t("toast.removeError.description"),
                variant: "destructive",
            });
        } finally {
            setUserToDelete(null);
        }
    };

    const columns: Column<TenantUser>[] = useMemo(() => [
        {
            header: t("table.headers.email"),
            accessorKey: "userId", // Use userId as key but render email manually since it's nested
            cell: (row) => <span className="font-medium">{row.user?.email || "N/A"}</span>,
        },
        {
            header: t("table.headers.fullName"),
            cell: (row) => row.user?.fullName || "-",
        },
        {
            header: t("table.headers.role"),
            cell: (row) => row.role ? (
                <Badge variant={row.role.isSuperAdmin ? "default" : "secondary"}>
                    {row.role.name}
                </Badge>
            ) : "-",
        },
        {
            header: t("table.headers.status"),
            cell: (row) => <StatusBadge status={row.user?.status || "Unknown"} />,
        },
        {
            header: t("table.headers.actions"),
            className: "w-[150px]",
            cell: (row) => (
                <ActionButtons
                    viewUrl={`/settings/users/${row.userId}`}
                    editUrl={`/settings/users/${row.userId}/edit`}
                    onDelete={() => setUserToDelete(row.userId)}
                    permissions={{
                        edit: ['users.assignRole'],
                        delete: ['users.delete'],
                    }}
                />
            ),
        },
    ], [t]);

    return (
        <PermissionGuard
            requiredPermissions={['users.read']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <PageHeader
                        title={t("page.title")}
                        description={t("page.description")}
                    />
                    <div className="flex gap-2">
                        <PermissionGuard requiredPermissions={['users.create']}>
                            <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                {t("buttons.invite")}
                            </Button>
                            <Button asChild>
                                <Link href="/settings/users/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t("buttons.create")}
                                </Link>
                            </Button>
                        </PermissionGuard>
                    </div>
                </div>

                <DataTable
                    data={users}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    emptyMessage={t("empty.message")}
                    rowKey={(user) => user.userId}
                />

                <ConfirmDialog
                    open={!!userToDelete}
                    onOpenChange={(open) => !open && setUserToDelete(null)}
                    title={t("confirm.remove.title")}
                    description={t("confirm.remove.description")}
                    onConfirm={confirmDelete}
                    confirmLabel={t("confirm.remove.confirmLabel")}
                    variant="destructive"
                />

                <InviteUserDialog
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                    onSuccess={fetchUsers}
                />
            </div>
        </PermissionGuard>
    );
}
