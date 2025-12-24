"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { rolesService, Role } from "@/services/roles";
import { Check, Loader2, Plus, Eye, Pencil, Trash2, X } from "lucide-react";
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

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const data = await rolesService.getAll();
            setRoles(data);
        } catch (error) {
            toast({
                title: "Error fetching roles",
                description: "Failed to load roles list.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!roleToDelete) return;

        try {
            await rolesService.delete(roleToDelete);
            toast({
                title: "Role deleted",
                description: "The role has been successfully deleted.",
            });
            fetchRoles();
        } catch (error) {
            toast({
                title: "Error deleting role",
                description: "Failed to delete the role.",
                variant: "destructive",
            });
        } finally {
            setRoleToDelete(null);
        }
    };

    return (
        <PermissionGuard
            requiredPermissions={['roles.read']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to view roles.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <PageHeader
                        title="Roles Management"
                        description="Manage roles and their permissions here."
                    />
                    <PermissionGuard requiredPermissions={['roles.create']}>
                        <Button asChild>
                            <Link href="/app/settings/roles/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Role
                            </Link>
                        </Button>
                    </PermissionGuard>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Super Admin</TableHead>
                                <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10">
                                        No roles found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>
                                            {role.isSuperAdmin ? (
                                                <div className="flex items-center text-green-600">
                                                    <Check className="h-4 w-4 mr-1" /> Yes
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-muted-foreground">
                                                    <X className="h-4 w-4 mr-1" /> No
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/app/settings/roles/${role.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <PermissionGuard requiredPermissions={['roles.update']}>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/app/settings/roles/${role.id}/edit`}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </PermissionGuard>
                                                <PermissionGuard requiredPermissions={['roles.delete']}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setRoleToDelete(role.id)}
                                                        disabled={role.isSuperAdmin}
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
            </div>

            <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the role
                            and remove permissions from any users assigned to it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PermissionGuard>
    );
}
