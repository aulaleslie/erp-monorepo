"use client";

import { useEffect, useState } from "react";
import { History, Search, Download, Filter, LogOut, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AttendanceService, AttendanceRecord } from "@/services/attendance";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { PaginationControls } from "@/components/common/PaginationControls";
import Link from "next/link";
import { useCallback } from "react";

export default function AttendanceHistoryPage() {
    const t = useTranslations("memberManagement.attendance.history");
    const tCheckIn = useTranslations("memberManagement.attendance.checkIn");
    const { toast } = useToast();

    const [items, setItems] = useState<AttendanceRecord[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await AttendanceService.findAll({ page, limit });
            setItems(data.items);
            setTotalPages(Math.ceil(data.total / limit));
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCheckOut = async (id: string) => {
        try {
            await AttendanceService.checkOut(id);
            toast({ title: "Checked out successfully" });
            loadData();
        } catch {
            toast({ variant: "destructive", title: "Check-out failed" });
        }
    };

    // Remove direct const calculation if using local state now

    return (
        <div className="container py-6 mx-auto">
            <PageHeader
                title={t("title")}
                description="View and manage member attendance logs"
            >
                <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
                <Button size="sm" asChild>
                    <Link href="/attendance/check-in">
                        <UserCheck className="mr-2 h-4 w-4" />
                        New Check-in
                    </Link>
                </Button>
            </PageHeader>

            <Card className="mt-6">
                <CardHeader className="pb-3 border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">History</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search logs..." className="pl-9 h-9" />
                            </div>
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="py-20">
                            <LoadingState />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-20">
                            <EmptyState
                                icon={History}
                                title="No records found"
                                description="No attendance records match your filters."
                            />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("table.member")}</TableHead>
                                        <TableHead>{t("table.type")}</TableHead>
                                        <TableHead>{t("table.checkIn")}</TableHead>
                                        <TableHead>{t("table.checkOut")}</TableHead>
                                        <TableHead>{t("table.method")}</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.member.person.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{item.member.memberCode}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {tCheckIn(`types.${item.attendanceType}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{format(new Date(item.checkInAt), "PP")}</div>
                                                <div className="text-xs text-muted-foreground">{format(new Date(item.checkInAt), "p")}</div>
                                            </TableCell>
                                            <TableCell>
                                                {item.checkOutAt ? (
                                                    <>
                                                        <div className="text-sm">{format(new Date(item.checkOutAt), "PP")}</div>
                                                        <div className="text-xs text-muted-foreground">{format(new Date(item.checkOutAt), "p")}</div>
                                                    </>
                                                ) : (
                                                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                        STILL IN
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs uppercase font-medium">{item.checkInMethod}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!item.checkOutAt && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                        onClick={() => handleCheckOut(item.id)}
                                                    >
                                                        <LogOut className="h-4 w-4 mr-1" />
                                                        Check Out
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="p-4 border-t">
                                <PaginationControls
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={setPage}
                                    loading={isLoading}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
