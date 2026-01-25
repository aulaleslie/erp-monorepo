"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Eye, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { InvoiceListFilters } from "@/components/sales/invoices/InvoiceListFilters";
import { salesInvoicesService, SalesInvoiceListItem, SalesInvoiceListParams } from "@/services/sales-invoices";
import { usePagination } from "@/hooks/use-pagination";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { DocumentStatus } from "@gym-monorepo/shared";

export default function InvoicesPage() {
    const t = useTranslations("sales.invoices");
    const ts = useTranslations("sales.statusLabels");
    const router = useRouter();
    const { toast } = useToast();

    const [filters, setFilters] = useState<SalesInvoiceListParams>({
        page: 1,
        limit: 10,
    });

    const [invoices, setInvoices] = useState<SalesInvoiceListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    const pagination = usePagination({
        initialPage: 1,
        initialLimit: filters.limit,
        total: total,
    });

    useEffect(() => {
        setFilters(f => ({ ...f, page: pagination.page }));
    }, [pagination.page]);

    const loadInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const result = await salesInvoicesService.list(filters);
            setInvoices(result.items);
            setTotal(result.total);
            pagination.setTotal(result.total);
        } catch {
            toast({
                title: t("list.toast.fetchError.title"),
                description: t("list.toast.fetchError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination, t, toast]);

    useEffect(() => {
        loadInvoices();
    }, [loadInvoices]);

    const columns: Column<SalesInvoiceListItem>[] = [
        {
            header: t("list.table.headers.number"),
            accessorKey: "number",
            className: "font-medium",
        },
        {
            header: t("list.table.headers.status"),
            cell: (item) => (
                <StatusBadge status={item.status}>
                    {ts(item.status)}
                </StatusBadge>
            ),
        },
        {
            header: t("list.table.headers.customer"),
            accessorKey: "personName",
        },
        {
            header: t("list.table.headers.salesperson"),
            cell: (item) => item.salesHeader?.salesperson?.fullName || "-",
        },
        {
            header: t("list.table.headers.dueDate"),
            cell: (item) =>
                item.salesHeader?.dueDate
                    ? format(new Date(item.salesHeader.dueDate), "dd MMM yyyy")
                    : "-",
        },
        {
            header: t("list.table.headers.total"),
            cell: (item) => item.total.toLocaleString(),
            className: "text-right",
        },
        {
            header: t("list.table.headers.actions"),
            cell: (item) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/sales/invoices/${item.id}`);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {(item.status === DocumentStatus.DRAFT || item.status === DocumentStatus.REVISION_REQUESTED) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/sales/invoices/${item.id}/edit`);
                            }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("page.title")}
                description={t("page.description")}
            >
                <Button onClick={() => router.push("/sales/invoices/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("buttons.new")}
                </Button>
            </PageHeader>

            <InvoiceListFilters
                filters={filters}
                onFilterChange={setFilters}
                onClear={() => {
                    setFilters({ page: 1, limit: 10 });
                    pagination.setPage(1);
                }}
            />

            <DataTable
                data={invoices}
                columns={columns}
                loading={loading}
                pagination={pagination}
                emptyMessage={t("list.table.empty")}
                onRowClick={(item) => router.push(`/sales/invoices/${item.id}`)}
            />
        </div>
    );
}
