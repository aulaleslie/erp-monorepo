"use client";

import { Calendar } from "lucide-react";
import { ComingSoon } from "@/components/common/ComingSoon";
import { useTranslations } from "next-intl";

export default function AvailabilityPage() {
    const t = useTranslations("memberManagement.scheduling.page.availability");

    return (
        <div className="container py-10">
            <ComingSoon
                icon={Calendar}
                title={t("title")}
                description={t("description")}
            />
        </div>
    );
}
