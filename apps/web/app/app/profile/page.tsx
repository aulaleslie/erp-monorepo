"use client";

import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <PageHeader title="My Profile" description="View and manage your account details." />

            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label>Full Name</Label>
                        <div className="text-sm font-medium">{user?.fullName || "N/A"}</div>
                    </div>
                    <div className="space-y-1">
                        <Label>Email</Label>
                        <div className="text-sm font-medium">{user?.email}</div>
                    </div>
                    <div className="space-y-1">
                        <Label>Role</Label>
                        <div className="text-sm font-medium">{user?.isSuperAdmin ? "Super Admin" : "User"}</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
