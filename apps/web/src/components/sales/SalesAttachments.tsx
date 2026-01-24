"use client";

import React, { useState, useEffect } from "react";
import { Upload, Trash2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { salesAttachmentsService, SalesAttachment } from "@/services/sales-attachments";
import { useToast } from "@/hooks/use-toast";

interface SalesAttachmentsProps {
    documentId: string;
}

export function SalesAttachments({ documentId }: SalesAttachmentsProps) {
    const [attachments, setAttachments] = useState<SalesAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const loadAttachments = async () => {
        try {
            const data = await salesAttachmentsService.list(documentId);
            setAttachments(data);
        } catch (error) {
            console.error("Failed to load attachments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttachments();
    }, [documentId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (attachments.length >= 5) {
            toast({
                title: "Limit reached",
                description: "Maximum 5 attachments allowed.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        try {
            await salesAttachmentsService.upload(documentId, file);
            toast({ title: "Success", description: "File uploaded successfully." });
            loadAttachments();
        } catch (error) {
            toast({
                title: "Upload failed",
                description: "Failed to upload file. Max 1MB allowed for specific types.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (attachmentId: string) => {
        try {
            await salesAttachmentsService.remove(documentId, attachmentId);
            toast({ title: "Deleted", description: "Attachment removed." });
            loadAttachments();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove attachment.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Attachments</h3>
                <div className="relative">
                    <input
                        type="file"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={handleUpload}
                        disabled={uploading || attachments.length >= 5}
                    />
                    <Button variant="outline" size="sm" disabled={uploading}>
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {attachments.map((file) => (
                    <Card key={file.id}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                <div className="overflow-hidden">
                                    <p className="truncate text-sm font-medium">{file.fileName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" asChild>
                                    <a href={file.publicUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(file.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {attachments.length === 0 && !loading && (
                    <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                        No attachments found.
                    </div>
                )}
            </div>
        </div>
    );
}
