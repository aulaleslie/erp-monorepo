"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { usersService } from "@/services/users";
import { rolesService, Role } from "@/services/roles";
import { useToast } from "@/hooks/use-toast";

interface InvitableUser {
    id: string;
    email: string;
    fullName?: string;
}

interface InviteUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function InviteUserDialog({
    open,
    onOpenChange,
    onSuccess,
}: InviteUserDialogProps) {
    const [loading, setLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        userId: "",
        userEmail: "",
        roleId: "",
    });
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const { toast } = useToast();

    const resetForm = () => {
        setFormData({
            userId: "",
            userEmail: "",
            roleId: "",
        });
        setErrors({});
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.userId) {
            newErrors.userId = "Please select a user";
        }

        if (!formData.roleId) {
            newErrors.roleId = "Role is required for invitation";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            await usersService.inviteExisting({
                userId: formData.userId,
                roleId: formData.roleId,
            });
            toast({
                title: "User invited",
                description: "The user has been added to this tenant.",
            });
            onOpenChange(false);
            resetForm();
            onSuccess?.();
        } catch (error: any) {
            const message =
                error.response?.data?.message || "Failed to invite user";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
            if (message.toLowerCase().includes("already")) {
                setErrors({ userId: "User is already a member of this tenant" });
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitableUsers = async (params: { search: string; page: number; limit: number }) => {
        try {
            const data = await usersService.getInvitableUsers(params);
            return {
                items: data.items,
                total: data.total,
                hasMore: data.hasMore,
            };
        } catch (error) {
            console.error("Failed to fetch users:", error);
            return { items: [], total: 0, hasMore: false };
        }
    };

    const fetchRoles = async (params: { search: string; page: number; limit: number }) => {
        try {
            const data: any = await rolesService.getAll(params.page, params.limit);
            const items = data.items || data;
            const total = data.total || items.length;

            // Filter by search term (client-side for simplicity)
            const filtered = params.search
                ? items.filter((role: Role) =>
                    role.name.toLowerCase().includes(params.search.toLowerCase())
                )
                : items;

            return {
                items: filtered,
                total,
                hasMore: params.page * params.limit < total,
            };
        } catch (error) {
            console.error("Failed to fetch roles:", error);
            return { items: [], total: 0, hasMore: false };
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                onOpenChange(isOpen);
                if (!isOpen) resetForm();
            }}
        >
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Existing User</DialogTitle>
                    <DialogDescription>
                        Add an existing user to this tenant. Only users who are not super admins
                        and not already members of this tenant are shown.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>User</Label>
                            <SearchableSelect<InvitableUser>
                                value={formData.userId}
                                onValueChange={(value) => {
                                    // Find the selected user to get their email
                                    setFormData({ ...formData, userId: value, userEmail: "" });
                                    if (errors.userId) {
                                        setErrors({ ...errors, userId: "" });
                                    }
                                }}
                                placeholder="Search for a user..."
                                searchPlaceholder="Type email or name..."
                                fetchItems={async (params) => {
                                    const result = await fetchInvitableUsers(params);
                                    // Store the email when selecting
                                    return result;
                                }}
                                getItemValue={(user) => user.id}
                                getItemLabel={(user) => user.email}
                                getItemDescription={(user) => user.fullName}
                            />
                            {errors.userId && (
                                <p className="text-sm text-red-500">{errors.userId}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <SearchableSelect<Role>
                                value={formData.roleId}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, roleId: value });
                                    if (errors.roleId) {
                                        setErrors({ ...errors, roleId: "" });
                                    }
                                }}
                                placeholder="Select a role"
                                searchPlaceholder="Search roles..."
                                fetchItems={fetchRoles}
                                getItemValue={(role) => role.id}
                                getItemLabel={(role) => role.name}
                                getItemDescription={(role) =>
                                    role.isSuperAdmin ? "Tenant Super Admin" : undefined
                                }
                            />
                            {errors.roleId && (
                                <p className="text-sm text-red-500">{errors.roleId}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Invite User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
