import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10 border-dashed animate-in fade-in-50", className)}>
            {Icon && <div className="p-3 mb-4 rounded-full bg-muted"><Icon className="w-6 h-6 text-muted-foreground" /></div>}
            <h3 className="mb-2 text-lg font-medium tracking-tight">{title}</h3>
            <p className="max-w-xs mb-6 text-sm text-muted-foreground">{description}</p>
            {action}
        </div>
    )
}
