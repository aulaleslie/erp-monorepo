"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { TagInput } from "@/components/common/TagInput";
import { peopleService, PersonListItem } from "@/services/people";
import { DocumentStatus, PeopleType, PeopleStatus } from "@gym-monorepo/shared";
import { SalesOrderListParams } from "@/services/sales-orders";

interface OrderListFiltersProps {
    filters: SalesOrderListParams;
    onFilterChange: (filters: SalesOrderListParams) => void;
    onClear: () => void;
}

export function OrderListFilters({
    filters,
    onFilterChange,
    onClear,
}: OrderListFiltersProps) {
    const t = useTranslations("sales.orders.filters");
    const ts = useTranslations("sales.statusLabels");

    const handleFieldChange = (field: keyof SalesOrderListParams, value: unknown) => {
        onFilterChange({
            ...filters,
            [field]: value,
            page: 1, // Reset page when filters change
        });
    };

    const fetchCustomers = async (params: {
        search: string;
        page: number;
        limit: number;
    }) => {
        const result = await peopleService.list({
            ...params,
            type: PeopleType.CUSTOMER,
            status: PeopleStatus.ACTIVE,
        });
        return {
            items: result.items,
            total: result.total,
            hasMore: result.page < Math.ceil(result.total / result.limit),
        };
    };

    return (
        <div className="space-y-4 rounded-lg border bg-card p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("search")}</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("searchPlaceholder")}
                            className="pl-8"
                            value={filters.search || ""}
                            onChange={(e) => handleFieldChange("search", e.target.value)}
                        />
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("status")}</label>
                    <Select
                        value={filters.status || "ALL"}
                        onValueChange={(value) =>
                            handleFieldChange("status", value === "ALL" ? undefined : value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t("statusPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t("any")}</SelectItem>
                            {Object.values(DocumentStatus).map((status) => (
                                <SelectItem key={status} value={status}>
                                    {ts(status)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Customer */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("customer")}</label>
                    <SearchableSelect<PersonListItem>
                        value={filters.personId}
                        onValueChange={(value) => handleFieldChange("personId", value)}
                        placeholder={t("customerPlaceholder")}
                        fetchItems={fetchCustomers}
                        getItemValue={(item) => item.id}
                        getItemLabel={(item) => item.fullName}
                        getItemDescription={(item) => item.code}
                        clearable
                    />
                </div>

                {/* Order Number */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("number")}</label>
                    <Input
                        placeholder={t("numberPlaceholder")}
                        value={filters.number || ""}
                        onChange={(e) => handleFieldChange("number", e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Date From */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("dateFrom")}</label>
                    <Input
                        type="date"
                        value={filters.dateFrom || ""}
                        onChange={(e) => handleFieldChange("dateFrom", e.target.value)}
                    />
                </div>

                {/* Date To */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("dateTo")}</label>
                    <Input
                        type="date"
                        value={filters.dateTo || ""}
                        onChange={(e) => handleFieldChange("dateTo", e.target.value)}
                    />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t("tag")}</label>
                    <TagInput
                        value={filters.tag ? [filters.tag] : []}
                        onChange={(tags) => handleFieldChange("tag", tags[0] || undefined)}
                        placeholder={t("tagPlaceholder")}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button variant="ghost" onClick={onClear} className="h-8 px-2 lg:px-3">
                    {t("clear")}
                    <X className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
