"use client";

import React from "react";
import { GroupSession, GroupSessionStatus } from "@gym-monorepo/shared";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Column } from "@/components/common/DataTable";
import { GroupSessionActions } from "./GroupSessionActions";

export const getColumns = (onUpdate?: () => void): Column<GroupSession>[] => [
    {
        header: "Purchaser",
        cell: (session) => {
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{session.purchaser?.person?.fullName || "—"}</span>
                    <span className="text-xs text-muted-foreground">{session.itemName}</span>
                </div>
            );
        },
    },
    {
        header: "Instructor",
        cell: (session) => session.instructor?.fullName || "—",
    },
    {
        header: "Sessions",
        cell: (session) => (
            <div className="flex flex-col">
                <span>{session.usedSessions} / {session.totalSessions}</span>
                <span className="text-[10px] text-muted-foreground">{session.remainingSessions} remaining</span>
            </div>
        ),
    },
    {
        header: "Participants",
        cell: (session) => (
            <div className="flex items-center gap-1">
                <span>{session.participantsCount || 0}</span>
                <span className="text-muted-foreground text-xs">/ {session.maxParticipants}</span>
            </div>
        ),
    },
    {
        header: "Status",
        cell: (session) => {
            const status = session.status;
            const colors: Record<GroupSessionStatus, string> = {
                [GroupSessionStatus.ACTIVE]: "bg-green-500/10 text-green-500",
                [GroupSessionStatus.EXPIRED]: "bg-red-500/10 text-red-500",
                [GroupSessionStatus.EXHAUSTED]: "bg-amber-500/10 text-amber-500",
                [GroupSessionStatus.CANCELLED]: "bg-gray-500/10 text-gray-500",
            };

            return (
                <Badge variant="outline" className={colors[status]}>
                    {status}
                </Badge>
            );
        },
    },
    {
        header: "Start Date",
        cell: (session) => format(new Date(session.startDate), "dd MMM yyyy"),
    },
    {
        header: "Actions",
        className: "text-right",
        cell: (session) => <GroupSessionActions session={session} onUpdate={onUpdate} />,
    },
];
