"use client";

import React, { useState } from "react";
import { GroupSessionsService } from "@/services/group-sessions";
import { GroupSessionParticipant } from "@gym-monorepo/shared";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { UserPlus, Trash2, Loader2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AddParticipantModal } from "./AddParticipantModal";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface GroupSessionParticipantsProps {
    sessionId: string;
    participants: GroupSessionParticipant[];
    maxParticipants: number;
    onUpdate: () => void;
}

export function GroupSessionParticipants({
    sessionId,
    participants,
    maxParticipants,
    onUpdate
}: GroupSessionParticipantsProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [participantToRemove, setParticipantToRemove] = useState<GroupSessionParticipant | null>(null);
    const { toast } = useToast();

    const handleAddParticipant = async (memberId: string) => {
        setIsAdding(true);
        try {
            await GroupSessionsService.addParticipant(sessionId, memberId);
            toast({
                title: "Success",
                description: "Participant added successfully.",
            });
            onUpdate();
        } catch (error: unknown) {
            console.error("Failed to add participant:", error);
            let errorMessage = "Failed to add participant.";
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                errorMessage = axiosError.response?.data?.message || errorMessage;
            }
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveParticipant = async () => {
        if (!participantToRemove) return;
        setIsRemoving(true);
        try {
            await GroupSessionsService.removeParticipant(sessionId, participantToRemove.id);
            toast({
                title: "Success",
                description: "Participant removed successfully.",
            });
            onUpdate();
        } catch (error) {
            console.error("Failed to remove participant:", error);
            toast({
                title: "Error",
                description: "Failed to remove participant.",
                variant: "destructive",
            });
        } finally {
            setIsRemoving(false);
            setParticipantToRemove(null);
        }
    };

    const columns: Column<GroupSessionParticipant>[] = [
        {
            header: "Member Name",
            cell: (p: GroupSessionParticipant) => (
                <div className="flex flex-col">
                    <span className="font-medium">{p.member?.person?.fullName || "—"}</span>
                    <span className="text-xs text-muted-foreground">{p.member?.code || "—"}</span>
                </div>
            )
        },
        {
            header: "Date Joined",
            cell: (p: GroupSessionParticipant) => format(new Date(p.createdAt), "dd MMM yyyy HH:mm")
        },
        {
            header: "Status",
            cell: (p: GroupSessionParticipant) => (
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${p.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="text-sm">{p.isActive ? "Active" : "Inactive"}</span>
                </div>
            )
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (p: GroupSessionParticipant) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setParticipantToRemove(p)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )
        }
    ];

    const canAddMore = participants.length < maxParticipants;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Users className="h-5 w-5 text-primary" />
                        Participant Management
                    </CardTitle>
                    <CardDescription>
                        {participants.length} / {maxParticipants} participants enrolled.
                    </CardDescription>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={!canAddMore}
                    className="gap-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Add Member
                </Button>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={columns}
                    data={participants}
                    emptyMessage="No participants enrolled in this session."
                />
            </CardContent>

            <AddParticipantModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddParticipant}
                isLoading={isAdding}
            />

            <AlertDialog open={!!participantToRemove} onOpenChange={(open) => !open && setParticipantToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Participant?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-foreground">
                                {participantToRemove?.member?.person?.fullName}
                            </span>{" "}
                            from this group session? This action can be undone by re-adding them later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleRemoveParticipant();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isRemoving}
                        >
                            {isRemoving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                "Yes, Remove Participant"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
