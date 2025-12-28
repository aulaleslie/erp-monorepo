"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreateTaxDto, Tax, TaxStatus, TaxType, UpdateTaxDto, taxesService } from "@/services/taxes";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TaxFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tax?: Tax | null;
    onSuccess: () => void;
}

export function TaxFormDialog({ open, onOpenChange, tax, onSuccess }: TaxFormDialogProps) {
    const { toast } = useToast();
    const isEditing = !!tax;
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<{
        name: string;
        code: string;
        type: TaxType;
        rate: string;
        amount: string;
    }>({
        name: "",
        code: "",
        type: TaxType.PERCENTAGE,
        rate: "0",
        amount: "0",
    });

    useEffect(() => {
        if (open) {
            setFormData({
                name: tax?.name || "",
                code: tax?.code || "",
                type: tax?.type || TaxType.PERCENTAGE,
                rate: tax?.rate?.toString() || "0",
                amount: tax?.amount?.toString() || "0",
            });
            setErrors({});
        }
    }, [open, tax]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";

        if (formData.type === TaxType.PERCENTAGE) {
            const rateVal = parseFloat(formData.rate);
            if (isNaN(rateVal) || rateVal <= 0 || rateVal > 1) {
                newErrors.rate = "Rate must be between 0 and 1 (e.g., 0.1 for 10%)";
            }
        } else {
            const amountVal = parseFloat(formData.amount);
            if (isNaN(amountVal) || amountVal <= 0) {
                newErrors.amount = "Amount must be greater than 0";
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);

        try {
            if (isEditing && tax) {
                const updateData: UpdateTaxDto = {
                    name: formData.name,
                    code: formData.code || undefined,
                    type: formData.type,
                    rate: formData.type === TaxType.PERCENTAGE ? parseFloat(formData.rate) : undefined,
                    amount: formData.type === TaxType.FIXED ? parseFloat(formData.amount) : undefined,
                };
                await taxesService.update(tax.id, updateData);
                toast({ title: "Success", description: "Tax updated successfully" });
            } else {
                const createData: CreateTaxDto = {
                    name: formData.name,
                    code: formData.code || undefined,
                    type: formData.type,
                    rate: formData.type === TaxType.PERCENTAGE ? parseFloat(formData.rate) : undefined,
                    amount: formData.type === TaxType.FIXED ? parseFloat(formData.amount) : undefined,
                };
                await taxesService.create(createData);
                toast({ title: "Success", description: "Tax created successfully" });
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            const message = error.response?.data?.message || "Something went wrong";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
            if (error.response?.data?.errors) {
                const serverErrors: Record<string, string> = {};
                Object.entries(error.response.data.errors).forEach(([key, msgs]) => {
                    serverErrors[key] = (msgs as string[])[0];
                });
                setErrors(serverErrors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Tax" : "Create Tax"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the tax details. Changes will apply to future transactions."
                            : "Add a new tax to the platform."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. VAT, Service Charge"
                            className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code">Code (Optional)</Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="e.g. VAT-11"
                            className={errors.code ? "border-red-500" : ""}
                        />
                        {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val: TaxType) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TaxType.PERCENTAGE}>Percentage</SelectItem>
                                <SelectItem value={TaxType.FIXED}>Fixed Amount</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.type === TaxType.PERCENTAGE && (
                        <div className="space-y-2">
                            <Label htmlFor="rate">Rate (0 - 1)</Label>
                            <Input
                                id="rate"
                                type="number"
                                step="0.0001"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                placeholder="0.11"
                                className={errors.rate ? "border-red-500" : ""}
                            />
                            {errors.rate && <p className="text-sm text-red-500">{errors.rate}</p>}
                        </div>
                    )}

                    {formData.type === TaxType.FIXED && (
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                className={errors.amount ? "border-red-500" : ""}
                            />
                            {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
