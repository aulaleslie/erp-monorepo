"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { ActionButtons } from '@/components/common/ActionButtons';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PermissionGuard } from '@/components/guards/PermissionGuard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateTimeInput } from '@/components/ui/date-time-input';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { usePagination } from '@/hooks/use-pagination';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api';
import { salesOrdersService, SalesOrderListItem } from '@/services/sales-orders';
import { peopleService, PersonListItem } from '@/services/people';
import { tagsService } from '@/services/tags';
import { DocumentStatus, PERMISSIONS, PeopleStatus, PeopleType } from '@gym-monorepo/shared';

const statusVariantMap: Record<
  DocumentStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  DRAFT: 'outline',
  SUBMITTED: 'secondary',
  REVISION_REQUESTED: 'outline',
  REJECTED: 'destructive',
  APPROVED: 'default',
  POSTED: 'default',
  CANCELLED: 'destructive',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
  }).format(value);

export default function SalesOrdersPage() {
  const t = useTranslations('sales.orders');
  const router = useRouter();
  const { toast } = useToast();
  const pagination = usePagination({ initialLimit: 10 });

  const [orders, setOrders] = useState<SalesOrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [customers, setCustomers] = useState<PersonListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [numberFilter, setNumberFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [tagOptions, setTagOptions] = useState<string[]>([]);

  const filterKey = useMemo(
    () =>
      `${statusFilter}|${customerFilter}|${searchTerm}|${numberFilter}|${dateFrom}|${dateTo}|${tagFilter}`,
    [statusFilter, customerFilter, searchTerm, numberFilter, dateFrom, dateTo, tagFilter],
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        personId: customerFilter || undefined,
        number: numberFilter || undefined,
        search: searchTerm || undefined,
        dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
        tag: tagFilter || undefined,
      };
      const data = await salesOrdersService.list(payload);
      setOrders(data.items);
      pagination.setTotal(data.total);
    } catch (error) {
      toast({
        title: t('list.toast.fetchError.title'),
        description:
          getApiErrorMessage(error) || t('list.toast.fetchError.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, statusFilter, customerFilter, numberFilter, searchTerm, tagFilter, pagination, t, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (pagination.page !== 1) {
      pagination.setPage(1);
    }
  }, [filterKey, pagination]);

  useEffect(() => {
    let isActive = true;
    const loadCustomers = async () => {
      try {
        const response = await peopleService.list({
          page: 1,
          limit: 40,
          type: PeopleType.CUSTOMER,
          status: PeopleStatus.ACTIVE,
        });
        if (isActive) {
          setCustomers(response.items);
        }
      } catch (error) {
        toast({
          title: t('filters.customerLoadError.title'),
          description:
            getApiErrorMessage(error) || t('filters.customerLoadError.description'),
          variant: 'destructive',
        });
      }
    };

    loadCustomers();
    return () => {
      isActive = false;
    };
  }, [t, toast]);

  useEffect(() => {
    if (!tagFilter) {
      setTagOptions([]);
      return;
    }

    let isActive = true;
    const timeout = setTimeout(async () => {
      try {
        const suggestions = await tagsService.suggest(tagFilter);
        if (isActive) {
          setTagOptions(suggestions.map((item) => item.name));
        }
      } catch {
        if (isActive) {
          setTagOptions([]);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [tagFilter]);

  const resetFilters = () => {
    setStatusFilter('');
    setCustomerFilter('');
    setSearchTerm('');
    setNumberFilter('');
    setDateFrom('');
    setDateTo('');
    setTagFilter('');
    pagination.resetPagination();
  };

  const columns: Column<SalesOrderListItem>[] = useMemo(
    () => [
      {
        header: t('list.table.headers.number'),
        accessorKey: 'number',
        className: 'font-medium',
      },
      {
        header: t('list.table.headers.status'),
        cell: (order) => (
          <StatusBadge
            status={order.status}
            variantMap={statusVariantMap}
            className="tracking-wide"
          />
        ),
      },
      {
        header: t('list.table.headers.customer'),
        cell: (order) => order.personName || '-',
      },
      {
        header: t('list.table.headers.salesperson'),
        cell: (order) => order.salesHeader?.salesperson?.fullName || '-',
      },
      {
        header: t('list.table.headers.deliveryDate'),
        cell: (order) => formatDate(order.salesHeader?.deliveryDate ?? null),
      },
      {
        header: t('list.table.headers.total'),
        cell: (order) => formatCurrency(order.total, order.currencyCode),
      },
      {
        header: t('list.table.headers.actions'),
        className: 'w-[120px]',
        cell: (order) => (
          <ActionButtons
            viewUrl={`/sales/orders/${order.id}`}
            editUrl={
              order.status === DocumentStatus.DRAFT
                ? `/sales/orders/${order.id}/edit`
                : undefined
            }
            permissions={{
              view: [PERMISSIONS.SALES.READ],
              edit: [PERMISSIONS.SALES.UPDATE],
            }}
          />
        ),
      },
    ],
    [t],
  );

  return (
    <PermissionGuard
      requiredPermissions={[PERMISSIONS.SALES.READ]}
      fallback={
        <p className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          {t('alerts.noPermission')}
        </p>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <PageHeader title={t('page.title')} description={t('page.description')} />
          <PermissionGuard requiredPermissions={[PERMISSIONS.SALES.CREATE]}>
            <Button asChild>
              <Link href="/sales/orders/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('buttons.new')}
              </Link>
            </Button>
          </PermissionGuard>
        </div>

        <div className="rounded-md border border-border bg-card p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {t('filters.status')}
              </p>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter((value as DocumentStatus) || '')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('filters.any')}</SelectItem>
                  {Object.values(DocumentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {t('filters.customer')}
              </p>
              <Select
                value={customerFilter}
                onValueChange={(value) => setCustomerFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.customerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('filters.any')}</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.fullName} {customer.code && `(${customer.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {t('filters.number')}
              </p>
              <Input
                placeholder={t('filters.numberPlaceholder')}
                value={numberFilter}
                onChange={(event) => setNumberFilter(event.target.value)}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {t('filters.search')}
              </p>
              <Input
                placeholder={t('filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {t('filters.dateFrom')}
              </p>
              <DateTimeInput
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                enableTime={false}
                placeholder={t('filters.datePlaceholder')}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {t('filters.dateTo')}
              </p>
              <DateTimeInput
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                enableTime={false}
                placeholder={t('filters.datePlaceholder')}
              />
            </div>
            <div className="md:col-span-2">
              <SearchableDropdown
                label={t('filters.tag')}
                value={tagFilter}
                options={tagOptions}
                placeholder={t('filters.tagPlaceholder')}
                helperText={t('filters.tagHelper')}
                onChange={(value) => setTagFilter(value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              {t('filters.clear')}
            </Button>
          </div>
        </div>

        <DataTable
          data={orders}
          columns={columns}
          loading={loading}
          pagination={pagination}
          emptyMessage={t('list.table.empty')}
          rowKey={(item) => item.id}
          onRowClick={(item) => router.push(`/sales/orders/${item.id}`)}
        />
      </div>
    </PermissionGuard>
  );
}
