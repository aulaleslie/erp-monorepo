"use client";

import { useEffect, useState } from "react";
import { UserCheck, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AttendanceService, AttendanceRecord } from "@/services/attendance";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LoadingState } from "@/components/common/LoadingState";

export function TodayAttendanceWidget() {
    const t = useTranslations("memberManagement.attendance");
    const [items, setItems] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await AttendanceService.getTodayCheckIns();
                setItems(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    if (isLoading) {
        return (
            <Card className="col-span-1 border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Today&apos;s Attendance</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center">
                    <LoadingState />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">
                        {t("checkIn.title")}
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-wider font-semibold text-primary/70">
                        {items.length} Checked In
                    </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold">
                                {item.member.person.fullName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none truncate">
                                    {item.member.person.fullName}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {format(new Date(item.checkInAt), "p")} • {t(`checkIn.types.${item.attendanceType}`)}
                                </p>
                            </div>
                            {!item.checkOutAt && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 bg-emerald-50 text-emerald-700 border-emerald-100 italic">
                                    IN
                                </Badge>
                            )}
                        </div>
                    ))}
                    {items.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                            No check-ins today.
                        </p>
                    )}
                    <div className="flex flex-col gap-2 mt-2">
                        <Button className="w-full text-xs" size="sm" asChild>
                            <Link href="/attendance/check-in">
                                <UserCheck className="mr-2 h-3 w-3" />
                                {t("checkIn.quickCheckIn")}
                            </Link>
                        </Button>
                        <Button variant="ghost" className="w-full text-xs hover:bg-primary/5 hover:text-primary transition-colors" size="sm" asChild>
                            <Link href="/attendance">
                                {t("history.title")} <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
