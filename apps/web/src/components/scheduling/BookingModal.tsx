"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addMinutes, parse } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookingType } from "@gym-monorepo/shared";
import { MembersService, type MemberLookupResult } from "@/services/members";
import type { PersonListItem } from "@/services/people";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
    memberId: z.string().min(1, "Member is required"),
    trainerId: z.string().min(1, "Trainer is required"),
    bookingType: z.nativeEnum(BookingType),
    bookingDate: z.string(),
    startTime: z.string(),
    durationMinutes: z.coerce.number().min(60, "Duration must be at least 60 minutes").max(480).refine(val => val % 60 === 0, "Duration must be a multiple of 60 minutes"),
    notes: z.string().optional(),
    ptPackageId: z.string().optional(),
}).refine((data) => {
    if (data.bookingType === BookingType.PT_SESSION && !data.ptPackageId) {
        return false;
    }
    return true;
}, {
    message: "PT Package is required for PT Sessions",
    path: ["ptPackageId"],
}).refine((data) => {
    // Current UI uses step=15. However, backend might require 60.
    // We'll keep it at 15 for now but ensure we capture the backend error message properly.
    return data.durationMinutes >= 15;
}, {
    message: "Duration must be at least 15 minutes",
    path: ["durationMinutes"],
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: BookingFormValues & { endTime: string }) => Promise<void>;
    trainers: PersonListItem[];
    initialData?: Partial<BookingFormValues>;
}

export function BookingModal({
    isOpen,
    onClose,
    onSubmit,
    trainers,
    initialData,
}: BookingModalProps) {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [memberSearch, setMemberSearch] = useState("");
    const [members, setMembers] = useState<MemberLookupResult[]>([]);
    const [searchingMembers, setSearchingMembers] = useState(false);
    const [ptPackages, setPtPackages] = useState<any[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(false);

    const form = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            memberId: "",
            trainerId: "",
            bookingType: BookingType.PT_SESSION,
            bookingDate: format(new Date(), "yyyy-MM-dd"),
            startTime: "09:00",
            durationMinutes: 60,
            notes: "",
            ...initialData,
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                memberId: "",
                trainerId: "",
                bookingType: BookingType.PT_SESSION,
                bookingDate: format(new Date(), "yyyy-MM-dd"),
                startTime: "09:00",
                durationMinutes: 60,
                notes: "",
                ...initialData,
            });
        }
    }, [initialData, form]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (memberSearch.length >= 2) {
                setSearchingMembers(true);
                try {
                    const results = await MembersService.lookup(memberSearch);
                    setMembers(results);
                } catch (error) {
                    console.error("Member lookup failed", error);
                } finally {
                    setSearchingMembers(false);
                }
            } else {
                setMembers([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [memberSearch]);

    const memberId = form.watch("memberId");
    const bookingType = form.watch("bookingType");

    useEffect(() => {
        const fetchPtPackages = async () => {
            if (!memberId) {
                setPtPackages([]);
                return;
            }
            setLoadingPackages(true);
            try {
                const packages = await MembersService.getPtPackages(memberId);
                // Filter for active and has remaining sessions
                const activePackages = packages.filter(
                    (p: any) => p.status === "ACTIVE" && p.remainingSessions > 0
                );
                setPtPackages(activePackages);

                // If there's only one package, auto-select it
                if (activePackages.length === 1) {
                    form.setValue("ptPackageId", activePackages[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch PT packages", error);
            } finally {
                setLoadingPackages(false);
            }
        };

        if (isOpen) {
            fetchPtPackages();
        }
    }, [memberId, isOpen, form]);

    const handleFormSubmit = async (values: BookingFormValues) => {
        setSubmitting(true);
        try {
            // Calculate endTime
            const startDateTime = parse(`${values.bookingDate} ${values.startTime}`, "yyyy-MM-dd HH:mm", new Date());
            const endDateTime = addMinutes(startDateTime, values.durationMinutes);
            const endTime = format(endDateTime, "HH:mm");

            // Clean payload: remove empty/undefined optional fields
            // This prevents 400 errors from backend @IsUUID validation failing on ""
            const payload = {
                memberId: values.memberId,
                trainerId: values.trainerId,
                bookingType: values.bookingType,
                bookingDate: values.bookingDate,
                startTime: values.startTime,
                durationMinutes: values.durationMinutes,
                endTime,
            } as any;

            if (values.notes) payload.notes = values.notes;
            if (values.ptPackageId && values.ptPackageId.trim() !== "") {
                payload.ptPackageId = values.ptPackageId;
            }

            console.log("Submitting booking payload:", payload);
            await onSubmit(payload);
            form.reset();
            onClose();
        } catch (error: any) {
            if (error.response?.data) {
                console.error("Booking submission error details:", JSON.stringify(error.response.data, null, 2));
            }
            console.error("Booking submission error:", error.message || error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Booking</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bookingDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Time</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="trainerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trainer</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select trainer" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {trainers.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.fullName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>Member</FormLabel>
                            <div className="relative">
                                <Input
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    placeholder="Search by name or code..."
                                    autoComplete="off"
                                />
                                {searchingMembers && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            {/* Simple hack: if member is found and unique, auto-select or show a list */}
                            {/* For now, let's just use a select if members are loaded */}
                            {members.length > 0 && (
                                <div className="mt-1 max-h-32 overflow-auto rounded-md border p-1">
                                    {members.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            className="w-full px-2 py-1 text-left text-sm hover:bg-accent rounded"
                                            onClick={() => {
                                                form.setValue("memberId", m.id);
                                                setMemberSearch(`${m.person.fullName} (${m.memberCode})`);
                                                setMembers([]);
                                            }}
                                        >
                                            {m.person.fullName} ({m.memberCode})
                                        </button>
                                    ))}
                                </div>
                            )}
                            <FormField
                                control={form.control}
                                name="memberId"
                                render={({ field }) => (
                                    <input type="hidden" {...field} />
                                )}
                            />
                            {form.formState.errors.memberId && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.memberId.message}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bookingType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={BookingType.PT_SESSION}>PT Session</SelectItem>
                                                <SelectItem value={BookingType.GROUP_SESSION}>Group Session</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="durationMinutes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration (min)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="60" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {bookingType === BookingType.PT_SESSION && (
                            <FormField
                                control={form.control}
                                name="ptPackageId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>PT Package</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={loadingPackages || ptPackages.length === 0}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={
                                                            loadingPackages
                                                                ? "Loading packages..."
                                                                : ptPackages.length === 0
                                                                    ? "No active packages found"
                                                                    : "Select a package"
                                                        }
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ptPackages.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.itemName} ({p.remainingSessions} sessions left)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {ptPackages.length === 0 && !loadingPackages && memberId && (
                                            <p className="text-xs text-destructive mt-1">
                                                This member has no active PT packages.
                                            </p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Booking
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
