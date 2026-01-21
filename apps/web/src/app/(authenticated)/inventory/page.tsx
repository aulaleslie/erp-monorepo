"use client";

import { Package } from "lucide-react";
import { ComingSoon } from "@/components/common/ComingSoon";
import { useTranslations } from "next-intl";

export default function InventoryPage() {
    const t = useTranslations("inventory.comingSoon");

    return (
        <div className="container py-10">
            <ComingSoon
                icon={Package}
                title={t("title")}
                description={t("description")}
            />
        </div>
    );
}
