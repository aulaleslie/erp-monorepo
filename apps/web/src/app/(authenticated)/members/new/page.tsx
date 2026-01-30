"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { PERMISSIONS } from "@gym-monorepo/shared";
import { MemberForm } from "@/components/members/member-form";
import { MembersService } from "@/services/members";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { CreateMemberDto } from "@gym-monorepo/shared";

export default function NewMemberPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: CreateMemberDto) => {
        setLoading(true);
        try {
            const member = await MembersService.create(data);
            toast({
                title: "Member created",
                description: `Member ${member.code} has been successfully created.`,
            });
            router.push(`/members/${member.id}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create member.";
            toast({
                title: "Error",
                description: (error as Record<string, any>).response?.data?.message || errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <PermissionGuard
            requiredPermissions={[PERMISSIONS.MEMBERS.CREATE]}
            fallback={
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <p className="text-muted-foreground">You do not have permission to create members.</p>
                </div>
            }
        >
            <div className="flex-1 space-y-4 p-8 pt-6">
                <PageHeader
                    title="New Member"
                    description="Register a new person as a member"
                    showBackButton
                />
                <div className="max-w-3xl mx-auto">
                    <MemberForm onSubmit={handleSubmit} isLoading={loading} />
                </div>
            </div>
        </PermissionGuard>
    );
}
