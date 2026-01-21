"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEFAULT_LIMIT = 10;

interface SearchableSelectProps<T> {
    value?: string;
    onValueChange: (value: string) => void;
    onSelectionChange?: (item: T | null) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    initialLabel?: string; // Label to show for pre-selected value before dropdown opens
    clearable?: boolean; // Allow clearing the selection
    fetchItems: (params: {
        search: string;
        page: number;
        limit: number;
    }) => Promise<{
        items: T[];
        total: number;
        hasMore: boolean;
    }>;
    getItemValue: (item: T) => string;
    getItemLabel: (item: T) => string;
    getItemDescription?: (item: T) => string | undefined;
    disabled?: boolean;
    className?: string;
}

export function SearchableSelect<T>({
    value,
    onValueChange,
    onSelectionChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    initialLabel,
    clearable = false,
    fetchItems,
    getItemValue,
    getItemLabel,
    getItemDescription,
    disabled = false,
    className,
}: SearchableSelectProps<T>) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [items, setItems] = React.useState<T[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [loadingMore, setLoadingMore] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [selectedLabel, setSelectedLabel] = React.useState<string>(initialLabel || "");

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const observerRef = React.useRef<IntersectionObserver | null>(null);
    const loadMoreTriggerRef = React.useRef<HTMLDivElement>(null);

    // Update selectedLabel when initialLabel changes (for async loading)
    React.useEffect(() => {
        if (initialLabel && !selectedLabel) {
            setSelectedLabel(initialLabel);
        }
    }, [initialLabel, selectedLabel]);

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const loadItems = React.useCallback(async (
        pageNum: number,
        searchTerm: string,
        isNewSearch: boolean
    ) => {
        if (isNewSearch) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const result = await fetchItems({
                search: searchTerm,
                page: pageNum,
                limit: DEFAULT_LIMIT,
            });

            if (isNewSearch) {
                setItems(result.items);
            } else {
                setItems((prev) => [...prev, ...result.items]);
            }

            setHasMore(result.hasMore);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch items:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [fetchItems]);

    // Reset and fetch when search changes
    React.useEffect(() => {
        if (open) {
            setPage(1);
            setItems([]);
            loadItems(1, debouncedSearch, true);
        }
    }, [debouncedSearch, loadItems, open]);

    // Set up intersection observer for infinite scroll
    React.useEffect(() => {
        if (!loadMoreTriggerRef.current || !open) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    loadItems(page + 1, debouncedSearch, false);
                }
            },
            { threshold: 0.1 }
        );

        observerRef.current.observe(loadMoreTriggerRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [debouncedSearch, hasMore, loadItems, loading, loadingMore, open, page]);

    // Find selected item label from loaded items
    React.useEffect(() => {
        if (value && items.length > 0) {
            const selectedItem = items.find((item) => getItemValue(item) === value);
            if (selectedItem) {
                setSelectedLabel(getItemLabel(selectedItem));
            }
        } else if (!value) {
            setSelectedLabel("");
        }
    }, [value, items, getItemValue, getItemLabel]);

    const handleSelect = (item: T) => {
        const itemValue = getItemValue(item);
        onValueChange(itemValue);
        if (onSelectionChange) {
            onSelectionChange(item);
        }
        setSelectedLabel(getItemLabel(item));
        setOpen(false);
        setSearch("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onValueChange("");
        if (onSelectionChange) {
            onSelectionChange(null);
        }
        setSelectedLabel("");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">{selectedLabel || placeholder}</span>
                    <div className="flex items-center gap-1">
                        {clearable && value && (
                            <span
                                role="button"
                                tabIndex={0}
                                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer"
                                onClick={handleClear}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onValueChange("");
                                        setSelectedLabel("");
                                    }
                                }}
                            >
                                <X className="h-4 w-4" />
                            </span>
                        )}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
                <ScrollArea className="h-[200px]" ref={scrollRef}>
                    <div className="p-1">
                        {clearable && value && !search && (
                            <div
                                onClick={() => {
                                    onValueChange("");
                                    if (onSelectionChange) {
                                        onSelectionChange(null);
                                    }
                                    setSelectedLabel("");
                                    setOpen(false);
                                }}
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                            >
                                <X className="mr-2 h-4 w-4" />
                                <span>Clear selection</span>
                            </div>
                        )}
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No results found.
                            </div>
                        ) : (
                            <>
                                {items.map((item) => {
                                    const itemValue = getItemValue(item);
                                    const isSelected = value === itemValue;

                                    return (
                                        <div
                                            key={itemValue}
                                            onClick={() => handleSelect(item)}
                                            className={cn(
                                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                isSelected && "bg-accent text-accent-foreground"
                                            )}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{getItemLabel(item)}</span>
                                                {getItemDescription && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {getItemDescription(item)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Load more trigger */}
                                <div ref={loadMoreTriggerRef} className="h-1" />
                                {loadingMore && (
                                    <div className="flex items-center justify-center py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
