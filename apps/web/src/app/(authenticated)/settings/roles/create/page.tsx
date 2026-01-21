"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rolesService, Permission } from "@/services/roles";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";

export default function CreateRolePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const t = useTranslations("roles");
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        isSuperAdmin: false,
        permissions: [] as string[],
    });
    const [errors, setErrors] = useState<Record<string, string | string[]>>({});

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const data = await rolesService.getAllPermissions();
                setPermissions(data);
            } catch (error: unknown) {
                const message = getApiErrorMessage(error);
                toast({
                    title: t("toast.loadPermissionsError.title"),
                    description: message || t("toast.loadPermissionsError.description"),
                    variant: "destructive",
                });
            }
        };
        fetchPermissions();
    }, [t, toast]);

    // Group permissions by 'group' field
    const groupedPermissions = permissions.reduce((acc, permission) => {
        if (!acc[permission.group]) {
            acc[permission.group] = [];
        }
        acc[permission.group].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        if (formData.permissions.length === 0 && !formData.isSuperAdmin) {
            setErrors({ permissions: t("form.permissionRequired") });
            setLoading(false);
            return;
        }

        try {
            await rolesService.create(formData);
            toast({
                title: t("toast.createSuccess.title"),
                description: t("toast.createSuccess.description"),
            });
            router.push("/settings/roles");
        } catch (error: unknown) {
            const responseErrors = getApiFieldErrors(error);
            const errorMessage = getApiErrorMessage(error) || "Failed to create role.";

            if (responseErrors) {
                setErrors(responseErrors);
            } else if (errorMessage.toLowerCase().includes("name")) {
                setErrors({ name: errorMessage });
            }

            toast({
                title: t("toast.createError.title"),
                description: errorMessage ?? t("toast.createError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (code: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(code)
                ? prev.permissions.filter(p => p !== code)
                : [...prev.permissions, code]
        }));
    };

    const toggleGroup = (group: string) => {
        const groupPermissions = groupedPermissions[group].map(p => p.code);
        const allSelected = groupPermissions.every(code => formData.permissions.includes(code));

        let newPermissions = [...formData.permissions];
        if (allSelected) {
            newPermissions = newPermissions.filter(code => !groupPermissions.includes(code));
        } else {
            const missing = groupPermissions.filter(code => !newPermissions.includes(code));
            newPermissions.push(...missing);
        }
        setFormData(prev => ({ ...prev, permissions: newPermissions }));
    };

    const toggleAll = () => {
        const allCodes = permissions.map(p => p.code);
        const allSelected = allCodes.every(code => formData.permissions.includes(code));

        setFormData(prev => ({
            ...prev,
            permissions: allSelected ? [] : allCodes
        }));
    };

    const isGroupSelected = (group: string) => {
        const groupPermissions = groupedPermissions[group];
        if (!groupPermissions || groupPermissions.length === 0) return false;
        return groupPermissions.every(p => formData.permissions.includes(p.code));
    };

    const isAllSelected = () => {
        if (permissions.length === 0) return false;
        return permissions.every(p => formData.permissions.includes(p.code));
    };

    return (
        <PermissionGuard
            requiredPermissions={['roles.create']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t('createPage.alert.noPermission')}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6 max-w-4xl">
                <PageHeader
                    title={t('createPage.title')}
                    description={t('createPage.description')}
                />

                <form onSubmit={handleSubmit} className="space-y-8 border p-6 rounded-md">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('form.roleName')}</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: "" });
                            }}
                            placeholder={t('form.roleNamePlaceholder')}
                            required
                            className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500 mt-1">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>
                        )}
                    </div>

                    {user?.isSuperAdmin && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isSuperAdmin"
                                checked={formData.isSuperAdmin}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, isSuperAdmin: checked === true })
                                }
                            />
                            <Label htmlFor="isSuperAdmin">{t('form.isSuperAdmin')}</Label>
                        </div>
                    )}

                    <div className={`space-y-4 ${errors.permissions ? "border border-red-500 rounded-md p-4" : ""}`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">{t('form.permissions')}</h3>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="select-all"
                                    checked={isAllSelected()}
                                    onCheckedChange={toggleAll}
                                />
                                <Label htmlFor="select-all" className="cursor-pointer">{t('form.selectAll')}</Label>
                            </div>
                        </div>

                        {errors.permissions && (
                            <p className="text-sm text-red-500 font-medium">
                                {Array.isArray(errors.permissions) ? errors.permissions[0] : errors.permissions}
                            </p>
                        )}

                        {Object.entries(groupedPermissions).map(([group, perms]) => (
                            <div key={group} className="space-y-2 p-4 border rounded-md">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Checkbox
                                        id={`group-${group}`}
                                        checked={isGroupSelected(group)}
                                        onCheckedChange={() => toggleGroup(group)}
                                    />
                                    <h4 className="font-semibold text-sm">{group}</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-6">
                                    {perms.map((permission) => (
                                        <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={permission.id}
                                                checked={formData.permissions.includes(permission.code)}
                                                onCheckedChange={() => togglePermission(permission.code)}
                                            />
                                            <Label htmlFor={permission.id} className="text-sm font-normal cursor-pointer">
                                                {permission.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            {t('buttons.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('buttons.create')}
                        </Button>
                    </div>
                </form>
            </div>
        </PermissionGuard>
    );
}
