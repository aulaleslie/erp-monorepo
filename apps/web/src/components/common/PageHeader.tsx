import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
    title: string;
    description?: string;
    showBackButton?: boolean;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, showBackButton, children }: PageHeaderProps) {
    const router = useRouter();

    return (
        <div className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {showBackButton && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2">{children}</div>
            </div>
            <Separator />
        </div>
    );
}
