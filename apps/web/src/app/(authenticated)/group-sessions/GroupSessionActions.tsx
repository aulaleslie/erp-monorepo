"use client";

import React, { useState } from "react";
import { GroupSessionsService } from "@/services/group-sessions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
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
import { GroupSession, GroupSessionStatus } from "@gym-monorepo/shared";
import { toast } from "@/hooks/use-toast";

interface GroupSessionActionsProps {
    session: GroupSession;
    onUpdate?: () => void;
}

export function GroupSessionActions({ session, onUpdate }: GroupSessionActionsProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await GroupSessionsService.cancel(session.id);
            toast({
                title: "Success",
                description: "Group session cancelled successfully",
            });
            onUpdate?.();
        } catch (error) {
            console.error("Failed to cancel group session:", error);
            toast({
                title: "Error",
                description: "Failed to cancel group session",
                variant: "destructive",
            });
        } finally {
            setIsCancelling(false);
            setShowCancelDialog(false);
        }
    };

    return (
        <>
            <div className="flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/group-sessions/${session.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive flex items-center gap-2"
                            onClick={() => setShowCancelDialog(true)}
                            disabled={session.status === GroupSessionStatus.CANCELLED || session.status === GroupSessionStatus.EXPIRED}
                        >
                            <XCircle className="h-4 w-4" />
                            Cancel Session
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolute sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will cancel the group session for {session.itemName}.
                            Remaining sessions will be forfeited. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>No, Keep it</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleCancel();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isCancelling}
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                "Yes, Cancel Session"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
