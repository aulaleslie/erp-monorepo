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
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function EditRolePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const roleId = params.roleId as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        permissions: [] as string[],
    });
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | string[]>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!roleId) return;

            try {
                const [permissionsData, roleData] = await Promise.all([
                    rolesService.getAllPermissions(),
                    rolesService.getOne(roleId)
                ]);

                setPermissions(permissionsData);
                setFormData({
                    name: roleData.name,
                    permissions: roleData.permissions || [],
                });
                setIsSuperAdmin(roleData.isSuperAdmin);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load role data.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [roleId]);

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
        setSaving(true);
        setErrors({});

        try {
            await rolesService.update(roleId, formData);
            toast({
                title: "Success",
                description: "Role updated successfully.",
            });
            router.push("/settings/roles");
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to update role.";

            if (errorMessage.toLowerCase().includes("name")) {
                setErrors({ name: errorMessage });
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <PermissionGuard
            requiredPermissions={['roles.update']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to edit roles.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6 max-w-4xl">
                <PageHeader
                    title="Edit Role"
                    description={`Edit role: ${formData.name}`}
                />

                <form onSubmit={handleSubmit} className="space-y-8 border p-6 rounded-md">
                    <div className="space-y-2">
                        <Label htmlFor="name">Role Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: "" });
                            }}
                            placeholder="e.g. Manager"
                            required
                            className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>
                        )}
                    </div>

                    {user?.isSuperAdmin && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isSuperAdmin"
                                checked={isSuperAdmin}
                                disabled={true} // Cannot change isSuperAdmin status on edit
                            />
                            <Label htmlFor="isSuperAdmin" className="text-muted-foreground">Is Super Admin? (Cannot be changed)</Label>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Permissions</h3>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="select-all"
                                    checked={isAllSelected()}
                                    onCheckedChange={toggleAll}
                                />
                                <Label htmlFor="select-all" className="cursor-pointer">Select All</Label>
                            </div>
                        </div>

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
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </PermissionGuard>
    );
}
