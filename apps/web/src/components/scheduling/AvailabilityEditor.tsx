"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    Calendar,
    Save,
    Loader2,
    CalendarX,
    Info
} from "lucide-react";
import { TrainerAvailabilityService } from "@/services/trainer-availability";
import {
    type TrainerAvailability,
    type TrainerAvailabilityOverride,
    OverrideType
} from "@gym-monorepo/shared";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { WeeklyAvailabilityGrid } from "./WeeklyAvailabilityGrid";
import { OverrideDialog } from "./OverrideDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AvailabilityEditorProps {
    trainerId: string;
    trainerName: string;
    onUpdate?: () => void;
}

export function AvailabilityEditor({
    trainerId,
    trainerName,
    onUpdate,
}: AvailabilityEditorProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [template, setTemplate] = useState<TrainerAvailability[]>([]);
    const [overrides, setOverrides] = useState<TrainerAvailabilityOverride[]>([]);
    const [saving, setSaving] = useState(false);
    const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);

    useEffect(() => {
        if (trainerId) {
            fetchData();
        }
    }, [trainerId]);

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
            onUpdate?.();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update template." });
        } finally {
            setSaving(false);
        }
    };

    const handleAddOverride = async (payload: any) => {
        try {
            await TrainerAvailabilityService.createOverride(trainerId, payload);
            fetchData();
            toast({ title: "Success", description: "Override added successfully." });
            onUpdate?.();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to add override." });
        }
    };

    const handleDeleteOverride = async (id: string) => {
        try {
            await TrainerAvailabilityService.deleteOverride(trainerId, id);
            setOverrides(overrides.filter(o => o.id !== id));
            toast({ title: "Success", description: "Override removed." });
            onUpdate?.();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to remove override." });
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading availability data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="template" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="template">Weekly Template</TabsTrigger>
                    <TabsTrigger value="overrides">Overrides & Holidays</TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold">Weekly Availability Grid</CardTitle>
                                <CardDescription>Define the standard working hours for {trainerName}.</CardDescription>
                            </div>
                            <Button onClick={handleSaveTemplate} disabled={saving} size="sm">
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Template
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <WeeklyAvailabilityGrid
                                value={template}
                                onChange={setTemplate}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="overrides" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold">Exceptions & Overrides</h3>
                            <p className="text-sm text-muted-foreground">Manage vacations, holidays, or specific date changes.</p>
                        </div>
                        <Button onClick={() => setIsOverrideDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Override
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {overrides.length > 0 ? (
                            overrides.map(o => (
                                <Card key={o.id}>
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">{format(parseISO(o.date), "EEEE, MMM d, yyyy")}</span>
                                                    <Badge variant={o.overrideType === OverrideType.BLOCKED ? "destructive" : "secondary"}>
                                                        {o.overrideType}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col text-sm text-muted-foreground">
                                                    <span>
                                                        {o.overrideType === OverrideType.BLOCKED
                                                            ? "Unavailable all day"
                                                            : `${o.startTime?.substring(0, 5)} - ${o.endTime?.substring(0, 5)}`
                                                        }
                                                    </span>
                                                    {o.reason && (
                                                        <span className="mt-1 flex items-center gap-1 text-[11px] italic">
                                                            <Info className="h-3 w-3" /> {o.reason}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleDeleteOverride(o.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-muted-foreground">
                                <CalendarX className="mb-4 h-12 w-12 opacity-20" />
                                <p className="text-lg font-medium">No overrides found</p>
                                <p className="text-sm">Click the button above to add a new exception for {trainerName}.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <OverrideDialog
                isOpen={isOverrideDialogOpen}
                onClose={() => setIsOverrideDialogOpen(false)}
                onSubmit={handleAddOverride}
                trainerName={trainerName}
            />
        </div>
    );
}
