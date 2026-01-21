"use client";

import { ShoppingCart } from "lucide-react";
import { ComingSoon } from "@/components/common/ComingSoon";
import { useTranslations } from "next-intl";

export default function SalesPage() {
    const t = useTranslations("sales.comingSoon");

    return (
        <div className="container py-10">
            <ComingSoon
                icon={ShoppingCart}
                title={t("title")}
                description={t("description")}
            />
        </div>
    );
}
