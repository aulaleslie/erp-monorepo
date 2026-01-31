"use client";

import React from "react";
import { Member, MemberStatus } from "@gym-monorepo/shared";
import { Badge } from "@/components/ui/badge";
import { format, isBefore, addDays, startOfDay } from "date-fns";
import { Column } from "@/components/common/DataTable";
import { MemberActions } from "./MemberActions";
import { Progress } from "@/components/ui/progress";

export const getProfileCompletion = (member: Member): number => {
    const fields = [
        member.person?.fullName,
        member.person?.email,
        member.person?.phone,
        member.person?.avatarUrl,
        member.agreedToTerms,
    ];

    const completed = fields.filter((field) => {
        if (typeof field === "boolean") return field === true;
        return !!field;
    }).length;

    return Math.round((completed / fields.length) * 100);
};

export const getColumns = (onUpdate?: () => void): Column<Member>[] => [
    {
        header: "Code",
        accessorKey: "code",
    },
    {
        header: "Name",
        cell: (member) => {
            return <div className="font-medium">{member.person?.fullName || "—"}</div>;
        },
    },
    {
        header: "Phone",
        cell: (member) => member.person?.phone || "—",
    },
    {
        header: "Email",
        cell: (member) => member.person?.email || "—",
    },
    {
        header: "Status",
        cell: (member) => {
            const status = member.status;
            const colors: Record<MemberStatus, string> = {
                [MemberStatus.ACTIVE]: "bg-green-500/10 text-green-500",
                [MemberStatus.EXPIRED]: "bg-red-500/10 text-red-500",
                [MemberStatus.INACTIVE]: "bg-gray-500/10 text-gray-500",
                [MemberStatus.NEW]: "bg-blue-500/10 text-blue-500",
            };

            return (
                <Badge variant="outline" className={colors[status]}>
                    {status}
                </Badge>
            );
        },
    },
    {
        header: "Expiry Date",
        cell: (member) => {
            const dateStr = member.currentExpiryDate;
            if (!dateStr) return "—";

            const expiryDate = new Date(dateStr);
            const today = startOfDay(new Date());
            const sevenDaysFromNow = addDays(today, 7);

            const isExpired = isBefore(expiryDate, today);
            const isExpiringSoon = !isExpired && isBefore(expiryDate, sevenDaysFromNow);

            let colorClass = "";
            if (isExpired) {
                colorClass = "text-red-500 font-medium";
            } else if (isExpiringSoon) {
                colorClass = "text-orange-500 font-medium";
            }

            return (
                <span className={colorClass}>
                    {format(expiryDate, "dd MMM yyyy")}
                </span>
            );
        },
    },
    {
        header: "Profile %",
        cell: (member) => {
            const completion = getProfileCompletion(member);
            return (
                <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={completion} className="h-2" />
                    <span className="text-xs text-muted-foreground">{completion}%</span>
                </div>
            );
        },
    },
    {
        header: "Actions",
        className: "text-right",
        cell: (member) => <MemberActions member={member} onUpdate={onUpdate} />,
    },
];
