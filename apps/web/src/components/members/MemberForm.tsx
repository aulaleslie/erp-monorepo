"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, UserPlus, Search, User, Info, CheckCircle2 } from "lucide-react";
import { Member, MemberStatus, CreateMemberDto, UpdateMemberDto, PeopleStatus } from "@gym-monorepo/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MembersService } from "@/services/members";
import { peopleService, PersonListItem } from "@/services/people";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MemberFormProps {
    mode: "create" | "edit";
    initialData?: Member;
    onSuccess?: (member: Member) => void;
}

export function MemberForm({ mode, initialData, onSuccess }: MemberFormProps) {
    const t = useTranslations("members");
    const tp = useTranslations("people");
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [people, setPeople] = useState<PersonListItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [personType, setPersonType] = useState<"existing" | "new">("existing");

    const [formData, setFormData] = useState({
        personId: initialData?.personId ?? "",
        fullName: initialData?.person?.fullName ?? "",
        email: initialData?.person?.email ?? "",
        phone: initialData?.person?.phone ?? "",
        notes: initialData?.notes ?? "",
        agreedToTerms: initialData?.agreedToTerms ?? false,
        status: initialData?.status ?? MemberStatus.NEW,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setPeople([]);
            return;
        }
        setSearchLoading(true);
        try {
            const result = await peopleService.list({ page: 1, limit: 10, search: query, status: PeopleStatus.ACTIVE });
            setPeople(result.items);
        } catch (error) {
            console.error("Failed to search people", error);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (personType === "existing" && searchQuery) {
                handleSearch(searchQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, personType, handleSearch]);

    const handleChange = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (personType === "new") {
            if (!formData.fullName) newErrors.fullName = tp("form.validation.fullNameRequired");
        } else if (mode === "create" && !formData.personId) {
            newErrors.personId = t("form.validation.personRequired");
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            let result: Member;
            if (mode === "create") {
                const payload: CreateMemberDto = {
                    notes: formData.notes,
                    agreedToTerms: formData.agreedToTerms,
                };

                if (personType === "new") {
                    payload.person = {
                        fullName: formData.fullName,
                        email: formData.email || undefined,
                        phone: formData.phone || undefined,
                    };
                } else {
                    payload.personId = formData.personId;
                }

                result = await MembersService.create(payload);
                toast({
                    title: t("toast.createSuccess.title"),
                    description: t("toast.createSuccess.description"),
                });
            } else {
                const payload: UpdateMemberDto = {
                    notes: formData.notes,
                    agreedToTerms: formData.agreedToTerms,
                    status: formData.status as MemberStatus,
                };
                result = await MembersService.update(initialData!.id, payload);
                toast({
                    title: t("toast.updateSuccess.title"),
                    description: t("toast.updateSuccess.description"),
                });
            }

            if (onSuccess) {
                onSuccess(result);
            } else {
                router.push(`/members/${result.id}`);
            }
        } catch (error) {
            const fieldErrors = getApiFieldErrors(error);
            if (fieldErrors) {
                const mappedErrors: Record<string, string> = {};
                Object.entries(fieldErrors).forEach(([key, value]) => {
                    mappedErrors[key] = Array.isArray(value) ? value[0] : value;
                });
                setErrors(mappedErrors);
            } else {
                toast({
                    variant: "destructive",
                    title: tp("toast.createError.title"),
                    description: getApiErrorMessage(error),
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
            <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-md">
                <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
                <CardContent className="p-8 space-y-8">
                    {/* Person Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-semibold">
                            <User className="h-5 w-5" />
                            <h3 className="text-lg uppercase tracking-wider">{t("form.sections.personInfo")}</h3>
                        </div>

                        {mode === "create" ? (
                            <div className="space-y-6">
                                <Tabs value={personType} onValueChange={(v) => setPersonType(v as "existing" | "new")} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
                                        <TabsTrigger value="existing" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                            <Search className="mr-2 h-4 w-4" />
                                            {t("form.personType.existing")}
                                        </TabsTrigger>
                                        <TabsTrigger value="new" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            {t("form.personType.new")}
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {personType === "existing" ? (
                                    <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                                        <div className="relative">
                                            <Label className="text-sm font-medium mb-2 block">{t("form.labels.searchPerson")}</Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={t("form.placeholders.searchPerson")}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10 h-12 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/50 transition-all rounded-xl"
                                                />
                                                {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                                            </div>
                                        </div>

                                        {people.length > 0 && (
                                            <div className="grid grid-cols-1 gap-2 mt-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {people.map((p) => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            handleChange("personId", p.id);
                                                            setSearchQuery(p.fullName);
                                                            setPeople([]);
                                                        }}
                                                        className={cn(
                                                            "p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group",
                                                            formData.personId === p.id
                                                                ? "bg-primary/10 border-primary ring-1 ring-primary"
                                                                : "bg-muted/20 border-transparent hover:bg-muted/40 hover:border-muted-foreground/30"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                                {p.fullName[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{p.fullName}</p>
                                                                <p className="text-xs text-muted-foreground">{p.email || p.phone || p.code}</p>
                                                            </div>
                                                        </div>
                                                        {formData.personId === p.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {errors.personId && <p className="text-xs text-destructive font-medium mt-1">{errors.personId}</p>}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2 col-span-2">
                                            <Label className="required">{tp("form.labels.fullName")}</Label>
                                            <Input
                                                value={formData.fullName}
                                                onChange={(e) => handleChange("fullName", e.target.value)}
                                                placeholder={tp("form.placeholders.fullName")}
                                                className="h-11 rounded-xl bg-muted/30"
                                            />
                                            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{tp("form.labels.email")}</Label>
                                            <Input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleChange("email", e.target.value)}
                                                placeholder={tp("form.placeholders.email")}
                                                className="h-11 rounded-xl bg-muted/30"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{tp("form.labels.phone")}</Label>
                                            <Input
                                                value={formData.phone}
                                                onChange={(e) => handleChange("phone", e.target.value)}
                                                placeholder={tp("form.placeholders.phone")}
                                                className="h-11 rounded-xl bg-muted/30"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 rounded-2xl bg-muted/30 border border-muted-foreground/10 flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                    {formData.fullName[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-foreground">{formData.fullName}</h4>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                        {formData.email && <span className="flex items-center gap-1"><Info className="h-3 w-3" /> {formData.email}</span>}
                                        {formData.phone && <span className="flex items-center gap-1"><Info className="h-3 w-3" /> {formData.phone}</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Member Status & profile */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <Info className="h-5 w-5" />
                                <h3 className="text-lg uppercase tracking-wider">{t("form.sections.memberProfile")}</h3>
                            </div>

                            {mode === "edit" && (
                                <div className="space-y-2">
                                    <Label>{t("form.labels.status")}</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(v) => handleChange("status", v as MemberStatus)}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl bg-muted/30">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={MemberStatus.NEW}>{t("status.NEW")}</SelectItem>
                                            <SelectItem value={MemberStatus.ACTIVE}>{t("status.ACTIVE")}</SelectItem>
                                            <SelectItem value={MemberStatus.EXPIRED}>{t("status.EXPIRED")}</SelectItem>
                                            <SelectItem value={MemberStatus.INACTIVE}>{t("status.INACTIVE")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex items-start space-x-3 p-4 rounded-xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10">
                                <Checkbox
                                    id="agreedToTerms"
                                    checked={formData.agreedToTerms}
                                    onCheckedChange={(checked) => handleChange("agreedToTerms", !!checked)}
                                    className="mt-1"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                        htmlFor="agreedToTerms"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {t("form.labels.agreedToTerms")}
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        {t("form.descriptions.agreedToTerms")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <Info className="h-5 w-5" />
                                <h3 className="text-lg uppercase tracking-wider">{t("form.sections.additionalInfo")}</h3>
                            </div>
                            <div className="space-y-2">
                                <Label>{t("form.labels.notes")}</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange("notes", e.target.value)}
                                    placeholder={t("form.placeholders.notes")}
                                    className="min-h-[145px] rounded-xl bg-muted/30 resize-none focus-visible:ring-primary/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-muted-foreground/10">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            disabled={loading}
                            className="rounded-xl px-8 h-12 hover:bg-muted"
                        >
                            {t("form.buttons.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl px-10 h-12 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all shadow-lg shadow-primary/20 font-bold"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === "create" ? t("form.buttons.create") : t("form.buttons.save")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
