"use client";

import React, { useMemo } from "react";
import {
    format,
    addDays,
    startOfWeek,
    eachDayOfInterval,
    isSameDay,
    parse,
    setHours,
    setMinutes,
    differenceInMinutes,
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

    const isSlotAvailable = (day: Date, hour: number) => {
        const dayOfWeek = day.getDay();
        const timeStr = `${hour.toString().padStart(2, "0")}:00:00`;

        // Check template
        const hasTemplate = availability.some(
            (a) => a.dayOfWeek === dayOfWeek && a.isActive && a.startTime <= timeStr && a.endTime > timeStr
        );

        // Check overrides (simplified for now: just BLOCKED)
        const dateStr = format(day, "yyyy-MM-dd");
        const isBlocked = overrides.some(
            (o) => o.date === dateStr && o.overrideType === "BLOCKED" &&
                (!o.startTime || (o.startTime <= timeStr && o.endTime! > timeStr))
        );

        return hasTemplate && !isBlocked;
    };

    const renderBooking = (booking: ScheduleBooking) => {
        const startH = parseInt(booking.startTime.split(":")[0]);
        const startM = parseInt(booking.startTime.split(":")[1]);
        const duration = booking.durationMinutes;

        const top = ((startH - 6) * 60 + startM);
        const height = duration;

        return (
            <div
                key={booking.id}
                onClick={(e) => {
                    e.stopPropagation();
                    onBookingClick?.(booking);
                }}
                className={cn(
                    "absolute left-1 right-1 z-10 rounded border p-1 text-[10px] leading-tight shadow-sm cursor-pointer transition-opacity hover:opacity-90 overflow-hidden",
                    getTrainerColor(booking.trainerId)
                )}
                style={{
                    top: `${(top / 60) * 4}rem`, // 1 hour = 4rem (h-16)
                    height: `${(height / 60) * 4}rem`,
                }}
            >
                <div className="font-bold truncate">{booking.startTime.substring(0, 5)}</div>
                <div className="truncate font-semibold text-[11px]">
                    {booking.member?.person.fullName || booking.memberId}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header */}
            <div className="grid grid-cols-[80px_1fr] border-b">
                <div className="bg-muted/30" />
                <div className="grid grid-cols-7 border-l">
                    {weekDays.map((day) => (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "flex flex-col items-center py-2 border-r last:border-r-0",
                                isSameDay(day, new Date()) && "bg-accent/50"
                            )}
                        >
                            <span className="text-xs font-medium text-muted-foreground">
                                {format(day, "EEE")}
                            </span>
                            <span className="text-sm font-bold">
                                {format(day, "d")}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-[80px_1fr] relative">
                    {/* Time labels */}
                    <div className="border-r bg-muted/10">
                        {HOURS.map((hour) => (
                            <div key={hour} className="h-16 pr-2 text-right text-xs text-muted-foreground pt-1">
                                {format(setHours(new Date(), hour), "h a")}
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    <div className="grid grid-cols-7 relative">
                        {weekDays.map((day) => (
                            <div key={day.toISOString()} className="h-[64rem] border-r last:border-r-0 relative group">
                                {/* Hour markers */}
                                {HOURS.map((hour) => (
                                    <div
                                        key={hour}
                                        className={cn(
                                            "h-16 border-b transition-colors",
                                            isSlotAvailable(day, hour)
                                                ? "bg-emerald-50/10 group-hover:bg-emerald-50/20 cursor-pointer"
                                                : "bg-slate-100/50"
                                        )}
                                        onClick={() => {
                                            if (isSlotAvailable(day, hour)) {
                                                onSlotClick?.(day, `${hour.toString().padStart(2, "0")}:00`);
                                            }
                                        }}
                                    />
                                ))}

                                {/* Bookings */}
                                {bookings
                                    .filter((b) => isSameDay(new Date(b.bookingDate), day))
                                    .map(renderBooking)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
