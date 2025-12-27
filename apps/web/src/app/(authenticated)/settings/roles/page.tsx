"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { rolesService, Role } from "@/services/roles";
import { Check, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { DataTable, Column } from "@/components/common/DataTable";
import { usePagination } from "@/hooks/use-pagination";
import { ActionButtons } from "@/components/common/ActionButtons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const pagination = usePagination();

    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchRoles();
    }, [pagination.page]);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const data: any = await rolesService.getAll(pagination.page, pagination.limit);
            if (data.items) {
                setRoles(data.items);
                pagination.setTotal(data.total);
            } else {
                setRoles(data);
                pagination.setTotal(data.length);
            }
        } catch (error) {
            toast({
                title: "Error fetching roles",
                description: "Failed to load roles list.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!roleToDelete) return;

        try {
            await rolesService.delete(roleToDelete);
            toast({
                title: "Role deleted",
                description: "The role has been successfully deleted.",
            });
            fetchRoles();
        } catch (error) {
            toast({
                title: "Error deleting role",
                description: "Failed to delete the role.",
                variant: "destructive",
            });
        } finally {
            setRoleToDelete(null);
        }
    };

    const columns: Column<Role>[] = useMemo(() => [
        {
            header: "Name",
            accessorKey: "name",
            className: "font-medium",
        },
        {
            header: "Super Admin",
            cell: (role) => role.isSuperAdmin ? (
                <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-1" /> Yes
                </div>
            ) : (
                <div className="flex items-center text-muted-foreground">
                    <X className="h-4 w-4 mr-1" /> No
                </div>
            ),
        },
        {
            header: "Actions",
            className: "w-[150px]",
            cell: (role) => (
                <ActionButtons
                    viewUrl={`/settings/roles/${role.id}`}
                    editUrl={`/settings/roles/${role.id}/edit`}
                    onDelete={!role.isSuperAdmin ? () => setRoleToDelete(role.id) : undefined}
                    permissions={{
                        edit: ['roles.update'],
                        delete: ['roles.delete'],
                    }}
                />
            ),
        },
    ], []);

    return (
        <PermissionGuard
            requiredPermissions={['roles.read']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to view roles.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <PageHeader
                        title="Roles Management"
                        description="Manage roles and their permissions here."
                    />
                    <PermissionGuard requiredPermissions={['roles.create']}>
                        <Button asChild>
                            <Link href="/settings/roles/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Role
                            </Link>
                        </Button>
                    </PermissionGuard>
                </div>

                <DataTable
                    data={roles}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    emptyMessage="No roles found."
                />

                <ConfirmDialog
                    open={!!roleToDelete}
                    onOpenChange={(open) => !open && setRoleToDelete(null)}
                    title="Are you absolutely sure?"
                    description="This action cannot be undone. This will permanently delete the role and remove permissions from any users assigned to it."
                    onConfirm={confirmDelete}
                    confirmLabel="Delete"
                    variant="destructive"
                />
            </div>
        </PermissionGuard>
    );
}
