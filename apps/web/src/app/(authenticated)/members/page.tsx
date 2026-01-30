"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Member, MemberStatus } from "@gym-monorepo/shared";
import { MembersService } from "@/services/members";
import { usePagination } from "@/hooks/use-pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import { columns } from "./columns";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@gym-monorepo/shared";

export default function MembersPage() {
    const t = useTranslations("members");
    const { can } = usePermissions();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<MemberStatus | "ALL">("ALL");
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    const pagination = usePagination({
        initialLimit: 10,
    });

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = {
                page: pagination.page,
                limit: pagination.limit,
            };
            if (search) params.search = search;
            if (status !== "ALL") params.status = status;

            const response = await MembersService.findAll(params);
            setMembers(response.items);
            pagination.setTotal(response.total);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination, search, status]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        pagination.setPage(1);
    };

    const handleStatusChange = (value: string) => {
        setStatus(value as MemberStatus | "ALL");
        pagination.setPage(1);
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <PageHeader
                title={t("title", { defaultValue: "Members" })}
                description={t("description", { defaultValue: "Manage your gym members" })}
            >
                {can(PERMISSIONS.MEMBERS.CREATE) && (
                    <Button asChild>
                        <Link href="/members/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("addNew", { defaultValue: "New Member" })}
                        </Link>
                    </Button>
                )}
            </PageHeader>

            <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex flex-1 items-center gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("searchPlaceholder", { defaultValue: "Search by name, code, email..." })}
                            value={search}
                            onChange={handleSearchChange}
                            className="pl-8"
                        />
                    </div>
                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t("filterStatus", { defaultValue: "All Statuses" })} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t("status_all", { defaultValue: "All Statuses" })}</SelectItem>
                            <SelectItem value={MemberStatus.ACTIVE}>{t("status_active", { defaultValue: "Active" })}</SelectItem>
                            <SelectItem value={MemberStatus.NEW}>{t("status_new", { defaultValue: "New" })}</SelectItem>
                            <SelectItem value={MemberStatus.EXPIRED}>{t("status_expired", { defaultValue: "Expired" })}</SelectItem>
                            <SelectItem value={MemberStatus.INACTIVE}>{t("status_inactive", { defaultValue: "Inactive" })}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={members}
                loading={loading}
                pagination={pagination}
                emptyMessage={t("noMembersFound", { defaultValue: "No members found." })}
            />
        </div>
    );
}
