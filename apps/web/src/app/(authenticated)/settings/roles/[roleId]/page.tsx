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
import { rolesService, Role, RoleUser, Permission } from "@/services/roles";
import { Check, Loader2, Pencil, Trash2, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function RoleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const roleId = params.roleId as string;

    const [role, setRole] = useState<Role & { permissions?: string[] } | null>(null);
    const [users, setUsers] = useState<RoleUser[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!roleId) return;

            try {
                const [roleData, usersData, permissionsData] = await Promise.all([
                    rolesService.getOne(roleId),
                    rolesService.getAssignedUsers(roleId),
                    rolesService.getAllPermissions()
                ]);
                setRole(roleData);
                setUsers(usersData);
                setAllPermissions(permissionsData);
            } catch (error) {
                toast({
                    title: "Error fetching details",
                    description: "Failed to load role details.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [roleId]);

    const handleDelete = async () => {
        if (!role || !confirm("Are you sure you want to delete this role?")) return;

        try {
            await rolesService.delete(role.id);
            toast({
                title: "Role deleted",
                description: "The role has been successfully deleted.",
            });
            router.push("/settings/roles");
        } catch (error) {
            toast({
                title: "Error deleting role",
                description: "Failed to delete the role.",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!role) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Role not found.</AlertDescription>
            </Alert>
        );
    }

    return (
        <PermissionGuard
            requiredPermissions={['roles.read']}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>You do not have permission to view roles.</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-8">
                <Button variant="ghost" className="pl-0" asChild>
                    <Link href="/settings/roles">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roles
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{role.name}</h1>
                        <p className="text-muted-foreground mt-1">
                            {role.isSuperAdmin ? (
                                <span className="flex items-center text-green-600">
                                    <Check className="h-4 w-4 mr-1" /> Super Admin Role
                                </span>
                            ) : (
                                <span className="flex items-center text-muted-foreground">
                                    <X className="h-4 w-4 mr-1" /> Not Super Admin
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <PermissionGuard requiredPermissions={['roles.update']}>
                            <Button asChild>
                                <Link href={`/settings/roles/${roleId}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                </Link>
                            </Button>
                        </PermissionGuard>
                        <PermissionGuard requiredPermissions={['roles.delete']}>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={role.isSuperAdmin}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </PermissionGuard>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Permissions</h3>
                        {role.permissions && role.permissions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {role.permissions.map((permCode) => {
                                    const permission = allPermissions.find(p => p.code === permCode);
                                    return (
                                        <Badge key={permCode} variant="secondary">
                                            {permission ? permission.name : permCode}
                                        </Badge>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No permissions assigned.</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Assigned Users</h3>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                                No users assigned to this role.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.fullName}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </PermissionGuard>
    );
}
