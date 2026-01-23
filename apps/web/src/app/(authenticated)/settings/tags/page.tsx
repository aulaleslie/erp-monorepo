"use client";

import { DataTable, Column } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePagination } from "@/hooks/use-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";
import { TagSuggestion, tagsService } from "@/services/tags";
import { format } from "date-fns";
import { Search, Pencil } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { TagFormDialog } from "./tag-form-dialog";

export default function TagsPage() {
    const { isSuperAdmin } = usePermissions();
    const { toast } = useToast();
    const pagination = usePagination();
    const t = useTranslations("tags");
    const [data, setData] = useState<TagSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Dialog states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<TagSuggestion | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await tagsService.list({
                page: pagination.page,
                limit: pagination.limit,
                query: search || undefined,
            });
            setData(response.items);
            pagination.setTotal(response.total);
        } catch {
            toast({
                title: t("toast.fetchError.title"),
                description: t("toast.fetchError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, search, t, toast]);

    useEffect(() => {
        if (!isSuperAdmin) {
            setLoading(false);
            return;
        }
        fetchData();
    }, [fetchData, isSuperAdmin]);

    const columns: Column<TagSuggestion>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: t("table.headers.name"),
        },
        {
            accessorKey: "usageCount",
            header: t("table.headers.usage"),
            cell: (row) => row.usageCount || 0,
        },
        {
            accessorKey: "lastUsedAt",
            header: t("table.headers.lastUsed"),
            cell: (row) => row.lastUsedAt ? format(new Date(row.lastUsedAt), "dd MMM yyyy HH:mm") : "-",
        },
        {
            header: t("table.headers.status"),
            cell: (row) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />,
        },
        {
            header: t("table.headers.actions"),
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setEditingTag(row);
                            setIsFormOpen(true);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], [t]);

    if (!isSuperAdmin) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{t("guards.superAdminOnly")}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("page.title")}
                description={t("page.description")}
            />

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("filters.searchPlaceholder")}
                        className="pl-8"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            pagination.setPage(1);
                        }}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                pagination={pagination}
                emptyMessage={t("table.empty")}
            />

            <TagFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setEditingTag(null);
                }}
                tag={editingTag}
                onSuccess={fetchData}
            />
        </div>
    );
}
