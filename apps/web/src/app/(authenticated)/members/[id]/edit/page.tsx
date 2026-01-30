"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MemberForm } from "@/components/members/member-form";
import { MembersService } from "@/services/members";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { UpdateMemberDto, Member } from "@gym-monorepo/shared";
import { Loader2 } from "lucide-react";

export default function EditMemberPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const { toast } = useToast();
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const data = await MembersService.findOne(id);
                setMember(data);
            } catch (error: unknown) {
                toast({
                    title: "Error",
                    description: "Failed to fetch member details.",
                    variant: "destructive",
                });
                router.push("/members");
            } finally {
                setLoading(false);
            }
        };
        fetchMember();
    }, [id, router, toast]);

    const handleSubmit = async (data: UpdateMemberDto) => {
        setSubmitting(true);
        try {
            await MembersService.update(id, data);
            toast({
                title: "Member updated",
                description: `Member ${member?.code} details have been updated.`,
            });
            router.push(`/members/${id}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update member.";
            toast({
                title: "Error",
                description: (error as Record<string, any>).response?.data?.message || errorMessage,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!member) return null;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <PageHeader
                title={`Edit Member: ${member.person?.fullName}`}
                description="Update member status and information"
                showBackButton
            />
            <div className="max-w-3xl mx-auto">
                <MemberForm
                    initialData={member}
                    onSubmit={handleSubmit}
                    isLoading={submitting}
                />
            </div>
        </div>
    );
}
