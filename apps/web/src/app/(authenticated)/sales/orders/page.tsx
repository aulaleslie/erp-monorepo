"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Eye, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { OrderListFilters } from "@/components/sales/orders/OrderListFilters";
import { salesOrdersService, SalesOrderListItem, SalesOrderListParams } from "@/services/sales-orders";
import { usePagination } from "@/hooks/use-pagination";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function OrdersPage() {
  const t = useTranslations("sales.orders");
  const ts = useTranslations("sales.statusLabels");
  const router = useRouter();
  const { toast } = useToast();

  const [filters, setFilters] = useState<SalesOrderListParams>({
    page: 1,
    limit: 10,
  });

  const [orders, setOrders] = useState<SalesOrderListItem[]>([]);
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

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await salesOrdersService.list(filters);
      setOrders(result.items);
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
    loadOrders();
  }, [loadOrders]);

  const columns: Column<SalesOrderListItem>[] = [
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
      header: t("list.table.headers.deliveryDate"),
      cell: (item) =>
        item.salesHeader?.deliveryDate
          ? format(new Date(item.salesHeader.deliveryDate), "dd MMM yyyy")
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
              router.push(`/sales/orders/${item.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {item.status === "DRAFT" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/sales/orders/${item.id}/edit`);
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
        <Button onClick={() => router.push("/sales/orders/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("buttons.new")}
        </Button>
      </PageHeader>

      <OrderListFilters
        filters={filters}
        onFilterChange={setFilters}
        onClear={() => {
          setFilters({ page: 1, limit: 10 });
          pagination.setPage(1);
        }}
      />

      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        pagination={pagination}
        emptyMessage={t("list.table.empty")}
        onRowClick={(item) => router.push(`/sales/orders/${item.id}`)}
      />
    </div>
  );
}
