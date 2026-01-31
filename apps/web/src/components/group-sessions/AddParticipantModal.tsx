"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { MembersService, type MemberLookupResult } from "@/services/members";
import { Loader2, UserPlus } from "lucide-react";

interface AddParticipantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (memberId: string) => Promise<void>;
    isLoading?: boolean;
}

export function AddParticipantModal({
    isOpen,
    onClose,
    onAdd,
    isLoading: isActionLoading
}: AddParticipantModalProps) {
    const [memberSearch, setMemberSearch] = useState("");
    const [members, setMembers] = useState<MemberLookupResult[]>([]);
    const [searchingMembers, setSearchingMembers] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberLookupResult | null>(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (memberSearch.length >= 2 && !selectedMember) {
                setSearchingMembers(true);
                try {
                    const results = await MembersService.lookup(memberSearch);
                    setMembers(results);
                } catch (error) {
                    console.error("Member lookup failed", error);
                } finally {
                    setSearchingMembers(false);
                }
            } else {
                setMembers([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [memberSearch, selectedMember]);

    const handleSelect = (m: MemberLookupResult) => {
        setSelectedMember(m);
        setMemberSearch(`${m.person.fullName} (${m.memberCode})`);
        setMembers([]);
    };

    const handleAdd = async () => {
        if (!selectedMember) return;
        try {
            await onAdd(selectedMember.id);
            setMemberSearch("");
            setSelectedMember(null);
            onClose();
        } catch {
            // Error handling is usually done in the parent via toast
        }
    };

    const resetAndClose = () => {
        setMemberSearch("");
        setSelectedMember(null);
        setMembers([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Add Participant
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <SearchableDropdown
                            label="Search Member"
                            value={memberSearch}
                            onChange={(val) => {
                                setMemberSearch(val);
                                if (selectedMember) {
                                    setSelectedMember(null);
                                }
                            }}
                            options={[]} // We handle the list custom below
                            placeholder="Type name or code..."
                            helperText={searchingMembers ? "Searching..." : undefined}
                        />

                        {members.length > 0 && (
                            <div className="mt-1 max-h-48 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-sm">
                                {members.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex flex-col"
                                        onClick={() => handleSelect(m)}
                                    >
                                        <span className="font-medium">{m.person.fullName}</span>
                                        <span className="text-xs text-muted-foreground">{m.memberCode} • {m.status}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedMember && (
                            <div className="mt-4 p-3 rounded-lg border bg-muted/50 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">{selectedMember.person.fullName}</span>
                                    <span className="text-xs text-muted-foreground">Selected Member</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-8"
                                    onClick={() => {
                                        setSelectedMember(null);
                                        setMemberSearch("");
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={resetAndClose} disabled={isActionLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={!selectedMember || isActionLoading}>
                        {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add to Session
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
