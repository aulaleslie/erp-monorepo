"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    Calendar,
    Clock,
    Save,
    Loader2,
    CalendarX
} from "lucide-react";
import { TrainerAvailabilityService } from "@/services/trainer-availability";
import {
    type TrainerAvailability,
    type TrainerAvailabilityOverride,
    OverrideType
} from "@gym-monorepo/shared";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AvailabilityManagerProps {
    trainerId: string;
    trainerName: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const DAYS = [
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
    { id: 0, name: "Sunday" },
];

export function AvailabilityManager({
    trainerId,
    trainerName,
    isOpen,
    onClose,
    onUpdate,
}: AvailabilityManagerProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [template, setTemplate] = useState<TrainerAvailability[]>([]);
    const [overrides, setOverrides] = useState<TrainerAvailabilityOverride[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && trainerId) {
            fetchData();
        }
    }, [isOpen, trainerId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [avail, ovr] = await Promise.all([
                TrainerAvailabilityService.getAvailability(trainerId),
                TrainerAvailabilityService.getOverrides(trainerId, format(new Date(), "yyyy-MM-dd"), "2099-12-31")
            ]);
            setTemplate(avail);
            setOverrides(ovr);
        } catch (error) {
            console.error("Failed to fetch availability", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = (dayId: number) => {
        setTemplate([...template, {
            id: `new-${Math.random()}`,
            trainerId,
            dayOfWeek: dayId,
            startTime: "09:00:00",
            endTime: "17:00:00",
            isActive: true,
        } as any]);
    };

    const handleRemoveSlot = (id: string) => {
        setTemplate(template.filter(t => t.id !== id));
    };

    const handleSlotChange = (id: string, field: string, value: string) => {
        setTemplate(template.map(t => t.id === id ? { ...t, [field]: value.length === 5 ? value + ":00" : value } : t));
    };

    const handleSaveTemplate = async () => {
        setSaving(true);
        try {
            const slots = template.map(t => ({
                dayOfWeek: t.dayOfWeek,
                startTime: t.startTime,
                endTime: t.endTime,
                isActive: true,
            }));
            await TrainerAvailabilityService.updateAvailability(trainerId, { slots });
            toast({ title: "Success", description: "Weekly template updated." });
            onUpdate();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update template." });
        } finally {
            setSaving(false);
        }
    };

    const handleAddOverride = async () => {
        try {
            const date = format(new Date(), "yyyy-MM-dd");
            await TrainerAvailabilityService.createOverride(trainerId, {
                date,
                overrideType: OverrideType.BLOCKED,
                notes: "Manual override",
            });
            fetchData();
            toast({ title: "Success", description: "Override added. Please edit it below." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to add override." });
        }
    };

    const handleDeleteOverride = async (id: string) => {
        try {
            await TrainerAvailabilityService.deleteOverride(trainerId, id);
            setOverrides(overrides.filter(o => o.id !== id));
            toast({ title: "Success", description: "Override removed." });
            onUpdate();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to remove override." });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Availability: {trainerName}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="template" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="template">Weekly Template</TabsTrigger>
                        <TabsTrigger value="overrides">Overrides & Holidays</TabsTrigger>
                    </TabsList>

                    <TabsContent value="template" className="flex-1 overflow-auto pt-4">
                        <div className="space-y-6 pb-20">
                            {DAYS.map(day => (
                                <div key={day.id} className="space-y-2 border-b pb-4 last:border-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">{day.name}</h4>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-[10px] uppercase tracking-wider text-primary"
                                            onClick={() => handleAddSlot(day.id)}
                                        >
                                            <Plus className="mr-1 h-3 w-3" /> Add Slot
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {template.filter(t => t.dayOfWeek === day.id).map(slot => (
                                            <div key={slot.id} className="flex items-center gap-2">
                                                <Input
                                                    type="time"
                                                    className="h-9 w-32"
                                                    value={slot.startTime.substring(0, 5)}
                                                    onChange={(e) => handleSlotChange(slot.id, "startTime", e.target.value)}
                                                />
                                                <span className="text-muted-foreground">-</span>
                                                <Input
                                                    type="time"
                                                    className="h-9 w-32"
                                                    value={slot.endTime.substring(0, 5)}
                                                    onChange={(e) => handleSlotChange(slot.id, "endTime", e.target.value)}
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemoveSlot(slot.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {template.filter(t => t.dayOfWeek === day.id).length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">No slots defined (Unavailable)</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="absolute bottom-6 right-6">
                            <Button onClick={handleSaveTemplate} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Template
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="overrides" className="flex-1 overflow-auto pt-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">Manage specific dates, vacations, or blocked times.</p>
                                <Button size="sm" onClick={handleAddOverride}>
                                    <CalendarX className="mr-2 h-4 w-4" /> Add Override
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {overrides.map(o => (
                                    <div key={o.id} className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold">{format(parseISO(o.date), "MMM d, yyyy")}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {o.startTime ? `${o.startTime.substring(0, 5)} - ${o.endTime?.substring(0, 5)}` : "Full Day"}
                                                </span>
                                            </div>
                                            <Badge variant={o.overrideType === OverrideType.BLOCKED ? "destructive" : "secondary"}>
                                                {o.overrideType}
                                            </Badge>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive"
                                            onClick={() => handleDeleteOverride(o.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {overrides.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <Calendar className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="text-sm">No future overrides found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
