"use client";

import { useEffect, useState, useMemo } from "react";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { Loader2, Plus, Info } from "lucide-react";
import {
    ItemListItem,
    ItemServiceKind,
    ItemDurationUnit,
    CreateMembershipDto,
    Membership
} from "@gym-monorepo/shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { DateTimeInput } from "@/components/ui/date-time-input";

interface MembershipFormProps {
    memberId: string;
    onSuccess?: (membership: Membership) => void;
    onCancel?: () => void;
}

export function MembershipForm({ memberId, onSuccess, onCancel }: MembershipFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetchingItems, setFetchingItems] = useState(true);
    const [items, setItems] = useState<ItemListItem[]>([]);

    const [formData, setFormData] = useState({
        itemId: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        pricePaid: 0,
        notes: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await itemsService.list({
                    page: 1,
                    limit: 100,
                    serviceKind: ItemServiceKind.MEMBERSHIP
                });
                setItems(response.items);
            } catch (error) {
                console.error("Failed to fetch membership items", error);
                toast({
                    title: "Error",
                    description: "Failed to load membership plans.",
                    variant: "destructive",
                });
            } finally {
                setFetchingItems(false);
            }
        };

        fetchItems();
    }, [toast]);

    const selectedItem = useMemo(() =>
        items.find(i => i.id === formData.itemId),
        [items, formData.itemId]);

    useEffect(() => {
        if (selectedItem) {
            setFormData(prev => ({ ...prev, pricePaid: selectedItem.price }));
        }
    }, [selectedItem]);

    const computedEndDate = useMemo(() => {
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
        if (!formData.itemId) newErrors.itemId = "Please select a membership plan.";
        if (!formData.startDate) newErrors.startDate = "Start date is required.";
        if (formData.pricePaid < 0) newErrors.pricePaid = "Price cannot be negative.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const payload: CreateMembershipDto = {
                memberId,
                itemId: formData.itemId,
                startDate: formData.startDate,
                pricePaid: formData.pricePaid,
                notes: formData.notes || undefined,
            };

            const result = await MembersService.createMembership(payload);
            toast({
                title: "Success",
                description: "Membership created successfully.",
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

    if (fetchingItems) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="itemId" className="required">Membership Plan</Label>
                <Select
                    value={formData.itemId}
                    onValueChange={(v) => handleChange("itemId", v)}
                >
                    <SelectTrigger id="itemId" className={errors.itemId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a membership plan" />
                    </SelectTrigger>
                    <SelectContent>
                        {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                                {item.name} (${item.price})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.itemId && <p className="text-xs text-destructive">{errors.itemId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                    <Label>End Date (Automatic)</Label>
                    <div className="h-10 px-3 py-2 rounded-md bg-muted/50 border border-input flex items-center text-sm text-muted-foreground">
                        {computedEndDate ? format(computedEndDate, "dd MMM yyyy") : "Select a plan and start date"}
                    </div>
                    {selectedItem && (
                        <p className="text-[10px] text-muted-foreground px-1">
                            Based on {selectedItem.durationValue} {selectedItem.durationUnit?.toLowerCase()}(s) duration
                        </p>
                    )}
                </div>
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
                    Add Membership
                </Button>
            </div>
        </form>
    );
}
