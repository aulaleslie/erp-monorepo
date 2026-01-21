"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Package } from "lucide-react";
import Link from "next/link";
import React from "react";
import { itemsService, ItemListItem, ItemType, ItemStatus, ItemServiceKind } from "@/services/items";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ItemDetailsPage() {
    const t = useTranslations("items");
    const { id } = useParams();

    return (
        <PermissionGuard
            requiredPermissions={["items.read"]}
            fallback={
                <Alert variant="destructive">
                    <AlertDescription>{t("alerts.noReadPermission")}</AlertDescription>
                </Alert>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/catalog/items">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <PageHeader
                            title={t("detail.page.title")}
                            description={`ID: ${id}`}
                        />
                    </div>
                    <PermissionGuard requiredPermissions={["items.update"]}>
                        <Button asChild>
                            <Link href={`/catalog/items/${id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("buttons.edit")}
                            </Link>
                        </Button>
                    </PermissionGuard>
                </div>

                <ItemDetailWrapper id={id as string} />
            </div>
        </PermissionGuard>
    );
}

function ItemDetailWrapper({ id }: { id: string }) {
    const t = useTranslations("items");
    const [loading, setLoading] = React.useState(true);
    const [item, setItem] = React.useState<ItemListItem | null>(null);

    React.useEffect(() => {
        const fetchItem = async () => {
            try {
                const data = await itemsService.get(id);
                setItem(data);
            } catch (error) {
                console.error("Failed to fetch item", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            <Skeleton className="w-full md:w-64 h-64 rounded-lg" />
                            <div className="flex-1 space-y-4">
                                <Skeleton className="h-8 w-1/2" />
                                <Skeleton className="h-4 w-1/4" />
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!item) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{t("toast.loadError.description")}</AlertDescription>
            </Alert>
        );
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="relative w-full md:w-64 h-64 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                            {item.imageUrl ? (
                                <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    sizes="(min-width: 768px) 16rem, 100vw"
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <Package className="h-16 w-16 text-muted-foreground opacity-20" />
                            )}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h2 className="text-3xl font-bold">{item.name}</h2>
                                <div className="flex items-center gap-2 mt-1 italic text-muted-foreground">
                                    <span>{item.code}</span>
                                    {item.barcode && (
                                        <>
                                            <Separator orientation="vertical" className="h-4" />
                                            <span>{item.barcode}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{item.type}</Badge>
                                {item.serviceKind && (
                                    <Badge variant="outline">{item.serviceKind}</Badge>
                                )}
                                <Badge variant={item.status === ItemStatus.ACTIVE ? "default" : "secondary"}>
                                    {item.status}
                                </Badge>
                                {item.category && (
                                    <Badge variant="secondary">{item.category.name}</Badge>
                                )}
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t("form.labels.price")}</p>
                                    <p className="text-2xl font-semibold text-primary">
                                        {formatPrice(item.price)}
                                    </p>
                                </div>
                                {item.unit && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t("form.labels.unit")}</p>
                                        <p className="text-lg">{item.unit}</p>
                                    </div>
                                )}
                            </div>

                            {item.tags && item.tags.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">{t("form.labels.tags")}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {item.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {(item.type === ItemType.SERVICE || item.description) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {item.type === ItemType.SERVICE && (
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">{t("form.sections.service")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t("form.labels.durationValue")}</p>
                                    <p className="font-medium">
                                        {item.durationValue} {item.durationUnit}
                                    </p>
                                </div>
                                {item.serviceKind === ItemServiceKind.PT_SESSION && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t("form.labels.sessionCount")}</p>
                                        <p className="font-medium">{item.sessionCount}</p>
                                    </div>
                                )}
                                {item.serviceKind === ItemServiceKind.MEMBERSHIP && item.includedPtSessions !== null && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t("form.labels.includedPtSessions")}</p>
                                        <p className="font-medium">{item.includedPtSessions}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    {item.description && (
                        <Card className={item.type === ItemType.SERVICE ? "md:col-span-2" : "md:col-span-3"}>
                            <CardHeader>
                                <CardTitle className="text-lg">{t("form.labels.description")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap">{item.description}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
