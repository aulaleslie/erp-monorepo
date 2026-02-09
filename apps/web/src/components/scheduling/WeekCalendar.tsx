"use client";

import React, { useMemo } from "react";
import {
    format,
    addDays,
    startOfWeek,
    eachDayOfInterval,
    isSameDay,
    setHours,
} from "date-fns";
import { cn } from "@/lib/utils";
import type {
    ScheduleBooking,
    TrainerAvailability,
    TrainerAvailabilityOverride,
} from "@gym-monorepo/shared";
import type { PersonListItem } from "@/services/people";

interface WeekCalendarProps {
    date: Date;
    bookings: ScheduleBooking[];
    trainers: PersonListItem[];
    availability: TrainerAvailability[];
    overrides: TrainerAvailabilityOverride[];
    onSlotClick?: (date: Date, startTime: string) => void;
    onBookingClick?: (booking: ScheduleBooking) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

export function WeekCalendar({
    date,
    bookings,
    trainers,
    availability,
    overrides,
    onSlotClick,
    onBookingClick,
}: WeekCalendarProps) {
    const start = useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date]);
    const weekDays = useMemo(() => {
        const end = addDays(start, 6);
        return eachDayOfInterval({ start, end });
    }, [start]);

    const getTrainerColor = (trainerId: string) => {
        const index = trainers.findIndex((t) => t.id === trainerId);
        const colors = [
            "bg-blue-500 border-blue-600 text-white",
            "bg-emerald-500 border-emerald-600 text-white",
            "bg-orange-500 border-orange-600 text-white",
            "bg-purple-500 border-purple-600 text-white",
            "bg-pink-500 border-pink-600 text-white",
            "bg-amber-500 border-amber-600 text-white",
            "bg-rose-500 border-rose-600 text-white",
            "bg-cyan-500 border-cyan-600 text-white",
        ];
        return colors[index % colors.length] || "bg-slate-500 border-slate-600 text-white";
    };

    const getAvailableTrainerIds = (day: Date, hour: number) => {
        const dayOfWeek = day.getDay();
        const timeStr = `${hour.toString().padStart(2, "0")}:00:00`;
        const dateStr = format(day, "yyyy-MM-dd");

        return trainers
            .filter((t) => {
                // Check template
                const hasTemplate = availability.some(
                    (a) =>
                        a.trainerId === t.id &&
                        a.dayOfWeek === dayOfWeek &&
                        a.isActive &&
                        a.startTime <= timeStr &&
                        a.endTime > timeStr
                );

                // Check overrides
                const override = overrides.find(
                    (o) =>
                        o.trainerId === t.id &&
                        o.date === dateStr &&
                        (!o.startTime || (o.startTime <= timeStr && o.endTime! > timeStr))
                );

                if (override) {
                    if (override.overrideType === "BLOCKED") return false;
                    if (override.overrideType === "MODIFIED") {
                        return override.startTime! <= timeStr && override.endTime! > timeStr;
                    }
                }

                return hasTemplate;
            })
            .map((t) => t.id);
    };

    const renderBooking = (booking: ScheduleBooking) => {
        const startH = parseInt(booking.startTime.split(":")[0]);
        const startM = parseInt(booking.startTime.split(":")[1]);
        const duration = booking.durationMinutes;

        const top = (startH - 6) * 60 + startM;
        const height = duration;

        return (
            <div
                key={booking.id}
                onClick={(e) => {
                    e.stopPropagation();
                    onBookingClick?.(booking);
                }}
                className={cn(
                    "absolute left-1 right-1 z-10 rounded-md border p-1.5 text-[10px] leading-tight shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md overflow-hidden",
                    getTrainerColor(booking.trainerId)
                )}
                style={{
                    top: `${(top / 60) * 4}rem`, // 1 hour = 4rem (h-16)
                    height: `${(height / 60) * 4}rem`,
                }}
            >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold whitespace-nowrap">{booking.startTime.substring(0, 5)}</span>
                    {booking.bookingType === "GROUP_SESSION" && (
                        <div className="rounded-full bg-white/20 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                            Group
                        </div>
                    )}
                </div>
                <div className="truncate font-bold text-[11px] leading-tight">
                    {booking.member?.person?.fullName || booking.memberId}
                </div>
                {duration >= 60 && (
                    <div className="mt-1 truncate opacity-90 italic">
                        {booking.notes || "No notes"}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col bg-background select-none">
            {/* Header */}
            <div className="grid grid-cols-[80px_1fr] border-b sticky top-0 z-30 bg-background">
                <div className="bg-muted/30 border-r" />
                <div className="grid grid-cols-7">
                    {weekDays.map((day) => {
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "flex flex-col items-center py-3 border-r last:border-r-0",
                                    isToday && "bg-primary/5"
                                )}
                            >
                                <span className={cn(
                                    "text-xs font-semibold uppercase tracking-wider mb-1",
                                    isToday ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {format(day, "EEE")}
                                </span>
                                <span className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold",
                                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                                )}>
                                    {format(day, "d")}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[80px_1fr] relative min-w-[700px]">
                    {/* Time labels */}
                    <div className="border-r bg-muted/5 sticky left-0 z-20">
                        {HOURS.map((hour) => (
                            <div key={hour} className="h-16 pr-3 text-right text-xs font-medium text-muted-foreground pt-1 bg-background/80 backdrop-blur-sm">
                                {format(setHours(new Date(), hour), "h a")}
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    <div className="grid grid-cols-7 relative">
                        {weekDays.map((day) => {
                            return (
                                <div key={day.toISOString()} className="h-[64rem] border-r last:border-r-0 relative group">
                                    {/* Hour markers */}
                                    {HOURS.map((hour) => {
                                        const availableTrainerIds = getAvailableTrainerIds(day, hour);
                                        const isAvailable = availableTrainerIds.length > 0;

                                        return (
                                            <div
                                                key={hour}
                                                className={cn(
                                                    "h-16 border-b transition-colors relative",
                                                    isAvailable
                                                        ? "bg-emerald-50/20 hover:bg-emerald-100/30 cursor-pointer"
                                                        : "bg-slate-50/50"
                                                )}
                                                onClick={() => {
                                                    if (isAvailable) {
                                                        onSlotClick?.(day, `${hour.toString().padStart(2, "0")}:00`);
                                                    }
                                                }}
                                            >
                                                {/* Mini availability indicators for trainers */}
                                                {isAvailable && (
                                                    <div className="absolute right-1 top-1 flex flex-wrap-reverse justify-end gap-0.5 max-w-[40%]">
                                                        {availableTrainerIds.map(tid => {
                                                            const colorClass = getTrainerColor(tid).split(' ')[0];
                                                            return (
                                                                <div
                                                                    key={tid}
                                                                    className={cn("h-1.5 w-1.5 rounded-full shadow-sm", colorClass)}
                                                                    title={trainers.find(t => t.id === tid)?.fullName}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Bookings */}
                                    {bookings
                                        .filter((b) => b.bookingDate === format(day, "yyyy-MM-dd"))
                                        .map(renderBooking)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
