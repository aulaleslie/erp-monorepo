"use client";

import React from "react";
import { ScheduleBooking } from "@gym-monorepo/shared";
import { DataTable } from "@/components/common/DataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Column } from "@/components/common/DataTable";

interface GroupSessionHistoryProps {
    history: ScheduleBooking[];
    loading?: boolean;
}

export function GroupSessionHistory({
    history,
    loading
}: GroupSessionHistoryProps) {
    const columns: Column<ScheduleBooking>[] = [
        {
            header: "Date",
            cell: (b: ScheduleBooking) => format(new Date(b.bookingDate), "dd MMM yyyy")
        },
        {
            header: "Time",
            cell: (b: ScheduleBooking) => (
                <span className="font-mono">
                    {b.startTime.substring(0, 5)} - {b.endTime.substring(0, 5)}
                </span>
            )
        },
        {
            header: "Trainer",
            cell: (b: ScheduleBooking) => b.trainer?.fullName || "—"
        },
        {
            header: "Status",
            cell: (b: ScheduleBooking) => {
                const colors: Record<string, string> = {
                    SCHEDULED: "bg-blue-500/10 text-blue-500",
                    COMPLETED: "bg-green-500/10 text-green-500",
                    CANCELLED: "bg-red-500/10 text-red-500",
                    NO_SHOW: "bg-amber-500/10 text-amber-500",
                };
                return (
                    <Badge variant="outline" className={colors[b.status] || ""}>
                        {b.status}
                    </Badge>
                );
            }
        },
        {
            header: "Notes",
            accessorKey: "notes" as keyof ScheduleBooking,
            cell: (b: ScheduleBooking) => (
                <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                    {b.notes || "—"}
                </span>
            )
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (b: ScheduleBooking) => (
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/scheduling?date=${b.bookingDate}`}>
                        <Eye className="h-4 w-4" />
                    </Link>
                </Button>
            )
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Calendar className="h-5 w-5 text-primary" />
                    Session History
                </CardTitle>
                <CardDescription>
                    All bookings and attendance records for this group session.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={history}
                    loading={loading}
                    emptyMessage="No history logs found for this session."
                />
            </CardContent>
        </Card>
    );
}
