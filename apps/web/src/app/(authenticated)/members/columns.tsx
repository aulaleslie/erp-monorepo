"use client";

import React from "react";
import { Member, MemberStatus } from "@gym-monorepo/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Column } from "@/components/common/DataTable";

export const columns: Column<Member>[] = [
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
            const date = member.currentExpiryDate;
            if (!date) return "—";
            return format(new Date(date), "dd MMM yyyy");
        },
    },
    {
        header: "Actions",
        className: "text-right",
        cell: (member) => {
            return (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/members/${member.id}`} className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/members/${member.id}/edit`} className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit Member
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                Deactivate
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];
