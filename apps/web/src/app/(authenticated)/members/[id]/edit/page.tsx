"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { PERMISSIONS, Member } from "@gym-monorepo/shared";
import { MemberForm } from "@/components/members/MemberForm";
import { MembersService } from "@/services/members";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCog } from "lucide-react";

export default function EditMemberPage() {
    const t = useTranslations("members");
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const { toast } = useToast();
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const data = await MembersService.findOne(id);
                setMember(data);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to fetch member details.",
                });
                router.push("/members");
            } finally {
                setLoading(false);
            }
        };
        fetchMember();
    }, [id, router, toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!member) return null;

    return (
        <PermissionGuard
            requiredPermissions={[PERMISSIONS.MEMBERS.UPDATE]}
            fallback={
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <p className="text-muted-foreground">{t("page.noPermission")}</p>
                </div>
            }
        >
            <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col gap-2 border-b border-muted-foreground/10 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <UserCog className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            {t("page.edit.title")}
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg ml-16 max-w-2xl">
                        Modify member details, update their status, or manage terms agreement and internal notes.
                    </p>
                </div>

                <MemberForm mode="edit" initialData={member} />
            </div>
        </PermissionGuard>
    );
}
