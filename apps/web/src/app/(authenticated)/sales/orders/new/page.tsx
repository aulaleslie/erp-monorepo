"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { PermissionGuard } from '@/components/guards/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateTimeInput } from '@/components/ui/date-time-input';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api';
import { salesOrdersService } from '@/services/sales-orders';
import { itemsService, ItemListItem } from '@/services/items';
import { peopleService, PersonListItem } from '@/services/people';
import { PERMISSIONS, PeopleStatus, PeopleType, SalesTaxPricingMode } from '@gym-monorepo/shared';

interface OrderLineState {
  itemId: string;
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  description: string;
}

const formatDateTimeLocal = (date: Date) => {
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  const localIso = new Date(date.getTime() - tzOffsetMs).toISOString();
  return localIso.slice(0, 16);
};

const createEmptyLine = (): OrderLineState => ({
  itemId: '',
  unitPrice: 0,
  quantity: 1,
  discountPercent: 0,
  description: '',
});

export default function NewSalesOrderPage() {
  const t = useTranslations('sales.orders');
  const router = useRouter();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<PersonListItem[]>([]);
  const [salespeople, setSalespeople] = useState<PersonListItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<ItemListItem[]>([]);

  const [documentDate, setDocumentDate] = useState(() => formatDateTimeLocal(new Date()));
  const [deliveryDate, setDeliveryDate] = useState('');
  const [personId, setPersonId] = useState('');
  const [salespersonId, setSalespersonId] = useState('');
  const [externalRef, setExternalRef] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [taxMode, setTaxMode] = useState<SalesTaxPricingMode>(SalesTaxPricingMode.INCLUSIVE);
  const [notes, setNotes] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [lines, setLines] = useState<OrderLineState[]>([createEmptyLine()]);
  const [saving, setSaving] = useState(false);

  const loadReferenceData = useCallback(async () => {
    try {
      const [customerResponse, salespersonResponse, catalogResponse] = await Promise.all([
        peopleService.list({
          page: 1,
          limit: 100,
          type: PeopleType.CUSTOMER,
          status: PeopleStatus.ACTIVE,
        }),
        peopleService.list({
          page: 1,
          limit: 100,
          type: PeopleType.STAFF,
          status: PeopleStatus.ACTIVE,
        }),
        itemsService.getActive(),
      ]);
      setCustomers(customerResponse.items);
      setSalespeople(salespersonResponse.items);
      setCatalogItems(catalogResponse);
    } catch (error) {
      toast({
        title: t('form.toast.error.title'),
        description:
          getApiErrorMessage(error) || t('form.toast.error.description'),
        variant: 'destructive',
      });
    }
  }, [t, toast]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const updateLine = (index: number, patch: Partial<OrderLineState>) => {
    setLines((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, ...patch }
          : line,
      ),
    );
  };

  const removeLine = (index: number) => {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const addLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const summary = useMemo(() => {
    const lineTotals = lines.map((line) => {
      const discountAmount = (line.unitPrice * (line.discountPercent || 0)) / 100;
      const lineTotal = (line.unitPrice - discountAmount) * line.quantity;
      return {
        discountAmount: discountAmount * line.quantity,
        lineTotal,
      };
    });

    const subtotal = lineTotals.reduce((sum, entry) => sum + entry.lineTotal, 0);
    const discountTotal = lineTotals.reduce((sum, entry) => sum + entry.discountAmount, 0);

    return {
      subtotal,
      discountTotal,
      taxTotal: 0,
      total: subtotal,
    };
  }, [lines]);

  const isFormValid = useMemo(() => {
    return (
      !!personId &&
      !!deliveryDate &&
      lines.every((line) => line.itemId && line.quantity > 0)
    );
  }, [personId, deliveryDate, lines]);

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast({
        title: t('form.toast.validationError.title'),
        description: t('form.toast.validationError.description'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        documentDate: new Date(documentDate).toISOString(),
        deliveryDate: new Date(deliveryDate).toISOString(),
        personId,
        salespersonPersonId: salespersonId || undefined,
        externalRef: externalRef || undefined,
        paymentTerms: paymentTerms || undefined,
        taxPricingMode: taxMode,
        notes: notes || undefined,
        billingAddressSnapshot: billingAddress || undefined,
        shippingAddressSnapshot: shippingAddress || undefined,
        items: lines.map((line) => ({
          itemId: line.itemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent || undefined,
          description: line.description || undefined,
        })),
      };

      const created = await salesOrdersService.create(payload);
      toast({
        title: t('form.toast.success.title'),
        description: t('form.toast.success.description'),
      });
      router.push(`/sales/orders/${created.id}`);
    } catch (error) {
      toast({
        title: t('form.toast.error.title'),
        description:
          getApiErrorMessage(error) || t('form.toast.error.description'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGuard requiredPermissions={[PERMISSIONS.SALES.CREATE]}>
      <div className="space-y-6">
        <PageHeader
          title={t('form.pageTitle')}
          description={t('form.pageDescription')}
        />

        <div className="rounded-md border border-border bg-card p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground">
              {t('form.generalHeader')}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {t('form.documentDate')}
                </p>
                <DateTimeInput
                  value={documentDate}
                  onChange={(event) => setDocumentDate(event.target.value)}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {t('form.deliveryDate')}
                </p>
                <DateTimeInput
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {t('form.customerLabel')}
                </p>
                <Select
                  value={personId}
                  onValueChange={(value) => setPersonId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.customerPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.fullName} {customer.code && `(${customer.code})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {t('form.salespersonLabel')}
                </p>
                <Select
                  value={salespersonId}
                  onValueChange={(value) => setSalespersonId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.salespersonPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('form.notSet')}</SelectItem>
                    {salespeople.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {t('form.externalRefLabel')}
                </p>
                <Input
                  placeholder={t('form.externalRefPlaceholder')}
                  value={externalRef}
                  onChange={(event) => setExternalRef(event.target.value)}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {t('form.paymentTermsLabel')}
                </p>
                <Input
                  placeholder={t('form.paymentTermsPlaceholder')}
                  value={paymentTerms}
                  onChange={(event) => setPaymentTerms(event.target.value)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {t('form.taxModeLabel')}
              </p>
              <Select
                value={taxMode}
                onValueChange={(value) =>
                  setTaxMode(value as SalesTaxPricingMode)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.taxModePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SalesTaxPricingMode.INCLUSIVE}>
                    {t('form.taxModeInclusive')}
                  </SelectItem>
                  <SelectItem value={SalesTaxPricingMode.EXCLUSIVE}>
                    {t('form.taxModeExclusive')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {t('form.itemsHeader')}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('form.itemsTable.headers.item')}</TableHead>
                  <TableHead>{t('form.itemsTable.headers.description')}</TableHead>
                  <TableHead>{t('form.itemsTable.headers.quantity')}</TableHead>
                  <TableHead>{t('form.itemsTable.headers.unitPrice')}</TableHead>
                  <TableHead>{t('form.itemsTable.headers.discount')}</TableHead>
                  <TableHead>{t('form.itemsTable.headers.lineTotal')}</TableHead>
                  <TableHead>{t('form.itemsTable.headers.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => {
                  const discountPerUnit =
                    (line.unitPrice * (line.discountPercent || 0)) / 100;
                  const lineTotal = (line.unitPrice - discountPerUnit) * line.quantity;

                  return (
                    <TableRow key={index}>
                      <TableCell className="min-w-[220px]">
                        <Select
                          value={line.itemId}
                          onValueChange={(value) => {
                            const selected = catalogItems.find(
                              (item) => item.id === value,
                            );
                            updateLine(index, {
                              itemId: value,
                              unitPrice: selected?.price ?? line.unitPrice,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('form.itemPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogItems.map((catalogItem) => (
                              <SelectItem key={catalogItem.id} value={catalogItem.id}>
                                {catalogItem.name} {catalogItem.code && `(${catalogItem.code})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder={t('form.descriptionPlaceholder')}
                          value={line.description}
                          onChange={(event) =>
                            updateLine(index, { description: event.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(index, {
                              quantity: Number(event.target.value),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={line.unitPrice}
                          onChange={(event) =>
                            updateLine(index, {
                              unitPrice: Number(event.target.value),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={line.discountPercent}
                          onChange={(event) =>
                            updateLine(index, {
                              discountPercent: Number(event.target.value),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                        }).format(lineTotal)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(index)}
                          disabled={lines.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="mt-3 flex justify-between">
              <Button variant="ghost" onClick={addLine}>
                + {t('form.addItem')}
              </Button>
              <div className="space-y-1 text-right text-sm text-muted-foreground">
                <p>
                  {t('form.summary.subtotal')}: {summary.subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                </p>
                <p>
                  {t('form.summary.discount')}: {summary.discountTotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                </p>
                <p>
                  {t('form.summary.tax')}: {summary.taxTotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                </p>
                <p className="font-semibold text-foreground">
                  {t('form.summary.total')}: {summary.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-muted-foreground">
              {t('form.notesLabel')}
            </label>
            <textarea
              className="w-full rounded border border-input bg-background p-3 text-sm shadow-sm"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t('form.notesPlaceholder')}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {t('form.billingLabel')}
                </p>
                <textarea
                  className="w-full rounded border border-input bg-background p-3 text-sm shadow-sm"
                  rows={3}
                  value={billingAddress}
                  onChange={(event) => setBillingAddress(event.target.value)}
                  placeholder={t('form.billingPlaceholder')}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {t('form.shippingLabel')}
                </p>
                <textarea
                  className="w-full rounded border border-input bg-background p-3 text-sm shadow-sm"
                  rows={3}
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  placeholder={t('form.shippingPlaceholder')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!isFormValid || saving}>
              {t('form.button.save')}
            </Button>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
