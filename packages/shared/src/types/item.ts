export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum ItemServiceKind {
  MEMBERSHIP = 'MEMBERSHIP',
  PT_SESSION = 'PT_SESSION',
}

export enum ItemDurationUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum ItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface ItemListItem {
  id: string;
  tenantId: string;
  categoryId: string | null;
  type: ItemType;
  serviceKind: ItemServiceKind | null;
  code: string;
  name: string;
  price: number;
  status: ItemStatus;
  barcode: string | null;
  unit: string | null;
  tags: string[];
  description: string | null;
  durationValue: number | null;
  durationUnit: ItemDurationUnit | null;
  sessionCount: number | null;
  includedPtSessions: number | null;
  imageKey: string | null;
  imageUrl: string | null;
  imageMimeType: string | null;
  imageSize: number | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateItemData {
  categoryId?: string | null;
  type: ItemType;
  serviceKind?: ItemServiceKind | null;
  name: string;
  price: number;
  status?: ItemStatus;
  barcode?: string | null;
  unit?: string | null;
  tags?: string[];
  description?: string | null;
  durationValue?: number | null;
  durationUnit?: ItemDurationUnit | null;
  sessionCount?: number | null;
  includedPtSessions?: number | null;
}

export interface UpdateItemData {
  categoryId?: string | null;
  type?: ItemType;
  serviceKind?: ItemServiceKind | null;
  name?: string;
  price?: number;
  status?: ItemStatus;
  barcode?: string | null;
  unit?: string | null;
  tags?: string[];
  description?: string | null;
  durationValue?: number | null;
  durationUnit?: ItemDurationUnit | null;
  sessionCount?: number | null;
  includedPtSessions?: number | null;
}
