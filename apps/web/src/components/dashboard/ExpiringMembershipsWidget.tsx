"use client";

import { useEffect, useState } from "react";
import { Clock, ArrowRight, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MembershipsService } from "@/services/memberships";
import type { Membership } from "@gym-monorepo/shared";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LoadingState } from "@/components/common/LoadingState";

export function ExpiringMembershipsWidget() {
    const t = useTranslations("dashboard");
    const [items, setItems] = useState<Membership[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const today = new Date();
                const todayStr = format(today, "yyyy-MM-dd");
                const sevenDaysFromNow = addDays(today, 7);
                const sevenDaysFromNowStr = format(sevenDaysFromNow, "yyyy-MM-dd");

                const response = await MembershipsService.findAll({
                    status: 'ACTIVE',
                    expiresAfter: todayStr,
                    expiresBefore: sevenDaysFromNowStr,
                    limit: 5
                });
                setItems(response.items);
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
                    <CardTitle className="text-sm font-medium">
                        {t("expiringSoonTitle")}
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
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
                        {t("expiringSoonTitle")}
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-wider font-semibold text-amber-600">
                        {t("membershipsCount", { count: items.length })}
                    </CardDescription>
                </div>
                <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold">
                                {item.member?.person?.fullName?.charAt(0) || <User className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium leading-none truncate">
                                        {item.member?.person?.fullName || "Unknown Member"}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        #{item.member?.memberCode}
                                    </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {t("expiresOn", { date: format(new Date(item.endDate), "PPP") })}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href={`/members/${item.memberId}`}>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                            {t("noExpiringMemberships")}
                        </p>
                    )}
                    <div className="mt-2">
                        <Button variant="ghost" className="w-full text-xs hover:bg-primary/5 hover:text-primary transition-colors" size="sm" asChild>
                            <Link href="/members">
                                {t("viewAllMembers")} <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
