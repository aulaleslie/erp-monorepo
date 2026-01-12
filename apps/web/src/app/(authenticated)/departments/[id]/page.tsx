"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { departmentsService, DepartmentListItem } from "@/services/departments";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataTable, Column } from "@/components/common/DataTable";
import { usePagination } from "@/hooks/use-pagination";

export default function DepartmentDetailsPage() {
    const t = useTranslations("departments");
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [department, setDepartment] = useState<DepartmentListItem | null>(null);
    const [loading, setLoading] = useState(true);
    const pagination = usePagination({ initialLimit: 10 });

    const fetchDepartment = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await departmentsService.get(id as string);
            setDepartment(data);
        } catch (error: any) {
            toast({
                title: t("toast.fetchError.title"),
                description: t("toast.fetchError.description"),
                variant: "destructive",
            });
            router.push("/departments");
        } finally {
            setLoading(false);
        }
    }, [id, t, toast, router]);

    useEffect(() => {
        fetchDepartment();
    }, [fetchDepartment]);

    const peopleColumns: Column<any>[] = [
        {
            header: t("details.people.code"),
            accessorKey: "code",
            className: "font-medium",
        },
        {
            header: t("details.people.name"),
            accessorKey: "fullName",
        },
        {
            header: t("details.people.email"),
            accessorKey: "email",
        },
        {
            header: t("details.people.phone"),
            accessorKey: "phone",
        },
        {
            header: t("details.people.status"),
            cell: (item) => <StatusBadge status={item.status} />,
        },
    ];

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!department) {
        return null;
    }

    return (
        <PermissionGuard requiredPermissions={["departments.read"]}>
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/departments">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <PageHeader
                            title={department.name}
                            description={department.code}
                        />
                    </div>
                    <PermissionGuard requiredPermissions={["departments.update"]}>
                        <Button asChild>
                            <Link href={`/departments/${department.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("buttons.edit")}
                            </Link>
                        </Button>
                    </PermissionGuard>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-md border border-border bg-card p-6">
                        <h3 className="mb-4 text-lg font-semibold">{t("details.info")}</h3>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">{t("list.table.headers.code")}</dt>
                                <dd>{department.code}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">{t("list.table.headers.name")}</dt>
                                <dd>{department.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">{t("list.table.headers.status")}</dt>
                                <dd><StatusBadge status={department.status} /></dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div className="rounded-md border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold">{t("details.people.title")}</h3>
                    <DataTable
                        data={department.people || []}
                        columns={peopleColumns}
                        loading={false}
                        pagination={pagination}
                        emptyMessage={t("details.people.empty")}
                        rowKey={(item) => item.id}
                    />
                </div>
            </div>
        </PermissionGuard>
    );
}
