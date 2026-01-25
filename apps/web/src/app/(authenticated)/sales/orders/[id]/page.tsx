"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import {
    CheckCircle2,
    Clock,
    ChevronLeft,
    Download,
    Send,
    Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingState } from "@/components/common/LoadingState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SalesAttachments } from "@/components/sales/SalesAttachments";
import {
    salesOrdersService,
    SalesOrderDetail,
} from "@/services/sales-orders";
import { salesPdfService } from "@/services/sales-pdf";
import {
    documentsService,
    DocumentStatusHistoryEntry,
} from "@/services/documents";
import { useToast } from "@/hooks/use-toast";
import { DocumentStatus } from "@gym-monorepo/shared";

export default function OrderDetailPage() {
    const { id } = useParams() as { id: string };
    const t = useTranslations("sales.orders.detail");
    const ts = useTranslations("sales.statusLabels");
    const router = useRouter();
    const { toast } = useToast();

    const [order, setOrder] = useState<SalesOrderDetail | null>(null);
    const [history, setHistory] = useState<DocumentStatusHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Dialog states
    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [confirmApprove, setConfirmApprove] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [orderData, historyData] = await Promise.all([
                salesOrdersService.get(id),
                documentsService.getStatusHistory(id),
            ]);
            setOrder(orderData);
            setHistory(historyData);
        } catch {
            toast({
                title: "Error",
                description: "Failed to load order data.",
                variant: "destructive",
            });
            router.push("/sales/orders");
        } finally {
            setLoading(false);
        }
    }, [id, router, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAction = async (action: string, notes?: string) => {
        setProcessing(true);
        try {
            switch (action) {
                case "submit":
                    await salesOrdersService.submit(id);
                    break;
                case "approve":
                    await salesOrdersService.approve(id, notes);
                    break;
                case "cancel":
                    await salesOrdersService.cancel(id, notes);
                    break;
                // Other actions can be added here
            }
            toast({
                title: t("toast.actionSuccess.title"),
                description: t("toast.actionSuccess.description"),
            });
            loadData();
        } catch {
            toast({
                title: t("toast.actionError.title"),
                description: t("toast.actionError.description"),
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadPdf = async () => {
        setProcessing(true);
        try {
            const url = await salesPdfService.regenerate(id);
            window.open(url, "_blank");
        } catch {
            toast({
                title: "Error",
                description: "Failed to generate PDF.",
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <LoadingState />;
    if (!order) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-2xl font-bold">
                        {t("title", { number: order.number })}
                    </h2>
                    <StatusBadge status={order.status}>{ts(order.status)}</StatusBadge>
                </div>
                <div className="flex gap-2">
                    {order.status === DocumentStatus.DRAFT && (
                        <>
                            <Button variant="outline" onClick={() => router.push(`/sales/orders/${id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("buttons.edit")}
                            </Button>
                            <Button onClick={() => setConfirmSubmit(true)} disabled={processing}>
                                <Send className="mr-2 h-4 w-4" />
                                {t("buttons.submit")}
                            </Button>
                        </>
                    )}

                    {order.status === DocumentStatus.SUBMITTED && (
                        <Button onClick={() => setConfirmApprove(true)} disabled={processing}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {t("buttons.approve")}
                        </Button>
                    )}

                    <Button variant="outline" onClick={handleDownloadPdf} disabled={processing}>
                        <Download className="mr-2 h-4 w-4" />
                        {t("buttons.downloadPdf")}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {/* Header Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                {t("sections.header")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Customer</p>
                                    <p className="font-medium">{order.personName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Date</p>
                                    <p className="font-medium">
                                        {format(new Date(order.documentDate), "dd MMM yyyy")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Delivery Date</p>
                                    <p className="font-medium">
                                        {order.salesHeader?.deliveryDate
                                            ? format(new Date(order.salesHeader.deliveryDate), "dd MMM yyyy")
                                            : "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Salesperson</p>
                                    <p className="font-medium">
                                        {order.salesHeader?.salesperson?.fullName || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tax Mode</p>
                                    <p className="font-medium">
                                        {order.salesHeader?.taxPricingMode}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">External Ref</p>
                                    <p className="font-medium">{order.salesHeader?.externalRef || "-"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                {t("sections.items")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">Item</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead className="pr-6 text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="pl-6 font-medium">
                                                {item.itemName}
                                                {item.description && (
                                                    <p className="text-xs font-normal text-muted-foreground">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{item.unitPrice.toLocaleString()}</TableCell>
                                            <TableCell className="pr-6 text-right font-medium">
                                                {item.lineTotal.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex flex-col items-end gap-2 border-t p-6">
                                <div className="flex w-40 justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{order.total.toLocaleString()}</span>
                                </div>
                                <div className="flex w-40 justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>{order.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attachments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                {t("sections.attachments")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SalesAttachments documentId={id} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-sm">
                                {order.notes || "No notes provided."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                {t("sections.history")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {history.map((entry) => (
                                    <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                                        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium">
                                                {t("history.status", { status: ts(entry.toStatus) })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t("history.by", { user: entry.changedByUser?.fullName || "System" })} •{" "}
                                                {format(new Date(entry.changedAt), "dd MMM HH:mm")}
                                            </p>
                                            {entry.reason && (
                                                <p className="mt-1 text-xs italic text-muted-foreground border-l-2 pl-2">
                                                    {entry.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {history.length === 0 && (
                                    <p className="text-sm text-center text-muted-foreground py-4">
                                        {t("history.empty")}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={confirmSubmit}
                onOpenChange={setConfirmSubmit}
                title="Submit Order"
                description="Are you sure you want to submit this order for approval? You won't be able to edit it anymore."
                onConfirm={() => {
                    setConfirmSubmit(false);
                    handleAction("submit");
                }}
                confirmLabel="Submit"
            />

            <ConfirmDialog
                open={confirmApprove}
                onOpenChange={setConfirmApprove}
                title="Approve Order"
                description="Are you sure you want to approve this order? This will automatically create an invoice."
                onConfirm={() => {
                    setConfirmApprove(false);
                    handleAction("approve");
                }}
                confirmLabel="Approve"
            />
        </div>
    );
}
