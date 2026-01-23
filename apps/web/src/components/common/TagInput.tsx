"use client";

import * as React from "react";
import { X, Loader2, Search, PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TagSuggestion, tagsService } from "@/services/tags";

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function TagInput({
    value = [],
    onChange,
    placeholder,
    disabled = false,
    className,
}: TagInputProps) {
    const t = useTranslations("tags.input");
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [suggestions, setSuggestions] = React.useState<TagSuggestion[]>([]);
    const [loading, setLoading] = React.useState(false);

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch suggestions when debounced search changes
    React.useEffect(() => {
        if (!open) return;

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const results = await tagsService.suggest(debouncedSearch);
                setSuggestions(results);
            } catch (error) {
                console.error("Failed to fetch tag suggestions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedSearch, open]);

    const handleAddTag = (tagName: string) => {
        const trimmed = tagName.trim();
        if (!trimmed) return;

        // Skip if tag already added (case-insensitive check)
        if (value.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
            setSearch("");
            return;
        }

        onChange([...value, trimmed]);
        setSearch("");
        // Keep popover open for more entries if desired, or close it?
        // Usually for tags, keeping it open is better.
    };

    const handleRemoveTag = (tagName: string) => {
        onChange(value.filter((t) => t !== tagName));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (search.trim()) {
                handleAddTag(search);
            }
        }
    };

    // Filter out already selected tags from suggestions
    const filteredSuggestions = suggestions.filter(
        (s) => !value.some((v) => v.toLowerCase() === s.name.toLowerCase())
    );

    // Check if the current search exactly matches a suggestion
    const exactMatch = suggestions.some(
        (s) => s.name.toLowerCase() === search.trim().toLowerCase()
    );

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex flex-wrap gap-2">
                {value.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
                        {tag}
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Badge>
                ))}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className="w-full justify-start text-left font-normal"
                    >
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <span className="truncate">{placeholder || t("placeholder")}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <div className="flex items-center border-b px-3">
                        <Input
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            autoFocus
                        />
                    </div>
                    <ScrollArea className="h-[200px]">
                        <div className="p-1">
                            {loading && (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            )}

                            {!loading && search.trim() && !exactMatch && (
                                <div
                                    role="button"
                                    onClick={() => handleAddTag(search)}
                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                                    <span>{t("addNew", { tag: search.trim() })}</span>
                                </div>
                            )}

                            {!loading && filteredSuggestions.length > 0 && (
                                <div className="space-y-1">
                                    {filteredSuggestions.map((suggestion) => (
                                        <div
                                            key={suggestion.id}
                                            role="button"
                                            onClick={() => handleAddTag(suggestion.name)}
                                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <span>{suggestion.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && search.trim() === "" && filteredSuggestions.length === 0 && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    {t("searchPlaceholder")}
                                </div>
                            )}

                            {!loading && search.trim() !== "" && filteredSuggestions.length === 0 && exactMatch && (
                                <div className="py-6 text-center text-sm text-muted-foreground text-amber-600">
                                    Tag already exists in selection
                                </div>
                            )}

                            {!loading && search.trim() !== "" && filteredSuggestions.length === 0 && !exactMatch && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    {/* Showing the "Create" button already above */}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </div>
    );
}
