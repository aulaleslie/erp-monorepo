"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { usersService } from "@/services/users";
import { rolesService, Role } from "@/services/roles";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api";

export default function CreateUserPage() {
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations("users");
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        fullName: "",
        password: "",
        confirmPassword: "",
        roleId: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = t("createUser.form.validation.emailRequired");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t("createUser.form.validation.emailInvalid");
        }

        if (!formData.password) {
            newErrors.password = t("createUser.form.validation.passwordRequired");
        } else if (formData.password.length < 6) {
            newErrors.password = t("createUser.form.validation.passwordMinLength");
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = t("createUser.form.validation.confirmPasswordRequired");
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t("createUser.form.validation.passwordsMismatch");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            await usersService.create({
                email: formData.email,
                fullName: formData.fullName || undefined,
                password: formData.password,
                roleId: formData.roleId || undefined,
            });
            toast({
                title: t("createUser.toast.success.title"),
                description: t("createUser.toast.success.description"),
            });
            router.push("/settings/users");
        } catch (error: unknown) {
            const message = getApiErrorMessage(error) || "Failed to create user";
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

    const fetchRoles = async (params: { search: string; page: number; limit: number }) => {
        try {
            const data = await rolesService.getAll(params.page, params.limit);
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
        } catch (error: unknown) {
            console.error("Failed to fetch roles:", error);
            return { items: [], total: 0, hasMore: false };
        }
    };

    return (
        <PermissionGuard
            requiredPermissions={['users.create']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("createUser.alerts.noPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6 max-w-2xl">
                <PageHeader
                    title={t("createUser.page.title")}
                    description={t("createUser.page.description")}
                />

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t("createUser.form.labels.email")}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t("createUser.form.placeholders.email")}
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email) setErrors({ ...errors, email: "" });
                                    }}
                                    className={errors.email ? "border-red-500" : ""}
                                    autoComplete="off"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">{t("createUser.form.labels.fullName")}</Label>
                                <Input
                                    id="fullName"
                                    placeholder={t("createUser.form.placeholders.fullName")}
                                    value={formData.fullName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, fullName: e.target.value })
                                    }
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="password">{t("createUser.form.labels.password")}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder={t("createUser.form.placeholders.password")}
                                        value={formData.password}
                                        onChange={(e) => {
                                            setFormData({ ...formData, password: e.target.value });
                                            if (errors.password) setErrors({ ...errors, password: "" });
                                        }}
                                        className={errors.password ? "border-red-500" : ""}
                                        autoComplete="new-password"
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-500">{errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">{t("createUser.form.labels.confirmPassword")}</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => {
                                            setFormData({ ...formData, confirmPassword: e.target.value });
                                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                                        }}
                                        className={errors.confirmPassword ? "border-red-500" : ""}
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{t("createUser.form.labels.role")}</Label>
                                <SearchableSelect<Role>
                                    value={formData.roleId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, roleId: value })
                                    }
                                    placeholder={t("createUser.form.placeholders.role")}
                                    searchPlaceholder={t("createUser.form.placeholders.searchRoles")}
                                    fetchItems={fetchRoles}
                                    getItemValue={(role) => role.id}
                                    getItemLabel={(role) => role.name}
                                    getItemDescription={(role) =>
                                        role.isSuperAdmin ? t("createUser.form.descriptions.superAdminRole") : undefined
                                    }
                                />
                                <p className="text-sm text-muted-foreground">
                                    {t("createUser.form.descriptions.roleHelp")}
                                </p>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={loading}
                                >
                                    {t("createUser.form.buttons.cancel")}
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t("createUser.form.buttons.create")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
