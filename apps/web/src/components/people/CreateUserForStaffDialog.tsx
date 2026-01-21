"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { useToast } from "@/hooks/use-toast";
import { rolesService, Role } from "@/services/roles";
import { peopleService, PersonLinkedUser } from "@/services/people";
import { getApiErrorMessage } from "@/lib/api";

interface CreateUserForStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    personId: string;
    onSuccess: (user: PersonLinkedUser) => void;
}

export function CreateUserForStaffDialog({
    open,
    onOpenChange,
    personId,
    onSuccess,
}: CreateUserForStaffDialogProps) {
    const t = useTranslations("people");
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        email: "",
        fullName: "",
        tempPassword: "",
        attachToTenant: true,
        roleId: "",
    });
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const resetForm = () => {
        setFormData({
            email: "",
            fullName: "",
            tempPassword: "",
            attachToTenant: true,
            roleId: "",
        });
        setErrors({});
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.email.trim()) {
            newErrors.email = t("createUser.form.validation.emailRequired");
        }

        if (!formData.tempPassword) {
            newErrors.tempPassword = t("createUser.form.validation.passwordRequired");
        } else if (formData.tempPassword.length < 6) {
            newErrors.tempPassword = t("createUser.form.validation.passwordMinLength");
        }

        if (formData.attachToTenant && !formData.roleId) {
            newErrors.roleId = t("createUser.form.validation.roleRequired");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            const result = await peopleService.createUserForStaff(personId, {
                email: formData.email.trim(),
                fullName: formData.fullName.trim() || undefined,
                tempPassword: formData.tempPassword,
                attachToTenant: formData.attachToTenant,
                roleId: formData.attachToTenant ? formData.roleId : undefined,
            });

            toast({
                title: t("createUser.toast.success.title"),
                description: t("createUser.toast.success.description"),
            });

            if (result.user) {
                onSuccess(result.user);
            }
            onOpenChange(false);
            resetForm();
        } catch (error: unknown) {
            const message = getApiErrorMessage(error) || t("createUser.toast.error.description");
            toast({
                title: t("createUser.toast.error.title"),
                description: message,
                variant: "destructive",
            });

            if (message.toLowerCase().includes("email")) {
                setErrors({ email: message });
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async (params: {
        search: string;
        page: number;
        limit: number;
    }) => {
        try {
            const data = await rolesService.getAll(1, 100);

            // Filter by search term (client-side)
            const filtered = params.search
                ? data.items.filter((role: Role) =>
                    role.name.toLowerCase().includes(params.search.toLowerCase())
                )
                : data.items;

            return {
                items: filtered,
                total: data.total,
                hasMore: params.page * params.limit < data.total,
            };
        } catch {
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
                    <DialogTitle>{t("createUser.dialog.title")}</DialogTitle>
                    <DialogDescription>
                        {t("createUser.dialog.description")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                {t("createUser.form.labels.email")}{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => {
                                    setFormData({ ...formData, email: e.target.value });
                                    if (errors.email) {
                                        setErrors({ ...errors, email: "" });
                                    }
                                }}
                                placeholder="email@example.com"
                                className={errors.email ? "border-red-500" : ""}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName">
                                {t("createUser.form.labels.fullName")}
                            </Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) =>
                                    setFormData({ ...formData, fullName: e.target.value })
                                }
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tempPassword">
                                {t("createUser.form.labels.tempPassword")}{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="tempPassword"
                                type="password"
                                value={formData.tempPassword}
                                onChange={(e) => {
                                    setFormData({ ...formData, tempPassword: e.target.value });
                                    if (errors.tempPassword) {
                                        setErrors({ ...errors, tempPassword: "" });
                                    }
                                }}
                                className={errors.tempPassword ? "border-red-500" : ""}
                            />
                            {errors.tempPassword && (
                                <p className="text-sm text-red-500">{errors.tempPassword}</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="attachToTenant"
                                checked={formData.attachToTenant}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        attachToTenant: checked as boolean,
                                    })
                                }
                            />
                            <Label htmlFor="attachToTenant" className="font-normal">
                                {t("createUser.form.labels.attachToTenant")}
                            </Label>
                        </div>

                        {formData.attachToTenant && (
                            <div className="space-y-2">
                                <Label>
                                    {t("createUser.form.labels.role")}{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect<Role>
                                    value={formData.roleId}
                                    onValueChange={(value) => {
                                        setFormData({ ...formData, roleId: value });
                                        if (errors.roleId) {
                                            setErrors({ ...errors, roleId: "" });
                                        }
                                    }}
                                    placeholder={t("createUser.form.placeholders.role")}
                                    searchPlaceholder={t("createUser.form.placeholders.searchRole")}
                                    fetchItems={fetchRoles}
                                    getItemValue={(role) => role.id}
                                    getItemLabel={(role) => role.name}
                                    getItemDescription={(role) =>
                                        role.isSuperAdmin ? "Super Admin" : undefined
                                    }
                                />
                                {errors.roleId && (
                                    <p className="text-sm text-red-500">{errors.roleId}</p>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {t("createUser.form.buttons.cancel")}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("createUser.form.buttons.create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
