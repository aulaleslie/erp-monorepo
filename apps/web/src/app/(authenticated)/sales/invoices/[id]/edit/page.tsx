"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InvoiceForm } from "@/components/sales/invoices/InvoiceForm";
import { salesInvoicesService, SalesInvoiceDetail } from "@/services/sales-invoices";
import { LoadingState } from "@/components/common/LoadingState";
import { useToast } from "@/hooks/use-toast";
import { DocumentStatus } from "@gym-monorepo/shared";

export default function EditInvoicePage() {
    const { id } = useParams() as { id: string };
    const [invoice, setInvoice] = useState<SalesInvoiceDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const loadInvoice = async () => {
            try {
                const data = await salesInvoicesService.get(id);
                if (data.status !== DocumentStatus.DRAFT && data.status !== DocumentStatus.REVISION_REQUESTED) {
                    toast({
                        title: "Action Not Allowed",
                        description: "Only draft invoices or invoices requesting revision can be edited.",
                        variant: "destructive",
                    });
                    router.push(`/sales/invoices/${id}`);
                    return;
                }
                setInvoice(data);
            } catch {
                toast({
                    title: "Error",
                    description: "Failed to load invoice data.",
                    variant: "destructive",
                });
                router.push("/sales/invoices");
            } finally {
                setLoading(false);
            }
        };

        loadInvoice();
    }, [id, router, toast]);

    if (loading) return <LoadingState />;
    if (!invoice) return null;

    return <InvoiceForm initialData={invoice} isEdit />;
}
