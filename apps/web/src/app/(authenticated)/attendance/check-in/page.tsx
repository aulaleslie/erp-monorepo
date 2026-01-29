"use client";

import { useState } from "react";
import { Search, Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AttendanceType, CheckInMethod } from "@gym-monorepo/shared";
import { MembersService, MemberLookupResult } from "@/services/members";
import { AttendanceService } from "@/services/attendance";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PageHeader } from "@/components/common/PageHeader";
import { getApiErrorMessage } from "@/lib/api";

export default function CheckInPage() {
    const t = useTranslations("memberManagement.attendance.checkIn");
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<MemberLookupResult[]>([]);
    const [selectedMember, setSelectedMember] = useState<MemberLookupResult | null>(null);
    const [attendanceType, setAttendanceType] = useState<AttendanceType>(AttendanceType.GYM_ENTRY);
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const results = await MembersService.lookup(val);
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCheckIn = async () => {
        if (!selectedMember) return;
        setIsLoading(true);
        try {
            await AttendanceService.checkIn({
                memberId: selectedMember.id,
                attendanceType,
                checkInMethod: CheckInMethod.MANUAL,
                notes,
            });
            toast({
                title: t("form.success"),
                description: `${selectedMember.person.fullName} checked in for ${t(`types.${attendanceType}`)}`,
            });
            setSelectedMember(null);
            setSearchResults([]);
            setSearchQuery("");
            setNotes("");
        } catch (error: unknown) {
            toast({
                variant: "destructive",
                title: t("form.error"),
                description: getApiErrorMessage(error),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const isMemberExpired = !!(selectedMember?.currentExpiryDate && new Date(selectedMember.currentExpiryDate) < new Date());

    return (
        <div className="container max-w-2xl py-6 mx-auto">
            <PageHeader
                title={t("title")}
                description="Check in members for gym access or sessions"
            />

            <div className="grid gap-6 mt-6">
                {/* Search Card */}
                {!selectedMember && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t("search.placeholder")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t("search.placeholder")}
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-9"
                                    autoFocus
                                />
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-4 border rounded-md divide-y max-h-72 overflow-auto bg-card shadow-sm">
                                    {searchResults.map((member) => (
                                        <div
                                            key={member.id}
                                            className="p-4 hover:bg-accent cursor-pointer flex justify-between items-center transition-colors"
                                            onClick={() => setSelectedMember(member)}
                                        >
                                            <div>
                                                <p className="font-semibold">{member.person.fullName}</p>
                                                <p className="text-sm text-muted-foreground">{member.memberCode}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={member.status === 'ACTIVE' ? 'secondary' : 'outline'}>
                                                    {member.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchQuery.length >= 2 && searchResults.length === 0 && (
                                <p className="mt-4 text-center text-sm text-muted-foreground">
                                    {t("search.noResults")}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Member Profile & Action Card */}
                {selectedMember && (
                    <Card className={isMemberExpired ? "border-destructive/50 ring-1 ring-destructive/20" : "border-primary/20 shadow-md"}>
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4 items-center">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                        {selectedMember.person.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">{selectedMember.person.fullName}</CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            {selectedMember.memberCode}
                                            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                                            {selectedMember.person.phone || "No phone"}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isMemberExpired && (
                                <Alert variant="destructive">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Membership Expired</AlertTitle>
                                    <AlertDescription>
                                        Member membership expired on {format(new Date(selectedMember.currentExpiryDate!), "PPP")}.
                                        Check-in is blocked.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">{t("memberCard.expiry")}</p>
                                    <p className="font-semibold">
                                        {selectedMember.currentExpiryDate
                                            ? format(new Date(selectedMember.currentExpiryDate), "PPP")
                                            : "No Active Membership"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">{t("memberCard.status")}</p>
                                    <Badge variant={isMemberExpired ? "destructive" : "default"}>
                                        {isMemberExpired ? t("memberCard.expired") : t("memberCard.active")}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">{t("form.type")}</label>
                                    <Select
                                        value={attendanceType}
                                        onValueChange={(v: AttendanceType) => setAttendanceType(v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={AttendanceType.GYM_ENTRY}>{t("types.GYM_ENTRY")}</SelectItem>
                                            <SelectItem value={AttendanceType.PT_SESSION}>{t("types.PT_SESSION")}</SelectItem>
                                            <SelectItem value={AttendanceType.GROUP_CLASS}>{t("types.GROUP_CLASS")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">{t("form.notes")}</label>
                                    <Input
                                        placeholder={t("form.notes")}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <Button
                                    className="w-full font-bold h-12 text-md"
                                    size="lg"
                                    onClick={handleCheckIn}
                                    disabled={isLoading || isMemberExpired}
                                >
                                    {isLoading ? "Processing..." : t("form.submit")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
