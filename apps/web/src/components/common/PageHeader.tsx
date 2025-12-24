import { Separator } from "@/components/ui/separator";

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                <div className="flex items-center space-x-2">{children}</div>
            </div>
            <Separator />
        </div>
    );
}
