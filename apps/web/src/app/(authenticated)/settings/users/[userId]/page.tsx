"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { usersService, TenantUser } from "@/services/users";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const userId = params.userId as string;

    const [user, setUser] = useState<TenantUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchUser = useCallback(async () => {
        try {
            const data = await usersService.getOne(userId);
            setUser(data);
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

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await usersService.remove(userId);
            toast({
                title: "User removed",
                description: "The user has been removed from this tenant.",
            });
            router.push("/settings/users");
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            toast({
                title: "Error",
                description: message || "Failed to remove user.",
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
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
            requiredPermissions={['users.read']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to view users.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6 max-w-2xl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/settings/users">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <PageHeader
                        title="User Details"
                        description="View user information and role assignment."
                    />
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">User Information</CardTitle>
                        <div className="flex gap-2">
                            <PermissionGuard requiredPermissions={['users.assignRole']}>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/settings/users/${userId}/edit`}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                            </PermissionGuard>
                            <PermissionGuard requiredPermissions={['users.delete']}>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setShowDeleteDialog(true)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                </Button>
                            </PermissionGuard>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Email</Label>
                                <div className="font-medium">{user.user?.email || "N/A"}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Full Name</Label>
                                <div className="font-medium">{user.user?.fullName || "-"}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Status</Label>
                                <div>
                                    <Badge variant={user.user?.status === "ACTIVE" ? "default" : "secondary"}>
                                        {user.user?.status || "Unknown"}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Role</Label>
                                <div>
                                    {user.role ? (
                                        <Badge variant={user.role.isSuperAdmin ? "default" : "secondary"}>
                                            {user.role.name}
                                        </Badge>
                                    ) : (
                                        "-"
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove user from tenant?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the user from this tenant. The user account will still exist
                            and can be invited back later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PermissionGuard>
    );
}
