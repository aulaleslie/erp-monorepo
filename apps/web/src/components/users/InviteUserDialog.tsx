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
import { useTranslations } from "next-intl";

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
    const t = useTranslations('users');
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
            newErrors.userId = t('invite.form.validation.userRequired');
        }

        if (!formData.roleId) {
            newErrors.roleId = t('invite.form.validation.roleRequired');
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
                title: t('invite.toast.success.title'),
                description: t('invite.toast.success.description'),
            });
            onOpenChange(false);
            resetForm();
            onSuccess?.();
        } catch (error: any) {
            const message =
                error.response?.data?.message || t('invite.toast.error.description');
            toast({
                title: t('invite.toast.error.title'),
                description: message,
                variant: "destructive",
            });
            if (message.toLowerCase().includes("already")) {
                setErrors({ userId: t('invite.form.validation.userAlreadyMember') });
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
                    <DialogTitle>{t('invite.dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('invite.dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('invite.form.labels.user')}</Label>
                            <SearchableSelect<InvitableUser>
                                value={formData.userId}
                                onValueChange={(value) => {
                                    // Find the selected user to get their email
                                    setFormData({ ...formData, userId: value, userEmail: "" });
                                    if (errors.userId) {
                                        setErrors({ ...errors, userId: "" });
                                    }
                                }}
                                placeholder={t('invite.form.placeholders.user')}
                                searchPlaceholder={t('invite.form.placeholders.searchUser')}
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
                            <Label>{t('invite.form.labels.role')}</Label>
                            <SearchableSelect<Role>
                                value={formData.roleId}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, roleId: value });
                                    if (errors.roleId) {
                                        setErrors({ ...errors, roleId: "" });
                                    }
                                }}
                                placeholder={t('invite.form.placeholders.role')}
                                searchPlaceholder={t('invite.form.placeholders.searchRoles')}
                                fetchItems={fetchRoles}
                                getItemValue={(role) => role.id}
                                getItemLabel={(role) => role.name}
                                getItemDescription={(role) =>
                                    role.isSuperAdmin ? t('invite.form.descriptions.superAdminRole') : undefined
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
                            {t('invite.form.buttons.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('invite.form.buttons.invite')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
