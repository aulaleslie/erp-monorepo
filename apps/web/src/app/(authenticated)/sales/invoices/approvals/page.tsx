"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Eye, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { ApprovalActionDialog, ApprovalAction } from "@/components/sales/approvals/ApprovalActionDialog";
import { salesApprovalsService, PendingApprovalListItem } from "@/services/sales-approvals";
import { usePagination } from "@/hooks/use-pagination";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function SalesInvoiceApprovalsPage() {
    const t = useTranslations("sales.approvals.queue");
    const router = useRouter();
    const { toast } = useToast();

    const [items, setItems] = useState<PendingApprovalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [actionItem, setActionItem] = useState<{ id: string, number: string } | null>(null);
    const [actionType, setActionType] = useState<ApprovalAction | null>(null);

    const pagination = usePagination({
        initialPage: 1,
        initialLimit: 10,
        total: total,
    });

    const loadQueue = useCallback(async () => {
        setLoading(true);
        try {
            const result = await salesApprovalsService.getPendingInvoices({
                page: pagination.page,
                limit: pagination.limit,
            });
            setItems(result.items);
            setTotal(result.total);
            pagination.setTotal(result.total);
        } catch {
            toast({
                title: t("toast.fetchError.title"),
                description: t("toast.fetchError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, t, toast]);

    useEffect(() => {
        loadQueue();
    }, [loadQueue]);

    const handleAction = async (action: ApprovalAction, notes: string) => {
        if (!actionItem) return;
        try {
            await salesApprovalsService.action('invoices', actionItem.id, action, notes);
            toast({
                title: "Action Successful",
                description: `The invoice ${actionItem.number} has been ${action}ed.`,
            });
            loadQueue();
        } catch {
            toast({
                title: "Action Failed",
                description: "Something went wrong while processing the approval.",
                variant: "destructive",
            });
        }
    };

    const columns: Column<PendingApprovalListItem>[] = [
        {
            header: t("table.headers.number"),
            accessorKey: "number",
            className: "font-medium",
        },
        {
            header: t("table.headers.customer"),
            accessorKey: "personName",
        },
        {
            header: t("table.headers.amount"),
            cell: (item) => `${item.currencyCode} ${item.total.toLocaleString()}`,
            className: "text-right",
        },
        {
            header: t("table.headers.date"),
            cell: (item) => format(new Date(item.documentDate), "dd MMM yyyy"),
        },
        {
            header: t("table.headers.level"),
            accessorKey: "currentLevel",
            className: "text-center",
        },
        {
            header: t("table.headers.actions"),
            cell: (item) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/sales/invoices/${item.id}`)}
                        title="View Detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => {
                            setActionItem({ id: item.id, number: item.number });
                            setActionType('approve');
                        }}
                    >
                        <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => {
                            setActionItem({ id: item.id, number: item.number });
                            setActionType('request-revision');
                        }}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                            setActionItem({ id: item.id, number: item.number });
                            setActionType('reject');
                        }}
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("page.invoiceTitle")}
                description={t("page.invoiceDescription")}
            />

            <DataTable
                data={items}
                columns={columns}
                loading={loading}
                pagination={pagination}
                emptyMessage={t("table.empty")}
                onRowClick={(item) => router.push(`/sales/invoices/${item.id}`)}
            />

            {actionItem && actionType && (
                <ApprovalActionDialog
                    isOpen={!!actionType}
                    onClose={() => {
                        setActionType(null);
                        setActionItem(null);
                    }}
                    action={actionType}
                    documentNumber={actionItem.number}
                    onConfirm={handleAction}
                />
            )}
        </div>
    );
}
