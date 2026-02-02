"use client";

import React from "react";
import { GroupSession } from "@gym-monorepo/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface GroupSessionInfoProps {
    session: GroupSession;
    onUpdate?: () => void;
}

export function GroupSessionInfo({ session }: GroupSessionInfoProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Session Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Item Name:</span>
                            <span className="font-medium">{session.itemName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Purchaser:</span>
                            <span className="font-medium text-primary">{session.purchaser?.person?.fullName || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Instructor:</span>
                            <span className="font-medium">{session.instructor?.fullName || "—"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Usage & Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sessions Used:</span>
                            <span className="font-medium">{session.usedSessions} / {session.totalSessions}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className="font-medium font-mono text-primary">{session.remainingSessions}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Max Participants:</span>
                            <span className="font-medium">{session.maxParticipants}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Dates & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Start Date:</span>
                            <span className="font-medium">{format(new Date(session.startDate), "dd MMM yyyy")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Expiry Date:</span>
                            <span className={session.expiryDate && new Date(session.expiryDate) < new Date() ? "text-destructive font-bold" : "font-medium"}>
                                {session.expiryDate ? format(new Date(session.expiryDate), "dd MMM yyyy") : "No Expiry"}
                            </span>
                        </div>
                    </div>
                    {session.notes && (
                        <div className="pt-2 border-t">
                            <span className="text-xs text-muted-foreground block mb-1">Internal Notes:</span>
                            <p className="text-sm italic">{session.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
