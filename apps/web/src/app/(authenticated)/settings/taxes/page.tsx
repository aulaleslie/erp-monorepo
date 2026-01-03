"use client";

import { ActionButtons } from "@/components/common/ActionButtons";
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
import { usePagination } from "@/hooks/use-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { Tax, TaxStatus, TaxType, taxesService } from "@/services/taxes";
import { format } from "date-fns";
import { Plus, Search, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { TaxFormDialog } from "./tax-form-dialog";

export default function TaxesPage() {
    const { isSuperAdmin } = usePermissions();
    const { toast } = useToast();
    const pagination = usePagination();
    const [data, setData] = useState<Tax[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TaxStatus | "ALL">("ALL");

    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<Tax | null>(null);
    const [deletingTax, setDeletingTax] = useState<Tax | null>(null);

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
                title: "Error",
                description: "Failed to load taxes",
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
                title: "Success",
                description: "Tax disabled successfully",
            });
            fetchData();
        } catch {
            toast({
                title: "Error",
                description: "Failed to disable tax",
                variant: "destructive",
            });
        } finally {
            setDeletingTax(null);
        }
    };

    const columns = [
        {
            accessorKey: "name" as keyof Tax,
            header: "Name",
        },
        {
            accessorKey: "code" as keyof Tax,
            header: "Code",
            cell: (tax: Tax) => tax.code || "-",
        },
        {
            accessorKey: "type" as keyof Tax,
            header: "Type",
            cell: (tax: Tax) =>
                tax.type === TaxType.PERCENTAGE ? "Percentage" : "Fixed",
        },
        {
            id: "value",
            header: "Rate / Amount",
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
            header: "Status",
            cell: (tax: Tax) => <StatusBadge status={tax.status} />,
        },
        {
            accessorKey: "updatedAt" as keyof Tax,
            header: "Last Updated",
            cell: (tax: Tax) => format(new Date(tax.updatedAt), "dd MMM yyyy HH:mm"),
        },
        {
            header: "Actions",
            cell: (tax: Tax) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setEditingTax(tax);
                            setIsCreateOpen(true);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <ActionButtons
                        onDelete={() => setDeletingTax(tax)}
                        deleteLabel="Disable"
                    />
                </div>
            ),
        },
    ];

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Only Super Admins can manage taxes.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Taxes"
                description="Manage platform taxes."
            >
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tax
                </Button>
            </PageHeader>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search taxes..."
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
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value={TaxStatus.ACTIVE}>Active</SelectItem>
                        <SelectItem value={TaxStatus.INACTIVE}>Inactive</SelectItem>
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
                title="Disable Tax"
                description={`Are you sure you want to disable "${deletingTax?.name}"? It will no longer be selectable for new settings.`}
                onConfirm={handleDelete}
                confirmLabel="Disable"
                variant="destructive"
            />
        </div>
    );
}
