"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { peopleService, InvitablePerson } from "@/services/people";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { PeopleType } from "@gym-monorepo/shared";

interface InvitePeopleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    defaultType?: PeopleType | "";
}

export function InvitePeopleDialog({
    open,
    onOpenChange,
    onSuccess,
    defaultType = "",
}: InvitePeopleDialogProps) {
    const t = useTranslations("people");
    const { toast } = useToast();
    const [selectedPersonId, setSelectedPersonId] = React.useState("");
    const [selectedType, setSelectedType] = React.useState<PeopleType | "">(
        defaultType
    );
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        setSelectedType(defaultType);
    }, [defaultType]);

    const resetForm = () => {
        setSelectedPersonId("");
        setErrors({});
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!selectedPersonId) {
            newErrors.person = t("invite.form.validation.personRequired");
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await peopleService.inviteExisting(selectedPersonId);
            toast({
                title: t("invite.toast.success.title"),
                description: t("invite.toast.success.description"),
            });
            onOpenChange(false);
            resetForm();
            onSuccess?.();
        } catch (error: any) {
            const message =
                error.response?.data?.message || t("invite.toast.error.description");
            toast({
                title: t("invite.toast.error.title"),
                description: message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitablePeople = async (params: {
        search: string;
        page: number;
        limit: number;
    }) => {
        const data = await peopleService.getInvitable({
            ...params,
            type: selectedType || undefined,
        });
        return {
            items: data.items,
            total: data.total,
            hasMore: data.hasMore,
        };
    };

    const typeOptions = React.useMemo(
        () => [
            { value: "", label: t("types.all") },
            {
                value: PeopleType.CUSTOMER,
                label: t("types.customer"),
            },
            {
                value: PeopleType.SUPPLIER,
                label: t("types.supplier"),
            },
            {
                value: PeopleType.STAFF,
                label: t("types.staff"),
            },
        ],
        [t]
    );

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                onOpenChange(isOpen);
                if (!isOpen) {
                    resetForm();
                }
            }}
        >
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t("invite.dialog.title")}</DialogTitle>
                    <DialogDescription>
                        {t("invite.dialog.description")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>{t("invite.form.labels.type")}</Label>
                            <Select
                                value={selectedType}
                                onValueChange={(value) => setSelectedType(value as PeopleType | "")}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t("invite.form.placeholders.type")}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {typeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t("invite.form.labels.person")}</Label>
                            <SearchableSelect<InvitablePerson>
                                value={selectedPersonId}
                                onValueChange={(value) => {
                                    setSelectedPersonId(value);
                                    if (errors.person) {
                                        setErrors({ ...errors, person: "" });
                                    }
                                }}
                                placeholder={t("invite.form.placeholders.person")}
                                searchPlaceholder={t("invite.form.placeholders.search")}
                                fetchItems={fetchInvitablePeople}
                                getItemValue={(person) => person.id}
                                getItemLabel={(person) =>
                                    person.fullName || person.email || person.phone || person.id
                                }
                                getItemDescription={(person) =>
                                    person.email || person.phone || undefined
                                }
                                clearable
                            />
                            {errors.person && (
                                <p className="text-sm text-destructive">
                                    {errors.person}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {t("invite.form.buttons.cancel")}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("invite.form.buttons.invite")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
