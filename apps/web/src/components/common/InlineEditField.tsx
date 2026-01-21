"use client";

import * as React from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InlineEditFieldProps {
    value: string;
    onSave: (value: string) => Promise<void>;
    label?: string;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
}

export function InlineEditField({
    value,
    onSave,
    label,
    placeholder = "Enter value...",
    className,
    inputClassName,
    disabled = false,
}: InlineEditFieldProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);
    const [loading, setLoading] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    React.useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleEdit = () => {
        if (disabled) return;
        setIsEditing(true);
        setEditValue(value);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditValue(value);
    };

    const handleSave = async () => {
        if (editValue.trim() === value) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        try {
            await onSave(editValue.trim());
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save:", error);
            // Keep editing mode open on error
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    aria-label={label || placeholder}
                    disabled={loading}
                    className={cn("h-8 flex-1", inputClassName)}
                />
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSave}
                    disabled={loading || !editValue.trim()}
                    className="h-8 w-8"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Check className="h-4 w-4 text-green-600" />
                    )}
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={loading}
                    className="h-8 w-8"
                >
                    <X className="h-4 w-4 text-red-600" />
                </Button>
            </div>
        );
    }

    return (
        <div className={cn("group flex items-center gap-2", className)}>
            <span className="text-sm font-medium">{value || "N/A"}</span>
            {!disabled && (
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleEdit}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Pencil className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
