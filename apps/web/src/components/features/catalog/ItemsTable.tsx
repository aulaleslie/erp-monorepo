"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Edit2, Trash2, MoreHorizontal, Eye } from "lucide-react";
import Link from "next/link";

import {
    ItemListItem,
    ItemStatus,
    itemsService
} from "@/services/items";
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
import { getApiErrorMessage } from "@/lib/api";

interface ItemsTableProps {
    data: ItemListItem[];
    loading?: boolean;
    pagination?: UsePaginationReturn;
    onRefresh?: () => void;
}

export function ItemsTable({
    data,
    loading,
    pagination,
    onRefresh,
}: ItemsTableProps) {
    const t = useTranslations("items");
    const { toast } = useToast();
    const { can } = usePermissions();

    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [deleting, setDeleting] = React.useState(false);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            setDeleting(true);
            await itemsService.remove(deleteId);
            toast({
                title: t("toast.deleteSuccess.title"),
                description: t("toast.deleteSuccess.description"),
            });
            onRefresh?.();
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: t("toast.error.title"),
                description: message || t("toast.error.description"),
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const columns: Column<ItemListItem>[] = [
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
            header: t("list.table.headers.type"),
            cell: (item) => (
                <Badge variant="outline">
                    {item.type}
                    {item.serviceKind && ` (${item.serviceKind})`}
                </Badge>
            ),
        },
        {
            header: t("list.table.headers.price"),
            cell: (item) => formatPrice(item.price),
        },
        {
            header: t("list.table.headers.status"),
            cell: (item) => (
                <Badge
                    variant={
                        item.status === ItemStatus.ACTIVE ? "default" : "secondary"
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
                const canRead = can("items.read");
                const canUpdate = can("items.update");
                const canDelete = can("items.delete");

                if (!canRead && !canUpdate && !canDelete) return null;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canRead && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/catalog/items/${item.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        {t("buttons.view")}
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            {canUpdate && (
                                <DropdownMenuItem asChild>
                                    <Link href={`/catalog/items/${item.id}/edit`}>
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
                            {t("buttons.cancel")}
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
