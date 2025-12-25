"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { InlineEditField } from "@/components/common/InlineEditField";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Key, Building2 } from "lucide-react";
import { profileService, UserTenant } from "@/services/users";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
    const { user, activeTenant, refreshAuth } = useAuth();
    const { toast } = useToast();
    const [tenants, setTenants] = useState<UserTenant[]>([]);
    const [loadingTenants, setLoadingTenants] = useState(true);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const data = await profileService.getMyTenants();
            setTenants(data);
        } catch (error) {
            console.error("Failed to fetch tenants:", error);
        } finally {
            setLoadingTenants(false);
        }
    };

    const handleUpdateFullName = async (newName: string) => {
        try {
            await profileService.updateFullName(newName);
            toast({
                title: "Profile updated",
                description: "Your name has been updated successfully.",
            });
            // Refresh auth to update user info in context
            refreshAuth();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update name",
                variant: "destructive",
            });
            throw error; // Rethrow to keep edit mode open
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="My Profile" description="View and manage your account details." />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Full Name</Label>
                            <InlineEditField
                                value={user?.fullName || ""}
                                onSave={handleUpdateFullName}
                                placeholder="Enter your name"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <div className="text-sm font-medium">{user?.email}</div>
                        </div>
                        <div className="space-y-1">
                            <Label>Account Type</Label>
                            <div className="flex items-center gap-2">
                                {user?.isSuperAdmin ? (
                                    <Badge variant="default">Super Admin</Badge>
                                ) : (
                                    <Badge variant="secondary">User</Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <p className="text-sm text-muted-foreground">
                                Change your password to keep your account secure.
                            </p>
                            <ChangePasswordDialog
                                trigger={
                                    <Button variant="outline" className="mt-2">
                                        <Key className="mr-2 h-4 w-4" />
                                        Change Password
                                    </Button>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Organizations */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        My Organizations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingTenants ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : tenants.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            You are not a member of any organization.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {tenants.map((membership) => (
                                <div
                                    key={membership.tenant.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${activeTenant?.id === membership.tenant.id
                                        ? "border-primary bg-primary/5"
                                        : "border-border"
                                        }`}
                                >
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {membership.tenant.name}
                                            {activeTenant?.id === membership.tenant.id && (
                                                <Badge variant="default" className="text-xs">
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {membership.tenant.slug}
                                        </div>
                                    </div>
                                    {membership.role ? (
                                        <Badge variant={membership.role.isSuperAdmin ? "default" : "secondary"}>
                                            {membership.role.name}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">No Role</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
