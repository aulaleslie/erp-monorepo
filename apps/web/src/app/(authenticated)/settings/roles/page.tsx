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
import { useTranslations } from "next-intl";

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const pagination = usePagination();

    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
    const { toast } = useToast();
    const t = useTranslations("roles");

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
                title: t("toast.fetchError.title"),
                description: t("toast.fetchError.description"),
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
                title: t("toast.deleteSuccess.title"),
                description: t("toast.deleteSuccess.description"),
            });
            fetchRoles();
        } catch (error) {
            toast({
                title: t("toast.deleteError.title"),
                description: t("toast.deleteError.description"),
                variant: "destructive",
            });
        } finally {
            setRoleToDelete(null);
        }
    };

    const columns: Column<Role>[] = useMemo(() => [
        {
            header: t("table.name"),
            accessorKey: "name",
            className: "font-medium",
        },
        {
            header: t("table.superAdmin"),
            cell: (role) => role.isSuperAdmin ? (
                <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-1" /> {t('labels.yes')}
                </div>
            ) : (
                <div className="flex items-center text-muted-foreground">
                    <X className="h-4 w-4 mr-1" /> {t('labels.no')}
                </div>
            ),
        },
        {
            header: t("table.actions"),
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
    ], [t]);

    return (
        <PermissionGuard
            requiredPermissions={['roles.read']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t('alert.noPermission')}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <PageHeader
                        title={t('pageTitle')}
                        description={t('pageDescription')}
                    />
                    <PermissionGuard requiredPermissions={['roles.create']}>
                        <Button asChild>
                            <Link href="/settings/roles/create">
                                <Plus className="mr-2 h-4 w-4" />
                                {t('buttons.create')}
                            </Link>
                        </Button>
                    </PermissionGuard>
                </div>

                <DataTable
                    data={roles}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    emptyMessage={t('emptyState')}
                />

                <ConfirmDialog
                    open={!!roleToDelete}
                    onOpenChange={(open) => !open && setRoleToDelete(null)}
                    title={t('confirm.title')}
                    description={t('confirm.description')}
                    onConfirm={confirmDelete}
                    confirmLabel={t('confirm.confirmLabel')}
                    variant="destructive"
                />
            </div>
        </PermissionGuard>
    );
}
