"use client";

import { useState, useEffect } from "react";
import {
    Search,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Clock,
    UserCheck,
    ArrowRight,
    X
} from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MembersService, MemberLookupResult } from "@/services/members";
import { AttendanceService } from "@/services/attendance";
import { ScheduleBookingsService } from "@/services/schedule-bookings";
import { AttendanceType, CheckInMethod, ScheduleBooking } from "@gym-monorepo/shared";
import { PageHeader } from "@/components/common/PageHeader";
import { getApiErrorMessage } from "@/lib/api";

export function CheckInView() {
    const t = useTranslations("memberManagement.attendance.checkIn");
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<MemberLookupResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberLookupResult | null>(null);
    const [todayBookings, setTodayBookings] = useState<ScheduleBooking[]>([]);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleSearch = useCallback(async () => {
        setIsSearching(true);
        try {
            const results = await MembersService.lookup(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery]);

    const handleSelectMember = async (member: MemberLookupResult) => {
        setSelectedMember(member);
        setSearchResults([]);
        setSearchQuery("");
        fetchMemberBookings(member.id);
    };

    const fetchMemberBookings = async (memberId: string) => {
        setIsLoadingBookings(true);
        try {
            const today = format(new Date(), "yyyy-MM-dd");
            const response = await ScheduleBookingsService.findAll({
                memberId,
                dateFrom: today,
                dateTo: today,
                status: "SCHEDULED" as const
            });
            setTodayBookings(response.items);
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
            toast({
                variant: "destructive",
                title: t("form.error"),
                description: "Failed to fetch member bookings",
            });
        } finally {
            setIsLoadingBookings(false);
        }
    };

    const handleCheckIn = async (type: AttendanceType, bookingId?: string) => {
        if (!selectedMember) return;

        setIsCheckingIn(true);
        try {
            await AttendanceService.checkIn({
                memberId: selectedMember.id,
                attendanceType: type,
                bookingId,
                checkInMethod: CheckInMethod.MANUAL
            });
            toast({
                title: t("form.success"),
                description: `${selectedMember.person.fullName} checked in for ${t(`types.${type}`)}`,
            });
            setSelectedMember(null);
            setTodayBookings([]);
        } catch (error: unknown) {
            toast({
                variant: "destructive",
                title: t("form.error"),
                description: getApiErrorMessage(error),
            });
        } finally {
            setIsCheckingIn(false);
        }
    };

    const isExpired = selectedMember?.status === "EXPIRED" ||
        (selectedMember?.currentExpiryDate && new Date(selectedMember.currentExpiryDate) < new Date());

    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <PageHeader
                title={t("title")}
                description="Search for a member to record attendance or check-in for a booking."
            />

            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("search.placeholder")}
                        className="pl-10 h-12 text-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {searchResults.length > 0 && (
                    <Card className="absolute z-10 w-full mt-1 shadow-lg max-h-[400px] overflow-auto">
                        <div className="p-2 space-y-1">
                            {searchResults.map((member) => (
                                <button
                                    key={member.id}
                                    className="w-full flex items-center justify-between p-3 rounded-md hover:bg-accent text-left transition-colors"
                                    onClick={() => handleSelectMember(member)}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{member.person.fullName}</span>
                                        <span className="text-sm text-muted-foreground">{member.memberCode}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={member.status === "ACTIVE" ? "default" : "destructive"}>
                                            {member.status}
                                        </Badge>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Card>
                )}

                {isSearching && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg p-4 flex justify-center">
                        <Skeleton className="h-8 w-full" />
                    </div>
                )}
            </div>

            {selectedMember && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className={isExpired ? "border-destructive bg-destructive/5" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                    {selectedMember.person.fullName.charAt(0)}
                                </div>
                                <CardTitle>
                                    {t("memberCard.details")}
                                </CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Name</span>
                                <span className="font-semibold text-lg">{selectedMember.person.fullName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">{t("memberCard.memberCode")}</span>
                                <span className="font-medium">{selectedMember.memberCode}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">{t("memberCard.status")}</span>
                                <Badge variant={isExpired ? "destructive" : "default"}>
                                    {isExpired ? t("memberCard.expired") : t("memberCard.active")}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">{t("memberCard.expiry")}</span>
                                <span className={isExpired ? "text-destructive font-semibold" : ""}>
                                    {selectedMember.currentExpiryDate
                                        ? format(new Date(selectedMember.currentExpiryDate), "PPP")
                                        : "No active membership"}
                                </span>
                            </div>

                            {isExpired && (
                                <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex gap-3 text-destructive">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p className="text-sm font-medium">
                                        Member has no active membership. Check-in is blocked.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full h-12 text-lg"
                                disabled={isExpired || isCheckingIn}
                                onClick={() => handleCheckIn(AttendanceType.GYM_ENTRY)}
                            >
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                {t("actions.gymEntry")}
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    {t("bookings.title")}
                                </CardTitle>
                                <CardDescription>
                                    {t("bookings.description")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingBookings ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                ) : todayBookings.length > 0 ? (
                                    <div className="space-y-3">
                                        {todayBookings.map((booking) => (
                                            <div
                                                key={booking.id}
                                                className="flex items-center justify-between p-3 border rounded-md"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {booking.bookingType === "PT_SESSION" ? t("types.PT_SESSION") : t("types.GROUP_CLASS")}
                                                    </span>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {booking.startTime.substring(0, 5)} - {booking.endTime.substring(0, 5)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <UserCheck className="h-3 w-3" />
                                                            {booking.trainer?.fullName}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    disabled={isExpired || isCheckingIn}
                                                    onClick={() => handleCheckIn(
                                                        booking.bookingType === "PT_SESSION"
                                                            ? AttendanceType.PT_SESSION
                                                            : AttendanceType.GROUP_CLASS,
                                                        booking.id
                                                    )}
                                                >
                                                    {t("bookings.checkIn")}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground italic">
                                        {t("bookings.noBookings")}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setSelectedMember(null)}
                        >
                            {t("actions.cancel")}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
