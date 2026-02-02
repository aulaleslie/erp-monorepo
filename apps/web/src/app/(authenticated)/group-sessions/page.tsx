"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { GroupSession, GroupSessionStatus } from "@gym-monorepo/shared";
import { GroupSessionsService } from "@/services/group-sessions";
import { usePagination } from "@/hooks/use-pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import { getColumns } from "./columns";

export default function GroupSessionsPage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<GroupSessionStatus | "ALL">("ALL");
    const [sessions, setSessions] = useState<GroupSession[]>([]);
    const [loading, setLoading] = useState(true);

    const pagination = usePagination({
        initialLimit: 10,
    });

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {
                page: pagination.page,
                limit: pagination.limit,
            };
            if (search) params.search = search;
            if (status !== "ALL") params.status = status;

            const response = await GroupSessionsService.findAll(params);
            setSessions(response.items);
            pagination.setTotal(response.total);
        } catch (error) {
            console.error("Failed to fetch group sessions:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, status]);

    const columns = React.useMemo(() => getColumns(fetchSessions), [fetchSessions]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        pagination.setPage(1);
    };

    const handleStatusChange = (value: string) => {
        setStatus(value as GroupSessionStatus | "ALL");
        pagination.setPage(1);
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <PageHeader
                title="Group Sessions"
                description="Manage private group sessions and participants"
            />

            <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex flex-1 items-center gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by purchaser or instructor..."
                            value={search}
                            onChange={handleSearchChange}
                            className="pl-8"
                        />
                    </div>
                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value={GroupSessionStatus.ACTIVE}>Active</SelectItem>
                            <SelectItem value={GroupSessionStatus.EXPIRED}>Expired</SelectItem>
                            <SelectItem value={GroupSessionStatus.EXHAUSTED}>Exhausted</SelectItem>
                            <SelectItem value={GroupSessionStatus.CANCELLED}>Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={sessions}
                loading={loading}
                pagination={pagination}
                emptyMessage="No group sessions found."
            />
        </div>
    );
}
