"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { GroupSessionsService } from "@/services/group-sessions";
import { ScheduleBookingsService } from "@/services/schedule-bookings";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { GroupSession, GroupSessionParticipant, ScheduleBooking, GroupSessionStatus, BookingFilter } from "@gym-monorepo/shared";
import { Loader2, Users, History as HistoryIcon, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GroupSessionInfo } from "@/components/group-sessions/GroupSessionInfo";
import { GroupSessionParticipants } from "@/components/group-sessions/GroupSessionParticipants";
import { GroupSessionHistory } from "@/components/group-sessions/GroupSessionHistory";

export default function GroupSessionDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();
    const [session, setSession] = useState<GroupSession | null>(null);
    const [participants, setParticipants] = useState<GroupSessionParticipant[]>([]);
    const [history, setHistory] = useState<ScheduleBooking[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [sessionData, participantsData, historyData] = await Promise.all([
                GroupSessionsService.findOne(id),
                GroupSessionsService.getParticipants(id),
                ScheduleBookingsService.findAll({ groupSessionId: id } as unknown as BookingFilter)
            ]);
            setSession(sessionData);
            setParticipants(participantsData);
            setHistory(historyData.items);
        } catch (error) {
            console.error("Failed to fetch group session details:", error);
            toast({
                title: "Error",
                description: "Failed to fetch group session details.",
                variant: "destructive",
            });
            router.push("/group-sessions");
        } finally {
            setLoading(false);
        }
    }, [id, router, toast]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id, fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!session) return null;

    const statusColors: Record<GroupSessionStatus, string> = {
        [GroupSessionStatus.ACTIVE]: "bg-green-500/10 text-green-500",
        [GroupSessionStatus.EXPIRED]: "bg-red-500/10 text-red-500",
        [GroupSessionStatus.EXHAUSTED]: "bg-amber-500/10 text-amber-500",
        [GroupSessionStatus.CANCELLED]: "bg-gray-500/10 text-gray-500",
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <PageHeader
                title={`Group Session: ${session.itemName}`}
                description={`Purchased by ${session.purchaser?.person?.fullName}`}
                showBackButton
            >
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[session.status]}>
                        {session.status}
                    </Badge>
                </div>
            </PageHeader>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="participants" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Participants
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <HistoryIcon className="h-4 w-4" />
                        History (Bookings)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <GroupSessionInfo session={session} onUpdate={fetchData} />
                </TabsContent>

                <TabsContent value="participants">
                    <GroupSessionParticipants
                        sessionId={session.id}
                        participants={participants}
                        onUpdate={fetchData}
                        maxParticipants={session.maxParticipants}
                    />
                </TabsContent>

                <TabsContent value="history">
                    <GroupSessionHistory history={history} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
