"use client";

import React from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
    value?: string | null;
    onChange: (file: File | null) => void;
    onRemove?: () => void;
    disabled?: boolean;
    loading?: boolean;
    maxSizeMB?: number;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    disabled,
    loading,
    maxSizeMB = 1,
}: ImageUploadProps) {
    const t = useTranslations("common.imageUpload");
    // Fallback translations if "common.imageUpload" is not defined
    const ft = (key: string) => {
        try {
            return t(key);
        } catch {
            const fallbacks: Record<string, string> = {
                "upload": "Upload Image",
                "change": "Change Image",
                "remove": "Remove",
                "error.large": "File too large (max {size}MB)",
                "error.type": "Invalid file type",
                "hint": "JPG, PNG or WebP up to {size}MB"
            };
            return fallbacks[key]?.replace("{size}", maxSizeMB.toString()) || key;
        }
    };

    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [preview, setPreview] = React.useState<string | null>(value || null);

    React.useEffect(() => {
        setPreview(value || null);
    }, [value]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast({
                title: "Error",
                description: ft("error.large"),
                variant: "destructive",
            });
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast({
                title: "Error",
                description: ft("error.type"),
                variant: "destructive",
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onChange(file);
    };

    const handleRemove = () => {
        setPreview(null);
        onChange(null);
        onRemove?.();
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-4 w-full flex flex-col items-center justify-center">
            <div
                className={`
                    relative w-40 h-40 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden transition-all
                    ${preview ? "border-primary" : "border-muted-foreground/25 hover:border-primary/50"}
                `}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!disabled && !loading && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleRemove();
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-xs text-center px-2">{ft("hint")}</p>
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={disabled || loading}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || loading}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {preview ? ft("change") : ft("upload")}
                </Button>
            </div>
        </div>
    );
}
