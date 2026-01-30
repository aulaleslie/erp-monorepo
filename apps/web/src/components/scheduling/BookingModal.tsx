"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Loader2 } from "lucide-react";

const bookingSchema = z.object({
    memberId: z.string().min(1, "Member is required"),
    trainerId: z.string().min(1, "Trainer is required"),
    bookingType: z.nativeEnum(BookingType),
    bookingDate: z.string(),
    startTime: z.string(),
    durationMinutes: z.coerce.number().min(15).max(480),
    notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: BookingFormValues) => Promise<void>;
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
    const [submitting, setSubmitting] = useState(false);
    const [memberSearch, setMemberSearch] = useState("");
    const [members, setMembers] = useState<MemberLookupResult[]>([]);
    const [searchingMembers, setSearchingMembers] = useState(false);

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

    const handleFormSubmit = async (values: BookingFormValues) => {
        setSubmitting(true);
        try {
            await onSubmit(values);
            form.reset();
            onClose();
        } catch (error) {
            console.error("Failed to submit booking", error);
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
                            <SearchableDropdown
                                label=""
                                value={memberSearch}
                                onChange={(val) => {
                                    setMemberSearch(val);
                                    // If user selected an option from the list, we'll handle it below
                                }}
                                options={members.map(m => `${m.person.fullName} (${m.memberCode})`)}
                                placeholder="Search by name or code..."
                                helperText={searchingMembers ? "Searching..." : undefined}
                            />
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
                                            <Input type="number" step="15" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
