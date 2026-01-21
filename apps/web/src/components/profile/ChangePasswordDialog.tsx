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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileService } from "@/services/users";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { getApiErrorMessage } from "@/lib/api";

interface ChangePasswordDialogProps {
    trigger?: React.ReactNode;
}

export function ChangePasswordDialog({ trigger }: ChangePasswordDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const { toast } = useToast();
    const t = useTranslations('profile');

    const resetForm = () => {
        setFormData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setErrors({});
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = t('changePassword.form.validation.currentPasswordRequired');
        }

        if (!formData.newPassword) {
            newErrors.newPassword = t('changePassword.form.validation.newPasswordRequired');
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = t('changePassword.form.validation.newPasswordMinLength');
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = t('changePassword.form.validation.confirmPasswordRequired');
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = t('changePassword.form.validation.passwordsMismatch');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            await profileService.updatePassword(
                formData.currentPassword,
                formData.newPassword,
                formData.confirmPassword
            );
            toast({
                title: t('changePassword.toast.success.title'),
                description: t('changePassword.toast.success.description'),
            });
            setOpen(false);
            resetForm();
        } catch (error: unknown) {
            const message = getApiErrorMessage(error) || t('changePassword.toast.error.description');
            toast({
                title: t('changePassword.toast.error.title'),
                description: message,
                variant: "destructive",
            });
            if (message.toLowerCase().includes("current")) {
                setErrors({ currentPassword: t('changePassword.form.validation.currentPasswordInvalid') });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Change Password</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('changePassword.dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('changePassword.dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">{t('changePassword.form.labels.currentPassword')}</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={formData.currentPassword}
                                onChange={(e) => {
                                    setFormData({ ...formData, currentPassword: e.target.value });
                                    if (errors.currentPassword) {
                                        setErrors({ ...errors, currentPassword: "" });
                                    }
                                }}
                                className={errors.currentPassword ? "border-red-500" : ""}
                            />
                            {errors.currentPassword && (
                                <p className="text-sm text-red-500">{errors.currentPassword}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">{t('changePassword.form.labels.newPassword')}</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => {
                                    setFormData({ ...formData, newPassword: e.target.value });
                                    if (errors.newPassword) {
                                        setErrors({ ...errors, newPassword: "" });
                                    }
                                }}
                                className={errors.newPassword ? "border-red-500" : ""}
                            />
                            {errors.newPassword && (
                                <p className="text-sm text-red-500">{errors.newPassword}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t('changePassword.form.labels.confirmPassword')}</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => {
                                    setFormData({ ...formData, confirmPassword: e.target.value });
                                    if (errors.confirmPassword) {
                                        setErrors({ ...errors, confirmPassword: "" });
                                    }
                                }}
                                className={errors.confirmPassword ? "border-red-500" : ""}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            {t('changePassword.form.buttons.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('changePassword.form.buttons.update')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
