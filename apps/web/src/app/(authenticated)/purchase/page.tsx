"use client";

import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/common/ComingSoon";
import { useTranslations } from "next-intl";

export default function PurchasePage() {
    const t = useTranslations("purchase.comingSoon");

    return (
        <div className="container py-10">
            <ComingSoon
                icon={CreditCard}
                title={t("title")}
                description={t("description")}
            />
        </div>
    );
}
