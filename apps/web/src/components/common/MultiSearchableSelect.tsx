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
import { Badge } from "@/components/ui/badge";

const DEFAULT_LIMIT = 10;

interface MultiSearchableSelectProps<T> {
    value?: string[];
    onValueChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    // We might need to preload labels for initial values if they are not in the first page of search results
    // For now, we assume the parent can provide them or we fetch them? 
    // Or we just accept that we might show IDs if not loaded? 
    // Ideally we pass "selectedItems" full objects if available, but value is string[].
    // Let's allow passing initialSelectedItems to help validation/display.
    initialSelectedItems?: T[];

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

export function MultiSearchableSelect<T>({
    value = [],
    onValueChange,
    placeholder = "Select items...",
    searchPlaceholder = "Search...",
    initialSelectedItems = [],
    fetchItems,
    getItemValue,
    getItemLabel,
    getItemDescription,
    disabled = false,
    className,
}: MultiSearchableSelectProps<T>) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [items, setItems] = React.useState<T[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [loadingMore, setLoadingMore] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(false);
    const [page, setPage] = React.useState(1);

    // Keep a local cache of selected items to display their labels properly
    const [selectedItemsCache, setSelectedItemsCache] = React.useState<Map<string, T>>(new Map());

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const observerRef = React.useRef<IntersectionObserver | null>(null);
    const loadMoreTriggerRef = React.useRef<HTMLDivElement>(null);

    // Initialize cache with initialSelectedItems
    React.useEffect(() => {
        if (initialSelectedItems.length > 0) {
            setSelectedItemsCache(prev => {
                const next = new Map(prev);
                initialSelectedItems.forEach(item => {
                    next.set(getItemValue(item), item);
                });
                return next;
            });
        }
    }, [initialSelectedItems, getItemValue]);

    // Update cache when new items are fetched
    React.useEffect(() => {
        if (items.length > 0) {
            setSelectedItemsCache(prev => {
                const next = new Map(prev);
                items.forEach(item => {
                    next.set(getItemValue(item), item);
                });
                return next;
            });
        }
    }, [items, getItemValue]);

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

    const handleSelect = (item: T) => {
        const itemValue = getItemValue(item);
        const isSelected = value.includes(itemValue);

        let newValue: string[];
        if (isSelected) {
            newValue = value.filter(v => v !== itemValue);
        } else {
            newValue = [...value, itemValue];
        }

        onValueChange(newValue);
    };

    const removeValue = (valToRemove: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onValueChange(value.filter(v => v !== valToRemove));
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
                        "w-full justify-between h-auto min-h-[40px] px-3 py-2",
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1 items-center">
                        {value.length > 0 ? (
                            value.map(val => {
                                const item = selectedItemsCache.get(val);
                                return (
                                    <Badge key={val} variant="secondary" className="mr-1 mb-1">
                                        {item ? getItemLabel(item) : val}
                                        <div
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                            onClick={(e) => removeValue(val, e)}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </div>
                                    </Badge>
                                );
                            })
                        ) : (
                            <span className="text-muted-foreground font-normal">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
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
                                    const isSelected = value.includes(itemValue);

                                    return (
                                        <div
                                            key={itemValue}
                                            onClick={() => handleSelect(item)}
                                            className={cn(
                                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                isSelected && "bg-accent text-accent-foreground"
                                            )}
                                        >
                                            <div className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                            )}>
                                                <Check className={cn("h-4 w-4")} />
                                            </div>
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
