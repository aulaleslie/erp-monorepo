"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateTimeInput } from "@/components/ui/date-time-input";
import { OverrideType } from "@gym-monorepo/shared";
import { format } from "date-fns";

interface OverrideDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    trainerName: string;
}

export function OverrideDialog({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    trainerName,
}: OverrideDialogProps) {
    const [date, setDate] = useState(initialData?.date || format(new Date(), "yyyy-MM-dd"));
    const [type, setType] = useState<OverrideType>(initialData?.overrideType || OverrideType.BLOCKED);
    const [startTime, setStartTime] = useState(initialData?.startTime?.substring(0, 5) || "09:00");
    const [endTime, setEndTime] = useState(initialData?.endTime?.substring(0, 5) || "17:00");
    const [reason, setReason] = useState(initialData?.reason || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            date,
            overrideType: type,
            startTime: type === OverrideType.MODIFIED ? `${startTime}:00` : null,
            endTime: type === OverrideType.MODIFIED ? `${endTime}:00` : null,
            reason: reason || null,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {initialData ? "Edit Override" : "Add Override"} for {trainerName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <DateTimeInput
                                id="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                enableTime={false}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as OverrideType)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={OverrideType.BLOCKED}>Blocked (Unavailable)</SelectItem>
                                    <SelectItem value={OverrideType.MODIFIED}>Modified Hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {type === OverrideType.MODIFIED && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="reason">Reason (Optional)</Label>
                            <Input
                                id="reason"
                                placeholder="Vacation, Holiday, etc."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
