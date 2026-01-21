"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { usersService, TenantUser } from "@/services/users";
import { rolesService, Role } from "@/services/roles";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api";

export default function EditUserPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const userId = params.userId as string;

    const [user, setUser] = useState<TenantUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        fullName: "",
        password: "",
        confirmPassword: "",
        roleId: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchUser = useCallback(async () => {
        try {
            const data = await usersService.getOne(userId);
            setUser(data);
            setFormData({
                email: data.user?.email || "",
                fullName: data.user?.fullName || "",
                password: "",
                confirmPassword: "",
                roleId: data.roleId || "",
            });
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: "Error",
                description: message || "Failed to load user details.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast, userId]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        }

        if (formData.password) {
            if (formData.password.length < 6) {
                newErrors.password = "Password must be at least 6 characters";
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setSaving(true);
        try {
            const updateData: {
                email?: string;
                fullName?: string;
                password?: string;
                roleId?: string | null;
            } = {};

            // Only include fields that have changed
            if (formData.email !== user?.user?.email) {
                updateData.email = formData.email;
            }
            if (formData.fullName !== (user?.user?.fullName || "")) {
                updateData.fullName = formData.fullName;
            }
            if (formData.password) {
                updateData.password = formData.password;
            }
            if (formData.roleId !== (user?.roleId || "")) {
                updateData.roleId = formData.roleId || null;
            }

            await usersService.updateUser(userId, updateData);
            toast({
                title: "User updated",
                description: "The user has been updated successfully.",
            });
            router.push(`/settings/users/${userId}`);
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: "Error",
                description: message || "Failed to update user.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <Alert variant="destructive">
                <AlertDescription>User not found.</AlertDescription>
            </Alert>
        );
    }

    return (
        <PermissionGuard
            requiredPermissions={['users.update']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to edit users.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6 max-w-2xl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/settings/users/${userId}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <PageHeader
                        title="Edit User"
                        description={`Edit details for ${user.user?.email}`}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">User Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email) setErrors({ ...errors, email: "" });
                                    }}
                                    className={errors.email ? "border-red-500" : ""}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name *</Label>
                                <Input
                                    id="fullName"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, fullName: e.target.value });
                                        if (errors.fullName) setErrors({ ...errors, fullName: "" });
                                    }}
                                    className={errors.fullName ? "border-red-500" : ""}
                                />
                                {errors.fullName && (
                                    <p className="text-sm text-red-500">{errors.fullName}</p>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Leave blank to keep current"
                                        value={formData.password}
                                        onChange={(e) => {
                                            setFormData({ ...formData, password: e.target.value });
                                            if (errors.password) setErrors({ ...errors, password: "" });
                                        }}
                                        className={errors.password ? "border-red-500" : ""}
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-500">{errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm new password"
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
                                <Label>Role</Label>
                                <SearchableSelect<Role>
                                    value={formData.roleId}
                                    onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                                    placeholder="Select a role (optional)"
                                    searchPlaceholder="Search roles..."
                                    initialLabel={user.role?.name}
                                    clearable={true}
                                    fetchItems={fetchRoles}
                                    getItemValue={(role) => role.id}
                                    getItemLabel={(role) => role.name}
                                    getItemDescription={(role) =>
                                        role.isSuperAdmin ? "Tenant Super Admin" : undefined
                                    }
                                />
                                <p className="text-sm text-muted-foreground">
                                    Leave empty to remove role assignment.
                                </p>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
