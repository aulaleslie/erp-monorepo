"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { TrainerAvailability } from "@gym-monorepo/shared";

interface WeeklyAvailabilityGridProps {
    value: TrainerAvailability[];
    onChange: (newValue: TrainerAvailability[]) => void;
}

const DAYS = [
    { id: 1, name: "Mon" },
    { id: 2, name: "Tue" },
    { id: 3, name: "Wed" },
    { id: 4, name: "Thu" },
    { id: 5, name: "Fri" },
    { id: 6, name: "Sat" },
    { id: 0, name: "Sun" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeeklyAvailabilityGrid({ value, onChange }: WeeklyAvailabilityGridProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<"add" | "remove" | null>(null);

    const isSlotAvailable = useCallback((dayOfWeek: number, hour: number) => {
        return value.some(slot => {
            if (slot.dayOfWeek !== dayOfWeek) return false;
            const startHour = parseInt(slot.startTime.split(":")[0]);
            const endHour = parseInt(slot.endTime.split(":")[0]);
            return hour >= startHour && hour < endHour;
        });
    }, [value]);

    const handleToggleSlot = (dayId: number, hour: number) => {
        const currentlyAvailable = isSlotAvailable(dayId, hour);
        let newValue: TrainerAvailability[] = [...value];

        if (currentlyAvailable) {
            // Remove the hour from existing slots
            // This is slightly complex because a slot might cover multiple hours
            // We'll simplify for now: if user clicks an hour, we remove the entire slot it belongs to
            // or we could split the slot.
            // Requirement says "Click/drag to set available hours".
            // Let's implement a simpler "block-based" logic where each hour is its own slot or merged.

            // Simpler approach for V1: toggle 1-hour slots.
            newValue = value.filter(slot => {
                const startHour = parseInt(slot.startTime.split(":")[0]);
                const endHour = parseInt(slot.endTime.split(":")[0]);
                return !(slot.dayOfWeek === dayId && hour >= startHour && hour < endHour);
            });
        } else {
            // Add 1-hour slot
            const newSlot: TrainerAvailability = {
                id: `new-${dayId}-${hour}`, // Temp ID
                tenantId: "", // Not needed for UI state
                trainerId: "", // Not needed for UI state
                dayOfWeek: dayId,
                startTime: `${hour.toString().padStart(2, "0")}:00:00`,
                endTime: `${(hour + 1).toString().padStart(2, "0")}:00:00`,
                isActive: true,
            };
            newValue.push(newSlot);
        }
        onChange(newValue);
    };

    const handleMouseDown = (dayId: number, hour: number) => {
        setIsDragging(true);
        const currentlyAvailable = isSlotAvailable(dayId, hour);
        setDragType(currentlyAvailable ? "remove" : "add");
        handleToggleSlot(dayId, hour);
    };

    const handleMouseEnter = (dayId: number, hour: number) => {
        if (!isDragging || !dragType) return;

        const currentlyAvailable = isSlotAvailable(dayId, hour);
        if (dragType === "add" && !currentlyAvailable) {
            handleToggleSlot(dayId, hour);
        } else if (dragType === "remove" && currentlyAvailable) {
            handleToggleSlot(dayId, hour);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragType(null);
    };

    return (
        <div
            className="select-none overflow-x-auto"
            onMouseLeave={handleMouseUp}
            onMouseUp={handleMouseUp}
        >
            <div className="min-w-[700px]">
                <div className="grid grid-cols-8 gap-px border-b">
                    <div className="p-2 text-center text-xs font-medium text-muted-foreground border-r">Time</div>
                    {DAYS.map(day => (
                        <div key={day.id} className="p-2 text-center text-xs font-bold uppercase tracking-wider">
                            {day.name}
                        </div>
                    ))}
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                    {HOURS.map(hour => (
                        <div key={hour} className="grid grid-cols-8 gap-px border-b last:border-0 hover:bg-muted/30">
                            <div className="flex items-center justify-center p-2 text-[10px] text-muted-foreground border-r font-mono">
                                {hour.toString().padStart(2, "0")}:00
                            </div>
                            {DAYS.map(day => {
                                const available = isSlotAvailable(day.id, hour);
                                return (
                                    <div
                                        key={`${day.id}-${hour}`}
                                        onMouseDown={() => handleMouseDown(day.id, hour)}
                                        onMouseEnter={() => handleMouseEnter(day.id, hour)}
                                        className={cn(
                                            "h-10 cursor-pointer transition-all duration-75",
                                            available
                                                ? "bg-primary/80 hover:bg-primary"
                                                : "hover:bg-muted"
                                        )}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <div className="h-3 w-3 bg-primary/80 rounded" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-3 w-3 border rounded" />
                    <span>Unavailable</span>
                </div>
                <p className="ml-auto italic">Tip: Click and drag to quickly set availability.</p>
            </div>
        </div>
    );
}
