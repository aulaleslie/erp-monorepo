"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { OrderForm } from "@/components/sales/orders/OrderForm";
import { salesOrdersService, SalesOrderDetail } from "@/services/sales-orders";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/common/LoadingState";

export default function EditOrderPage() {
    const { id } = useParams() as { id: string };
    const [order, setOrder] = useState<SalesOrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        async function loadOrder() {
            try {
                const data = await salesOrdersService.get(id);
                if (data.status !== "DRAFT") {
                    toast({
                        title: "Access Denied",
                        description: "Only draft orders can be edited.",
                        variant: "destructive",
                    });
                    router.push(`/sales/orders/${id}`);
                    return;
                }
                setOrder(data);
            } catch {
                toast({
                    title: "Error",
                    description: "Failed to load order.",
                    variant: "destructive",
                });
                router.push("/sales/orders");
            } finally {
                setLoading(false);
            }
        }
        loadOrder();
    }, [id, router, toast]);

    if (loading) return <LoadingState />;
    if (!order) return null;

    return (
        <div className="mx-auto max-w-7xl">
            <OrderForm initialData={order} isEdit />
        </div>
    );
}
