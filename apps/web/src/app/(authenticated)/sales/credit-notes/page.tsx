"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { CreditNoteListFilters } from "@/components/sales/credit-notes/CreditNoteListFilters";
import { salesCreditNotesService, SalesCreditNoteListItem, SalesCreditNoteListParams } from "@/services/sales-credit-notes";
import { usePagination } from "@/hooks/use-pagination";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function CreditNotesPage() {
    const t = useTranslations("sales.creditNotes");
    const ts = useTranslations("sales.statusLabels");
    const router = useRouter();
    const { toast } = useToast();

    const [filters, setFilters] = useState<SalesCreditNoteListParams>({
        page: 1,
        limit: 10,
    });

    const [creditNotes, setCreditNotes] = useState<SalesCreditNoteListItem[]>([]);
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

    const loadCreditNotes = async () => {
        setLoading(true);
        try {
            const result = await salesCreditNotesService.list(filters);
            setCreditNotes(result.items);
            setTotal(result.total);
            pagination.setTotal(result.total);
        } catch (error) {
            toast({
                title: t("list.toast.fetchError.title"),
                description: t("list.toast.fetchError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCreditNotes();
    }, [filters]);

    const columns: Column<SalesCreditNoteListItem>[] = [
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
            header: t("list.table.headers.date"),
            cell: (item) => format(new Date(item.documentDate), "dd MMM yyyy"),
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
                            router.push(`/sales/credit-notes/${item.id}`);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("page.title")}
                description={t("page.description")}
            />

            <CreditNoteListFilters
                filters={filters}
                onFilterChange={setFilters}
                onClear={() => {
                    setFilters({ page: 1, limit: 10 });
                    pagination.setPage(1);
                }}
            />

            <DataTable
                data={creditNotes}
                columns={columns}
                loading={loading}
                pagination={pagination}
                emptyMessage={t("list.table.empty")}
                onRowClick={(item) => router.push(`/sales/credit-notes/${item.id}`)}
            />
        </div>
    );
}
