"use client";

import { useState } from "react";
import { Loader2, Link2, Unlink, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { useToast } from "@/hooks/use-toast";
import {
    peopleService,
    PersonLinkedUser,
    InvitableUser,
} from "@/services/people";
import { CreateUserForStaffDialog } from "./CreateUserForStaffDialog";

interface StaffUserLinkCardProps {
    personId: string;
    linkedUser: PersonLinkedUser | null;
    onUserChange: (user: PersonLinkedUser | null) => void;
}

export function StaffUserLinkCard({
    personId,
    linkedUser,
    onUserChange,
}: StaffUserLinkCardProps) {
    const t = useTranslations("people");
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedUserObject, setSelectedUserObject] = useState<InvitableUser | null>(null);

    const handleLinkUser = async () => {
        if (!selectedUserId) return;

        // If no personId, we are in create mode - just update local state
        if (!personId) {
            if (selectedUserObject) {
                onUserChange(selectedUserObject);
                setSelectedUserId("");
                setSelectedUserObject(null);
            }
            return;
        }

        setLoading(true);
        try {
            const updated = await peopleService.linkUser(personId, selectedUserId);
            onUserChange(updated.user);
            setSelectedUserId("");
            setSelectedUserObject(null);
            toast({
                title: t("staff.userCard.toast.linkSuccess.title"),
                description: t("staff.userCard.toast.linkSuccess.description"),
            });
        } catch {
            toast({
                title: t("staff.userCard.toast.linkError.title"),
                description: t("staff.userCard.toast.linkError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUnlinkUser = async () => {
        if (!personId) {
            onUserChange(null);
            return;
        }

        setLoading(true);
        try {
            await peopleService.unlinkUser(personId);
            onUserChange(null);
            toast({
                title: t("staff.userCard.toast.unlinkSuccess.title"),
                description: t("staff.userCard.toast.unlinkSuccess.description"),
            });
        } catch {
            toast({
                title: t("staff.userCard.toast.unlinkError.title"),
                description: t("staff.userCard.toast.unlinkError.description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitableUsers = async (params: {
        search: string;
        page: number;
        limit: number;
    }) => {
        try {
            const data = await peopleService.getInvitableUsersForStaff(params);
            return {
                items: data.items,
                total: data.total,
                hasMore: data.hasMore,
            };
        } catch {
            return { items: [], total: 0, hasMore: false };
        }
    };

    const handleUserCreated = (user: PersonLinkedUser) => {
        onUserChange(user);
        setCreateDialogOpen(false);
    };

    return (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <Label className="text-sm font-medium">
                {t("staff.labels.userLink")}
            </Label>

            {linkedUser ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{linkedUser.email}</p>
                            {linkedUser.fullName && (
                                <p className="text-sm text-muted-foreground">
                                    {linkedUser.fullName}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUnlinkUser}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Unlink className="h-4 w-4 mr-1" />
                        )}
                        {t("staff.userCard.unlinkButton")}
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        {t("staff.userCard.notLinked")}
                    </p>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <SearchableSelect<InvitableUser>
                                value={selectedUserId}
                                onValueChange={setSelectedUserId}
                                onSelectionChange={(item) => setSelectedUserObject(item)}
                                placeholder={t("staff.placeholders.searchUser")}
                                searchPlaceholder={t("staff.placeholders.searchUser")}
                                fetchItems={fetchInvitableUsers}
                                getItemValue={(user) => user.id}
                                getItemLabel={(user) => user.email}
                                getItemDescription={(user) => user.fullName}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={handleLinkUser}
                            disabled={loading || !selectedUserId}
                            size="sm"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                                <Link2 className="h-4 w-4 mr-1" />
                            )}
                            {t("staff.userCard.linkButton")}
                        </Button>
                    </div>
                    <div className="flex justify-start">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateDialogOpen(true)}
                        >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {t("staff.userCard.createButton")}
                        </Button>
                    </div>
                </div>
            )}

            <CreateUserForStaffDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                personId={personId}
                onSuccess={handleUserCreated}
            />
        </div>
    );
}
