"use client";

import { useTranslations } from "next-intl";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { PERMISSIONS } from "@gym-monorepo/shared";
import { MemberForm } from "@/components/members/MemberForm";
import { UserPlus } from "lucide-react";

export default function NewMemberPage() {
    const t = useTranslations("members");

    return (
        <PermissionGuard
            requiredPermissions={[PERMISSIONS.MEMBERS.CREATE]}
            fallback={
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <p className="text-muted-foreground">{t("page.noPermission")}</p>
                </div>
            }
        >
            <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <UserPlus className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            {t("page.new.title")}
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg ml-16 max-w-2xl">
                        Register a new member to the gym. You can link them to an existing person record or create a new one from scratch.
                    </p>
                </div>

                <MemberForm mode="create" />
            </div>
        </PermissionGuard>
    );
}
