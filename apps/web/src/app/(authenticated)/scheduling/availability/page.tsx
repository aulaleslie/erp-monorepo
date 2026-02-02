"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { AvailabilityEditor } from "@/components/scheduling/AvailabilityEditor";
import { peopleService, type PersonListItem } from "@/services/people";
import { PeopleType, PERMISSIONS } from "@gym-monorepo/shared";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

export default function AvailabilityPage() {
    const t = useTranslations("memberManagement.scheduling.page.availability");
    const [trainers, setTrainers] = useState<PersonListItem[]>([]);
    const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrainers = async () => {
            try {
                const response = await peopleService.list({ page: 1, limit: 100, type: PeopleType.STAFF });
                setTrainers(response.items);
                if (response.items.length > 0) {
                    setSelectedTrainerId(response.items[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch trainers", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrainers();
    }, []);

    const selectedTrainer = trainers.find(t => t.id === selectedTrainerId);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Loading staff records...</p>
                </div>
            </div>
        );
    }

    return (
        <PermissionGuard requiredPermissions={[PERMISSIONS.TRAINER_AVAILABILITY.READ]}>
            <div className="container mx-auto space-y-8 py-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                        <LayoutDashboard className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Scheduling Management</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{t("title")}</h1>
                    <p className="text-xl text-muted-foreground max-w-[800px]">
                        {t("description")}
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <Card className="md:col-span-1 h-fit border-primary/10 shadow-lg bg-gradient-to-b from-background to-muted/20">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground/80">
                                <Users className="h-5 w-5" />
                                Staff Selection
                            </CardTitle>
                            <CardDescription>
                                Select a trainer to manage their specific availability template.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={selectedTrainerId || ""}
                                onValueChange={setSelectedTrainerId}
                            >
                                <SelectTrigger className="w-full bg-background border-primary/20 hover:border-primary/40 transition-colors">
                                    <SelectValue placeholder="Select a trainer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {trainers.map((trainer) => (
                                        <SelectItem key={trainer.id} value={trainer.id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{trainer.fullName}</span>
                                                <span className="text-[10px] text-muted-foreground">{trainer.code}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedTrainer && (
                                <div className="mt-6 space-y-4 pt-6 border-t border-dashed">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Trainer</span>
                                        <div className="text-sm font-semibold text-foreground">{selectedTrainer.fullName}</div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Role/Type</span>
                                        <div className="text-sm text-foreground/80">{selectedTrainer.type}</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3 border-primary/10 shadow-xl overflow-hidden">
                        <CardContent className="p-0">
                            {selectedTrainer ? (
                                <div className="p-6 md:p-8">
                                    <AvailabilityEditor
                                        trainerId={selectedTrainer.id}
                                        trainerName={selectedTrainer.fullName}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-muted/5">
                                    <Users className="h-16 w-16 mb-6 opacity-10" />
                                    <h3 className="text-xl font-medium">No Trainer Selected</h3>
                                    <p className="max-w-[300px] text-center mt-2">
                                        Please choose a staff member from the left panel to begin managing their availability.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PermissionGuard>
    );
}
