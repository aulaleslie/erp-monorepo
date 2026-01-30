"use client";

import { useState } from "react";
import { Membership, MembershipStatus } from "@gym-monorepo/shared";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, XCircle, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { MembershipForm } from "./MembershipForm";
import { useToast } from "@/hooks/use-toast";
import { MembersService } from "@/services/members";

interface MembershipsListProps {
    memberId: string;
    memberships: Membership[];
    onRefresh: () => void;
}

export function MembershipsList({ memberId, memberships, onRefresh }: MembershipsListProps) {
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [membershipToCancel, setMembershipToCancel] = useState<Membership | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const handleCancel = async () => {
        if (!membershipToCancel) return;

        setCancelling(true);
        try {
            await MembersService.cancelMembership(membershipToCancel.id);
            toast({
                title: "Success",
                description: "Membership cancelled successfully.",
            });
            onRefresh();
            setMembershipToCancel(null);
        } catch (error: unknown) {
            console.error("Failed to cancel membership", error);
            toast({
                title: "Error",
                description: "Failed to cancel membership.",
                variant: "destructive",
            });
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Memberships</h3>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Membership
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add Manual Membership</DialogTitle>
                            <DialogDescription>
                                Create a new membership for this member manually. This will bypass the sales flow.
                            </DialogDescription>
                        </DialogHeader>
                        <MembershipForm
                            memberId={memberId}
                            onSuccess={() => {
                                setIsCreateOpen(false);
                                onRefresh();
                            }}
                            onCancel={() => setIsCreateOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                columns={[
                    {
                        header: "Item",
                        cell: (m) => (
                            <div className="flex flex-col">
                                <span className="font-medium">{m.itemName}</span>
                                {m.notes && <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{m.notes}</span>}
                            </div>
                        )
                    },
                    {
                        header: "Status",
                        cell: (m) => {
                            const colors: Record<MembershipStatus, string> = {
                                [MembershipStatus.ACTIVE]: "bg-green-500/10 text-green-500",
                                [MembershipStatus.EXPIRED]: "bg-red-500/10 text-red-500",
                                [MembershipStatus.CANCELLED]: "bg-gray-500/10 text-gray-500",
                            };
                            return (
                                <Badge variant="outline" className={colors[m.status]}>
                                    {m.status}
                                </Badge>
                            );
                        }
                    },
                    {
                        header: "Start Date",
                        cell: (m) => format(new Date(m.startDate), "dd MMM yyyy")
                    },
                    {
                        header: "End Date",
                        cell: (m) => format(new Date(m.endDate), "dd MMM yyyy")
                    },
                    {
                        header: "Price",
                        cell: (m) => `$${m.pricePaid}`
                    },
                    {
                        header: "Source",
                        cell: (m) => (
                            <div className="flex items-center gap-1 text-muted-foreground">
                                {m.sourceDocumentId ? (
                                    <>
                                        <FileText className="h-3 w-3" />
                                        <span className="text-xs text-primary hover:underline cursor-pointer">Invoice</span>
                                    </>
                                ) : (
                                    <span className="text-xs italic">Manual</span>
                                )}
                            </div>
                        )
                    },
                    {
                        header: "Actions",
                        className: "text-right",
                        cell: (m) => (
                            <div className="flex justify-end gap-2">
                                {m.status === MembershipStatus.ACTIVE && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setMembershipToCancel(m)}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )
                    }
                ]}
                data={memberships}
                emptyMessage="No memberships found."
            />

            <AlertDialog open={!!membershipToCancel} onOpenChange={(open) => !open && setMembershipToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolute sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will cancel the membership for {membershipToCancel?.itemName}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling}>No, Keep it</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleCancel();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={cancelling}
                        >
                            {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Cancel Membership
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
