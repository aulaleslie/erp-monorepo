"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Edit2, Trash2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import {
    CategoryListItem,
    CategoryStatus,
    categoriesService
} from "@/services/categories";
import { DataTable, Column } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { UsePaginationReturn } from "@/hooks/use-pagination";
import { usePermissions } from "@/hooks/use-permissions";

interface CategoriesTableProps {
    data: CategoryListItem[];
    loading?: boolean;
    pagination?: UsePaginationReturn;
    onRefresh?: () => void;
}

export function CategoriesTable({
    data,
    loading,
    pagination,
    onRefresh,
}: CategoriesTableProps) {
    const t = useTranslations("categories");
    const { toast } = useToast();
    const { can } = usePermissions();

    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [deleting, setDeleting] = React.useState(false);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            setDeleting(true);
            await categoriesService.remove(deleteId);
            toast({
                title: t("toast.deleteSuccess.title"),
                description: t("toast.deleteSuccess.description"),
            });
            onRefresh?.();
        } catch (error) {
            toast({
                title: t("toast.error.title"),
                description: t("toast.error.description"),
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const columns: Column<CategoryListItem>[] = [
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
            header: t("list.table.headers.parent"),
            cell: (item) => item.parent?.name || "-",
        },
        {
            header: t("list.table.headers.status"),
            cell: (item) => (
                <Badge
                    variant={
                        item.status === CategoryStatus.ACTIVE ? "default" : "secondary"
                    }
                >
                    {item.status}
                </Badge>
            ),
        },
        {
            header: t("list.table.headers.actions"),
            className: "text-right",
            cell: (item) => {
                const canUpdate = can("categories.update");
                const canDelete = can("categories.delete");

                if (!canUpdate && !canDelete) return null;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canUpdate && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/catalog/categories/${item.id}/edit`}>
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        {t("buttons.edit")}
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteId(item.id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("confirm.delete.confirmLabel")}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <>
            <DataTable
                data={data}
                columns={columns}
                loading={loading}
                pagination={pagination}
                emptyMessage={t("list.table.empty")}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("confirm.delete.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("confirm.delete.description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            {t("form.buttons.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleting}
                        >
                            {deleting ? (
                                <span className="flex items-center">
                                    <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("confirm.delete.confirmLabel")}
                                </span>
                            ) : (
                                t("confirm.delete.confirmLabel")
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
