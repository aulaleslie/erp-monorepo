"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Member, CreateMemberDto, MemberStatus, UpdateMemberDto } from "@gym-monorepo/shared";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { peopleService, PersonListItem } from "@/services/people";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
    personId: z.string().optional(),
    newPerson: z.object({
        fullName: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address").optional().or(z.literal("")),
        phone: z.string().optional(),
    }).optional(),
    notes: z.string().optional(),
    agreedToTerms: z.boolean(),
    status: z.nativeEnum(MemberStatus).optional(),
});

interface MemberFormProps {
    initialData?: Member;
    onSubmit: (data: CreateMemberDto | UpdateMemberDto) => Promise<void>;
    isLoading?: boolean;
}

export function MemberForm({ initialData, onSubmit, isLoading }: MemberFormProps) {
    const [creationMode, setCreationMode] = useState<"existing" | "new">(
        initialData?.personId ? "existing" : "existing"
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            personId: initialData?.personId || "",
            newPerson: {
                fullName: "",
                email: "",
                phone: "",
            },
            notes: initialData?.notes || "",
            agreedToTerms: initialData?.agreedToTerms || false,
            status: initialData?.status,
        },
    });

    const isEdit = !!initialData;

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        const payload: Record<string, unknown> = {
            notes: values.notes,
            agreedToTerms: values.agreedToTerms,
        };

        if (isEdit) {
            payload.status = values.status;
        } else {
            if (creationMode === "existing") {
                payload.personId = values.personId;
            } else {
                payload.person = values.newPerson;
            }
        }

        await onSubmit(payload);
    };

    const fetchPeople = async ({ search, page, limit }: { search: string; page: number; limit: number }) => {
        const response = await peopleService.list({ search, page, limit });
        return {
            items: response.items,
            total: response.total,
            hasMore: response.page < Math.ceil(response.total / response.limit),
        };
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <div className="grid gap-4 bg-card p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium border-b pb-2">Member Information</h3>

                    {!isEdit ? (
                        <div className="space-y-4">
                            <Tabs value={creationMode} onValueChange={(v) => setCreationMode(v as "existing" | "new")}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="existing">Existing Person</TabsTrigger>
                                    <TabsTrigger value="new">New Person</TabsTrigger>
                                </TabsList>
                                <TabsContent value="existing" className="space-y-4 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="personId"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Person</FormLabel>
                                                <FormControl>
                                                    <SearchableSelect<PersonListItem>
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        placeholder="Search for a person..."
                                                        searchPlaceholder="Type name or code..."
                                                        fetchItems={fetchPeople}
                                                        getItemValue={(p) => p.id}
                                                        getItemLabel={(p) => p.fullName}
                                                        getItemDescription={(p) => `${p.code}${p.email ? ` • ${p.email}` : ""}`}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>
                                <TabsContent value="new" className="space-y-4 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="newPerson.fullName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="John Doe" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="newPerson.email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="john@example.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="newPerson.phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+1234567890" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <FormLabel>Person</FormLabel>
                                <div className="font-medium p-2 border rounded bg-muted">
                                    {initialData.person?.fullName} ({initialData.code})
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={MemberStatus.ACTIVE}>Active</SelectItem>
                                                <SelectItem value={MemberStatus.NEW}>New</SelectItem>
                                                <SelectItem value={MemberStatus.EXPIRED}>Expired</SelectItem>
                                                <SelectItem value={MemberStatus.INACTIVE}>Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </div>

                <div className="grid gap-4 bg-card p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium border-b pb-2">Profile & Terms</h3>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Internal notes about the member..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="agreedToTerms"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Agreed to Terms & Conditions
                                        </FormLabel>
                                        <FormDescription>
                                            Verify that the member has signed the gym liability waiver and rules.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" disabled={isLoading} asChild>
                        <Link href="/members">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Member" : "Create Member"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
