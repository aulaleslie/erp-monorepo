"use client";

import { useEffect, useState, useMemo } from "react";
import { History, Search, Download, Filter, LogOut, UserCheck, X } from "lucide-react";
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
import { format, startOfDay, endOfDay } from "date-fns";
import { AttendanceService, AttendanceRecord } from "@/services/attendance";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { PaginationControls } from "@/components/common/PaginationControls";
import Link from "next/link";
import { useCallback } from "react";
import { AttendanceType } from "@gym-monorepo/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimeInput } from "@/components/ui/date-time-input";

export default function AttendanceHistoryPage() {
    const t = useTranslations("memberManagement.attendance.history");
    const tCheckIn = useTranslations("memberManagement.attendance.checkIn");
    const { toast } = useToast();

    const [items, setItems] = useState<AttendanceRecord[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);

    // Filters state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {
                page,
                limit,
                q: searchQuery || undefined,
                type: selectedType === "ALL" ? undefined : selectedType,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            };
            const data = await AttendanceService.findAll(params);
            setItems(data.items);
            setTotalPages(Math.ceil(data.total / limit));
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, searchQuery, selectedType, dateFrom, dateTo]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 300);
        return () => clearTimeout(timer);
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

    const handleExport = async () => {
        try {
            // Fetch all matching records for export
            const data = await AttendanceService.findAll({
                limit: 1000,
                q: searchQuery || undefined,
                type: selectedType === "ALL" ? undefined : selectedType,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            });

            const csvRows = [
                ["Member Name", "Member Code", "Type", "Check-In", "Check-Out", "Method", "Staff"].join(","),
                ...data.items.map((item: AttendanceRecord) => [
                    `"${item.member.person.fullName}"`,
                    `"${item.member.memberCode}"`,
                    item.attendanceType,
                    item.checkInAt,
                    item.checkOutAt || "",
                    item.checkInMethod,
                    `"${item.checkedInByUser?.fullName || "-"}"`
                ].join(","))
            ];

            const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.setAttribute("hidden", "");
            a.setAttribute("href", url);
            a.setAttribute("download", `attendance-history-${format(new Date(), "yyyy-MM-dd")}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast({ title: "Export successful" });
        } catch {
            toast({ variant: "destructive", title: "Export failed" });
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedType("ALL");
        setDateFrom("");
        setDateTo("");
    };

    return (
        <div className="container py-6 mx-auto">
            <PageHeader
                title={t("title")}
                description="View and manage member attendance logs"
            >
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("table.export")}
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
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">History</CardTitle>
                            <div className="flex gap-2">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search member name or code..."
                                        className="pl-9 h-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant={isFilterOpen ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className="h-9"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filters
                                </Button>
                            </div>
                        </div>

                        {isFilterOpen && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium">{t("filters.all")}</label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">{t("filters.all")}</SelectItem>
                                            {Object.values(AttendanceType).map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {tCheckIn(`types.${type}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium">{t("filters.dateFrom")}</label>
                                    <DateTimeInput
                                        enableTime={false}
                                        className="h-9"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium">{t("filters.dateTo")}</label>
                                    <DateTimeInput
                                        enableTime={false}
                                        className="h-9"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end pb-0.5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="h-9 w-full"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        )}
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
                                        <TableHead>{t("table.staff")}</TableHead>
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
                                                <Badge variant="secondary">
                                                    {tCheckIn(`types.${item.attendanceType}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">{format(new Date(item.checkInAt), "PP")}</div>
                                                <div className="text-xs text-muted-foreground">{format(new Date(item.checkInAt), "p")}</div>
                                            </TableCell>
                                            <TableCell>
                                                {item.checkOutAt ? (
                                                    <>
                                                        <div className="text-sm font-medium">{format(new Date(item.checkOutAt), "PP")}</div>
                                                        <div className="text-xs text-muted-foreground">{format(new Date(item.checkOutAt), "p")}</div>
                                                    </>
                                                ) : (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                                        STILL IN
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs uppercase font-medium text-muted-foreground">{item.checkInMethod.replace(/_/g, " ")}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{item.checkedInByUser?.fullName || "-"}</div>
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
