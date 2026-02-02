"use client";

import React from "react";
import { Check, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PersonListItem } from "@/services/people";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TrainerSelectorProps {
    trainers: PersonListItem[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onManage?: (trainer: PersonListItem) => void;
}

const COLORS = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
];

export function TrainerSelector({ trainers, selectedIds, onToggle, onManage }: TrainerSelectorProps) {
    return (
        <div className="flex flex-wrap gap-2 items-center">
            {trainers.map((trainer, index) => {
                const isSelected = selectedIds.includes(trainer.id);
                const color = COLORS[index % COLORS.length];

                return (
                    <div key={trainer.id} className="flex items-center gap-1">
                        <button
                            onClick={() => onToggle(trainer.id)}
                            className={cn(
                                "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                                isSelected
                                    ? "border-transparent bg-secondary text-secondary-foreground shadow-sm"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <div className={cn("h-2 w-2 rounded-full", color)} />
                            <span>{trainer.fullName}</span>
                            {isSelected && <Check className="h-3 w-3 ml-1" />}
                        </button>
                        {isSelected && onManage && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                                onClick={() => onManage(trainer)}
                            >
                                <Settings className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
