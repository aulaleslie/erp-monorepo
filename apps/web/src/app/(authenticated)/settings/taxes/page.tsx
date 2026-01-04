"use client";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagination } from "@/hooks/use-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tax, TaxStatus, TaxType, taxesService } from "@/services/taxes";
import { format } from "date-fns";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { TaxFormDialog } from "./tax-form-dialog";

export default function TaxesPage() {
    const { isSuperAdmin } = usePermissions();
    const { toast } = useToast();
    const pagination = usePagination();
    const t = useTranslations("taxes");
    const [data, setData] = useState<Tax[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TaxStatus | "ALL">("ALL");

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<Tax | null>(null);
    const [deletingTax, setDeletingTax] = useState<Tax | null>(null);

    const lockedActionMessage = t("filters.lockedAction");

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await taxesService.getAll({
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
                status: statusFilter === "ALL" ? undefined : statusFilter,
            });
            setData(response.items);
            pagination.setTotal(response.total);
        } catch {
            toast({
                title: t("toast.loadError.title"),
                description: t("toast.loadError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isSuperAdmin) {
            setLoading(false);
            return;
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, pagination.limit, search, statusFilter, isSuperAdmin]);

    const handleDelete = async () => {
        if (!deletingTax) return;
        try {
            await taxesService.delete(deletingTax.id);
            toast({
                title: t("toast.disableSuccess.title"),
                description: t("toast.disableSuccess.description"),
            });
            fetchData();
        } catch {
            toast({
                title: t("toast.disableError.title"),
                description: t("toast.disableError.description"),
                variant: "destructive",
            });
        } finally {
            setDeletingTax(null);
        }
    };

    const columns = [
        {
            accessorKey: "name" as keyof Tax,
            header: t("table.name"),
        },
        {
            accessorKey: "code" as keyof Tax,
            header: t("table.code"),
            cell: (tax: Tax) => tax.code || "-",
        },
        {
            accessorKey: "type" as keyof Tax,
            header: t("table.type"),
            cell: (tax: Tax) =>
                tax.type === TaxType.PERCENTAGE
                    ? t("table.typeValues.percentage")
                    : t("table.typeValues.fixed"),
        },
        {
            id: "value",
            header: t("table.value"),
            cell: (tax: Tax) => {
                if (tax.type === TaxType.PERCENTAGE) {
                    return `${((tax.rate || 0) * 100).toFixed(2)}%`;
                }
                return new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                }).format(tax.amount || 0);
            },
        },
        {
            accessorKey: "status" as keyof Tax,
            header: t("table.status"),
            cell: (tax: Tax) => <StatusBadge status={tax.status} />,
        },
        {
            accessorKey: "updatedAt" as keyof Tax,
            header: t("table.lastUpdated"),
            cell: (tax: Tax) => format(new Date(tax.updatedAt), "dd MMM yyyy HH:mm"),
        },
        {
            header: t("table.actions"),
            cell: (tax: Tax) => {
                const isLocked = (tax.tenantUsageCount ?? 0) > 0;

                const editButton = (
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLocked}
                        onClick={() => {
                            if (isLocked) return;
                            setEditingTax(tax);
                            setIsCreateOpen(true);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                );

                const deleteButton = (
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLocked}
                        onClick={() => {
                            if (isLocked) return;
                            setDeletingTax(tax);
                        }}
                        className={cn(
                            "text-destructive hover:text-destructive",
                            isLocked && "text-muted-foreground"
                        )}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                );

                const withLockTooltip = (button: ReactElement) => (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-flex">{button}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[240px] text-xs">
                            {lockedActionMessage}
                        </TooltipContent>
                    </Tooltip>
                );

                return (
                    <TooltipProvider>
                        <div className="flex items-center gap-2">
                            {isLocked ? withLockTooltip(editButton) : editButton}
                            {isLocked ? withLockTooltip(deleteButton) : deleteButton}
                        </div>
                    </TooltipProvider>
                );
            },
        },
    ];

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{t("guards.superAdminOnly")}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("page.title")}
                description={t("page.description")}
            >
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("buttons.add")}
                </Button>
            </PageHeader>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("filters.searchPlaceholder")}
                        className="pl-8"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            pagination.setPage(1);
                        }}
                    />
                </div>
                <Select
                    value={statusFilter}
                    onValueChange={(val: TaxStatus | "ALL") => {
                        setStatusFilter(val);
                        pagination.setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("filters.statusPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">{t("filters.status.all")}</SelectItem>
                        <SelectItem value={TaxStatus.ACTIVE}>{t("filters.status.active")}</SelectItem>
                        <SelectItem value={TaxStatus.INACTIVE}>{t("filters.status.inactive")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                pagination={pagination}
            />

            <TaxFormDialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) setEditingTax(null);
                }}
                tax={editingTax}
                onSuccess={fetchData}
            />

            <ConfirmDialog
                open={!!deletingTax}
                onOpenChange={(open) => !open && setDeletingTax(null)}
                title={t("dialogs.disable.title")}
                description={t("dialogs.disable.description", { name: deletingTax?.name ?? "" })}
                onConfirm={handleDelete}
                confirmLabel={t("dialogs.disable.confirmLabel")}
                variant="destructive"
            />
        </div>
    );
}
