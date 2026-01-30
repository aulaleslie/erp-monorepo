"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import {
    ItemListItem,
    ItemServiceKind,
    CreatePtPackageDto,
    PtSessionPackage,
    PeopleType,
    ItemDurationUnit
} from "@gym-monorepo/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MembersService } from "@/services/members";
import { itemsService } from "@/services/items";
import { peopleService, PersonListItem } from "@/services/people";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { DateTimeInput } from "@/components/ui/date-time-input";

interface PtPackageFormProps {
    memberId: string;
    onSuccess?: (pkg: PtSessionPackage) => void;
    onCancel?: () => void;
}

export function PtPackageForm({ memberId, onSuccess, onCancel }: PtPackageFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [items, setItems] = useState<ItemListItem[]>([]);
    const [trainers, setTrainers] = useState<PersonListItem[]>([]);

    const [formData, setFormData] = useState({
        itemId: "",
        trainerId: "",
        totalSessions: 0,
        startDate: format(new Date(), "yyyy-MM-dd"),
        expiryDate: "",
        pricePaid: 0,
        notes: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemsResponse, peopleResponse] = await Promise.all([
                    itemsService.list({
                        page: 1,
                        limit: 100,
                        serviceKind: ItemServiceKind.PT_SESSION
                    }),
                    peopleService.list({
                        page: 1,
                        limit: 100,
                        type: PeopleType.STAFF
                    })
                ]);
                setItems(itemsResponse.items);
                setTrainers(peopleResponse.items);
            } catch (error) {
                console.error("Failed to fetch data for PT package form", error);
                toast({
                    title: "Error",
                    description: "Failed to load necessary data.",
                    variant: "destructive",
                });
            } finally {
                setFetchingData(false);
            }
        };

        fetchData();
    }, [toast]);

    const selectedItem = useMemo(() =>
        items.find(i => i.id === formData.itemId),
        [items, formData.itemId]);

    useEffect(() => {
        if (selectedItem) {
            setFormData(prev => ({
                ...prev,
                totalSessions: selectedItem.sessionCount || 0,
                pricePaid: selectedItem.price || 0,
            }));
        }
    }, [selectedItem]);

    const computedExpiryDate = useMemo(() => {
        if (!selectedItem || !formData.startDate || !selectedItem.durationValue || !selectedItem.durationUnit) {
            return null;
        }

        const start = new Date(formData.startDate);
        const val = selectedItem.durationValue;

        switch (selectedItem.durationUnit) {
            case ItemDurationUnit.DAY: return addDays(start, val);
            case ItemDurationUnit.WEEK: return addWeeks(start, val);
            case ItemDurationUnit.MONTH: return addMonths(start, val);
            case ItemDurationUnit.YEAR: return addYears(start, val);
            default: return null;
        }
    }, [selectedItem, formData.startDate]);

    useEffect(() => {
        if (computedExpiryDate && !formData.expiryDate) {
            // We don't necessarily want to force it, but maybe show it?
            // Actually, for PT packages, expiry is optional in the DTO.
        }
    }, [computedExpiryDate, formData.expiryDate]);

    const handleChange = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const { [field]: _removed, ...rest } = prev;
                void _removed;
                return rest;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.itemId) newErrors.itemId = "Please select a PT session item.";
        if (!formData.trainerId) newErrors.trainerId = "Please select a trainer.";
        if (formData.totalSessions <= 0) newErrors.totalSessions = "Sessions count must be greater than zero.";
        if (formData.pricePaid < 0) newErrors.pricePaid = "Price cannot be negative.";
        if (!formData.startDate) newErrors.startDate = "Start date is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const payload: CreatePtPackageDto = {
                memberId,
                itemId: formData.itemId,
                preferredTrainerId: formData.trainerId,
                totalSessions: formData.totalSessions,
                startDate: formData.startDate,
                expiryDate: formData.expiryDate || undefined,
                pricePaid: formData.pricePaid,
                notes: formData.notes || undefined,
            };

            const result = await MembersService.createPtPackage(payload);
            toast({
                title: "Success",
                description: "PT package created successfully.",
            });

            if (onSuccess) {
                onSuccess(result);
            }
        } catch (error) {
            const fieldErrors = getApiFieldErrors(error);
            if (fieldErrors) {
                const mappedErrors: Record<string, string> = {};
                Object.entries(fieldErrors).forEach(([key, value]) => {
                    mappedErrors[key] = Array.isArray(value) ? value[0] : (value as string);
                });
                setErrors(mappedErrors);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: getApiErrorMessage(error),
                });
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="itemId" className="required">PT Item</Label>
                <Select
                    value={formData.itemId}
                    onValueChange={(v) => handleChange("itemId", v)}
                >
                    <SelectTrigger id="itemId" className={errors.itemId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a PT item" />
                    </SelectTrigger>
                    <SelectContent>
                        {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                                {item.name} ({item.sessionCount} sessions - ${item.price})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.itemId && <p className="text-xs text-destructive">{errors.itemId}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="trainerId" className="required">Trainer</Label>
                <Select
                    value={formData.trainerId}
                    onValueChange={(v) => handleChange("trainerId", v)}
                >
                    <SelectTrigger id="trainerId" className={errors.trainerId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a trainer" />
                    </SelectTrigger>
                    <SelectContent>
                        {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id}>
                                {trainer.fullName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.trainerId && <p className="text-xs text-destructive">{errors.trainerId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="totalSessions" className="required">Total Sessions</Label>
                    <Input
                        id="totalSessions"
                        type="number"
                        min="1"
                        value={formData.totalSessions}
                        onChange={(e) => handleChange("totalSessions", parseInt(e.target.value) || 0)}
                        className={errors.totalSessions ? "border-destructive" : ""}
                    />
                    {errors.totalSessions && <p className="text-xs text-destructive">{errors.totalSessions}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="startDate" className="required">Start Date</Label>
                    <DateTimeInput
                        id="startDate"
                        enableTime={false}
                        value={formData.startDate}
                        onChange={(e) => handleChange("startDate", e.target.value)}
                        className={errors.startDate ? "border-destructive" : ""}
                    />
                    {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <DateTimeInput
                    id="expiryDate"
                    enableTime={false}
                    value={formData.expiryDate}
                    onChange={(e) => handleChange("expiryDate", e.target.value)}
                    placeholder="No expiry"
                />
                {computedExpiryDate && !formData.expiryDate && (
                    <p className="text-[10px] text-muted-foreground px-1">
                        Suggested expiry based on item duration: {format(computedExpiryDate, "dd MMM yyyy")}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="pricePaid" className="required">Price Paid ($)</Label>
                <Input
                    id="pricePaid"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePaid}
                    onChange={(e) => handleChange("pricePaid", parseFloat(e.target.value) || 0)}
                    className={errors.pricePaid ? "border-destructive" : ""}
                />
                {errors.pricePaid && <p className="text-xs text-destructive">{errors.pricePaid}</p>}
                {selectedItem && formData.pricePaid !== selectedItem.price && (
                    <p className="text-[10px] text-amber-500 flex items-center gap-1 px-1">
                        <Info className="h-3 w-3" />
                        Custom price applied (Original: ${selectedItem.price})
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Optional notes about this manual creation..."
                    className="resize-none h-24"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Plus className="mr-2 h-4 w-4" />
                    Add PT Package
                </Button>
            </div>
        </form>
    );
}
