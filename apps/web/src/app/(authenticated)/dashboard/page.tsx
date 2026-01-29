"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { TodayAttendanceWidget } from "@/components/attendance/TodayAttendanceWidget";

export default function DashboardPage() {
    const t = useTranslations("dashboard");

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("title")}
                description={t("description")}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            {t("myStatsTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            {t("pendingTasks")}
                        </p>
                    </CardContent>
                </Card>
                <TodayAttendanceWidget />
                {/* Add more cards here */}
            </div>
        </div>
    );
}
