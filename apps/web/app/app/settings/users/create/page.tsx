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
import { useToast } from "@/hooks/use-toast";

export default function CreateUserPage() {
    const router = useRouter();
    const { toast } = useToast();
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
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm the password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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
                title: "User created",
                description: "The user has been created successfully.",
            });
            router.push("/app/settings/users");
        } catch (error: any) {
            const message =
                error.response?.data?.message || "Failed to create user";
            toast({
                title: "Error",
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
            const data: any = await rolesService.getAll(params.page, params.limit);
            const items = data.items || data;
            const total = data.total || items.length;

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
        <PermissionGuard
            requiredPermissions={['users.create']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to create users.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6 max-w-2xl">
                <PageHeader
                    title="Create User"
                    description="Create a new user and optionally assign a role."
                />

                <Card>
                    <CardContent className="pt-6">
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
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, fullName: e.target.value })
                                    }
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
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
                                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
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
                                <Label>Role (Optional)</Label>
                                <SearchableSelect<Role>
                                    value={formData.roleId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, roleId: value })
                                    }
                                    placeholder="Select a role (optional)"
                                    searchPlaceholder="Search roles..."
                                    fetchItems={fetchRoles}
                                    getItemValue={(role) => role.id}
                                    getItemLabel={(role) => role.name}
                                    getItemDescription={(role) =>
                                        role.isSuperAdmin ? "Tenant Super Admin" : undefined
                                    }
                                />
                                <p className="text-sm text-muted-foreground">
                                    The user will be added to this workspace. Role can be assigned later.
                                </p>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create User
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    );
}
