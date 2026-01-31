"use client";

import { useState, useEffect } from "react";
import { Loader2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { AvailabilityEditor } from "@/components/scheduling/AvailabilityEditor";
import { TrainerSelector } from "@/components/scheduling/TrainerSelector";
import { peopleService, type PersonListItem } from "@/services/people";
import { PeopleType, PERMISSIONS } from "@gym-monorepo/shared";
import { PermissionGuard } from "@/components/guards/PermissionGuard";

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
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <PermissionGuard requiredPermissions={[PERMISSIONS.TRAINER_AVAILABILITY.READ]}>
            <div className="flex flex-col space-y-6 pb-20">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground">{t("description")}</p>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center">
                        <span className="text-sm font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4" /> Select Trainer:
                        </span>
                        <TrainerSelector
                            trainers={trainers}
                            selectedIds={selectedTrainerId ? [selectedTrainerId] : []}
                            onToggle={(id) => setSelectedTrainerId(id)}
                        />
                    </div>

                    {selectedTrainer ? (
                        <div className="rounded-lg border bg-background p-6">
                            <AvailabilityEditor
                                trainerId={selectedTrainer.id}
                                trainerName={selectedTrainer.fullName}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Users className="h-12 w-12 mb-4 opacity-20" />
                            <p>Please select a trainer to manage their availability.</p>
                        </div>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
