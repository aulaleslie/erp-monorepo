"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { ActionButtons } from "@/components/common/ActionButtons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/use-pagination";
import { peopleService, PersonListItem } from "@/services/people";
import { PeopleStatus, PeopleType } from "@gym-monorepo/shared";
import { StatusBadge } from "@/components/common/StatusBadge";
import { InvitePeopleDialog } from "@/components/people/InvitePeopleDialog";

export default function PeoplePage() {
    const t = useTranslations("people");
    const [people, setPeople] = useState<PersonListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const pagination = usePagination({ initialLimit: 10 });
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<PeopleType | "">(PeopleType.CUSTOMER);
    const [statusFilter, setStatusFilter] = useState<PeopleStatus | "">("");
    const [personToDeactivate, setPersonToDeactivate] = useState<string | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchPeople = useCallback(async () => {
        setLoading(true);
        try {
            const data = await peopleService.list({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch || undefined,
                type: typeFilter || undefined,
                status: statusFilter || undefined,
            });
            setPeople(data.items);
            pagination.setTotal(data.total);
        } catch (error: any) {
            toast({
                title: t("toast.fetchError.title"),
                description: t("toast.fetchError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [
        debouncedSearch,
        pagination.limit,
        pagination.page,
        pagination.setTotal,
        statusFilter,
        t,
        toast,
        typeFilter,
    ]);

    useEffect(() => {
        fetchPeople();
    }, [fetchPeople]);

    const handleDeactivate = async () => {
        if (!personToDeactivate) return;
        try {
            await peopleService.remove(personToDeactivate);
            toast({
                title: t("toast.deactivateSuccess.title"),
                description: t("toast.deactivateSuccess.description"),
            });
            fetchPeople();
        } catch (error: any) {
            const message = error.response?.data?.message;
            toast({
                title: t("toast.deactivateError.title"),
                description: message || t("toast.deactivateError.description"),
                variant: "destructive",
            });
        } finally {
            setPersonToDeactivate(null);
        }
    };

    const statusOptions = useMemo(
        () => [
            { value: "", label: t("statuses.any") },
            { value: PeopleStatus.ACTIVE, label: t("statuses.active") },
            { value: PeopleStatus.INACTIVE, label: t("statuses.inactive") },
        ],
        [t]
    );

    const columns: Column<PersonListItem>[] = useMemo(
        () => [
            {
                header: t("list.table.headers.code"),
                accessorKey: "code",
                className: "font-medium",
            },
            {
                header: t("list.table.headers.name"),
                accessorKey: "fullName",
            },
            {
                header: t("list.table.headers.type"),
                cell: (person) => (
                    <Badge variant="outline">
                        {t(`types.${person.type.toLowerCase()}` as "types.customer")}
                    </Badge>
                ),
            },
            {
                header: t("list.table.headers.phone"),
                accessorKey: "phone",
                cell: (person) => person.phone || "-",
            },
            {
                header: t("list.table.headers.email"),
                accessorKey: "email",
                cell: (person) => person.email || "-",
            },
            {
                header: t("list.table.headers.tags"),
                cell: (person) => (
                    <div className="flex flex-wrap gap-1">
                        {person.tags.length === 0 ? (
                            <span className="text-sm text-muted-foreground">-</span>
                        ) : (
                            person.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))
                        )}
                    </div>
                ),
            },
            {
                header: t("list.table.headers.status"),
                cell: (person) => <StatusBadge status={person.status} />,
            },
            {
                header: t("list.table.headers.actions"),
                className: "w-[150px]",
                cell: (person) => (
                    <ActionButtons
                        editUrl={`/people/${person.id}/edit`}
                        onDelete={() => setPersonToDeactivate(person.id)}
                        permissions={{
                            edit: ["people.update"],
                            delete: ["people.delete"],
                        }}
                    />
                ),
            },
        ],
        [t]
    );

    return (
        <PermissionGuard
            requiredPermissions={["people.read"]}
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
                        <PermissionGuard requiredPermissions={["people.create"]}>
                            <Button variant="outline" onClick={() => setInviteOpen(true)}>
                                {t("buttons.invite")}
                            </Button>
                            <Button asChild>
                                <Link href="/people/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t("buttons.new")}
                                </Link>
                            </Button>
                        </PermissionGuard>
                    </div>
                </div>

                <Tabs
                    value={typeFilter}
                    onValueChange={(value) => setTypeFilter(value as PeopleType)}
                    className="w-full"
                >
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                        <TabsTrigger
                            value={PeopleType.CUSTOMER}
                            className="rounded-t-md border-b-2 border-transparent bg-transparent px-4 py-3 font-medium text-muted-foreground shadow-none hover:text-primary hover:border-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                        >
                            {t("types.customer")}
                        </TabsTrigger>
                        <TabsTrigger
                            value={PeopleType.SUPPLIER}
                            className="rounded-t-md border-b-2 border-transparent bg-transparent px-4 py-3 font-medium text-muted-foreground shadow-none hover:text-primary hover:border-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                        >
                            {t("types.supplier")}
                        </TabsTrigger>
                        <TabsTrigger
                            value={PeopleType.STAFF}
                            className="rounded-t-md border-b-2 border-transparent bg-transparent px-4 py-3 font-medium text-muted-foreground shadow-none hover:text-primary hover:border-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                        >
                            {t("types.staff")}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="rounded-md border border-border bg-card p-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground">
                                {t("list.filters.search")}
                            </label>
                            <Input
                                placeholder={t("list.filters.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground">
                                {t("list.filters.status")}
                            </label>
                            <select
                                className="w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value as PeopleStatus | "")
                                }
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <DataTable
                    data={people}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    emptyMessage={t("list.table.empty")}
                    rowKey={(person) => person.id}
                />

                <ConfirmDialog
                    open={!!personToDeactivate}
                    onOpenChange={(open) => !open && setPersonToDeactivate(null)}
                    title={t("confirm.deactivate.title")}
                    description={t("confirm.deactivate.description")}
                    onConfirm={handleDeactivate}
                    confirmLabel={t("confirm.deactivate.confirmLabel")}
                    variant="destructive"
                />

                <InvitePeopleDialog
                    open={inviteOpen}
                    onOpenChange={setInviteOpen}
                    onSuccess={fetchPeople}
                />
            </div>
        </PermissionGuard>
    );
}
