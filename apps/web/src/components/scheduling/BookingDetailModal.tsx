"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    UserMinus,
    MoreHorizontal,
    Loader2,
    CalendarClock,
    History
} from "lucide-react";
import {
    BookingStatus,
    BookingType,
    type ScheduleBooking,
    type UpdateBookingDto
} from "@gym-monorepo/shared";
import { cn } from "@/lib/utils";

interface BookingDetailModalProps {
    booking: ScheduleBooking | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusUpdate: (id: string, action: 'complete' | 'cancel' | 'no-show', reason?: string) => Promise<void>;
    onUpdate: (id: string, data: UpdateBookingDto) => Promise<void>;
}

export function BookingDetailModal({
    booking,
    isOpen,
    onClose,
    onStatusUpdate,
    onUpdate,
}: BookingDetailModalProps) {
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState<'view' | 'edit' | 'cancel'>('view');
    const [editData, setEditData] = useState<UpdateBookingDto>({});
    const [cancelReason, setCancelReason] = useState("");

    if (!booking) return null;

    const handleAction = async (type: 'complete' | 'cancel' | 'no-show') => {
        setLoading(true);
        try {
            await onStatusUpdate(booking.id, type, type === 'cancel' ? cancelReason : undefined);
            onClose();
        } catch (error) {
            console.error("Action failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = async () => {
        setLoading(true);
        try {
            await onUpdate(booking.id, editData);
            onClose();
            setAction('view');
        } catch (error) {
            console.error("Update failed", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.SCHEDULED:
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Scheduled</Badge>;
            case BookingStatus.COMPLETED:
                return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Completed</Badge>;
            case BookingStatus.CANCELLED:
                return <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>;
            case BookingStatus.NO_SHOW:
                return <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">No-Show</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-xl">Booking Details</DialogTitle>
                    <div className="mr-6">{getStatusBadge(booking.status)}</div>
                </DialogHeader>

                {action === 'view' && (
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-4 rounded-lg bg-muted/30 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Member</p>
                                <p className="text-lg font-bold">{booking.member?.person?.fullName || 'Unknown Member'}</p>
                                <p className="text-xs text-muted-foreground">{booking.member?.memberCode}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Date</p>
                                    <p className="text-sm font-semibold">{format(parseISO(booking.bookingDate), "EEEE, MMM d")}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Time</p>
                                    <p className="text-sm font-semibold">{booking.startTime.substring(0, 5)} ({booking.durationMinutes} min)</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Trainer</p>
                                    <p className="text-sm font-semibold">{booking.trainer?.fullName || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Type</p>
                                    <p className="text-sm font-semibold">{booking.bookingType === BookingType.PT_SESSION ? "PT Session" : "Group Session"}</p>
                                </div>
                            </div>
                        </div>

                        {booking.notes && (
                            <div className="rounded-md border bg-muted/10 p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase">Notes</p>
                                <p className="text-sm">{booking.notes}</p>
                            </div>
                        )}

                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <History className="h-4 w-4" />
                                <h3 className="text-sm font-semibold">Booking History</h3>
                            </div>
                            <div className="space-y-2 pl-6 border-l ml-2">
                                <div className="text-xs">
                                    <span className="font-semibold">Created:</span>{" "}
                                    {format(parseISO(booking.createdAt), "MMM d, yyyy HH:mm")}
                                </div>
                                {booking.status === BookingStatus.COMPLETED && booking.completedAt && (
                                    <div className="text-xs text-emerald-600">
                                        <span className="font-semibold">Completed:</span>{" "}
                                        {format(parseISO(booking.completedAt), "MMM d, yyyy HH:mm")}
                                    </div>
                                )}
                                {booking.status === BookingStatus.CANCELLED && booking.cancelledAt && (
                                    <div className="text-xs text-red-600">
                                        <span className="font-semibold">Cancelled:</span>{" "}
                                        {format(parseISO(booking.cancelledAt), "MMM d, yyyy HH:mm")}
                                        {booking.cancelledReason && (
                                            <div className="mt-1 italic">Reason: {booking.cancelledReason}</div>
                                        )}
                                    </div>
                                )}
                                {booking.status === BookingStatus.NO_SHOW && (
                                    <div className="text-xs text-orange-600">
                                        <span className="font-semibold">Marked No-Show</span>
                                    </div>
                                )}
                                {booking.updatedAt !== booking.createdAt && (
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-semibold">Last Updated:</span>{" "}
                                        {format(parseISO(booking.updatedAt), "MMM d, yyyy HH:mm")}
                                    </div>
                                )}
                            </div>
                        </div>

                        {booking.status === BookingStatus.SCHEDULED && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t">
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleAction('complete')}
                                    disabled={loading}
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Complete
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setEditData({
                                            bookingDate: booking.bookingDate,
                                            startTime: booking.startTime.substring(0, 5),
                                            durationMinutes: booking.durationMinutes,
                                            notes: booking.notes || ""
                                        });
                                        setAction('edit');
                                    }}
                                    disabled={loading}
                                >
                                    <CalendarClock className="mr-2 h-4 w-4" />
                                    Edit / Reschedule
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                    onClick={() => handleAction('no-show')}
                                    disabled={loading}
                                >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    No-Show
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setAction('cancel')}
                                    disabled={loading}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {action === 'edit' && (
                    <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <input
                                    type="date"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editData.bookingDate || ""}
                                    onChange={(e) => setEditData({ ...editData, bookingDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Time</label>
                                <input
                                    type="time"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editData.startTime || ""}
                                    onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration (min)</label>
                                <input
                                    type="number"
                                    step="15"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editData.durationMinutes || ""}
                                    onChange={(e) => setEditData({ ...editData, durationMinutes: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editData.notes || ""}
                                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button className="flex-1" onClick={handleEditSubmit} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => setAction('view')}>Cancel</Button>
                        </div>
                    </div>
                )}

                {action === 'cancel' && (
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cancellation Reason (optional)</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Why is this booking being cancelled?"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="destructive" className="flex-1" onClick={() => handleAction('cancel')} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Cancellation
                            </Button>
                            <Button variant="outline" onClick={() => setAction('view')}>Back</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
