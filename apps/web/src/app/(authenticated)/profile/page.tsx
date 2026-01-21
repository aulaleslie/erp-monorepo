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
import { useTranslations } from "next-intl";
import { getApiErrorMessage } from "@/lib/api";

export default function ProfilePage() {
    const { user, activeTenant, refreshAuth } = useAuth();
    const { toast } = useToast();
    const t = useTranslations("profile");
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
                title: t("toast.profileUpdated.title"),
                description: t("toast.profileUpdated.description"),
            });
            // Refresh auth to update user info in context
            refreshAuth();
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: t("toast.profileUpdateError.title"),
                description: message || t("toast.profileUpdateError.description"),
                variant: "destructive",
            });
            throw error; // Rethrow to keep edit mode open
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title={t("pageTitle")} description={t("pageDescription")} />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">{t("sections.personal")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>{t("labels.fullName")}</Label>
                            <InlineEditField
                                value={user?.fullName || ""}
                                onSave={handleUpdateFullName}
                                placeholder={t("placeholders.fullName")}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t("labels.email")}</Label>
                            <div className="text-sm font-medium">{user?.email}</div>
                        </div>
                        <div className="space-y-1">
                            <Label>{t("labels.accountType")}</Label>
                            <div className="flex items-center gap-2">
                                {user?.isSuperAdmin ? (
                                    <Badge variant="default">{t("accountTypes.superAdmin")}</Badge>
                                ) : (
                                    <Badge variant="secondary">{t("accountTypes.user")}</Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">{t("sections.security")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("labels.password")}</Label>
                            <p className="text-sm text-muted-foreground">
                                {t("securityDescription")}
                            </p>
                            <ChangePasswordDialog
                                trigger={
                                    <Button variant="outline" className="mt-2">
                                        <Key className="mr-2 h-4 w-4" />
                                        {t("buttons.changePassword")}
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
                        {t("sections.organizations")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingTenants ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : tenants.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            {t("tenants.emptyState")}
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {tenants.map((membership) => (
                                <div
                                    key={membership.tenant.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                        activeTenant?.id === membership.tenant.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border"
                                    }`}
                                >
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {membership.tenant.name}
                                            {activeTenant?.id === membership.tenant.id && (
                                                <Badge variant="default" className="text-xs">
                                                    {t("tenants.currentBadge")}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {membership.tenant.slug}
                                        </div>
                                    </div>
                                    {membership.role ? (
                                        <Badge
                                            variant={membership.role.isSuperAdmin ? "default" : "secondary"}
                                        >
                                            {membership.role.name}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">{t("tenants.noRole")}</Badge>
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
