"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DepartmentForm } from "@/components/departments/DepartmentForm";
import { departmentsService, DepartmentListItem } from "@/services/departments";
import { useToast } from "@/hooks/use-toast";

export default function EditDepartmentPage() {
    const t = useTranslations("departments");
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();
    const [department, setDepartment] = useState<DepartmentListItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchDepartment = async () => {
            try {
                const data = await departmentsService.get(id);
                setDepartment(data);
            } catch (err) {
                setError(true);
                toast({
                    title: t("toast.loadError.title"),
                    description: t("toast.loadError.description"),
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDepartment();
        }
    }, [id, t, toast]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !department) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{t("toast.loadError.description")}</AlertDescription>
            </Alert>
        );
    }

    return (
        <PermissionGuard
            requiredPermissions={["departments.update"]}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noEditPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <PageHeader
                    title={t("edit.page.title")}
                    description={t("edit.page.description")}
                />
                <DepartmentForm mode="edit" initialData={department} />
            </div>
        </PermissionGuard>
    );
}
