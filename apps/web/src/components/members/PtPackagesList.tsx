"use client";

import { useState } from "react";
import { PtSessionPackage, PtPackageStatus } from "@gym-monorepo/shared";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, XCircle, FileText, Loader2, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
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
import { PtPackageForm } from "./PtPackageForm";
import { useToast } from "@/hooks/use-toast";
import { MembersService } from "@/services/members";
import { peopleService, PersonListItem } from "@/services/people";
import { PeopleType } from "@gym-monorepo/shared";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PtPackagesListProps {
    memberId: string;
    ptPackages: PtSessionPackage[];
    onRefresh: () => void;
}

export function PtPackagesList({ memberId, ptPackages, onRefresh }: PtPackagesListProps) {
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [packageToCancel, setPackageToCancel] = useState<PtSessionPackage | null>(null);
    const [packageToChangeTrainer, setPackageToChangeTrainer] = useState<PtSessionPackage | null>(null);
    const [trainers, setTrainers] = useState<PersonListItem[]>([]);
    const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
    const [loadingTrainers, setLoadingTrainers] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [updatingTrainer, setUpdatingTrainer] = useState(false);

    const loadTrainers = async () => {
        setLoadingTrainers(true);
        try {
            const response = await peopleService.list({
                page: 1,
                limit: 100,
                type: PeopleType.STAFF
            });
            setTrainers(response.items);
        } catch (error) {
            console.error("Failed to load trainers", error);
            toast({
                title: "Error",
                description: "Failed to load trainers.",
                variant: "destructive",
            });
        } finally {
            setLoadingTrainers(false);
        }
    };

    const handleChangeTrainer = async () => {
        if (!packageToChangeTrainer || !selectedTrainerId) return;

        setUpdatingTrainer(true);
        try {
            await MembersService.updatePtPackage(packageToChangeTrainer.id, {
                preferredTrainerId: selectedTrainerId
            });
            toast({
                title: "Success",
                description: "Trainer updated successfully.",
            });
            onRefresh();
            setPackageToChangeTrainer(null);
        } catch (error) {
            console.error("Failed to update trainer", error);
            toast({
                title: "Error",
                description: "Failed to update trainer.",
                variant: "destructive",
            });
        } finally {
            setUpdatingTrainer(false);
        }
    };

    const handleCancel = async () => {
        if (!packageToCancel) return;

        setCancelling(true);
        try {
            await MembersService.cancelPtPackage(packageToCancel.id);
            toast({
                title: "Success",
                description: "PT package cancelled successfully.",
            });
            onRefresh();
            setPackageToCancel(null);
        } catch (error: unknown) {
            console.error("Failed to cancel PT package", error);
            toast({
                title: "Error",
                description: "Failed to cancel PT package.",
                variant: "destructive",
            });
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">PT Packages</h3>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add PT Package
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add Manual PT Package</DialogTitle>
                            <DialogDescription>
                                Create a new PT package for this member manually.
                            </DialogDescription>
                        </DialogHeader>
                        <PtPackageForm
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
                        cell: (p) => (
                            <div className="flex flex-col">
                                <span className="font-medium">{p.itemName}</span>
                            </div>
                        )
                    },
                    {
                        header: "Trainer",
                        cell: (p) => p.preferredTrainer?.fullName || "—"
                    },
                    {
                        header: "Status",
                        cell: (p) => {
                            const colors: Record<PtPackageStatus, string> = {
                                [PtPackageStatus.ACTIVE]: "bg-green-500/10 text-green-500",
                                [PtPackageStatus.EXPIRED]: "bg-red-500/10 text-red-500",
                                [PtPackageStatus.EXHAUSTED]: "bg-amber-500/10 text-amber-500",
                                [PtPackageStatus.CANCELLED]: "bg-gray-500/10 text-gray-500",
                            };
                            return (
                                <Badge variant="outline" className={colors[p.status]}>
                                    {p.status}
                                </Badge>
                            );
                        }
                    },
                    {
                        header: "Sessions",
                        cell: (p) => (
                            <div className="flex flex-col">
                                <span>{p.usedSessions} / {p.totalSessions}</span>
                                <span className="text-[10px] text-muted-foreground">{p.remainingSessions} remaining</span>
                            </div>
                        )
                    },
                    {
                        header: "Expiry",
                        cell: (p) => p.expiryDate ? format(new Date(p.expiryDate), "dd MMM yyyy") : "—"
                    },
                    {
                        header: "Source",
                        cell: (p) => (
                            <div className="flex items-center gap-1 text-muted-foreground">
                                {p.sourceDocumentId ? (
                                    <Link
                                        href={`/sales/invoices/${p.sourceDocumentId}`}
                                        className="flex items-center gap-1 text-primary hover:underline cursor-pointer"
                                    >
                                        <FileText className="h-3 w-3" />
                                        <span className="text-xs">Invoice</span>
                                    </Link>
                                ) : (
                                    <span className="text-xs italic">Manual</span>
                                )}
                            </div>
                        )
                    },
                    {
                        header: "Actions",
                        className: "text-right",
                        cell: (p) => (
                            <div className="flex justify-end gap-2">
                                {p.status === PtPackageStatus.ACTIVE && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                            onClick={() => {
                                                setPackageToChangeTrainer(p);
                                                setSelectedTrainerId(p.preferredTrainerId || "");
                                                loadTrainers();
                                            }}
                                            title="Change Trainer"
                                        >
                                            <UserIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setPackageToCancel(p)}
                                            title="Cancel Package"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        )
                    }
                ]}
                data={ptPackages}
                emptyMessage="No PT packages found."
            />

            <AlertDialog open={!!packageToCancel} onOpenChange={(open) => !open && setPackageToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolute sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will cancel the PT package for {packageToCancel?.itemName}.
                            Remaining sessions will be forfeited. This action cannot be undone.
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
                            Yes, Cancel Package
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!packageToChangeTrainer} onOpenChange={(open) => !open && setPackageToChangeTrainer(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change Trainer</DialogTitle>
                        <DialogDescription>
                            Select a new trainer for this PT package.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Current Package</Label>
                            <div className="text-sm font-medium">{packageToChangeTrainer?.itemName}</div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="trainer">New Trainer</Label>
                            <Select
                                value={selectedTrainerId}
                                onValueChange={setSelectedTrainerId}
                                disabled={loadingTrainers || updatingTrainer}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingTrainers ? "Loading trainers..." : "Select a trainer"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {trainers.map((trainer) => (
                                        <SelectItem key={trainer.id} value={trainer.id}>
                                            {trainer.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setPackageToChangeTrainer(null)}
                            disabled={updatingTrainer}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleChangeTrainer}
                            disabled={updatingTrainer || !selectedTrainerId || selectedTrainerId === packageToChangeTrainer?.preferredTrainerId}
                        >
                            {updatingTrainer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Trainer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
