export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum MembershipHistoryAction {
  CREATED = 'CREATED',
  EXTENDED = 'EXTENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  FLAGGED = 'FLAGGED',
  CLEARED = 'CLEARED',
}

export interface Membership {
  id: string;
  tenantId: string;
  memberId: string;
  personId: string;
  itemId: string;
  itemName: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  price: number;
  sourceDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
  item?: {
    id: string;
    name: string;
  };
}

export interface CreateMembershipDto {
  memberId: string;
  itemId: string;
  startDate?: string;
  price?: number;
  notes?: string;
}
