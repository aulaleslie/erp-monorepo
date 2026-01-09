"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { PersonForm } from "@/components/people/PersonForm";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { peopleService, PersonListItem } from "@/services/people";
import { useToast } from "@/hooks/use-toast";

export default function EditPersonPage() {
    const t = useTranslations("people");
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [person, setPerson] = useState<PersonListItem | null>(null);

    useEffect(() => {
        const fetchPerson = async () => {
            if (!id || typeof id !== "string") return;

            try {
                const data = await peopleService.get(id);
                setPerson(data);
            } catch {
                toast({
                    title: t("toast.loadError.title"),
                    description: t("toast.loadError.description"),
                    variant: "destructive",
                });
                router.push("/people");
            } finally {
                setLoading(false);
            }
        };

        fetchPerson();
    }, [id, router, toast, t]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!person) {
        return null;
    }

    return (
        <PermissionGuard
            requiredPermissions={["people.update"]}
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
                <PersonForm mode="edit" initialData={person} />
            </div>
        </PermissionGuard>
    );
}
