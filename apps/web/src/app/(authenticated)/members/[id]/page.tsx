"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MembersService } from "@/services/members";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { Member, Membership, PtSessionPackage, MemberStatus } from "@gym-monorepo/shared";
import { Loader2, Edit, Calendar, Package, Clock, History as HistoryIcon, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { DataTable } from "@/components/common/DataTable";
import { getProfileCompletion } from "../columns";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MembershipsList } from "@/components/members/MembershipsList";
import { PtPackagesList } from "@/components/members/PtPackagesList";

export default function MemberDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();
    const [member, setMember] = useState<Member | null>(null);
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [ptPackages, setPtPackages] = useState<PtSessionPackage[]>([]);
    const [attendance, setAttendance] = useState<Record<string, unknown>[]>([]);
    const [history, setHistory] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [memberData, membershipData, ptData, attendanceData, historyData] = await Promise.all([
                MembersService.findOne(id),
                MembersService.getMemberships(id),
                MembersService.getPtPackages(id),
                MembersService.getAttendance(id, { limit: 5 }),
                MembersService.getHistory(id)
            ]);
            setMember(memberData);
            setMemberships(membershipData);
            setPtPackages(ptData);
            setAttendance(attendanceData.items || []);
            setHistory(historyData);
        } catch (error: unknown) {
            toast({
                title: "Error",
                description: "Failed to fetch member details.",
                variant: "destructive",
            });
            router.push("/members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, router, toast]);

    const handleAgreeToTerms = async (checked: boolean) => {
        if (!member) return;
        try {
            const updated = await MembersService.update(member.id, { agreedToTerms: checked });
            setMember(updated);
            toast({
                title: "Success",
                description: checked ? "Terms agreement recorded." : "Terms agreement removed.",
            });
            // Refresh history after status change
            const historyData = await MembersService.getHistory(id);
            setHistory(historyData);
        } catch (error: unknown) {
            toast({
                title: "Error",
                description: "Failed to update terms agreement.",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!member) return null;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <PageHeader
                title={`${member.person?.fullName} (${member.code})`}
                description="View and manage member details"
                showBackButton
            >
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                        member.status === MemberStatus.ACTIVE ? "bg-green-500/10 text-green-500" :
                            member.status === MemberStatus.EXPIRED ? "bg-red-500/10 text-red-500" :
                                "bg-gray-500/10 text-gray-500"
                    }>
                        {member.status}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/members/${id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="memberships" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Memberships
                    </TabsTrigger>
                    <TabsTrigger value="pt-packages" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        PT Packages
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Attendance
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <HistoryIcon className="h-4 w-4" />
                        History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium">{member.person?.email || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Phone:</span>
                                        <span className="font-medium">{member.person?.phone || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Member Since:</span>
                                        <span className="font-medium">{format(new Date(member.createdAt), "dd MMM yyyy")}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Status & Completion</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Profile Completion:</span>
                                        <span className="text-xs font-bold">{getProfileCompletion(member)}%</span>
                                    </div>
                                    <Progress value={getProfileCompletion(member)} className="h-2" />
                                </div>
                                <div className="space-y-2 pt-2 border-t">
                                    <div className="flex justify-between font-medium">
                                        <span className="text-muted-foreground font-normal">Expiry Date:</span>
                                        <span className={member.currentExpiryDate && new Date(member.currentExpiryDate) < new Date() ? "text-destructive" : ""}>
                                            {member.currentExpiryDate ? format(new Date(member.currentExpiryDate), "dd MMM yyyy") : "No active membership"}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-1">
                                        <Checkbox
                                            id="terms"
                                            checked={member.agreedToTerms}
                                            onCheckedChange={(checked) => handleAgreeToTerms(checked as boolean)}
                                        />
                                        <Label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                                            Agreed to Terms & Conditions
                                        </Label>
                                    </div>
                                    {member.agreedAt && (
                                        <div className="text-[10px] text-muted-foreground pl-6">
                                            Agreed on {format(new Date(member.agreedAt), "dd MMM yyyy HH:mm")}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Internal Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
                                    {member.notes || "No notes available."}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="memberships">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div>
                                <CardTitle>Membership Management</CardTitle>
                                <CardDescription>View, create, and cancel memberships for this member.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <MembershipsList
                                memberId={id}
                                memberships={memberships}
                                onRefresh={fetchData}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pt-packages">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div>
                                <CardTitle>PT Packages</CardTitle>
                                <CardDescription>Personal training session packages.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <PtPackagesList
                                memberId={id}
                                ptPackages={ptPackages}
                                onRefresh={fetchData}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attendance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Attendance</CardTitle>
                            <CardDescription>Last 5 check-in records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={[
                                    { header: "Type", accessorKey: "attendanceType" as keyof Record<string, unknown> },
                                    { header: "Check-in", cell: (a: Record<string, any>) => format(new Date(a.checkInAt), "dd MMM yyyy HH:mm") },
                                    { header: "Method", accessorKey: "checkInMethod" as keyof Record<string, unknown> },
                                    { header: "Notes", accessorKey: "notes" as keyof Record<string, unknown> },
                                ]}
                                data={attendance}
                                emptyMessage="No attendance records found."
                            />
                            {attendance.length > 0 && (
                                <div className="mt-4 text-center">
                                    <Button variant="link" asChild>
                                        <Link href={`/attendance?memberId=${id}`}>View Full History</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Member History</CardTitle>
                            <CardDescription>Audit logs and status changes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={[
                                    { header: "Date", cell: (h: Record<string, any>) => format(new Date(h.createdAt), "dd MMM yyyy HH:mm") },
                                    { header: "Action", accessorKey: "action" as keyof Record<string, unknown> },
                                    { header: "Description", accessorKey: "description" as keyof Record<string, unknown> },
                                    { header: "User", cell: (h: Record<string, any>) => h.user?.fullName || "System" },
                                ]}
                                data={history}
                                emptyMessage="No history logs found."
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
