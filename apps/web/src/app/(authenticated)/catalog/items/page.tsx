"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

import { itemsService, ItemListItem, ItemStatus, ItemType } from "@/services/items";
import { ItemsTable } from "@/components/features/catalog/ItemsTable";
import { usePagination } from "@/hooks/use-pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImportItemsDialog } from "@/components/features/catalog/items/ImportItemsDialog";
import { ExportItemsDialog } from "@/components/features/catalog/items/ExportItemsDialog";

export default function ItemsPage() {
    const t = useTranslations("items");

    return (
        <PermissionGuard
            requiredPermissions={["items.read"]}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noListPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <PageHeader
                        title={t("page.title")}
                        description={t("page.description")}
                    />
                    <div className="flex gap-2">
                        <PermissionGuard requiredPermissions={["items.create"]}>
                            <Button asChild>
                                <Link href="/catalog/items/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t("buttons.new")}
                                </Link>
                            </Button>
                        </PermissionGuard>
                    </div>
                </div>

                <ItemsTableWrapper />
            </div>
        </PermissionGuard>
    );
}

function ItemsTableWrapper() {
    const t = useTranslations("items");
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<ItemListItem[]>([]);
    const [search, setSearch] = React.useState("");
    const ALL_TYPES = "ALL";
    const ANY_STATUS = "ANY";
    const [status, setStatus] = React.useState<ItemStatus | typeof ANY_STATUS>(ANY_STATUS);
    const [type, setType] = React.useState<ItemType | typeof ALL_TYPES>(ALL_TYPES);

    const pagination = usePagination();
    const resolvedStatus = status === ANY_STATUS ? undefined : status;
    const resolvedType = type === ALL_TYPES ? undefined : type;

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await itemsService.list({
                page: pagination.page,
                limit: pagination.limit,
                search,
                status: resolvedStatus,
                type: resolvedType,
            });
            setData(response.items);
            pagination.setTotal(response.total);
        } catch (error) {
            console.error("Failed to fetch items", error);
        } finally {
            setLoading(false);
        }
    }, [pagination, search, resolvedStatus, resolvedType]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <Input
                        placeholder={t("list.filters.searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-[180px]">
                    <Select value={type} onValueChange={(v) => setType(v as ItemType | typeof ALL_TYPES)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t("list.filters.type")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_TYPES}>{t("list.filters.allTypes")}</SelectItem>
                            <SelectItem value={ItemType.PRODUCT}>{t("types.PRODUCT")}</SelectItem>
                            <SelectItem value={ItemType.SERVICE}>{t("types.SERVICE")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-[180px]">
                    <Select value={status} onValueChange={(v) => setStatus(v as ItemStatus | typeof ANY_STATUS)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t("list.filters.status")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ANY_STATUS}>{t("list.filters.anyStatus")}</SelectItem>
                            <SelectItem value={ItemStatus.ACTIVE}>ACTIVE</SelectItem>
                            <SelectItem value={ItemStatus.INACTIVE}>INACTIVE</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 ml-auto">
                    <PermissionGuard requiredPermissions={["items.read"]}>
                        <ExportItemsDialog
                            filters={{ search, type: resolvedType, status: resolvedStatus }}
                        />
                    </PermissionGuard>
                    <PermissionGuard requiredPermissions={["items.create"]}>
                        <ImportItemsDialog onSuccess={fetchData} />
                    </PermissionGuard>
                </div>
            </div>

            <ItemsTable
                data={data}
                loading={loading}
                pagination={pagination}
                onRefresh={fetchData}
            />
        </div>
    );
}
