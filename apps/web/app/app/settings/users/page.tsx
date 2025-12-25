"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControls } from "@/components/common/PaginationControls";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { usersService, TenantUser } from "@/services/users";
import { Loader2, Plus, Eye, Pencil, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { InviteUserDialog } from "@/components/users/InviteUserDialog";

export default function UsersPage() {
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await usersService.getAll(page, limit);
            setUsers(data.items);
            setTotal(data.total);
        } catch (error) {
            toast({
                title: "Error fetching users",
                description: "Failed to load users list.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            await usersService.remove(userToDelete);
            toast({
                title: "User removed",
                description: "The user has been removed from this tenant.",
            });
            fetchUsers();
        } catch (error) {
            toast({
                title: "Error removing user",
                description: "Failed to remove the user.",
                variant: "destructive",
            });
        } finally {
            setUserToDelete(null);
        }
    };

    return (
        <PermissionGuard
            requiredPermissions={['users.read']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to view users.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <PageHeader
                        title="User Management"
                        description="Manage users and assign roles here."
                    />
                    <div className="flex gap-2">
                        <PermissionGuard requiredPermissions={['users.create']}>
                            <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Invite User
                            </Button>
                            <Button asChild>
                                <Link href="/app/settings/users/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create User
                                </Link>
                            </Button>
                        </PermissionGuard>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((tenantUser) => (
                                    <TableRow key={tenantUser.userId}>
                                        <TableCell className="font-medium">
                                            {tenantUser.user?.email || "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {tenantUser.user?.fullName || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {tenantUser.role ? (
                                                <Badge variant={tenantUser.role.isSuperAdmin ? "default" : "secondary"}>
                                                    {tenantUser.role.name}
                                                </Badge>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={tenantUser.user?.status === "ACTIVE" ? "default" : "secondary"}>
                                                {tenantUser.user?.status || "Unknown"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/app/settings/users/${tenantUser.userId}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <PermissionGuard requiredPermissions={['users.assignRole']}>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/app/settings/users/${tenantUser.userId}/edit`}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </PermissionGuard>
                                                <PermissionGuard requiredPermissions={['users.delete']}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setUserToDelete(tenantUser.userId)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </PermissionGuard>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <PaginationControls
                    currentPage={page}
                    totalPages={Math.ceil(total / limit)}
                    onPageChange={setPage}
                    loading={loading}
                />
            </div>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove user from tenant?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the user from this tenant. The user account will still exist
                            and can be invited back later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <InviteUserDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                onSuccess={fetchUsers}
            />
        </PermissionGuard>
    );
}
