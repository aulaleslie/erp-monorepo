import React, { useState } from "react";
import { MembersService } from "@/services/members";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2, Loader2 } from "lucide-react";
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
import { Member, MemberStatus } from "@gym-monorepo/shared";
import { toast } from "@/hooks/use-toast";

interface MemberActionsProps {
    member: Member;
    onUpdate?: () => void;
}

export function MemberActions({ member, onUpdate }: MemberActionsProps) {
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

    const handleDeactivate = async () => {
        setIsDeactivating(true);
        try {
            await MembersService.update(member.id, {
                status: MemberStatus.INACTIVE,
            });
            toast({
                title: "Success",
                description: "Member deactivated successfully",
            });
            onUpdate?.();
        } catch (error) {
            console.error("Failed to deactivate member:", error);
            toast({
                title: "Error",
                description: "Failed to deactivate member",
                variant: "destructive",
            });
        } finally {
            setIsDeactivating(false);
            setShowDeactivateDialog(false);
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
                            <Link href={`/members/${member.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/members/${member.id}/edit`} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Member
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive flex items-center gap-2"
                            onClick={() => setShowDeactivateDialog(true)}
                            disabled={member.status === MemberStatus.INACTIVE}
                        >
                            <Trash2 className="h-4 w-4" />
                            Deactivate
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will set the member status to Inactive. They will not be able to check in until reactivated.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeactivate();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeactivating}
                        >
                            {isDeactivating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deactivating...
                                </>
                            ) : (
                                "Deactivate"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
