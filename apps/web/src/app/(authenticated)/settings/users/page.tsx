"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usersService, TenantUser } from "@/services/users";
import { Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";
import { DataTable, Column } from "@/components/common/DataTable";
import { usePagination } from "@/hooks/use-pagination";
import { ActionButtons } from "@/components/common/ActionButtons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function UsersPage() {
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);
    const pagination = usePagination();

    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, [pagination.page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await usersService.getAll(pagination.page, pagination.limit);
            setUsers(data.items);
            pagination.setTotal(data.total);
        } catch (error) {
            toast({
                title: "Error fetching users",
                description: "Failed to load users list.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            await usersService.remove(userToDelete);
            toast({
                title: "User removed",
                description: "The user has been removed from this tenant.",
            });
            fetchUsers();
        } catch (error) {
            toast({
                title: "Error removing user",
                description: "Failed to remove the user.",
                variant: "destructive",
            });
        } finally {
            setUserToDelete(null);
        }
    };

    const columns: Column<TenantUser>[] = useMemo(() => [
        {
            header: "Email",
            accessorKey: "userId", // Use userId as key but render email manually since it's nested
            cell: (row) => <span className="font-medium">{row.user?.email || "N/A"}</span>,
        },
        {
            header: "Full Name",
            cell: (row) => row.user?.fullName || "-",
        },
        {
            header: "Role",
            cell: (row) => row.role ? (
                <Badge variant={row.role.isSuperAdmin ? "default" : "secondary"}>
                    {row.role.name}
                </Badge>
            ) : "-",
        },
        {
            header: "Status",
            cell: (row) => <StatusBadge status={row.user?.status || "Unknown"} />,
        },
        {
            header: "Actions",
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
    ], []);

    return (
        <PermissionGuard
            requiredPermissions={['users.read']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to view users.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <PageHeader
                        title="User Management"
                        description="Manage users and assign roles here."
                    />
                    <div className="flex gap-2">
                        <PermissionGuard requiredPermissions={['users.create']}>
                            <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Invite User
                            </Button>
                            <Button asChild>
                                <Link href="/settings/users/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create User
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
                    emptyMessage="No users found."
                    rowKey={(user) => user.userId}
                />

                <ConfirmDialog
                    open={!!userToDelete}
                    onOpenChange={(open) => !open && setUserToDelete(null)}
                    title="Remove user from tenant?"
                    description="This will remove the user from this tenant. The user account will still exist and can be invited back later."
                    onConfirm={confirmDelete}
                    confirmLabel="Remove"
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
