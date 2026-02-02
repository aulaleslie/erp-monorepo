"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { AvailabilityEditor } from "./AvailabilityEditor";

interface AvailabilityManagerProps {
    trainerId: string;
    trainerName: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function AvailabilityManager({
    trainerId,
    trainerName,
    isOpen,
    onClose,
    onUpdate,
}: AvailabilityManagerProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Availability: {trainerName}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    <AvailabilityEditor
                        trainerId={trainerId}
                        trainerName={trainerName}
                        onUpdate={onUpdate}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
