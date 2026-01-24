"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { salesApprovalsService, SalesApprovalLevel } from "@/services/sales-approvals";
import { rolesService, Role } from "@/services/roles";
import { MultiSearchableSelect } from "@/components/common/MultiSearchableSelect";
import { useToast } from "@/hooks/use-toast";
import { DOCUMENT_TYPE_KEY } from "@gym-monorepo/shared";

export default function SalesApprovalConfigPage() {
    const t = useTranslations("sales.approvals.config");
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<string>(DOCUMENT_TYPE_KEY.SALES_ORDER);
    const [levels, setLevels] = useState<{ levelIndex: number; roleIds: string[] }[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadConfig = async (docKey: string) => {
        setLoading(true);
        try {
            const data = await salesApprovalsService.getConfig(docKey);
            // Sort by level index just in case
            const sorted = [...data].sort((a, b) => a.levelIndex - b.levelIndex);
            setLevels(sorted.map(l => ({
                levelIndex: l.levelIndex,
                roleIds: l.roles.map(r => r.roleId)
            })));
        } catch (error) {
            toast({
                title: t("toast.fetchError.title"),
                description: t("toast.fetchError.description"),
                variant: "destructive",
            });
            setLevels([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig(activeTab);
    }, [activeTab]);

    const handleAddLevel = () => {
        const nextIndex = levels.length > 0 ? Math.max(...levels.map(l => l.levelIndex)) + 1 : 1;
        setLevels([...levels, { levelIndex: nextIndex, roleIds: [] }]);
    };

    const handleRemoveLevel = (index: number) => {
        const newLevels = levels.filter((_, i) => i !== index)
            .map((l, i) => ({ ...l, levelIndex: i + 1 })); // Re-index
        setLevels(newLevels);
    };

    const handleRoleChange = (index: number, roleIds: string[]) => {
        const newLevels = [...levels];
        newLevels[index].roleIds = roleIds;
        setLevels(newLevels);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await salesApprovalsService.updateConfig(activeTab, levels);
            toast({
                title: t("toast.saveSuccess.title"),
                description: t("toast.saveSuccess.description"),
            });
        } catch (error) {
            toast({
                title: t("toast.saveError.title"),
                description: t("toast.saveError.description"),
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const fetchRoles = async (params: { search: string; page: number; limit: number }) => {
        const result = await rolesService.getAll(params.page, params.limit);
        return {
            items: result.items,
            total: result.total,
            hasMore: result.items.length === params.limit && (params.page * params.limit) < result.total,
        };
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("page.title")}
                description={t("page.description")}
            >
                <Button onClick={handleSave} disabled={saving || loading}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {t("buttons.save")}
                </Button>
            </PageHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value={DOCUMENT_TYPE_KEY.SALES_ORDER}>
                        {t("tabs.orders")}
                    </TabsTrigger>
                    <TabsTrigger value={DOCUMENT_TYPE_KEY.SALES_INVOICE}>
                        {t("tabs.invoices")}
                    </TabsTrigger>
                    <TabsTrigger value={DOCUMENT_TYPE_KEY.SALES_CREDIT_NOTE}>
                        {t("tabs.creditNotes")}
                    </TabsTrigger>
                </TabsList>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t("card.title")}</CardTitle>
                            <CardDescription>{t("card.description")}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddLevel} disabled={loading}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t("buttons.addLevel")}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : levels.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t("emptyState")}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {levels.map((level, index) => (
                                    <div key={index} className="flex gap-4 items-start p-4 border rounded-lg bg-slate-50/50">
                                        <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                            {level.levelIndex}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-sm font-medium">{t("labels.roles")}</label>
                                            <MultiSearchableSelect<Role>
                                                value={level.roleIds}
                                                onValueChange={(val) => handleRoleChange(index, val)}
                                                fetchItems={fetchRoles}
                                                getItemValue={(r) => r.id}
                                                getItemLabel={(r) => r.name}
                                                placeholder={t("placeholders.roles")}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="mt-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRemoveLevel(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}
