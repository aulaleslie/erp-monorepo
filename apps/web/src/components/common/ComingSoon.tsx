import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ComingSoonProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    className?: string;
}

export function ComingSoon({ icon: Icon, title, description, className }: ComingSoonProps) {
    const t = useTranslations("common.comingSoon");

    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[400px] p-8 text-center", className)}>
            <div className="p-4 mb-6 rounded-full bg-accent/50 animate-pulse">
                {Icon && <Icon className="w-12 h-12 text-primary" />}
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight">{title}</h2>
            <p className="max-w-md mb-8 text-muted-foreground">{description}</p>
            <div className="px-4 py-2 text-sm font-medium rounded-full bg-secondary text-secondary-foreground">
                {t("badge")}
            </div>
        </div>
    )
}
