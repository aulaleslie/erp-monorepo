"use client";

import { UserCheck } from "lucide-react";
import { ComingSoon } from "@/components/common/ComingSoon";
import { useTranslations } from "next-intl";

export default function MembersPage() {
    const t = useTranslations("memberManagement.members.comingSoon");

    return (
        <div className="container py-10">
            <ComingSoon
                icon={UserCheck}
                title={t("title")}
                description={t("description")}
            />
        </div>
    );
}
